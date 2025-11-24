// frontend/src/pages/CampaignAnalytics.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../services/api";

const StatCard = ({ title, value, className = "" }) => {
  return (
    <div
      className={`bg-[#202d33] p-6 rounded-lg shadow-lg text-center ${className}`}
    >
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
        {title}
      </h2>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  );
};

export default function CampaignAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { campaignId } = useParams();

  // State for the Google Sheet ID input
  const [spreadsheetId, setSpreadsheetId] = useState("");

  useEffect(() => {
    if (!campaignId) return;
    const fetchCampaignAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await authFetch(`/analytics/${campaignId}`);
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error("Error fetching campaign analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaignAnalytics();
  }, [campaignId]);

  const handleCsvExport = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/analytics/${campaignId}/export`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${analytics.name}_analytics.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export analytics.");
    }
  };

  // Function to handle exporting to Google Sheets
  const handleSheetExport = async () => {
    if (!spreadsheetId.trim()) {
      return alert("Please create a Google Sheet and paste its ID.");
    }
    try {
      const data = await authFetch(`/analytics/${campaignId}/export-sheet`, {
        method: "POST",
        body: JSON.stringify({ spreadsheetId }),
      });
      if (data.success) {
        alert("Successfully exported replies to your Google Sheet!");
      }
    } catch (error) {
      console.error("Error exporting to Google Sheets:", error);
      alert(error.message);
    }
  };

  if (isLoading) {
    return <p className="text-center text-gray-400">Loading analytics...</p>;
  }
  if (!analytics) {
    return (
      <p className="text-center text-red-500">
        Could not load analytics for this campaign.
      </p>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-white">Campaign Analytics</h1>
        <button onClick={handleCsvExport} className="send-button">
          Export to CSV
        </button>
      </div>
      <h2 className="text-xl text-gray-300 text-center mb-8">
        {analytics.name}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Sent"
          value={analytics.totalSent}
          className="border-l-4 border-violet-700"
        />
        <StatCard
          title="Total Delivered"
          value={`${analytics.totalDelivered} (${analytics.totalDeliveryRate})`}
          className="border-l-4 border-blue-500"
        />
        <StatCard
          title="Delivered"
          value={`${analytics.delivered} (${analytics.deliveryRate})`}
          className="border-l-4 border-cyan-500"
        />
        <StatCard
          title="Read"
          value={`${analytics.read} (${analytics.readRate})`}
          className="border-l-4 border-green-500"
        />
        <StatCard
          title="Replies"
          value={`${analytics.replies} (${analytics.replyRate})`}
          className="border-l-4 border-yellow-500"
        />
        <StatCard
          title="Failed"
          value={`${analytics.failed} (${analytics.failedRate})`}
          className="border-l-4 border-red-500"
        />
      </div>

      {/* --- NEW GOOGLE SHEETS EXPORT SECTION --- */}
      <div className="mt-12 bg-[#202d33] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">
          Export Replies to Google Sheets
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Paste your Google Sheet ID here"
            className="bg-[#2c3943] rounded-lg outline-none text-sm text-neutral-200 w-full px-3 py-2 placeholder:text-sm placeholder:text-[#8796a1]"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
          />
          <button
            onClick={handleSheetExport}
            className="send-button whitespace-nowrap"
          >
            Export Replies
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          **Reminder**: You must share your Google Sheet with the service
          account email from your `credentials.json` file.
        </p>
      </div>
    </div>
  );
}
