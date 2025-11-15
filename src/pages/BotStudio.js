// frontend/src/pages/BotStudio.js

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { FaTrash, FaPlus, FaEdit } from "react-icons/fa";

export default function BotStudio() {
  const [flows, setFlows] = useState([]);
  const [newFlowName, setNewFlowName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const { activeWaba } = useWaba();
  const navigate = useNavigate();

  // --- STYLES (same pattern as Dashboard.js uses) ---
  const inputStyle =
    "bg-[#2c3943] border border-gray-700 text-white text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";
  const buttonStyle =
    "text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";

  // --- FETCH BOT FLOWS ---
  const fetchFlows = useCallback(async () => {
    if (!activeWaba) {
      setFlows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await authFetch(`/bot-flows/waba/${activeWaba}`);

      if (data.success) {
        setFlows(data.data);
      }
    } catch (error) {
      console.error("Error fetching bot flows:", error);
      setFlows([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeWaba]);

  // Load flows when activeWaba changes
  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  // --- CREATE NEW FLOW ---
  const handleCreateFlow = async (e) => {
    e.preventDefault();

    if (!newFlowName.trim()) {
      return alert("Enter a flow name.");
    }

    try {
      const res = await authFetch("/bot-flows", {
        method: "POST",
        body: JSON.stringify({
          name: newFlowName,
          wabaAccount: activeWaba,
        }),
      });

      if (res.success) {
        setNewFlowName("");
        fetchFlows();
      }
    } catch (error) {
      alert(error.message);
    }
  };

  // --- DELETE FLOW ---
  const handleDeleteFlow = async (flowId) => {
    if (!window.confirm("Delete this flow?")) return;

    try {
      const res = await authFetch(`/bot-flows/${flowId}`, {
        method: "DELETE",
      });

      if (res.success) {
        fetchFlows();
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-emerald-500 text-center mb-8">
        Bot Studio
      </h1>

      {/* CREATE FLOW --- same layout style as Dashboard */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Create New Flow</h2>

          <form onSubmit={handleCreateFlow} className="flex gap-4">
            <input
              type="text"
              placeholder="Flow name (e.g., Property Bot)"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              className={inputStyle}
              disabled={!activeWaba}
            />
            <button className={buttonStyle} disabled={!activeWaba}>
              <FaPlus className="inline mr-2" /> Create
            </button>
          </form>

          {!activeWaba && (
            <p className="text-yellow-400 text-sm mt-2">
              Select a WABA account to create a flow.
            </p>
          )}
        </div>
      </div>

      {/* FLOWS LIST --- same loading pattern as Dashboard */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Your Flows
        </h2>

        {isLoading ? (
          <p className="text-center text-gray-400">Loading flows...</p>
        ) : !activeWaba ? (
          <p className="text-center text-yellow-400">
            Select a WABA account to see flows.
          </p>
        ) : flows.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No flows yet. Create your first flow above.
          </p>
        ) : (
          <div className="bg-[#202d33] rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-[#2a3942]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-700">
                {flows.map((flow) => (
                  <tr key={flow._id}>
                    <td className="px-6 py-4 text-sm text-white">
                      {flow.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(flow.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-sm flex gap-4">
                      <button
                        onClick={() => navigate(`/bot-studio/${flow._id}`)}
                        className="text-sky-500 hover:text-sky-400"
                      >
                        <FaEdit />
                      </button>

                      <button
                        onClick={() => handleDeleteFlow(flow._id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
