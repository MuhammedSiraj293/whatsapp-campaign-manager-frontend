// frontend/src/pages/Dashboard.js

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authFetch } from "../services/api"; // <-- IMPORT OUR NEW SERVICES
import { useWaba } from "../context/WabaContext"; // <-- 1. IMPORT THE WABA CONTEXT

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
  const [recipientCounts, setRecipientCounts] = useState({});
  const navigate = useNavigate();
  const { activeWaba } = useWaba(); // <-- 2. GET THE ACTIVE WABA ID
  

  const fetchCampaignsAndCounts = async () => {
    if (!activeWaba) {
      setIsLoading(false);
      return; // Don't fetch if no WABA is selected
    }
    setIsLoading(true);
    try {
      // --- 3. THIS IS THE KEY CHANGE ---
      // Fetch campaigns for the *active* WABA
      const campaignsData = await authFetch(`/campaigns/waba/${activeWaba}`);

      if (campaignsData.success) {
        const campaignsList = campaignsData.data;
        setCampaigns(campaignsList);

        const countResults = await Promise.all(
          campaignsList.map((campaign) =>
            authFetch(`/campaigns/${campaign._id}/recipients/count`)
              .then((res) => ({
                campaignId: campaign._id,
                count: res.success ? res.count : 0,
              }))
              .catch(() => ({ campaignId: campaign._id, count: 0 }))
          )
        );

        const counts = {};
        countResults.forEach(({ campaignId, count }) => {
          counts[campaignId] = count;
        });
        setRecipientCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }; // 4. RE-FETCH campaigns when the activeWaba changes

  useEffect(() => {
    fetchCampaignsAndCounts();
  }, [activeWaba]);

  const handleSendCampaign = async (campaignId) => {
    if (!window.confirm("Are you sure you want to send this campaign?")) return;
    try {
      const result = await authFetch(`/campaigns/${campaignId}/send`, {
        method: "POST",
      });
      if (result.success) {
        alert(result.data.message);
        fetchCampaignsAndCounts();
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert(error.message);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this campaign?"
      )
    )
      return;
    try {
      const result = await authFetch(`/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (result.success) {
        alert("Campaign deleted successfully.");
        fetchCampaignsAndCounts();
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert(error.message);
    }
  };

  const getCampaignDate = (campaign) => {
    let label = "Created:";
    let date = new Date(campaign.createdAt);
    if (campaign.status === "scheduled" && campaign.scheduledFor) {
      label = "Scheduled for:";
      date = new Date(campaign.scheduledFor);
    } else if (campaign.status === "sent") {
      label = "Sent on:";
      date = new Date(campaign.updatedAt);
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
    <div className="bg-gray-900 min-h-screen w-full">
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-white">Campaigns</h1>
          <button
            onClick={() => navigate("/create-campaign")}
            className={buttonStyle}
          >
            + Create New Campaign
          </button>
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
              {campaigns.map((campaign) => (
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
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                      <span>{recipientCounts[campaign._id] || 0}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    {campaign.status !== "sent" ? (
                      <button
                        className={`${buttonStyle} w-full`}
                        onClick={() => handleSendCampaign(campaign._id)}
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
