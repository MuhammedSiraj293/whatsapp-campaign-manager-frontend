// frontend/src/pages/BotStudio.js

import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { AuthContext } from "../context/AuthContext";
import { FaTrash, FaPlus, FaEdit, FaCog } from "react-icons/fa";

export default function BotStudio() {
  const [flows, setFlows] = useState([]);
  const [newFlowName, setNewFlowName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- SETTINGS MODAL STATE ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedFlowSettings, setSelectedFlowSettings] = useState(null);

  const { activeWaba } = useWaba();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const inputStyle =
    "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";
  const buttonStyle =
    "text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";

  // Fetch all flows for the active WABA
  const fetchFlows = useCallback(async () => {
    if (!activeWaba) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await authFetch(`/bot-flows/waba/${activeWaba}`);
      if (data.success) {
        setFlows(data.data);
      }
    } catch (error) {
      console.error("Error fetching bot flows:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeWaba]);

  useEffect(() => {
    if (user) {
      // Only fetch if user is logged in
      fetchFlows();
    }
  }, [user, fetchFlows]);

  const handleCreateFlow = async (e) => {
    e.preventDefault();
    if (!newFlowName.trim() || !activeWaba) {
      alert("Please enter a name and select a WABA account.");
      return;
    }
    try {
      await authFetch("/bot-flows", {
        method: "POST",
        body: JSON.stringify({ name: newFlowName, wabaAccount: activeWaba }),
      });
      setNewFlowName("");
      fetchFlows(); // Refresh the list
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteFlow = async (flowId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this entire flow and all its nodes?"
      )
    )
      return;
    try {
      await authFetch(`/bot-flows/${flowId}`, { method: "DELETE" });
      alert("Flow deleted.");
      fetchFlows(); // Refresh the list
    } catch (error) {
      alert(error.message);
    }
  };

  const navigateToFlow = (flowId) => {
    navigate(`/bot-studio/${flowId}`);
  };

  // --- OPEN SETTINGS MODAL ---
  const openSettings = (flow) => {
    setSelectedFlowSettings({ ...flow }); // Clone to avoid direct mutation
    setShowSettingsModal(true);
  };

  // --- SAVE SETTINGS ---
  const saveFlowSettings = async () => {
    if (!selectedFlowSettings) return;
    try {
      await authFetch(`/bot-flows/${selectedFlowSettings._id}`, {
        method: "PUT",
        body: JSON.stringify(selectedFlowSettings),
      });
      setShowSettingsModal(false);
      fetchFlows(); // Refresh to show updated status
      alert("Flow settings saved!");
    } catch (error) {
      console.error("Error saving flow settings:", error);
      alert("Failed to save settings.");
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <h1 className="text-3xl font-bold text-white text-center mb-8">
        Bot Studio
      </h1>

      {/* Create New Flow Form */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">
            Create New Bot Flow
          </h2>
          <form onSubmit={handleCreateFlow} className="flex gap-4">
            <input
              type="text"
              placeholder="New flow name (e.g., 'Property Bot')"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              className={inputStyle}
              disabled={!activeWaba}
            />
            <button
              type="submit"
              className={buttonStyle}
              disabled={!activeWaba}
            >
              <FaPlus className="inline mr-2" />
              Create Flow
            </button>
          </form>
          {!activeWaba && (
            <p className="text-yellow-400 text-sm mt-2">
              Please select a WABA account from the navbar to create a flow.
            </p>
          )}
        </div>
      </div>

      {/* Existing Flows List */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Existing Flows
        </h2>
        {isLoading ? (
          <p className="text-center text-gray-400">Loading flows...</p>
        ) : !activeWaba ? (
          <p className="text-center text-yellow-400">
            Please select a WABA account to see its flows.
          </p>
        ) : (
          <div className="bg-[#202d33] rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-[#2a3942]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Flow Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Follow-Up
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {flows.map((flow) => (
                  <tr key={flow._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {flow.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {flow.completionFollowUpEnabled ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(flow.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-4">
                      <button
                        onClick={() => navigateToFlow(flow._id)}
                        className="text-sky-500 hover:text-sky-400"
                        title="Edit Flow"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => openSettings(flow)}
                        className="text-gray-400 hover:text-white"
                        title="Flow Settings"
                      >
                        <FaCog />
                      </button>
                      <button
                        onClick={() => handleDeleteFlow(flow._id)}
                        className="text-red-500 hover:text-red-400"
                        title="Delete Flow"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && flows.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No bot flows found for this account.
              </p>
            )}
          </div>
        )}
      </div>

      {/* --- FLOW SETTINGS MODAL --- */}
      {showSettingsModal && selectedFlowSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#202d33] p-6 rounded-lg w-96 text-white border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              Flow Settings: {selectedFlowSettings.name}
            </h2>

            <div className="space-y-4">
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-md font-semibold text-emerald-500 mb-2">
                  Post-Completion Follow-Up
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Send a message after the user completes the flow (reaches
                  END).
                </p>

                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedFlowSettings.completionFollowUpEnabled || false
                    }
                    onChange={(e) =>
                      setSelectedFlowSettings({
                        ...selectedFlowSettings,
                        completionFollowUpEnabled: e.target.checked,
                      })
                    }
                    className="form-checkbox h-4 w-4 text-emerald-500 rounded border-gray-700 bg-[#111b21]"
                  />
                  <span className="text-sm">Enable Follow-Up</span>
                </label>

                {selectedFlowSettings.completionFollowUpEnabled && (
                  <>
                    <div className="mb-3">
                      <label className="block text-xs text-gray-400 mb-1">
                        Delay (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={
                          selectedFlowSettings.completionFollowUpDelay || 60
                        }
                        onChange={(e) =>
                          setSelectedFlowSettings({
                            ...selectedFlowSettings,
                            completionFollowUpDelay:
                              parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full bg-[#111b21] border border-gray-700 rounded p-2 text-sm text-white"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs text-gray-400 mb-1">
                        Message (Yes/No buttons added automatically)
                      </label>
                      <textarea
                        rows="3"
                        value={
                          selectedFlowSettings.completionFollowUpMessage || ""
                        }
                        onChange={(e) =>
                          setSelectedFlowSettings({
                            ...selectedFlowSettings,
                            completionFollowUpMessage: e.target.value,
                          })
                        }
                        className="w-full bg-[#111b21] border border-gray-700 rounded p-2 text-sm text-white"
                        placeholder="e.g. Did you find what you were looking for?"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveFlowSettings}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
