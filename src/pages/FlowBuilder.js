// frontend/src/pages/FlowBuilder.js

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authFetch } from '../services/api';
import { FaTrash, FaPlus, FaSave, FaArrowLeft, FaEdit } from 'react-icons/fa';

// This is the main component for editing a bot flow
export default function FlowBuilder() {
  const { flowId } = useParams();
  const [nodes, setNodes] = useState([]);
  const [flow, setFlow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for the "Add/Edit Node" form
  const [isEditing, setIsEditing] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [nodeId, setNodeId] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [messageText, setMessageText] = useState('');
  const [saveToField, setSaveToField] = useState('');
  const [nextNodeId, setNextNodeId] = useState(''); // For 'text' type
  const [buttons, setButtons] = useState([]); // For 'buttons' type

  const inputStyle = "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";
  const labelStyle = "block mb-2 text-sm font-medium text-gray-400";
  const buttonStyle = "text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";

  // Fetch all nodes for this flow
  const fetchNodes = async () => {
    try {
      setIsLoading(true);
      // We can fetch the flow details and nodes in parallel
      const [nodesData, flowData] = await Promise.all([
         authFetch(`/api/bot-flows/${flowId}/nodes`),
         // We'll need a new endpoint to get single flow details
         // For now, let's just fetch nodes
      ]);

      if (nodesData.success) {
        setNodes(nodesData.data);
      }
    } catch (error) {
      console.error('Error fetching flow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, [flowId]);

  // --- Form Reset ---
  const resetForm = () => {
    setIsEditing(false);
    setCurrentNode(null);
    setNodeId('');
    setMessageType('text');
    setMessageText('');
    setSaveToField('');
    setNextNodeId('');
    setButtons([]);
  };

  // --- Button Handlers for 'buttons' type ---
  const addNodeButton = () => {
    setButtons([...buttons, { title: '', nextNodeId: '' }]);
  };
  const removeNodeButton = (index) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };
  const handleNodeButtonChange = (index, field, value) => {
    const newButtons = [...buttons];
    newButtons[index][field] = value;
    setButtons(newButtons);
  };

  // --- Main Save/Update Handler ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const nodeData = {
      nodeId,
      messageType,
      messageText,
      // Only include fields relevant to the message type
      ...(messageType === 'text' && { saveToField, nextNodeId }),
      ...(messageType === 'buttons' && { buttons }),
      // (We'll add 'list' type later to keep this simple)
    };

    try {
      if (isEditing) {
        // Update existing node
        await authFetch(`/api/bot-flows/nodes/${currentNode._id}`, {
          method: 'PUT',
          body: JSON.stringify(nodeData),
        });
        alert('Node updated successfully!');
      } else {
        // Create new node
        await authFetch(`/api/bot-flows/${flowId}/nodes`, {
          method: 'POST',
          body: JSON.stringify(nodeData),
        });
        alert('Node created successfully!');
      }
      resetForm();
      fetchNodes(); // Refresh the list
    } catch (error) {
      alert(error.message);
    }
  };

  // --- Edit/Delete Node Handlers ---
  const handleEditClick = (node) => {
    setIsEditing(true);
    setCurrentNode(node);
    setNodeId(node.nodeId);
    setMessageType(node.messageType);
    setMessageText(node.messageText);
    setSaveToField(node.saveToField || '');
    setNextNodeId(node.nextNodeId || '');
    setButtons(node.buttons || []);
  };

  const handleDeleteClick = async (nodeId) => {
    if (!window.confirm('Are you sure you want to delete this node?')) return;
    try {
      await authFetch(`/api/bot-flows/nodes/${nodeId}`, { method: 'DELETE' });
      alert('Node deleted.');
      fetchNodes(); // Refresh list
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Column 1: Add/Edit Node Form */}
      <div className="lg:col-span-1">
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg sticky top-8">
          <Link to="/bot-studio" className="text-emerald-500 hover:text-emerald-400 text-sm flex items-center mb-4">
            <FaArrowLeft className="inline mr-2" />
            Back to All Flows
          </Link>
          <h2 className="text-xl font-bold text-white mb-4">
            {isEditing ? 'Edit Node' : 'Add New Node'}
          </h2>
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelStyle}>Node ID (e.g., "ask_name")</label>
              <input type="text" placeholder="main_menu" value={nodeId} onChange={(e) => setNodeId(e.target.value)} className={inputStyle} required />
            </div>
            <div>
              <label className={labelStyle}>Message Type</label>
              <select value={messageType} onChange={(e) => setMessageType(e.target.value)} className={inputStyle}>
                <option value="text">Text / Question</option>
                <option value="buttons">Buttons</option>
                <option value="list">List (Coming Soon)</option>
              </select>
            </div>
            <div>
              <label className={labelStyle}>Message Text (use {"{{name}}"} for variables)</label>
              <textarea rows="4" placeholder="Hello, what is your name?" value={messageText} onChange={(e) => setMessageText(e.target.value)} className={inputStyle} required />
            </div>
            
            {/* --- Fields for TEXT type --- */}
            {messageType === 'text' && (
              <>
                <div className="p-3 border border-gray-700 rounded-lg">
                  <label className={labelStyle}>Save User's Reply to Field (Optional)</label>
                  <input type="text" placeholder="e.g., name, email, budget" value={saveToField} onChange={(e) => setSaveToField(e.target.value)} className={inputStyle} />
                  <p className="text-xs text-gray-500 mt-1">Saves reply to Enquiry.{saveToField || '...'}</p>
                </div>
                <div className="p-3 border border-gray-700 rounded-lg">
                  <label className={labelStyle}>Next Node ID</label>
                  <input type="text" placeholder="e.g., ask_email (or END)" value={nextNodeId} onChange={(e) => setNextNodeId(e.target.value)} className={inputStyle} required />
                  <p className="text-xs text-gray-500 mt-1">Node to go to after saving.</p>
                </div>
              </>
            )}

            {/* --- Fields for BUTTONS type --- */}
            {messageType === 'buttons' && (
              <div className="p-3 border border-gray-700 rounded-lg">
                <label className={labelStyle}>Buttons (Max 3)</label>
                {buttons.map((btn, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input type="text" placeholder="Button Title" value={btn.title} onChange={(e) => handleNodeButtonChange(index, 'title', e.target.value)} className={inputStyle} />
                    <input type="text" placeholder="Next Node ID" value={btn.nextNodeId} onChange={(e) => handleNodeButtonChange(index, 'nextNodeId', e.target.value)} className={inputStyle} />
                    <button type="button" onClick={() => removeNodeButton(index)} className="text-red-500 p-2">&times;</button>
                  </div>
                ))}
                {buttons.length < 3 && (
                  <button type="button" onClick={addNodeButton} className="text-emerald-500 text-sm mt-2">+ Add Button</button>
                )}
              </div>
            )}
            
            <div className="flex gap-4">
              <button type="submit" className={buttonStyle + " w-full"}>
                <FaSave className="inline mr-2" />
                {isEditing ? 'Save Changes' : 'Create Node'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="text-white bg-gray-600 hover:bg-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Column 2: List of Existing Nodes */}
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-white mb-6">Flow Nodes</h2>
        {isLoading ? (
          <p className="text-center text-gray-400">Loading nodes...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {nodes.map(node => (
              <div key={node._id} className="bg-[#202d33] p-4 rounded-lg shadow-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-emerald-400">Node ID: {node.nodeId}</h3>
                  <div className="flex gap-4">
                    <button onClick={() => handleEditClick(node)} className="text-sky-500 hover:text-sky-400"><FaEdit /></button>
                    <button onClick={() => handleDeleteClick(node._id)} className="text-red-500 hover:text-red-400"><FaTrash /></button>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mt-2 font-mono bg-[#2a3942] p-2 rounded">Type: {node.messageType}</p>
                <p className="text-sm text-gray-300 mt-2">"{node.messageText}"</p>
                {node.messageType === 'text' && (
                  <p className="text-xs text-gray-400 mt-2">Saves to: <span className="font-bold">{node.saveToField || 'N/A'}</span> | Next: <span className="font-bold">{node.nextNodeId}</span></p>
                )}
                {node.messageType === 'buttons' && (
                  <div className="mt-2 flex gap-2">
                    {node.buttons.map((btn, i) => (
                      <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                        "{btn.title}" → {btn.nextNodeId}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}