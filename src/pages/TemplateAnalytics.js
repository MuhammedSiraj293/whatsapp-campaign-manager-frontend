// frontend/src/pages/TemplateAnalytics.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../services/api";

// Reusable StatCard component (same as on the other analytics page)
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

// Helper function to format the template name for the title
const formatTemplateName = (name) => {
  if (!name) return "";
  // Replace underscores/hyphens with spaces and capitalize words
  return name
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function TemplateAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { templateName } = useParams(); // Get the template name from the URL

  useEffect(() => {
    if (!templateName) return;

    const fetchTemplateAnalytics = async () => {
      try {
        setIsLoading(true);
        // Call the new API endpoint
        const data = await authFetch(`/analytics/template/${templateName}`);
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error("Error fetching template analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplateAnalytics();
  }, [templateName]);

  if (isLoading) {
    return (
      <p className="bg-gray-900 text-center text-gray-400">
        Loading template analytics...
      </p>
    );
  }

  if (!analytics) {
    return (
      <p className="text-center text-red-500">
        Could not load analytics for this template.
      </p>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full p-4 md:p-8">
      <h1 className="text-3xl font-bold text-white text-center mb-8">
        Template Analytics
      </h1>
      <h2 className="text-xl text-gray-200 text-center mb-8">
        {formatTemplateName(analytics.templateName)}
      </h2>

      {/* Display the stats in the card layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total"
          value={analytics.total}
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
          value={analytics.failed}
          className="border-l-4 border-red-500"
        />
      </div>
    </div>
  );
}
