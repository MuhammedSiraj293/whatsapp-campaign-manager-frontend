// frontend/src/pages/CampaignAnalytics.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../services/api";

const StatCard = ({ title, value, className = "", valueClassName = "text-gray-800" }) => {
  return (
    <div
      className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center ${className}`}
    >
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h2>
      <p className={`text-3xl font-bold ${valueClassName}`}>{value}</p>
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
    return <p className="text-center text-gray-500 mt-10">Loading analytics...</p>;
  }
  if (!analytics) {
    return (
      <p className="text-center text-red-500 mt-10">
        Could not load analytics for this campaign.
      </p>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800">Campaign Analytics</h1>
          <button onClick={handleCsvExport} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors">
            Export to CSV
          </button>
        </div>
        <h2 className="text-xl text-gray-500 text-center mb-8">
        {analytics.name}
      </h2>
      {/* PREPARATION STAGE */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-400 mb-4 uppercase tracking-wider border-b border-gray-700 pb-2">1. Preparation Phase</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Total Uploaded Contacts"
            value={analytics.totalSent}
            className="border-l-4 border-violet-700"
          />
          <StatCard
            title="Cleaned / Removed Duplicates"
            value={`${analytics.skipped || 0} (${analytics.skippedRate || "0%"})`}
            className="border-l-4 border-gray-500"
          />
        </div>
      </div>

      {/* DELIVERY STAGE */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-400 mb-4 uppercase tracking-wider border-b border-gray-700 pb-2">2. Delivery Phase</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Successfully Received"
            value={`${analytics.totalDelivered} (${analytics.totalDeliveryRate})`}
            className="border-l-4 border-green-500"
          />
          <StatCard
            title="Failed / Invalid Numbers"
            value={`${analytics.failed} (${analytics.failedRate})`}
            className="border-l-4 border-red-500"
          />
          <StatCard
            title="Sending Right Now..."
            value={`${analytics.sent || 0} (${analytics.sentRate || "0%"})`}
            className="border-l-4 border-indigo-500"
          />
        </div>
      </div>

      {/* ENGAGEMENT STAGE */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-400 mb-4 uppercase tracking-wider border-b border-gray-700 pb-2">3. Engagement Phase</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Opened / Read"
            value={`${analytics.read} (${analytics.readRate})`}
            className="border-l-4 border-green-400"
          />
          <StatCard
            title="Responses"
            value={`${analytics.replies} (${analytics.replyRate})`}
            className="border-l-4 border-yellow-500"
          />
        </div>
      </div>

      {/* --- NEW GOOGLE SHEETS EXPORT SECTION --- */}
      <div className="mt-12 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Export Replies to Google Sheets
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Paste your Google Sheet ID here"
            className="bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm text-gray-800 w-full px-4 py-2 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
          />
          <button
            onClick={handleSheetExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            Export Replies
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3 font-medium">
          **Reminder**: You must share your Google Sheet with the service
          account email{" "}
          <span className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">
            sheets-manager@whatsapp-crm-472112.iam.gserviceaccount.com
          </span>
          .
        </p>
      </div>

      {/* --- NEW DETAILED ANALYTICS TABLE --- */}
      <DetailedAnalyticsTable campaignId={campaignId} />
      </div>
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
    <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Detailed Analytics</h2>

      {/* --- FILTER & CONTROLS SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by Name or Phone..."
            className="bg-gray-50 text-gray-800 px-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="bg-gray-50 text-gray-800 px-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
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

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold">Phone Number</th>
              <th className="px-6 py-4 font-semibold">Contact Name</th>
              <th className="px-6 py-4 font-semibold">Message ID</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Failure Reason</th>
              <th className="px-6 py-4 font-semibold">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && details.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-8 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : details.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No data found matching your filters.
                </td>
              </tr>
            ) : (
              details.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {item.phoneNumber}
                  </td>
                  <td className="px-6 py-4">{item.contactName}</td>
                  <td
                    className="px-6 py-4 truncate max-w-xs text-gray-400"
                    title={item.wamid}
                  >
                    {item.wamid}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium
                        ${
                          item.status === "read"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === "delivered"
                              ? "bg-blue-50 text-blue-700"
                              : item.status === "failed"
                                ? "bg-rose-50 text-rose-700"
                                : item.status === "skipped"
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-rose-500">
                    {item.failureReason}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(item.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER / PAGINATION --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-gray-500 text-sm border-t border-gray-100 pt-6">
        <div className="mb-4 md:mb-0">
          Total Records:{" "}
          <span className="text-gray-800 font-bold">{totalRecords}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Records per page:</span>
            <select
              className="bg-gray-50 text-gray-800 border border-gray-200 px-2 py-1 rounded outline-none focus:ring-2 focus:ring-emerald-500"
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
              className={`px-3 py-1 rounded font-medium transition-colors ${
                page === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              PREVIOUS
            </button>
            <span>
              Page <span className="text-gray-800 font-medium">{page}</span> of{" "}
              {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                page === totalPages || totalPages === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-emerald-600 hover:bg-emerald-50"
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
