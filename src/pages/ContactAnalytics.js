import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "../services/api";
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUsers,
  FaChartLine,
  FaFire,
  FaComments,
} from "react-icons/fa";
import ContactDetailModal from "../components/ContactDetailModal";
import KPICard from "../components/dashboard/KPICard";
import TrendChart from "../components/dashboard/TrendChart";
import StatusDonutChart from "../components/dashboard/StatusDonutChart";
import TopPerformersChart from "../components/dashboard/TopPerformersChart";

const ContactAnalytics = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState([]);

  // Dashboard data
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [listFilter, setListFilter] = useState("");
  const [minReplies, setMinReplies] = useState("");
  const [minScore, setMinScore] = useState("");
  const [lastActiveDays, setLastActiveDays] = useState("");
  const [sortBy, setSortBy] = useState("lastActive");
  const [sortOrder, setSortOrder] = useState("desc");
  const [period, setPeriod] = useState("30d");

  // Selection for Detail Modal
  const [selectedContactId, setSelectedContactId] = useState(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await authFetch("/contacts/lists");
      if (res.success) setLists(res.data);
    } catch (error) {
      console.error("Error fetching lists", error);
    }
  };

  // Fetch dashboard summary
  const fetchDashboardSummary = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        listId: listFilter,
        minReplies,
        minScore,
        lastActiveDays,
      });

      const res = await authFetch(
        `/contacts/dashboard/summary?${query.toString()}`,
      );
      if (res.success) {
        setSummary(res.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard summary", error);
    }
  }, [search, statusFilter, listFilter, minReplies, minScore, lastActiveDays]);

  // Fetch trends
  const fetchTrends = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        period,
        listId: listFilter,
        status: statusFilter,
      });

      const res = await authFetch(
        `/contacts/dashboard/trends?${query.toString()}`,
      );
      if (res.success) {
        setTrends(res.data);
      }
    } catch (error) {
      console.error("Error fetching trends", error);
    }
  }, [period, listFilter, statusFilter]);

  // Fetch top performers
  const fetchTopPerformers = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        limit: 10,
        listId: listFilter,
        status: statusFilter,
      });

      const res = await authFetch(
        `/contacts/dashboard/top-performers?${query.toString()}`,
      );
      if (res.success) {
        setTopPerformers(res.data);
      }
    } catch (error) {
      console.error("Error fetching top performers", error);
    }
  }, [listFilter, statusFilter]);

  // Fetch contacts table data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: 20,
        search,
        status: statusFilter,
        listId: listFilter,
        minReplies,
        minScore,
        lastActiveDays,
        sortBy,
        sortOrder,
      });

      const res = await authFetch(`/contacts/dashboard?${query.toString()}`);
      if (res.success) {
        setContacts(res.data);
        setTotalPages(res.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    statusFilter,
    listFilter,
    minReplies,
    minScore,
    lastActiveDays,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchDashboardData();
    fetchDashboardSummary();
    fetchTrends();
    fetchTopPerformers();
  }, [
    fetchDashboardData,
    fetchDashboardSummary,
    fetchTrends,
    fetchTopPerformers,
  ]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Hot":
        return "bg-red-500 text-white";
      case "Warm":
        return "bg-orange-500 text-white";
      case "Cold":
        return "bg-blue-400 text-gray-900";
      case "Dead":
        return "bg-gray-700 text-gray-300";
      default:
        return "bg-gray-600 text-gray-200";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-red-400";
    if (score >= 50) return "text-orange-400";
    return "text-gray-400";
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-600 ml-1" />;
    return sortOrder === "asc" ? (
      <FaSortUp className="text-emerald-400 ml-1" />
    ) : (
      <FaSortDown className="text-emerald-400 ml-1" />
    );
  };

  return (
    <div className="p-6 bg-[#111b21] min-h-screen text-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            Contact Analytics Dashboard
          </h1>
          <div className="flex gap-2">
            <select
              className="bg-[#2a3942] px-4 py-2 rounded border border-gray-600 text-white text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <KPICard
              title="Total Contacts"
              value={summary.totalContacts.toLocaleString()}
              subtitle="Active contacts"
              icon={<FaUsers />}
              color="blue"
            />
            <KPICard
              title="Avg Engagement"
              value={Math.round(summary.avgEngagementScore)}
              subtitle="Engagement score"
              icon={<FaChartLine />}
              color="green"
            />
            <KPICard
              title="Hot Leads"
              value={summary.hotLeadsCount.toLocaleString()}
              subtitle={`${Math.round((summary.hotLeadsCount / summary.totalContacts) * 100)}% of total`}
              icon={<FaFire />}
              color="red"
            />
            <KPICard
              title="Response Rate"
              value={`${summary.responseRate.toFixed(1)}%`}
              subtitle={`${summary.totalReplies} replies`}
              icon={<FaComments />}
              color="orange"
            />
          </div>
        )}

        {/* Trend Chart (Full Width) */}
        {trends.length > 0 && (
          <div className="mb-6">
            <TrendChart data={trends} />
          </div>
        )}

        {/* Status Distribution & Top Performers (Side by Side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {summary && <StatusDonutChart data={summary} />}
          {topPerformers.length > 0 && (
            <TopPerformersChart data={topPerformers} />
          )}
        </div>

        {/* Filters */}
        <div className="bg-[#202d33] p-4 rounded-lg mb-6 shadow-md flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                className="w-full bg-[#2a3942] pl-10 pr-4 py-2 rounded border border-gray-600 focus:border-emerald-500 focus:outline-none text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="bg-[#2a3942] px-4 py-2 rounded border border-gray-600 focus:border-emerald-500 text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="dead">Dead</option>
            </select>

            <select
              className="bg-[#2a3942] px-4 py-2 rounded border border-gray-600 focus:border-emerald-500 text-white"
              value={listFilter}
              onChange={(e) => setListFilter(e.target.value)}
            >
              <option value="">All Lists</option>
              {lists.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-wrap gap-4 items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Min Replies:</span>
              <input
                type="number"
                placeholder="0"
                className="w-20 bg-[#2a3942] px-2 py-1 rounded border border-gray-600 focus:border-emerald-500 text-white"
                value={minReplies}
                onChange={(e) => setMinReplies(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Min Score:</span>
              <input
                type="number"
                placeholder="0-100"
                className="w-20 bg-[#2a3942] px-2 py-1 rounded border border-gray-600 focus:border-emerald-500 text-white"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Last Active &lt;</span>
              <input
                type="number"
                placeholder="Days"
                className="w-20 bg-[#2a3942] px-2 py-1 rounded border border-gray-600 focus:border-emerald-500 text-white"
                value={lastActiveDays}
                onChange={(e) => setLastActiveDays(e.target.value)}
              />
              <span className="text-gray-400">days ago</span>
            </div>
            <button
              onClick={() => {
                setStatusFilter("all");
                setListFilter("");
                setMinReplies("");
                setMinScore("");
                setLastActiveDays("");
                setSearch("");
              }}
              className="ml-auto text-emerald-400 hover:text-emerald-300 text-sm underline"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-[#202d33] rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">
              Contact Details
            </h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#2a3942] text-gray-300 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th
                  className="px-6 py-4 font-semibold cursor-pointer"
                  onClick={() => handleSort("totalSent")}
                >
                  <div className="flex items-center">
                    Sent {renderSortIcon("totalSent")}
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold">Engagement</th>
                <th
                  className="px-6 py-4 font-semibold cursor-pointer"
                  onClick={() => handleSort("engagementScore")}
                >
                  <div className="flex items-center">
                    Score {renderSortIcon("engagementScore")}
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th
                  className="px-6 py-4 font-semibold cursor-pointer"
                  onClick={() => handleSort("lastActive")}
                >
                  <div className="flex items-center">
                    Last Active {renderSortIcon("lastActive")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading analytics data...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No contacts found matching criteria.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={contact._id}
                    className="hover:bg-[#2a3942] transition-colors cursor-pointer"
                    onClick={() => setSelectedContactId(contact._id)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {contact.name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-400">
                        {contact.phoneNumber}
                      </div>
                      <div className="text-xs text-emerald-500 mt-1">
                        {contact.contactList?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-mono">
                        {contact.totalSent}
                      </div>
                      <div className="text-xs text-gray-500">
                        Failed: {contact.failed}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs flex justify-between">
                          <span>Read:</span>
                          <span className="font-mono text-white">
                            {contact.read} ({Math.round(contact.readRate || 0)}
                            %)
                          </span>
                        </div>
                        <div className="text-xs flex justify-between">
                          <span>Reply:</span>
                          <span className="font-mono text-white">
                            {contact.replied} (
                            {Math.round(contact.replyRate || 0)}%)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`text-xl font-bold ${getScoreColor(contact.engagementScore)}`}
                      >
                        {Math.round(contact.engagementScore || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${getStatusColor(contact.computedStatus)}`}
                      >
                        {contact.computedStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {contact.lastActive
                        ? new Date(contact.lastActive).toLocaleDateString()
                        : "Never"}
                      <div className="text-xs text-gray-500">
                        {contact.lastActive
                          ? new Date(contact.lastActive).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : ""}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-[#202d33] rounded hover:bg-[#2a3942] disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page <span className="text-white font-bold">{page}</span> of{" "}
            {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-[#202d33] rounded hover:bg-[#2a3942] disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>

        {/* Detail Modal */}
        {selectedContactId && (
          <ContactDetailModal
            contactId={selectedContactId}
            onClose={() => setSelectedContactId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ContactAnalytics;
