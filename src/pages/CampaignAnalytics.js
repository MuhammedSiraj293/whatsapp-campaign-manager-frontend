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
        { headers },
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
        {/* --- NEW SKIPPED CARD --- */}
        <StatCard
          title="Skipped"
          value={`${analytics.skipped || 0} (${analytics.skippedRate || "0%"})`}
          className="border-l-4 border-gray-500"
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
          account email
          `sheets-manager@whatsapp-crm-472112.iam.gserviceaccount.com`.
        </p>
      </div>

      {/* --- NEW DETAILED ANALYTICS TABLE --- */}
      <DetailedAnalyticsTable campaignId={campaignId} />
    </div>
  );
}

// Sub-component for Detailed Analytics Table
const DetailedAnalyticsTable = ({ campaignId }) => {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // Default limit
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters or limit change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, limit, campaignId]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchDetails(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, statusFilter, limit, campaignId]);

  const fetchDetails = async (currentPage) => {
    try {
      setLoading(true);
      const res = await authFetch(
        `/analytics/${campaignId}/details?page=${currentPage}&limit=${limit}&status=${statusFilter}&search=${encodeURIComponent(
          debouncedSearch,
        )}`,
      );
      if (res.success) {
        setDetails(res.data);
        setTotalPages(res.pagination.pages);
        setTotalRecords(res.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl text-white mb-6">Detailed Analytics</h2>

      {/* --- FILTER & CONTROLS SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by Name or Phone..."
            className="bg-[#202d33] text-white px-4 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="bg-[#202d33] text-white px-4 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      <div className="bg-[#202d33] rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full text-left text-sm text-gray-400">
          <thead className="bg-[#2a3942] text-xs uppercase text-gray-300">
            <tr>
              <th className="px-6 py-3">Phone Number</th>
              <th className="px-6 py-3">Contact Name</th>
              <th className="px-6 py-3">Message ID</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Failure Reason</th>
              <th className="px-6 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading && details.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-emerald-500"
                >
                  Loading...
                </td>
              </tr>
            ) : details.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  No data found matching your filters.
                </td>
              </tr>
            ) : (
              details.map((item) => (
                <tr key={item._id} className="hover:bg-[#2a3942]">
                  <td className="px-6 py-4 text-white font-medium">
                    {item.phoneNumber}
                  </td>
                  <td className="px-6 py-4">{item.contactName}</td>
                  <td
                    className="px-6 py-4 truncate max-w-xs"
                    title={item.wamid}
                  >
                    {item.wamid}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold
                        ${
                          item.status === "read"
                            ? "bg-green-500/20 text-green-500"
                            : item.status === "delivered"
                              ? "bg-blue-500/20 text-blue-500"
                              : item.status === "failed"
                                ? "bg-red-500/20 text-red-500"
                                : item.status === "skipped"
                                  ? "bg-gray-500/20 text-gray-400"
                                  : "bg-gray-500/20 text-gray-500"
                        }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-red-400">
                    {item.failureReason}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(item.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER / PAGINATION --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-gray-400 text-sm">
        <div className="mb-2 md:mb-0">
          Total Records:{" "}
          <span className="text-white font-bold">{totalRecords}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Records per page:</span>
            <select
              className="bg-[#202d33] text-white px-2 py-1 rounded outline-none focus:ring-1 focus:ring-emerald-500"
              value={limit}
              onChange={handleLimitChange}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="100">100</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded ${
                page === 1
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-emerald-500 hover:text-emerald-400"
              }`}
            >
              PREVIOUS
            </button>
            <span>
              Page <span className="text-white">{page}</span> of{" "}
              {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className={`px-3 py-1 rounded ${
                page === totalPages || totalPages === 0
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-emerald-500 hover:text-emerald-400"
              }`}
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
