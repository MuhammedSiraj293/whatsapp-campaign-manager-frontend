// frontend/src/pages/TemplateAnalytics.js

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../services/api";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCalendarAlt,
  FaLayerGroup,
  FaChevronDown,
} from "react-icons/fa";

// Reusable StatCard component
const StatCard = ({ title, value, className = "" }) => (
  <div
    className={`bg-[#202d33] p-6 rounded-lg shadow-lg text-center ${className}`}
  >
    <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
      {title}
    </h2>
    <p className="text-3xl font-bold text-white mt-1">{value}</p>
  </div>
);

const formatTemplateName = (name) => {
  if (!name) return "";
  return name.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const pct = (num, den) =>
  den > 0 ? ((num / den) * 100).toFixed(1) + "%" : "0%";

export default function TemplateAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { templateName } = useParams();

  // Date filter
  const [dateRangeFilter, setDateRangeFilter] = useState("all_time");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Multi-select segment filter
  const [selectedSegments, setSelectedSegments] = useState(new Set()); // empty = All
  const [segmentDropdownOpen, setSegmentDropdownOpen] = useState(false);
  const segmentDropdownRef = useRef(null);

  // Table search & sort
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "totalSent",
    direction: "desc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (
        segmentDropdownRef.current &&
        !segmentDropdownRef.current.contains(e.target)
      ) {
        setSegmentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Toggle a segment in/out of the selection
  const toggleSegment = (name) => {
    setSelectedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const clearSegments = () => setSelectedSegments(new Set());

  const selectAll = () => {
    const allNames = new Set((analytics?.segments || []).map((s) => s.name));
    setSelectedSegments(allNames);
  };

  // Aggregated stats for the top cards
  const displayStats = useMemo(() => {
    if (!analytics) return null;

    const segments = analytics.segments || [];
    const active =
      selectedSegments.size === 0
        ? null // use global
        : segments.filter((s) => selectedSegments.has(s.name));

    if (!active) {
      // Global stats
      return {
        total: analytics.total,
        sent: analytics.sent || 0,
        totalDelivered: analytics.totalDelivered,
        delivered: analytics.delivered,
        read: analytics.read,
        replies: analytics.replies,
        failed: analytics.failed,
        skipped: analytics.skipped || 0,
        sentRate: analytics.sentRate || "0%",
        totalDeliveryRate: analytics.totalDeliveryRate,
        deliveryRate: analytics.deliveryRate,
        readRate: analytics.readRate,
        replyRate: analytics.replyRate,
        failedRate: analytics.failedRate,
        skippedRate: analytics.skippedRate || "0%",
      };
    }

    // Sum selected segments
    const sum = active.reduce(
      (acc, seg) => ({
        total: acc.total + (seg.totalSent || 0),
        sent: acc.sent + (seg.sent || 0),
        delivered: acc.delivered + (seg.delivered || 0),
        read: acc.read + (seg.read || 0),
        failed: acc.failed + (seg.failed || 0),
        skipped: acc.skipped + (seg.skipped || 0),
        replies: acc.replies + (seg.replies || 0),
      }),
      {
        total: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        skipped: 0,
        replies: 0,
      },
    );

    const totalDelivered = sum.delivered + sum.read;
    return {
      ...sum,
      totalDelivered,
      sentRate: pct(sum.sent, sum.total),
      totalDeliveryRate: pct(totalDelivered, sum.total),
      deliveryRate: pct(sum.delivered, sum.total),
      readRate: pct(sum.read, sum.total),
      replyRate: pct(sum.replies, sum.total),
      failedRate: pct(sum.failed, sum.total),
      skippedRate: pct(sum.skipped, sum.total),
    };
  }, [analytics, selectedSegments]);

  // Filtered + sorted segments for the table
  const filteredSegments = useMemo(() => {
    if (!analytics?.segments) return [];
    let data = [...analytics.segments];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter((s) => (s.name || "").toLowerCase().includes(lower));
    }
    if (sortConfig.key) {
      data.sort((a, b) => {
        let av = a[sortConfig.key],
          bv = b[sortConfig.key];
        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();
        if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [analytics, searchTerm, sortConfig]);

  useEffect(() => {
    if (!templateName) return;
    const fetch = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (dateRangeFilter !== "all_time") {
          let startDate = new Date();
          let endDate = new Date();
          if (dateRangeFilter === "last_24h")
            startDate.setHours(startDate.getHours() - 24);
          else if (dateRangeFilter === "last_7d")
            startDate.setDate(startDate.getDate() - 7);
          else if (dateRangeFilter === "last_30d")
            startDate.setDate(startDate.getDate() - 30);
          else if (dateRangeFilter === "custom") {
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
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
        const data = await authFetch(
          `/analytics/template/${templateName}${qs}`,
        );
        if (data.success) {
          setAnalytics(data.data);
          setSelectedSegments(new Set()); // reset on reload
        }
      } catch (err) {
        console.error("Error fetching template analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [templateName, dateRangeFilter, customStartDate, customEndDate]);

  if (isLoading && !analytics)
    return (
      <p className="bg-gray-900 text-center mt-10 text-gray-400">
        Loading template analytics...
      </p>
    );
  if (!analytics && !isLoading)
    return (
      <p className="text-center mt-10 text-red-500">
        Could not load analytics for this template.
      </p>
    );

  const segmentOptions = analytics?.segments || [];
  const stats = displayStats || {};
  const noneSelected = selectedSegments.size === 0;
  const allSelected =
    selectedSegments.size === segmentOptions.length &&
    segmentOptions.length > 0;

  // Label for the segment button
  const segmentBtnLabel = noneSelected
    ? "All Segments"
    : selectedSegments.size === 1
      ? [...selectedSegments][0]
      : `${selectedSegments.size} Segments`;

  return (
    <div
      className={`bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full p-4 md:p-8 ${isLoading ? "opacity-70" : "opacity-100"} transition-opacity`}
    >
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white text-left">
            Template Analytics
          </h1>
          <h2 className="text-xl text-gray-400 text-left mt-2">
            {formatTemplateName(analytics.templateName || templateName)}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-[#202d33] p-2 rounded-lg">
            <FaCalendarAlt className="text-gray-400" />
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

          {/* Segment Multi-Select Dropdown */}
          {segmentOptions.length > 0 && (
            <div className="relative" ref={segmentDropdownRef}>
              <button
                onClick={() => setSegmentDropdownOpen((o) => !o)}
                className="flex items-center gap-2 bg-[#202d33] hover:bg-[#2a3942] text-white text-sm px-4 py-2.5 rounded-lg transition-colors border border-transparent focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <FaLayerGroup
                  className={
                    noneSelected ? "text-gray-400" : "text-emerald-400"
                  }
                />
                <span
                  className={
                    noneSelected
                      ? "text-gray-300"
                      : "text-emerald-300 font-medium"
                  }
                >
                  {segmentBtnLabel}
                </span>
                <FaChevronDown
                  className={`text-gray-400 text-xs transition-transform ${segmentDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {segmentDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-[#1a2530] border border-gray-700 rounded-lg shadow-2xl w-64 py-2 max-h-72 overflow-y-auto">
                  {/* Select All / Clear */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                    <button
                      onClick={allSelected ? clearSegments : selectAll}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                    {!noneSelected && (
                      <button
                        onClick={clearSegments}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Clear ({selectedSegments.size})
                      </button>
                    )}
                  </div>

                  {/* Segment list */}
                  {segmentOptions.map((seg) => {
                    const checked = selectedSegments.has(seg.name);
                    return (
                      <label
                        key={seg.name}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                          checked
                            ? "bg-emerald-900/25 text-emerald-300"
                            : "text-gray-300 hover:bg-[#2a3942]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSegment(seg.name)}
                          className="accent-emerald-500 w-4 h-4 rounded"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">
                            {seg.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {seg.totalSent} sent
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active segment badges */}
      {!noneSelected && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            Segments:
          </span>
          {[...selectedSegments].map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 bg-emerald-700/30 border border-emerald-600 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full"
            >
              {name}
              <button
                onClick={() => toggleSegment(name)}
                className="ml-1 text-emerald-300 hover:text-white transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
          <button
            onClick={clearSegments}
            className="text-xs text-gray-500 hover:text-white underline transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <StatCard
          title="Total"
          value={stats.total ?? 0}
          className="border-l-4 border-violet-700"
        />
        <StatCard
          title="Sent (Dispatched)"
          value={`${stats.sent ?? 0} (${stats.sentRate ?? "0%"})`}
          className="border-l-4 border-indigo-500"
        />
        <StatCard
          title="Total Delivered"
          value={`${stats.totalDelivered ?? 0} (${stats.totalDeliveryRate ?? "0%"})`}
          className="border-l-4 border-blue-500"
        />
        <StatCard
          title="Delivered"
          value={`${stats.delivered ?? 0} (${stats.deliveryRate ?? "0%"})`}
          className="border-l-4 border-cyan-500"
        />
        <StatCard
          title="Read"
          value={`${stats.read ?? 0} (${stats.readRate ?? "0%"})`}
          className="border-l-4 border-green-500"
        />
        <StatCard
          title="Replies"
          value={`${stats.replies ?? 0} (${stats.replyRate ?? "0%"})`}
          className="border-l-4 border-yellow-500"
        />
        <StatCard
          title="Failed"
          value={`${stats.failed ?? 0} (${stats.failedRate ?? "0%"})`}
          className="border-l-4 border-red-500"
        />
        <StatCard
          title="Skipped"
          value={`${stats.skipped ?? 0} (${stats.skippedRate ?? "0%"})`}
          className="border-l-4 border-gray-500"
        />
      </div>

      {/* ── SEGMENT PERFORMANCE TABLE ── */}
      {segmentOptions.length > 0 && (
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
                {filteredSegments.map((seg, idx) => {
                  const isActive = selectedSegments.has(seg.name);
                  return (
                    <tr
                      key={idx}
                      onClick={() => toggleSegment(seg.name)}
                      title={`Click to ${isActive ? "remove" : "add"} "${seg.name}"`}
                      className={`transition-colors cursor-pointer ${
                        isActive
                          ? "bg-emerald-900/20 ring-1 ring-inset ring-emerald-700 hover:bg-emerald-900/30"
                          : "hover:bg-[#2a3942]"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => toggleSegment(seg.name)}
                            onClick={(e) => e.stopPropagation()}
                            className="accent-emerald-500 w-4 h-4 rounded"
                          />
                          {seg.name}
                        </div>
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
                  );
                })}
                {filteredSegments.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
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
