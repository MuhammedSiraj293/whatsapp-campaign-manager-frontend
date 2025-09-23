// frontend/src/pages/Dashboard.js

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authFetch } from "../services/api"; // <-- IMPORT OUR NEW SERVICES

// Helper function
const getStatusClass = (status) => {
  switch (status) {
    case "draft":
      return "bg-gray-400 text-gray-900"; // gray for draft
    case "scheduled":
      return "bg-blue-600 text-white"; // blue for scheduled
    case "sent":
      return "bg-green-600 text-white"; // green for sent
    case "failed":
      return "bg-red-600 text-white"; // red for failed
    default:
      return "bg-gray-200 text-gray-800"; // fallback
  }
};

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipientCounts, setRecipientCounts] = useState({});
  const navigate = useNavigate();

  const fetchCampaignsAndCounts = async () => {
    setIsLoading(true);
    try {
      // Use authFetch to get campaigns
      const campaignsData = await authFetch("/campaigns");
      if (campaignsData.success) {
        setCampaigns(campaignsData.data);

        const counts = {};
        for (const campaign of campaignsData.data) {
          // Use authFetch to get recipient counts
          const countData = await authFetch(
            `/campaigns/${campaign._id}/recipients/count`
          );
          if (countData.success) {
            counts[campaign._id] = countData.count;
          }
        }
        setRecipientCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndCounts();
  }, []);

  const handleSendCampaign = async (campaignId) => {
    if (!window.confirm("Are you sure you want to send this campaign?")) return;
    try {
      // Use authFetch to send a campaign
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

  // --- NEW DELETE FUNCTION ---
  const handleDeleteCampaign = async (campaignId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this campaign? This cannot be undone."
      )
    )
      return;
    try {
      const result = await authFetch(`/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (result.success) {
        alert("Campaign deleted successfully.");
        fetchCampaignsAndCounts(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert(error.message);
    }
  };

  // This component is no longer used here but can be moved to the Contacts page
  // For simplicity, we are removing the file upload from the dashboard.
  // The primary upload functionality is on the Contacts page.

  // --- STYLING CLASSES ---
  const buttonStyle =
    "bg-emerald-600 hover:bg-emerald-700 relative rounded-full px-3 py-1 text-sm/6 text-gray-100 ring-1 ring-white hover:ring-white/20 text-center";
  const analyticsButtonStyle =
    "text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm p-2.5 text-center";
  const deleteButtonStyle =
    "text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-2.5 text-center";

  return (
    <div className="bg-gray-900">
      <div className=" p-4 md:p-8">
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
          ) : (
            // --- THIS IS THE NEW CARD GRID ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                // Each item is now a styled card
                <div
                  key={campaign._id}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6 rounded-lg shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white truncate uppercase">
                      {campaign.name}
                    </h2>
                    <p className="text-gray-200 text-sm mt-2 h-20 overflow-hidden">
                      {campaign.message}
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>STATUS</span>
                      <span>RECIPIENTS</span>
                    </div>
                    <div className="flex justify-between font-medium text-white">
                      <span
                        className={`px-2 py-1 rounded-full text-xs capitalize mt-2 ${getStatusClass(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                      <span>{recipientCounts[campaign._id] || 0}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-12">
                    {campaign.status !== "sent" && (
                      <button
                        className={`${buttonStyle} w-full`}
                        onClick={() => handleSendCampaign(campaign._id)}
                      >
                        Send
                      </button>
                    )}
                    {campaign.status === "sent" && (
                      <Link
                        to={`/analytics/${campaign._id}`}
                        className={`${analyticsButtonStyle} w-full`}
                      >
                        View Analytics
                      </Link>
                    )}
                    {/* --- NEW DELETE BUTTON --- */}
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
