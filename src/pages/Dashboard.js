// frontend/src/pages/Dashboard.js

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import socket from "../services/socket";
import DataBot from "../components/dashboard/DataBot";

// Helper function for new Pill Badges
const getStatusBadge = (status) => {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700 border border-gray-200";
    case "scheduled":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "sending":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 animate-pulse";
    case "paused":
      return "bg-orange-100 text-orange-700 border border-orange-200";
    case "sent":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "failed":
      return "bg-rose-100 text-rose-700 border border-rose-200";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
};

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("board"); // 'board', 'list', 'calendar'
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // Added limit state

  const navigate = useNavigate();
  const { activeWaba } = useWaba();

  const fetchCampaignsAndCounts = useCallback(async () => {
    if (!activeWaba) {
      setCampaigns([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const campaignsData = await authFetch(`/campaigns/waba/${activeWaba}?page=${currentPage}&limit=${recordsPerPage}`);
      if (campaignsData.success) {
        setCampaigns(campaignsData.data);
        setTotalPages(campaignsData.totalPages || 1);
        setTotalCount(campaignsData.totalCount || 0);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeWaba, currentPage, recordsPerPage]);

  useEffect(() => {
    fetchCampaignsAndCounts();
  }, [fetchCampaignsAndCounts]);

  useEffect(() => {
    const handleCampaignUpdate = () => {
      fetchCampaignsAndCounts();
    };
    socket.on("campaignsUpdated", handleCampaignUpdate);
    return () => socket.off("campaignsUpdated", handleCampaignUpdate);
  }, [fetchCampaignsAndCounts]);

  // Actions
  const handleAction = async (action, campaignId, extraData = {}) => {
    if (action === "delete" && !window.confirm("Delete this campaign?")) return;
    if (action === "send" && !window.confirm(`Send this campaign to ${extraData.count} contacts?`)) return;

    try {
      const method = action === "delete" ? "DELETE" : "POST";
      const url = action === "delete" ? `/campaigns/${campaignId}` : `/campaigns/${campaignId}/${action}`;
      const options = { method };
      
      if (action === "send") {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify({
          batchSize: extraData.batchSize || 50,
          batchDelay: extraData.batchDelay || 2000,
          messageDelay: extraData.messageDelay || 2000,
        });
      }

      const result = await authFetch(url, options);
      if (!result.success) alert(`Error: ${result.error}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const getCampaignDate = (campaign) => {
    let date = new Date(campaign.createdAt);
    if (campaign.status === "scheduled" && campaign.scheduledFor) {
      date = new Date(campaign.scheduledFor);
    } else if (campaign.status === "sent" && campaign.sentAt) {
      date = new Date(campaign.sentAt);
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const filteredCampaigns = campaigns.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-[#F7F8FA] min-h-screen w-full font-sans text-gray-900 pb-12">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>Overview</span>
              <span>/</span>
              <span className="font-semibold text-gray-900">Campaigns</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
              <h1 className="text-3xl font-bold text-gray-900">Campaign Assets</h1>
            </div>
          </div>
        </div>

        {/* CONTROLS (Toggles & Filters) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          
          {/* View Toggles (Board, List, Calendar) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode("board")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === "board" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Board
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === "calendar" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Calendar
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-gray-300 block w-full md:w-64 px-4 py-2 outline-none shadow-sm transition-shadow"
            />
            <button
              onClick={() => navigate("/create-campaign")}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-xl shadow-sm transition-colors text-sm whitespace-nowrap flex items-center gap-2"
            >
              <span>+</span> New Campaign
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        {isLoading ? (
          viewMode === "board" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: recordsPerPage }).map((_, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col animate-pulse">
                  <div className="bg-gray-100 rounded-xl h-32 mb-4 w-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-6 space-y-4">
                 {Array.from({ length: recordsPerPage }).map((_, i) => (
                   <div key={i} className="flex justify-between items-center animate-pulse border-b border-gray-50 pb-4">
                     <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                     <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                     <div className="h-4 bg-gray-200 rounded w-1/12"></div>
                     <div className="h-4 bg-gray-200 rounded w-1/12"></div>
                     <div className="h-8 bg-gray-200 rounded w-20"></div>
                   </div>
                 ))}
               </div>
            </div>
          )
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No campaigns found.</div>
        ) : viewMode === "board" ? (
          
          /* =========================================
           * BOARD VIEW (Grid of Cards)
           * ========================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign._id} className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col transition-shadow hover:shadow-md">
                
                {/* Mini Analytics Box */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${getStatusBadge(campaign.status)}`}>
                       {campaign.status}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">Analytics</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white px-2 py-1.5 rounded-lg border border-gray-100 flex justify-between items-center shadow-sm">
                      <span className="text-gray-500 font-medium">Sent</span>
                      <span className="font-bold text-gray-900">{campaign.stats?.sent || 0}</span>
                    </div>
                    <div className="bg-white px-2 py-1.5 rounded-lg border border-gray-100 flex justify-between items-center shadow-sm">
                      <span className="text-gray-500 font-medium">Read</span>
                      <span className="font-bold text-gray-900">{campaign.stats?.read || 0}</span>
                    </div>
                    <div className="bg-white px-2 py-1.5 rounded-lg border border-gray-100 flex justify-between items-center shadow-sm">
                      <span className="text-gray-500 font-medium">Replied</span>
                      <span className="font-bold text-indigo-600">{campaign.stats?.replied || 0}</span>
                    </div>
                    <div className="bg-white px-2 py-1.5 rounded-lg border border-gray-100 flex justify-between items-center shadow-sm">
                      <span className="text-gray-500 font-medium">Failed</span>
                      <span className="font-bold text-rose-600">{campaign.stats?.failed || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">{getCampaignDate(campaign)}</p>
                  <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{campaign.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{campaign.message}</p>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  {campaign.status === "sent" ? (
                    <Link to={`/analytics/${campaign._id}`} className="text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors flex items-center gap-1">
                      Analytics ↗
                    </Link>
                  ) : ["draft", "scheduled", "failed"].includes(campaign.status) ? (
                    <button 
                      onClick={() => handleAction("send", campaign._id, { count: campaign.contactCount, batchSize: campaign.batchSize, batchDelay: campaign.batchDelay, messageDelay: campaign.messageDelay })} 
                      className="text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors flex items-center gap-1"
                    >
                      Send Now ↗
                    </button>
                  ) : campaign.status === "sending" ? (
                     <button onClick={() => handleAction("pause", campaign._id)} className="text-orange-700 hover:bg-orange-50 border border-orange-200 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors">
                      Pause
                    </button>
                  ) : (
                     <button onClick={() => handleAction("resume", campaign._id)} className="text-green-700 hover:bg-green-50 border border-green-200 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors">
                      Resume
                    </button>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <div className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100" title="Recipients">
                      👥 {campaign.contactCount || 0}
                    </div>
                    <button onClick={() => handleAction("delete", campaign._id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors ml-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : viewMode === "list" ? (

          /* =========================================
           * LIST VIEW (Table)
           * ========================================= */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Campaign Name</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Recipients</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {getCampaignDate(campaign)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{campaign.name}</span>
                        <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{campaign.message}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {campaign.contactCount || 0}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {campaign.status === "sending" && (
                          <button onClick={() => handleAction("pause", campaign._id)} className="text-gray-500 hover:text-orange-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors">Pause</button>
                        )}
                        {campaign.status === "paused" && (
                          <button onClick={() => handleAction("resume", campaign._id)} className="text-gray-500 hover:text-green-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors">Resume</button>
                        )}
                        {["draft", "scheduled", "failed"].includes(campaign.status) && (
                          <button 
                            onClick={() => handleAction("send", campaign._id, { count: campaign.contactCount, batchSize: campaign.batchSize, batchDelay: campaign.batchDelay, messageDelay: campaign.messageDelay })} 
                            className="text-gray-700 hover:text-blue-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
                          >
                            Send
                          </button>
                        )}
                        {campaign.status === "sent" && (
                          <Link to={`/analytics/${campaign._id}`} className="text-gray-700 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors">
                            Analytics ↗
                          </Link>
                        )}
                        <button onClick={() => handleAction("delete", campaign._id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors ml-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        ) : (
          <div className="text-center text-gray-400 py-12">Calendar view coming soon.</div>
        )}

        {/* Pagination Controls */}
        {!isLoading && filteredCampaigns.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Total Records:</span>
              <span className="font-bold text-gray-900">{totalCount}</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Records per page:</span>
                <select 
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page
                  }}
                  className="bg-white border border-gray-200 rounded-md py-1 px-2 text-gray-900 outline-none cursor-pointer shadow-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`font-semibold tracking-wide ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-gray-700 transition-colors"}`}
                >
                  PREVIOUS
                </button>
                <span className="text-gray-500">
                  Page <span className="font-semibold text-gray-900">{currentPage}</span> of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`font-semibold tracking-wide ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-emerald-500 hover:text-emerald-600 transition-colors"}`}
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <DataBot />
    </div>
  );
}
