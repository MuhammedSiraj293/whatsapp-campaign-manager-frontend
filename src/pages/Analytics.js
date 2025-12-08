// frontend/src/pages/Analytics.js

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // <-- 1. IMPORT Link
import { authFetch } from "../services/api";
import {
  FaPaperPlane,
  FaUsers,
  FaReply,
  FaCheckDouble,
  FaEye,
  FaExclamationTriangle,
} from "react-icons/fa";

// Reusable component for the stat cards
const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-[#202d33] p-6 rounded-lg shadow-lg flex items-center border-l-4 border-emerald-500">
      <div className="text-3xl text-emerald-500 mr-4">{icon}</div>
      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </h2>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  );
};

// --- 2. NEW HELPER FUNCTION for formatting the template name ---
const formatTemplateName = (name) => {
  if (!name) return "";
  // Replace underscores/hyphens with spaces and capitalize words
  return name
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [templateStats, setTemplateStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setIsLoading(true);
        const [statsData, templateData] = await Promise.all([
          authFetch("/analytics/stats"),
          authFetch("/analytics/templates"),
        ]);

        if (statsData.success) {
          setStats(statsData.data);
        }
        if (templateData.success) {
          setTemplateStats(templateData.data);
        }
      } catch (error) {
        console.error("Error fetching analytics stats:", error);
        alert(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  if (isLoading) {
    return <p className="text-center text-gray-400">Loading analytics...</p>;
  }

  if (!stats) {
    return (
      <p className="text-center text-red-500">Could not load analytics data.</p>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full p-4 md:p-8">
      <h1 className="text-3xl font-bold text-white text-center mb-8">
        Analytics Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Campaigns Sent"
          value={stats.campaignsSent}
          icon={<FaPaperPlane />}
        />
        <StatCard
          title="Total Contacts"
          value={stats.totalContacts}
          icon={<FaUsers />}
        />
        <StatCard
          title="Replies Received"
          value={stats.repliesReceived}
          icon={<FaReply />}
        />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl text-white mb-6">Template Performance</h2>
        <div className="bg-[#202d33] rounded-lg shadow-lg overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#2a3942]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Template Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Total Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Delivered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Read
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Failed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Replies
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {templateStats.map((template) => (
                <tr key={template.templateName}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {/* --- 3. THIS IS THE FIX --- */}
                    {/* The name is now a clickable link */}
                    <Link
                      to={`/analytics/template/${template.templateName}`}
                      className="text-white hover:text-gray-400 hover:underline"
                    >
                      {formatTemplateName(template.templateName)}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {template.totalSent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <FaCheckDouble className="inline mr-1 text-cyan-500" />
                    {template.delivered}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <FaEye className="inline mr-1 text-green-500" />
                    {template.read}
                  </td>
                  <td className="px-6 py-4 whitespace-nowGrap text-sm text-gray-300">
                    <FaExclamationTriangle className="inline mr-1 text-red-500" />
                    {template.failed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <FaReply className="inline mr-1 text-yellow-500" />
                    {template.replies}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
