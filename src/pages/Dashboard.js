// frontend/src/pages/Dashboard.js

import React, { useState, useEffect, useCallback } from "react"; //
import { useNavigate, Link } from "react-router-dom";
import { authFetch } from "../services/api"; // <-- IMPORT OUR NEW SERVICES
import { useWaba } from "../context/WabaContext"; // <-- 1. IMPORT THE WABA CONTEXT
import socket from "../services/socket"; // 3. Import the socket
// Helper function
const getStatusClass = (status) => {
  switch (status) {
    case "draft":
      return "bg-gray-400 text-gray-900";
    case "scheduled":
      return "bg-blue-600 text-white";
    case "sent":
      return "bg-green-600 text-white";
    case "failed":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // <-- New Search State

  // const [recipientCounts, setRecipientCounts] = useState({}); // 4. REMOVED - No longer needed
  const navigate = useNavigate();
  const { activeWaba } = useWaba(); // Get the active WABA ID

  // 5. UPGRADED: This function is now faster and wrapped in useCallback
  const fetchCampaignsAndCounts = useCallback(async () => {
    if (!activeWaba) {
      setCampaigns([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // This is now one single, fast API call
      const campaignsData = await authFetch(`/campaigns/waba/${activeWaba}`);

      if (campaignsData.success) {
        setCampaigns(campaignsData.data);
        // No more N+1 queries. The recipient count is already included.
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeWaba]); // It only depends on activeWaba // 6. This useEffect now runs the fetch function

  useEffect(() => {
    fetchCampaignsAndCounts();
  }, [fetchCampaignsAndCounts]);

  // 7. NEW: This useEffect listens for real-time updates
  useEffect(() => {
    const handleCampaignUpdate = () => {
      console.log(
        "Socket event received: campaignsUpdated. Refreshing dashboard.",
      );
      fetchCampaignsAndCounts();
    };

    socket.on("campaignsUpdated", handleCampaignUpdate);

    return () => {
      socket.off("campaignsUpdated", handleCampaignUpdate);
    };
  }, [fetchCampaignsAndCounts]); // Use the stable fetch function

  const handleSendCampaign = async (campaignId, contactCount) => {
    if (
      !window.confirm(
        `Are you sure you want to send this campaign to ${contactCount} contacts?`,
      )
    )
      return;

    // --- UPDATED BATCH SENDING LOGIC ---
    const BATCH_SIZE = 5; // Send 5 messages per batch
    const DELAY_MS = 2000; // Wait 2 seconds between batches

    let offset = 0;
    const totalBatches = Math.ceil(contactCount / BATCH_SIZE);

    // Simple progress toast/alert (You might want a real modal state for this later)
    // For now, we'll use a simple blocking alert approach doesn't work well for updates.
    // So we'll console log and maybe show a 'sending' status

    console.log(
      `Starting batch send for ${contactCount} contacts. ${totalBatches} batches.`,
    );

    try {
      for (let i = 0; i < totalBatches; i++) {
        const isLastBatch = i === totalBatches - 1;

        console.log(`Sending batch ${i + 1}/${totalBatches}...`);

        // Call the batch endpoint
        const result = await authFetch(`/campaigns/${campaignId}/send-batch`, {
          method: "POST",
          body: JSON.stringify({
            limit: BATCH_SIZE,
            offset: offset,
            finalBatch: isLastBatch,
          }),
        });

        if (!result.success) {
          console.error("Batch failed:", result);
          alert(`Batch ${i + 1} failed: ${result.error}`);
          break; // Stop sending on error
        }

        // Update offset for next batch
        offset += BATCH_SIZE;

        // Wait before next batch (unless it was the last one)
        if (!isLastBatch) {
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }
      }

      alert("Campaign sending initiated successfully via batching!");
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert(error.message);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this campaign?",
      )
    )
      return;
    try {
      const result = await authFetch(`/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (result.success) {
        alert("Campaign deleted successfully.");
        // We no longer need to call fetchCampaignsAndCounts() here,
        // because the socket event will handle it automatically.
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert(error.message);
    }
  }; // 8. UPGRADED: This function now uses the 'sentAt' field

  const getCampaignDate = (campaign) => {
    let label = "Created:";
    let date = new Date(campaign.createdAt);

    if (campaign.status === "scheduled" && campaign.scheduledFor) {
      label = "Scheduled for:";
      date = new Date(campaign.scheduledFor);
    } else if (campaign.status === "sent" && campaign.sentAt) {
      label = "Sent on:";
      date = new Date(campaign.sentAt);
    }

    return `${label} ${date.toLocaleString()}`;
  };

  const buttonStyle =
    "bg-emerald-600 hover:bg-emerald-700 relative rounded-full px-3 py-1 text-sm/6 text-gray-100 ring-1 ring-white hover:ring-white/20 text-center";
  const analyticsButtonStyle =
    "text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm p-2.5 text-center";
  const deleteButtonStyle =
    "text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-2.5 text-center";

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full">
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-semibold text-white">Campaigns</h1>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#2c3943] border border-gray-700 text-white text-sm rounded-lg focus:ring-emerald-500 block w-full md:w-64 p-2.5"
            />
            <button
              onClick={() => navigate("/create-campaign")}
              className={`${buttonStyle} whitespace-nowrap`}
            >
              + Create New Campaign
            </button>
          </div>
        </div>

        <div className="list-container">
          {isLoading ? (
            <p className="text-center text-gray-400">Loading campaigns...</p>
          ) : !activeWaba ? (
            <p className="text-center text-yellow-400">
              Please select a WABA account from the navbar to view campaigns.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns
                .filter((campaign) =>
                  campaign.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
                )
                .map((campaign) => (
                  <div
                    key={campaign._id}
                    className="bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6 rounded-lg shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-white uppercase truncate">
                        {campaign.name}
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {getCampaignDate(campaign)}
                      </p>
                      <p className="text-gray-400 text-sm mt-4 h-20 overflow-hidden">
                        "{campaign.message}"
                      </p>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>STATUS</span>
                        <span>RECIPIENTS</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-white">
                        <span
                          className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusClass(
                            campaign.status,
                          )}`}
                        >
                          {campaign.status}
                        </span>
                        <span>{campaign.contactCount || 0}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                      {campaign.status !== "sent" ? (
                        <button
                          className={`${buttonStyle} w-full`}
                          onClick={() =>
                            handleSendCampaign(
                              campaign._id,
                              campaign.contactCount || 0,
                            )
                          }
                        >
                          Send Now
                        </button>
                      ) : (
                        <Link
                          to={`/analytics/${campaign._id}`}
                          className={`${analyticsButtonStyle} w-full`}
                        >
                          Analytics
                        </Link>
                      )}
                      <button
                        className={`${deleteButtonStyle} w-full`}
                        onClick={() => handleDeleteCampaign(campaign._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
