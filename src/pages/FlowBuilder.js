// frontend/src/pages/FlowBuilder.js

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { useParams, Link } from "react-router-dom";
import { authFetch } from "../services/api";
import Sidebar from "../components/FlowSidebar";
import CustomNode from "../components/CustomNode";
import ErrorBoundary from "../components/ErrorBoundary";
import { FaSave, FaArrowLeft, FaMagic, FaTrash } from "react-icons/fa";
import dagre from "dagre";

// Node Types Configuration
const nodeTypes = {
  customNode: CustomNode,
};

// --- LAYOUT HELPER (Auto-arrange nodes) ---
const getLayoutedElements = (nodes, edges, direction = "LR") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 300;
  const nodeHeight = 150;

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = "left";
    node.sourcePosition = "right";

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};

export default function FlowBuilder() {
  const { flowId } = useParams();
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Node for Editing
  const [selectedNode, setSelectedNode] = useState(null);
  // Selected Edge for Deletion
  const [selectedEdge, setSelectedEdge] = useState(null);

  // --- FETCH & TRANSFORM DATA ---
  const fetchFlowData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authFetch(`/bot-flows/${flowId}/nodes`);

      if (response.success) {
        const backendNodes = response.data;

        // 1. Transform Backend Nodes -> React Flow Nodes
        const initialNodes = backendNodes.map((node) => {
          // Flatten listSections -> listItems for UI
          let listItems = [];
          if (node.listSections && node.listSections.length > 0) {
            node.listSections.forEach((section) => {
              if (section.rows) {
                listItems = [...listItems, ...section.rows];
              }
            });
          } else if (node.listItems) {
            // Fallback for legacy/flat data
            listItems = node.listItems;
          }

          return {
            id: node.nodeId, // Use nodeId as the unique ID
            type: "customNode",
            data: {
              label: node.nodeId,
              messageText: node.messageText,
              messageType: node.messageType,
              buttons: node.buttons,
              listItems: listItems,
              listButtonText: node.listButtonText || "Open Menu", // Default if missing
              saveToField: node.saveToField,
              // Store original ID for updates
              _id: node._id,
              nodeId: node.nodeId,
            },
            position: { x: 0, y: 0 }, // Initial position (will be layouted)
          };
        });

        // 2. Transform Links -> React Flow Edges
        const initialEdges = [];
        backendNodes.forEach((node) => {
          // Edge from 'nextNodeId' (Default/Text)
          if (node.nextNodeId) {
            initialEdges.push({
              id: `e-${node.nodeId}-${node.nextNodeId}`,
              source: node.nodeId,
              target: node.nextNodeId,
              animated: true,
              style: { stroke: "#10b981" },
            });
          }

          // Edges from Buttons
          if (node.buttons && node.buttons.length > 0) {
            node.buttons.forEach((btn, index) => {
              if (btn.nextNodeId) {
                initialEdges.push({
                  id: `e-${node.nodeId}-${btn.nextNodeId}-${index}`,
                  source: node.nodeId,
                  sourceHandle: `handle-btn-${index}`,
                  target: btn.nextNodeId,
                  animated: true,
                  label: btn.title,
                  style: { stroke: "#a855f7" },
                });
              }
            });
          }

          // Edges from List Items
          // We need to reconstruct edges based on the flattened listItems
          let listItems = [];
          if (node.listSections && node.listSections.length > 0) {
            node.listSections.forEach((section) => {
              if (section.rows) listItems = [...listItems, ...section.rows];
            });
          } else if (node.listItems) {
            listItems = node.listItems;
          }

          if (listItems && listItems.length > 0) {
            listItems.forEach((item, index) => {
              if (item.nextNodeId) {
                initialEdges.push({
                  id: `e-${node.nodeId}-${item.nextNodeId}-list-${index}`,
                  source: node.nodeId,
                  sourceHandle: `handle-list-${index}`,
                  target: item.nextNodeId,
                  animated: true,
                  label: item.title,
                  style: { stroke: "#f97316" },
                });
              }
            });
          }
        });

        // 3. Auto Layout
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(initialNodes, initialEdges);

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      }
    } catch (error) {
      console.error("Error fetching flow:", error);
      alert("Failed to load flow data.");
    } finally {
      setIsLoading(false);
    }
  }, [flowId, setNodes, setEdges]);

  useEffect(() => {
    fetchFlowData();
  }, [fetchFlowData]);

  // --- DRAG & DROP HANDLERS ---
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      const messageType = event.dataTransfer.getData("application/messageType");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `node_${Math.floor(Math.random() * 10000)}`;

      const newNode = {
        id: newNodeId,
        type,
        position,
        data: {
          label: newNodeId,
          messageType,
          messageText: "New message...",
          nodeId: newNodeId, // Important for backend
          listButtonText: "Open Menu", // Default for new list nodes
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNode(newNode); // Auto-select new node
    },
    [reactFlowInstance, setNodes]
  );

  // Enforce single connection per handle (replace existing)
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        // Remove existing edge from the same source handle
        const filteredEds = eds.filter((e) => {
          const edgeHandle = e.sourceHandle || null;
          const newHandle = params.sourceHandle || null;
          return !(e.source === params.source && edgeHandle === newHandle);
        });
        return addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
          },
          filteredEds
        );
      });
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null); // Deselect edge
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null); // Deselect node
  }, []);

  const deleteEdge = () => {
    if (!selectedEdge) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
    setSelectedEdge(null);
  };

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    setIsLoading(true); // Show loading state while saving
    try {
      // 1. Fetch current nodes from backend to identify deletions
      const response = await authFetch(`/bot-flows/${flowId}/nodes`);
      if (!response.success)
        throw new Error("Failed to fetch current nodes for sync.");

      const existingBackendNodes = response.data;
      const currentFrontendNodeIds = new Set(
        nodes.map((n) => n.data._id).filter((id) => id)
      ); // Only existing IDs

      // 2. Identify nodes to delete (exist in backend but not in frontend)
      const nodesToDelete = existingBackendNodes.filter(
        (node) => !currentFrontendNodeIds.has(node._id)
      );

      // 3. Delete removed nodes
      if (nodesToDelete.length > 0) {
        console.log("Deleting nodes:", nodesToDelete);
        await Promise.all(
          nodesToDelete.map((node) =>
            authFetch(`/bot-flows/nodes/${node._id}`, { method: "DELETE" })
          )
        );
      }

      // 4. Convert React Flow Nodes/Edges -> Backend Format
      const backendNodes = nodes.map((node) => {
        // Find edges starting from this node
        const connectedEdges = edges.filter((e) => e.source === node.id);

        // Helper to find target node's business ID
        const getTargetNodeId = (targetId) => {
          const targetNode = nodes.find((n) => n.id === targetId);
          // Prefer data.nodeId (user edited), fallback to id (internal)
          return targetNode ? targetNode.data.nodeId || targetNode.id : "";
        };

        // Default Next Node (for Text nodes)
        let nextNodeId = "";
        if (node.data.messageType === "text") {
          // Find edge with no specific handle or default handle
          const edge = connectedEdges.find(
            (e) => !e.sourceHandle || e.sourceHandle === "null"
          );
          if (edge) nextNodeId = getTargetNodeId(edge.target);
        }

        // Map Buttons Edges
        let buttons = node.data.buttons || [];
        if (node.data.messageType === "buttons") {
          buttons = buttons.map((btn, index) => {
            const edge = connectedEdges.find(
              (e) => e.sourceHandle === `handle-btn-${index}`
            );
            return {
              ...btn,
              nextNodeId: edge ? getTargetNodeId(edge.target) : "",
            };
          });
        }

        // Map List Items Edges & Structure into Sections
        let listSections = [];
        let listItems = node.data.listItems || [];

        if (node.data.messageType === "list") {
          // Update nextNodeId for each item based on edges
          const updatedListItems = listItems.map((item, index) => {
            const edge = connectedEdges.find(
              (e) => e.sourceHandle === `handle-list-${index}`
            );
            return {
              ...item,
              nextNodeId: edge ? getTargetNodeId(edge.target) : "",
            };
          });

          // Wrap in a default section
          if (updatedListItems.length > 0) {
            listSections = [
              {
                title: "Options", // Default section title
                rows: updatedListItems,
              },
            ];
          }
        }

        return {
          _id: node.data._id, // Existing ID if any
          nodeId: node.data.nodeId || node.id,
          messageText: node.data.messageText,
          messageType: node.data.messageType,
          saveToField: node.data.saveToField,
          buttons: buttons,
          listButtonText: node.data.listButtonText || "Open Menu", // Save button text
          listSections: listSections, // Send sections instead of listItems
          nextNodeId: nextNodeId || node.data.nextNodeId, // Prefer visual connection
        };
      });

      // 5. Update or Create nodes
      // We use a loop here, but ideally this should be a bulk operation
      for (const node of backendNodes) {
        if (node._id) {
          await authFetch(`/bot-flows/nodes/${node._id}`, {
            method: "PUT",
            body: JSON.stringify(node),
          });
        } else {
          await authFetch(`/bot-flows/${flowId}/nodes`, {
            method: "POST",
            body: JSON.stringify(node),
          });
        }
      }

      // 6. Refresh data to get new IDs
      await fetchFlowData();
      alert("Flow saved successfully!");
    } catch (error) {
      console.error("Error saving flow:", error);
      alert(`Failed to save flow: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- AUTO LAYOUT HANDLER ---
  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  // --- EDIT NODE SIDEBAR ---
  const updateNodeData = (field, value) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const newData = { ...node.data, [field]: value };
          // Sync label with nodeId
          if (field === "nodeId") {
            newData.label = value;
          }
          return { ...node, data: newData };
        }
        return node;
      })
    );

    // Update local selected node state to reflect changes immediately in UI
    setSelectedNode((prev) => {
      const newData = { ...prev.data, [field]: value };
      if (field === "nodeId") newData.label = value;
      return { ...prev, data: newData };
    });
  };

  // --- NEW: DELETE NODE ---
  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  // --- NEW: BUTTON MANAGEMENT ---
  const addButton = () => {
    if (!selectedNode) return;
    const newButton = { id: Date.now().toString(), title: "New Button" };
    const currentButtons = selectedNode.data.buttons || [];
    updateNodeData("buttons", [...currentButtons, newButton]);
  };

  const removeButton = (index) => {
    if (!selectedNode) return;
    const currentButtons = [...(selectedNode.data.buttons || [])];
    currentButtons.splice(index, 1);
    updateNodeData("buttons", currentButtons);
  };

  const updateButton = (index, title) => {
    if (!selectedNode) return;
    const currentButtons = [...(selectedNode.data.buttons || [])];
    currentButtons[index] = { ...currentButtons[index], title };
    updateNodeData("buttons", currentButtons);
  };

  // --- NEW: LIST ITEMS MANAGEMENT ---
  const addListItem = () => {
    if (!selectedNode) return;
    const newItem = {
      id: Date.now().toString(),
      title: "New Item",
      description: "",
    };
    const currentItems = selectedNode.data.listItems || [];
    updateNodeData("listItems", [...currentItems, newItem]);
  };

  const removeListItem = (index) => {
    if (!selectedNode) return;
    const currentItems = [...(selectedNode.data.listItems || [])];
    currentItems.splice(index, 1);
    updateNodeData("listItems", currentItems);
  };

  const updateListItem = (index, field, value) => {
    if (!selectedNode) return;
    const currentItems = [...(selectedNode.data.listItems || [])];
    currentItems[index] = { ...currentItems[index], [field]: value };
    updateNodeData("listItems", currentItems);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b141a] text-white">
        Loading Flow...
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Toolbar */}
        <div className="bg-[#202d33] p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/bot-studio" className="text-gray-400 hover:text-white">
              <FaArrowLeft />
            </Link>
            <h1 className="text-white font-bold text-lg">Flow Builder</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onLayout}
              className="bg-[#2a3942] text-white px-4 py-2 rounded hover:bg-[#364852] flex items-center gap-2"
            >
              <FaMagic /> Auto Layout
            </button>
            <button
              onClick={handleSave}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2"
            >
              <FaSave /> Save Flow
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <ReactFlowProvider>
            {/* Sidebar for Drag & Drop */}
            <Sidebar />

            {/* Main Canvas */}
            <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-[#0b141a]"
              >
                <Controls />
                <MiniMap style={{ height: 120 }} zoomable pannable />
                <Background color="#2a3942" gap={16} />

                {/* Edit Panel (Floating on Right) */}
                {selectedNode && (
                  <Panel
                    position="top-right"
                    className="bg-[#202d33] p-4 rounded-lg border border-gray-700 w-80 m-4 text-white shadow-xl max-h-[80vh] overflow-y-auto"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Edit Node</h3>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        &times;
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Node ID
                        </label>
                        <input
                          type="text"
                          value={selectedNode.data.nodeId}
                          onChange={(e) =>
                            updateNodeData("nodeId", e.target.value)
                          }
                          className="w-full bg-[#111b21] border border-gray-700 rounded p-2 text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Message Text
                        </label>
                        <textarea
                          rows="4"
                          value={selectedNode.data.messageText}
                          onChange={(e) =>
                            updateNodeData("messageText", e.target.value)
                          }
                          className="w-full bg-[#111b21] border border-gray-700 rounded p-2 text-sm text-white"
                        />
                      </div>

                      {selectedNode.data.messageType === "text" && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Save Reply To (Variable)
                          </label>
                          <input
                            type="text"
                            value={selectedNode.data.saveToField || ""}
                            onChange={(e) =>
                              updateNodeData("saveToField", e.target.value)
                            }
                            className="w-full bg-[#111b21] border border-gray-700 rounded p-2 text-sm text-white"
                            placeholder="e.g. email"
                          />
                        </div>
                      )}

                      {/* BUTTONS MANAGEMENT */}
                      {selectedNode.data.messageType === "buttons" && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Buttons
                          </label>
                          <div className="space-y-2">
                            {(selectedNode.data.buttons || []).map(
                              (btn, index) => (
                                <div key={index} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={btn.title}
                                    onChange={(e) =>
                                      updateButton(index, e.target.value)
                                    }
                                    className="flex-1 bg-[#111b21] border border-gray-700 rounded p-2 text-sm text-white"
                                    placeholder="Button Title"
                                  />
                                  <button
                                    onClick={() => removeButton(index)}
                                    className="text-red-500 hover:text-red-400 p-2"
                                  >
                                    &times;
                                  </button>
                                </div>
                              )
                            )}
                            <button
                              onClick={addButton}
                              className="w-full bg-[#2a3942] hover:bg-[#364852] text-emerald-500 text-sm py-2 rounded border border-dashed border-gray-600"
                            >
                              + Add Button
                            </button>
                          </div>
                        </div>
                      )}

                      {/* LIST ITEMS MANAGEMENT */}
                      {selectedNode.data.messageType === "list" && (
                        <div>
                          <div className="mb-3">
                            <label className="block text-xs text-gray-400 mb-1">
                              Menu Button Text
                            </label>
                            <input
                              type="text"
                              value={
                                selectedNode.data.listButtonText || "Open Menu"
                              }
                              onChange={(e) =>
                                updateNodeData("listButtonText", e.target.value)
                              }
                              className="w-full bg-[#111b21] border border-gray-700 rounded p-2 text-sm text-white"
                              placeholder="e.g. View Options"
                            />
                          </div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Menu Items
                          </label>
                          <div className="space-y-2">
                            {(selectedNode.data.listItems || []).map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="flex flex-col gap-1 bg-[#111b21] p-2 rounded border border-gray-700"
                                >
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={item.title}
                                      onChange={(e) =>
                                        updateListItem(
                                          index,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      className="flex-1 bg-transparent border-b border-gray-600 text-sm text-white focus:outline-none focus:border-emerald-500"
                                      placeholder="Item Title"
                                    />
                                    <button
                                      onClick={() => removeListItem(index)}
                                      className="text-red-500 hover:text-red-400"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={item.description || ""}
                                    onChange={(e) =>
                                      updateListItem(
                                        index,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    className="w-full bg-transparent text-xs text-gray-400 focus:outline-none"
                                    placeholder="Description (optional)"
                                  />
                                </div>
                              )
                            )}
                            <button
                              onClick={addListItem}
                              className="w-full bg-[#2a3942] hover:bg-[#364852] text-orange-500 text-sm py-2 rounded border border-dashed border-gray-600"
                            >
                              + Add Menu Item
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-700 flex justify-between items-center">
                        <button
                          onClick={deleteNode}
                          className="text-red-500 hover:text-red-400 text-sm flex items-center gap-2"
                        >
                          <FaTrash /> Delete Node
                        </button>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs text-gray-500">
                          To connect nodes, drag from the{" "}
                          <span className="text-emerald-500">green handle</span>{" "}
                          on the right of a node to the left handle of another
                          node.
                        </p>
                      </div>
                    </div>
                  </Panel>
                )}

                {/* Selected Edge Panel */}
                {selectedEdge && (
                  <Panel
                    position="top-right"
                    className="bg-[#202d33] p-4 rounded-lg border border-gray-700 w-64 m-4 text-white shadow-xl"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Connection</h3>
                      <button
                        onClick={() => setSelectedEdge(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        &times;
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Selected connection from{" "}
                      <strong>{selectedEdge.source}</strong> to{" "}
                      <strong>{selectedEdge.target}</strong>.
                    </p>
                    <button
                      onClick={deleteEdge}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <FaTrash /> Delete Connection
                    </button>
                  </Panel>
                )}
              </ReactFlow>
            </div>
          </ReactFlowProvider>
        </div>
      </div>
    </ErrorBoundary>
  );
}
