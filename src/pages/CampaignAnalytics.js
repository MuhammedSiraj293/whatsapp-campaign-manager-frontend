// frontend/src/pages/CampaignAnalytics.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config';

const StatCard = ({ title, value }) => {
    return (
      <div className="bg-[#202c33] p-6 rounded-lg shadow-lg text-center border-l-4 border-emerald-500">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h2>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
    );
};

export default function CampaignAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { campaignId } = useParams();

  useEffect(() => {
    if (!campaignId) return;

    const fetchCampaignAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/api/analytics/${campaignId}`);
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error('Error fetching campaign analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignAnalytics();
  }, [campaignId]);

  // --- NEW FUNCTION TO HANDLE THE EXPORT ---
  const handleExport = async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/${campaignId}/export`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      // Convert the response into a blob (a file-like object)
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analytics.name}_analytics.csv`; // Set the file name
      document.body.appendChild(a); // Add the link to the page
      a.click(); // Programmatically click the link
      a.remove(); // Remove the link from the page
      window.URL.revokeObjectURL(url); // Clean up the temporary URL

    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export analytics.');
    }
  };


  if (isLoading) {
    return <p className="text-center text-gray-400">Loading campaign analytics...</p>;
  }

  if (!analytics) {
    return <p className="text-center text-red-500">Could not load analytics for this campaign.</p>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-emerald-500">
          Campaign Analytics
        </h1>
        {/* --- NEW EXPORT BUTTON --- */}
        <button onClick={handleExport} className="send-button">
          Export to CSV
        </button>
      </div>
      <h2 className="text-xl text-gray-300 text-center mb-8">
        {analytics.name}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Sent" value={analytics.totalSent} />
        <StatCard title="Delivered" value={`${analytics.delivered} (${analytics.deliveryRate})`} />
        <StatCard title="Read" value={`${analytics.read} (${analytics.readRate})`} />
        <StatCard title="Replies" value={`${analytics.replies} (${analytics.replyRate})`} />
      </div>
    </div>
  );
}