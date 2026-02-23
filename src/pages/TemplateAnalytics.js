// frontend/src/pages/TemplateAnalytics.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../services/api";
import { FaSort, FaSortUp, FaSortDown, FaCalendarAlt } from "react-icons/fa";

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

  // --- NEW STATE for Date Filter ---
  const [dateRangeFilter, setDateRangeFilter] = useState("all_time"); // last_24h, last_7d, last_30d, custom, all_time
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // --- NEW STATE for Search and Sort ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "totalSent",
    direction: "desc",
  });

  // --- SORT HANDLER ---
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // --- DERIVED STATE: Filtered & Sorted Segments ---
  const filteredSegments = React.useMemo(() => {
    if (!analytics || !analytics.segments) return [];

    let data = [...analytics.segments];

    // 1. Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter((item) =>
        (item.name || "").toLowerCase().includes(lowerTerm),
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
  }, [analytics, searchTerm, sortConfig]);

  useEffect(() => {
    if (!templateName) return;

    const fetchTemplateAnalytics = async () => {
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
              setIsLoading(false);
              return;
            }
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
          }

          queryParams.append("startDate", startDate.toISOString());
          queryParams.append("endDate", endDate.toISOString());
        }

        const queryString = queryParams.toString()
          ? `?${queryParams.toString()}`
          : "";

        // Call the new API endpoint
        const data = await authFetch(
          `/analytics/template/${templateName}${queryString}`,
        );
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
  }, [templateName, dateRangeFilter, customStartDate, customEndDate]);

  if (isLoading && !analytics) {
    return (
      <p className="bg-gray-900 text-center mt-10 text-gray-400">
        Loading template analytics...
      </p>
    );
  }

  if (!analytics && !isLoading) {
    return (
      <p className="text-center mt-10 text-red-500">
        Could not load analytics for this template.
      </p>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full p-4 md:p-8 ${isLoading ? "opacity-70 transition-opacity" : "opacity-100 transition-opacity"}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white text-left">
            Template Analytics
          </h1>
          <h2 className="text-xl text-gray-400 text-left mt-2">
            {formatTemplateName(analytics.templateName || templateName)}
          </h2>
        </div>

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

      {/* Display the stats in the card layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <StatCard
          title="Total"
          value={analytics.total}
          className="border-l-4 border-violet-700"
        />
        {/* ADDED SENT */}
        <StatCard
          title="Sent (Dispatched)"
          value={`${analytics.sent || 0} (${analytics.sentRate || "0%"})`}
          className="border-l-4 border-indigo-500"
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
        {/* ADDED SKIPPED */}
        <StatCard
          title="Skipped"
          value={`${analytics.skipped || 0} (${analytics.skippedRate || "0%"})`}
          className="border-l-4 border-gray-500"
        />
      </div>

      {/* SEGMENT PERFORMANCE TABLE */}
      {analytics.segments && analytics.segments.length > 0 && (
        <div className="bg-[#202d33] rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-semibold text-white">
              Segment Performance
            </h3>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search segments..."
                className="w-full bg-[#111b21] text-white rounded-lg px-4 py-2 pl-10 focus:outline-none ring-1 ring-gray-600 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-gray-300">
              <thead className="bg-[#111b21] uppercase text-xs font-semibold text-gray-500">
                <tr>
                  {[
                    { key: "name", label: "Segment Name" },
                    { key: "totalSent", label: "Total Sent" },
                    { key: "sent", label: "Sent" },
                    { key: "delivered", label: "Delivered" },
                    { key: "read", label: "Read" },
                    { key: "failed", label: "Failed" },
                    { key: "skipped", label: "Skipped" },
                    { key: "replies", label: "Replies" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-3 cursor-pointer hover:bg-[#1f2c33] select-none"
                      onClick={() => handleSort(col.key)}
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
                {filteredSegments.map((seg, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#2a3942] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {seg.name}
                    </td>
                    <td className="px-6 py-4">{seg.totalSent}</td>
                    <td className="px-6 py-4">
                      <span className="text-indigo-400 font-bold">
                        ➡ {seg.sent}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({seg.sentRate})
                      </span>
                    </td>
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
                      <span className="text-gray-400 font-bold">
                        ⚠ {seg.skipped}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({seg.skippedRate})
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
                {filteredSegments.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No segments found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
