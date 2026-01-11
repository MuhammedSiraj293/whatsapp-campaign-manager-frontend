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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
          value={`${analytics.failed} (${analytics.failedRate})`}
          className="border-l-4 border-red-500"
        />
      </div>

      {/* SEGMENT PERFORMANCE TABLE */}
      {analytics.segments && analytics.segments.length > 0 && (
        <div className="bg-[#202d33] rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              Segment Performance
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-gray-300">
              <thead className="bg-[#111b21] uppercase text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-3">Segment Name</th>
                  <th className="px-6 py-3">Total Sent</th>
                  <th className="px-6 py-3">Delivered</th>
                  <th className="px-6 py-3">Read</th>
                  <th className="px-6 py-3">Failed</th>
                  <th className="px-6 py-3">Replies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {analytics.segments.map((seg, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#2a3942] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {seg.name}
                    </td>
                    <td className="px-6 py-4">{seg.totalSent}</td>
                    <td className="px-6 py-4">
                      <span className="text-cyan-400 font-bold">
                        ✔ {seg.delivered}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({seg.deliveredRate})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 font-bold">
                        👁 {seg.read}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({seg.readRate})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-red-400 font-bold">
                        ⚠ {seg.failed}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({seg.failedRate})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-yellow-400 font-bold">
                        ↩ {seg.replies}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({seg.replyRate})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
