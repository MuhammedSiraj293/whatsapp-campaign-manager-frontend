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
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCalendarAlt,
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

  // --- NEW STATE for Search and Sort ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "lastSent",
    direction: "desc",
  });

  // --- NEW STATE for Date Filter ---
  const [dateRangeFilter, setDateRangeFilter] = useState("all_time"); // last_24h, last_7d, last_30d, custom, all_time
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // --- SORT HANDLER ---
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // --- DERIVED STATE: Filtered & Sorted Stats ---
  const filteredStats = React.useMemo(() => {
    let data = [...templateStats];

    // 1. Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter((item) =>
        (item.templateName || "").toLowerCase().includes(lowerTerm),
      );
    }

    // 2. Sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle string comparison (case-insensitive for names)
        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        // Handle dates if key is 'lastSent' (though it comes as string often, nice to ensure)
        if (sortConfig.key === "lastSent") {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [templateStats, searchTerm, sortConfig]);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setIsLoading(true);

        const queryParams = new URLSearchParams();
        if (dateRangeFilter !== "all_time") {
          let startDate = new Date();
          let endDate = new Date();

          if (dateRangeFilter === "last_24h") {
            startDate.setHours(startDate.getHours() - 24);
          } else if (dateRangeFilter === "last_7d") {
            startDate.setDate(startDate.getDate() - 7);
          } else if (dateRangeFilter === "last_30d") {
            startDate.setDate(startDate.getDate() - 30);
          } else if (dateRangeFilter === "custom") {
            if (!customStartDate || !customEndDate) {
              // Don't fetch if custom dates aren't fully set yet
              setIsLoading(false);
              return;
            }
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
            // Ensure end date covers the whole day
            endDate.setHours(23, 59, 59, 999);
          }

          queryParams.append("startDate", startDate.toISOString());
          queryParams.append("endDate", endDate.toISOString());
        }

        const queryString = queryParams.toString()
          ? `?${queryParams.toString()}`
          : "";

        const [statsData, templateData] = await Promise.all([
          authFetch(`/analytics/stats${queryString}`),
          authFetch(`/analytics/templates${queryString}`),
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
  }, [dateRangeFilter, customStartDate, customEndDate]);

  if (isLoading && !stats) {
    return (
      <p className="text-center text-gray-400 mt-10">Loading analytics...</p>
    );
  }

  if (!stats && !isLoading) {
    return (
      <p className="text-center text-red-500">Could not load analytics data.</p>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full p-4 md:p-8 ${isLoading ? "opacity-70 transition-opacity" : "opacity-100 transition-opacity"}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white text-center md:text-left">
          Analytics Dashboard
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#202d33] p-2 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400">
            <FaCalendarAlt />
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="bg-[#2a3942] text-white text-sm rounded-md px-3 py-2 border-none focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="all_time">All Time</option>
              <option value="last_24h">Last 24 Hours</option>
              <option value="last_7d">Last 7 Days</option>
              <option value="last_30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRangeFilter === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-[#2a3942] text-white text-sm rounded-md px-3 py-2 w-32 border-none focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-[#2a3942] text-white text-sm rounded-md px-3 py-2 w-32 border-none focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}
        </div>
      </div>

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
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl text-white">Template Performance</h2>
          <div className="relative mt-4 md:mt-0 w-full md:w-64">
            <input
              type="text"
              placeholder="Search templates..."
              className="w-full bg-[#202d33] text-white rounded-lg px-4 py-2 pl-10 focus:outline-none ring-1 ring-gray-700 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-3 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#202d33] rounded-lg shadow-lg overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#2a3942]">
              <tr>
                {[
                  {
                    key: "templateName",
                    label: "Template Name",
                    align: "left",
                  },
                  { key: "totalSent", label: "Total Sent", align: "left" },
                  { key: "sent", label: "Sent", align: "left" },
                  { key: "delivered", label: "Delivered", align: "left" },
                  { key: "read", label: "Read", align: "left" },
                  { key: "failed", label: "Failed", align: "left" },
                  { key: "skipped", label: "Skipped", align: "left" },
                  { key: "replies", label: "Replies", align: "left" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-6 py-3 text-${col.align} text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-[#324552] transition-colors select-none`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key ? (
                        sortConfig.direction === "asc" ? (
                          <FaSortUp />
                        ) : (
                          <FaSortDown />
                        )
                      ) : (
                        <FaSort className="text-gray-600" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredStats.map((template) => (
                <tr
                  key={template.templateName}
                  className="hover:bg-[#2a3942] transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    <Link
                      to={`/analytics/template/${template.templateName}`}
                      className="text-white hover:text-emerald-400 hover:underline"
                    >
                      {formatTemplateName(template.templateName)}
                    </Link>
                    <div className="text-xs text-gray-500 mt-1">
                      {template.lastSent
                        ? new Date(template.lastSent).toLocaleDateString()
                        : "Never"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {template.totalSent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {template.sent || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <FaCheckDouble className="inline mr-1 text-cyan-500" />
                    {template.delivered}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <FaEye className="inline mr-1 text-green-500" />
                    {template.read}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <FaExclamationTriangle className="inline mr-1 text-red-500" />
                    {template.failed}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 max-w-[100px] truncate"
                    title={template.skipped || 0}
                  >
                    {template.skipped || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <FaReply className="inline mr-1 text-yellow-500" />
                    {template.replies}
                  </td>
                </tr>
              ))}
              {filteredStats.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No templates found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
