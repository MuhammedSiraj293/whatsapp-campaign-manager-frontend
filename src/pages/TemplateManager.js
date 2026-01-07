import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { AuthContext } from "../context/AuthContext";
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  FunnelIcon,
  ArrowsRightLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  ChevronRightIcon,
  CreditCardIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  FolderIcon,
  ClockIcon,
  CloudIcon,
  EllipsisHorizontalIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

// Recharts for Analytics Graph
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import TemplateForm from "../components/TemplateForm";
import TemplatePreview from "../components/TemplatePreview";

// Helper to format date like "Jan 6, 2026"
const formatDate = (dateString) => {
  if (!dateString) return "--";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Helper to extract body snippet
const getBodySnippet = (components) => {
  const body = components.find((c) => c.type === "BODY");
  if (!body || !body.text) return "";
  return body.text.length > 30 ? body.text.substring(0, 30) + "..." : body.text;
};

// --- CUSTOM HOOK FOR OUTSIDE CLICK ---
function useOutsideAlerter(ref, callback) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

const TemplateManager = () => {
  const { authToken } = useContext(AuthContext);
  const [wabaAccounts, setWabaAccounts] = useState([]);
  const [selectedWabaId, setSelectedWabaId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list"); // list, create, details
  const [editTemplateId, setEditTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null); // For Details View
  const [analyticsData, setAnalyticsData] = useState({}); // Detailed time-series data

  // --- FILTERS STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [dateRange, setDateRange] = useState(7);

  // Dropdown visibility states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Refs for outside click
  const catRef = useRef(null);
  const langRef = useRef(null);
  const statusRef = useRef(null);
  const dateRef = useRef(null);

  useOutsideAlerter(catRef, () => setShowCategoryDropdown(false));
  useOutsideAlerter(langRef, () => setShowLanguageDropdown(false));
  useOutsideAlerter(statusRef, () => setShowStatusDropdown(false));
  useOutsideAlerter(dateRef, () => setShowDateDropdown(false));

  // --- CREATE FORM STATE ---
  // Form state is now handled by TemplateForm component
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const fetchWaba = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/waba/accounts`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setWabaAccounts(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedWabaId(res.data.data[0].businessAccountId);
        }
      } catch (err) {
        console.error("Failed to fetch WABA accounts", err);
      }
    };
    fetchWaba();
  }, [authToken]);

  // Fetch Templates whenever filters change
  useEffect(() => {
    if (selectedWabaId && view === "list") {
      // Debounce search slightly
      const timer = setTimeout(() => {
        fetchTemplates();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    selectedWabaId,
    view,
    searchQuery,
    selectedCategories,
    selectedLanguages,
    selectedStatuses,
    dateRange,
  ]);

  // Fetch Analytics when selectedTemplate changes
  useEffect(() => {
    if (view === "details" && selectedTemplate && selectedWabaId) {
      fetchTemplateAnalytics();
    }
  }, [view, selectedTemplate, selectedWabaId, dateRange]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Construct Query Params
      const params = {};
      if (searchQuery) params.name = searchQuery;
      if (selectedCategories.length > 0)
        params.category = selectedCategories.join(",");
      if (selectedLanguages.length > 0)
        params.language = selectedLanguages.join(",");

      const validMetaStatuses = ["APPROVED", "REJECTED", "PENDING", "PAUSED"];
      const statusFilters = selectedStatuses.filter((s) =>
        validMetaStatuses.includes(s)
      );
      if (statusFilters.length > 0) params.status = statusFilters.join(",");

      // Analytics Date Range
      if (dateRange) {
        const end = Math.floor(Date.now() / 1000);
        const start = Math.floor(Date.now() / 1000) - dateRange * 24 * 60 * 60;
        params.start = start;
        params.end = end;
      }

      const res = await axios.get(
        `${API_URL}/api/templates/${selectedWabaId}`,
        {
          params,
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      setTemplates(res.data.data);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateAnalytics = async () => {
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = Math.floor(Date.now() / 1000) - dateRange * 24 * 60 * 60;

      const res = await axios.get(
        `${API_URL}/api/templates/${selectedWabaId}/analytics`,
        {
          params: {
            templateId: selectedTemplate.id,
            start,
            end,
          },
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      setAnalyticsData(res.data);
    } catch (err) {
      console.error("Failed to fetch template analytics", err);
      // Fallback or empty chart will render
      setAnalyticsData({});
    }
  };

  // --- HANDLERS for Filter Toggles ---
  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleLanguage = (lang) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleStatus = (statusKey) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusKey)
        ? prev.filter((s) => s !== statusKey)
        : [...prev, statusKey]
    );
  };

  const selectAllStatuses = () => {
    const all = ["APPROVED", "REJECTED", "PENDING", "PAUSED"];
    if (selectedStatuses.length === all.length) setSelectedStatuses([]);
    else setSelectedStatuses(all);
  };

  // --- EDITOR HANDLERS ---
  const handleEdit = (template) => {
    setEditTemplateId(template.id);
    setView("create");
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setFormError("");
    setFormSuccess("");

    try {
      if (editTemplateId) {
        await axios.put(
          `${API_URL}/api/templates/${editTemplateId}`,
          { wabaId: selectedWabaId, components: formData.components },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setFormSuccess("Template updated successfully!");
      } else {
        await axios.post(
          `${API_URL}/api/templates`,
          { wabaId: selectedWabaId, ...formData },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setFormSuccess(
          "Template created successfully! Waiting for Meta review."
        );
      }
      setTimeout(() => {
        setView("list");
        setEditTemplateId(null);
        setFormError("");
        setFormSuccess("");
      }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save template.");
    } finally {
      setLoading(false);
    }
  };

  // --- DETAILS VIEW MOCK CHART ---
  const renderAnalytics = () => {
    // If no data yet, show loading or empty state
    // Use data strictly from API response
    const graphData = analyticsData?.data || [];

    // Fallback if API hasn't returned yet, use selectedTemplate stats as baseline
    // But prefer real graph totals if available.
    // Ensure displaySent comes from graphData to match detailed view
    const displaySent =
      graphData.reduce((acc, curr) => acc + (curr.sent || 0), 0) ||
      (analyticsData.summary ? 0 : selectedTemplate.messages_delivered) ||
      0;
    const displayDelivered =
      graphData.reduce((acc, curr) => acc + (curr.delivered || 0), 0) ||
      (analyticsData.summary ? 0 : selectedTemplate.messages_delivered) ||
      0;
    const totalRead = graphData.reduce(
      (acc, curr) => acc + (curr.read || 0),
      0
    );

    // Read rate calculation
    const readRate =
      displaySent > 0 ? Math.round((totalRead / displaySent) * 100) : 0;

    // Currency formatting - Display empty if no data from API
    // Per user "if no sharing data leve it"
    const amountSpent = "--";
    const costPerDelivered = "--";

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-[#DADDE1] mt-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800 text-lg">
            Performance{" "}
            <InformationCircleIcon className="w-4 h-4 inline text-gray-400" />
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 border border-[#DADDE1] rounded-lg">
            <div className="text-xs text-gray-500 mb-1 font-semibold uppercase">
              Amount spent{" "}
              <InformationCircleIcon className="w-3 h-3 inline ml-1" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {amountSpent}
            </div>
          </div>
          <div className="p-4 border border-[#DADDE1] rounded-lg">
            <div className="text-xs text-gray-500 mb-1 font-semibold uppercase">
              Cost per message{" "}
              <InformationCircleIcon className="w-3 h-3 inline ml-1" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {costPerDelivered}
            </div>
          </div>
          <div className="p-4 border border-[#DADDE1] rounded-lg">
            <div className="text-xs text-gray-500 mb-1 font-semibold uppercase">
              Messages sent
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {displaySent}
            </div>
          </div>
          <div className="p-4 border border-[#DADDE1] rounded-lg">
            <div className="text-xs text-gray-500 mb-1 font-semibold uppercase">
              Messages delivered
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {displayDelivered}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 border border-[#DADDE1] rounded-lg">
            <div className="text-xs text-gray-500 mb-1 font-semibold uppercase">
              Messages read
            </div>
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {totalRead}
              <span className="text-sm font-normal text-gray-500">
                ({readRate}%)
              </span>
            </div>
          </div>
          <div className="p-4 border border-[#DADDE1] rounded-lg">
            <div className="text-xs text-gray-500 mb-1 font-semibold uppercase">
              Unique replies
            </div>
            <div className="text-2xl font-bold text-gray-900">--</div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={graphData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#65676B", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#65676B", fontSize: 12 }}
              />
              <Tooltip />
              <Legend iconType="plainline" />
              <Line
                type="monotone"
                dataKey="sent"
                stroke="#E05B5B"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="Messages sent"
              />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#5B3878"
                strokeWidth={2}
                dot={false}
                name="Messages delivered"
              />
              <Line
                type="monotone"
                dataKey="read"
                stroke="#008080"
                strokeWidth={2}
                dot={false}
                name="Messages read"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1C2B33] font-sans flex text-sm justify-center">
      {/* --- MAIN CONTENTWRAPPER --- */}
      <div className="w-full max-w-[1400px] flex flex-col min-w-0 mx-auto px-4">
        {view === "details" && selectedTemplate ? (
          /* --- DETAILS VIEW --- */
          <div className="p-6">
            {/* Breadcrumb / Header */}
            <div className="flex items-center gap-2 text-gray-500 mb-4 text-xs">
              <span
                className="cursor-pointer hover:underline"
                onClick={() => setView("list")}
              >
                Manage templates
              </span>
              <ChevronRightIcon className="w-3 h-3" />
              <span className="font-semibold text-gray-700">
                Template insights
              </span>
            </div>

            {/* Title Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#008069] rounded flex items-center justify-center text-white">
                  <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedTemplate.name}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                        selectedTemplate.status === "APPROVED"
                          ? "bg-[#E7F6D5] text-[#1F510F] border-[#E7F6D5]"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {selectedTemplate.status === "APPROVED"
                        ? "Active - Quality pending"
                        : selectedTemplate.status}
                    </span>
                    <span>•</span>
                    <span>{selectedTemplate.category}</span>
                    <span>•</span>
                    <span>
                      Updated {formatDate(selectedTemplate.last_updated_time)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="btn btn-sm bg-white border border-[#DADDE1] text-gray-700 hover:bg-gray-50 font-medium normal-case gap-2">
                  <CloudIcon className="w-4 h-4" /> Cloud API{" "}
                  <ChevronDownIcon className="w-3 h-3" />
                </button>
                <div className="flex items-center bg-white border border-[#DADDE1] rounded h-8 px-3 text-sm text-gray-600 gap-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>Auto-detected: Dec 30, 2025 - Jan 7, 2026</span>
                  <ChevronDownIcon className="w-3 h-3" />
                </div>
                <button
                  className="btn btn-sm bg-[#E4E6EB] hover:bg-[#D8DADF] border border-[#DADDE1] text-gray-900 font-medium normal-case gap-2"
                  onClick={() => handleEdit(selectedTemplate)}
                >
                  <PencilSquareIcon className="w-4 h-4" /> Edit template
                </button>
                <button className="btn btn-sm btn-square bg-white border border-[#DADDE1] text-gray-600">
                  <EllipsisHorizontalIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-[#FFF5E5] border border-[#F5C32E] rounded-md p-3 flex gap-3 text-sm text-gray-800 mb-6">
              <ExclamationCircleIcon className="w-5 h-5 text-[#F5C32E] shrink-0" />
              <div>
                <div className="font-semibold">
                  This template was edited during the selected date range
                </div>
                <div>
                  Insights show the total engagement for all versions of this
                  message template in the date range you selected.
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Preview */}
              <div className="w-full lg:w-[320px] shrink-0">
                <h3 className="font-bold text-gray-800 mb-3 ml-1">
                  Your template
                </h3>
                <TemplatePreview template={selectedTemplate} />
              </div>

              {/* Right: Insights */}
              <div className="flex-1 min-w-0">
                {/* Top Cards */}
                {renderAnalytics()}

                <div className="mt-4 text-xs text-gray-400 text-right">
                  Analytics powered by Meta. This dashboard is governed by the
                  Meta Hosting Terms for Cloud API.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* --- LIST / CREATE VIEW --- */
          <div className="p-6 md:p-8 overflow-y-auto">
            {/* TABS */}
            {view === "list" && (
              <div className="flex gap-1 mb-4">
                <button
                  className={`px-4 py-2 font-semibold rounded-md ${
                    view === "list" && !editTemplateId
                      ? "bg-[#EBF5FF] text-[#0064C8]"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setView("list")}
                >
                  Templates
                </button>
                <button className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-md">
                  Template groups
                </button>
              </div>
            )}

            {view === "list" ? (
              <div className="bg-white rounded-md shadow-sm border border-[#DADDE1]">
                {/* FILTER BAR */}
                <div className="p-3 flex flex-wrap gap-2 items-center border-b border-[#DADDE1] bg-white rounded-t-md relative z-20">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input input-sm h-9 pl-9 w-64 border-[#DADDE1] focus:outline-none focus:border-blue-500 rounded-sm text-base"
                    />
                  </div>

                  {/* CATEGORY DROPDOWN */}
                  <div className="relative" ref={catRef}>
                    <button
                      className="btn btn-sm h-9 bg-white border-[#DADDE1] text-gray-600 hover:bg-gray-50 flex justify-between min-w-[120px] rounded-sm font-normal normal-case"
                      onClick={() =>
                        setShowCategoryDropdown(!showCategoryDropdown)
                      }
                    >
                      Category <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute top-10 left-0 bg-white shadow-xl border border-gray-200 rounded-md w-48 p-2 z-50">
                        {["MARKETING", "UTILITY", "AUTHENTICATION"].map(
                          (cat) => (
                            <label
                              key={cat}
                              className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                                className="checkbox checkbox-xs rounded-sm border-gray-400 checked:bg-blue-600"
                              />
                              <span className="capitalize text-sm">
                                {cat.toLowerCase()}
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* LANGUAGE DROPDOWN */}
                  <div className="relative" ref={langRef}>
                    <button
                      className="btn btn-sm h-9 bg-white border-[#DADDE1] text-gray-600 hover:bg-gray-50 flex justify-between min-w-[120px] rounded-sm font-normal normal-case"
                      onClick={() =>
                        setShowLanguageDropdown(!showLanguageDropdown)
                      }
                    >
                      Language <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {showLanguageDropdown && (
                      <div className="absolute top-10 left-0 bg-white shadow-xl border border-gray-200 rounded-md w-48 p-2 z-50">
                        {["en_US", "ar"].map((lang) => (
                          <label
                            key={lang}
                            className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLanguages.includes(lang)}
                              onChange={() => toggleLanguage(lang)}
                              className="checkbox checkbox-xs rounded-sm border-gray-400 checked:bg-blue-600"
                            />
                            <span className="text-sm">
                              {lang === "en_US" ? "English (US)" : "Arabic"}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* STATUS DROPDOWN */}
                  <div className="relative" ref={statusRef}>
                    <button
                      className="btn btn-sm h-9 bg-white border-[#DADDE1] text-gray-600 hover:bg-gray-50 flex justify-between min-w-[140px] rounded-sm font-normal normal-case"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    >
                      {selectedStatuses.length > 0
                        ? `${selectedStatuses.length} options sel...`
                        : "Filter by..."}{" "}
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute top-10 left-0 bg-white shadow-xl border border-gray-200 rounded-md w-64 p-2 z-50">
                        <label className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer border-b border-gray-100 mb-1">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={selectAllStatuses}
                            className="checkbox checkbox-xs rounded-sm border-gray-400 checked:bg-blue-600"
                          />
                          <span className="text-sm font-semibold">
                            Select all
                          </span>
                        </label>
                        <div className="max-h-60 overflow-y-auto">
                          {["APPROVED", "REJECTED", "PENDING", "PAUSED"].map(
                            (status) => (
                              <label
                                key={status}
                                className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedStatuses.includes(status)}
                                  onChange={() => toggleStatus(status)}
                                  className="checkbox checkbox-xs rounded-sm border-gray-400 checked:bg-blue-600"
                                />
                                <span className="text-sm capitalize">
                                  {status === "APPROVED"
                                    ? "Active"
                                    : status.toLowerCase()}
                                </span>
                              </label>
                            )
                          )}
                        </div>
                        <div className="pt-2 border-t border-gray-100 mt-1 flex justify-end">
                          <button
                            className="btn btn-xs btn-primary bg-[#0866FF] border-none"
                            onClick={() => setShowStatusDropdown(false)}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DATE DROPDOWN */}
                  <div className="relative ml-auto" ref={dateRef}>
                    <div
                      className="flex items-center border border-[#DADDE1] rounded-sm h-9 px-3 bg-white text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => setShowDateDropdown(!showDateDropdown)}
                    >
                      Last {dateRange} days{" "}
                      <ChevronDownIcon className="w-4 h-4 ml-2" />
                    </div>
                    {showDateDropdown && (
                      <div className="absolute top-10 right-0 bg-white shadow-xl border border-gray-200 rounded-md w-40 p-2 z-50">
                        {[7, 30, 60, 90].map((days) => (
                          <label
                            key={days}
                            className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="date"
                              checked={dateRange === days}
                              onChange={() => setDateRange(days)}
                              className="radio radio-xs checked:bg-blue-600"
                            />
                            <span className="text-sm">Last {days} days</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="btn btn-sm h-9 bg-[#F0F2F5] hover:bg-[#E4E6EB] border border-[#DADDE1] text-gray-700 font-medium normal-case gap-2 rounded-sm shadow-none">
                    <Cog6ToothIcon className="w-4 h-4" /> Namespace
                  </button>

                  <button className="btn btn-sm h-9 bg-white hover:bg-gray-50 border border-[#DADDE1] text-gray-700 font-medium normal-case rounded-sm shadow-none">
                    Compare
                  </button>

                  <button
                    className="btn btn-sm h-9 bg-[#0866FF] hover:bg-[#0052cc] border-none text-white font-medium normal-case rounded-md shadow-none px-4"
                    onClick={() => {
                      setEditTemplateId(null);
                      setView("create");
                    }}
                  >
                    Create template
                  </button>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto min-h-[400px]">
                  <table className="table w-full text-sm">
                    <thead className="bg-white text-gray-500 font-medium border-b border-[#DADDE1]">
                      <tr>
                        <th className="w-10 py-3">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-xs rounded-sm border-gray-400"
                          />
                        </th>
                        <th className="font-semibold text-xs text-gray-500 uppercase py-3 cursor-pointer hover:bg-gray-50">
                          Template name{" "}
                          <span className="inline-block ml-1">↓</span>
                        </th>
                        <th className="font-semibold text-xs text-gray-500 uppercase py-3 cursor-pointer hover:bg-gray-50">
                          Category <span className="inline-block ml-1">↑↓</span>
                        </th>
                        <th className="font-semibold text-xs text-gray-500 uppercase py-3 cursor-pointer hover:bg-gray-50">
                          Language <span className="inline-block ml-1">↑↓</span>
                        </th>
                        <th className="font-semibold text-xs text-gray-500 uppercase py-3 cursor-pointer hover:bg-gray-50">
                          Status <span className="inline-block ml-1">↑↓</span>
                        </th>
                        <th className="font-semibold text-xs text-gray-500 uppercase py-3 text-center">
                          Messages
                          <br />
                          delivered
                        </th>
                        <th className="font-semibold text-xs text-gray-500 uppercase py-3 text-center">
                          Read rate
                        </th>
                        <th className="font-semibold text-xs text-gray-500 uppercase py-3 text-center">
                          Top block
                          <br />
                          reason
                        </th>
                        <th className="font-semibold text-xs text-gray-500 uppercase py-3 text-right">
                          Last edited{" "}
                          <span className="inline-block ml-1">↓</span>
                        </th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-900">
                      {loading ? (
                        <tr>
                          <td
                            colSpan="10"
                            className="text-center py-20 text-gray-500"
                          >
                            Loading templates...
                          </td>
                        </tr>
                      ) : templates.length === 0 ? (
                        <tr>
                          <td
                            colSpan="10"
                            className="text-center py-20 text-gray-400"
                          >
                            No templates found matching filters.
                          </td>
                        </tr>
                      ) : (
                        templates.map((t) => (
                          <tr
                            key={t.id}
                            className="hover:bg-gray-50 border-b border-[#F0F2F5] last:border-0 group"
                          >
                            <td className="py-4">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs rounded-sm border-gray-400"
                              />
                            </td>
                            <td
                              className="max-w-[280px] py-4 cursor-pointer"
                              onClick={() => {
                                setSelectedTemplate(t);
                                setView("details");
                              }}
                            >
                              <div className="font-bold text-[#0866FF] hover:underline mb-1 text-[15px]">
                                {t.name}
                              </div>
                              <div className="flex items-start gap-1.5 text-gray-500 text-xs truncate">
                                <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                                <span className="truncate">
                                  {getBodySnippet(t.components)}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 text-[15px]">{t.category}</td>
                            <td className="py-4 text-[15px]">{t.language}</td>
                            <td className="py-4">
                              {/* META PILL BADGE */}
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                  t.status === "APPROVED"
                                    ? "bg-[#E7F6D5] text-[#1F510F] border-[#E7F6D5]"
                                    : t.status === "REJECTED"
                                    ? "bg-[#FFEBEB] text-[#C0121A] border-[#FFEBEB]"
                                    : "bg-[#FEF5D5] text-[#7A6117] border-[#FEF5D5]"
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    t.status === "APPROVED"
                                      ? "bg-[#4B9C25]"
                                      : t.status === "REJECTED"
                                      ? "bg-[#C0121A]"
                                      : "bg-[#F5C32E]"
                                  }`}
                                ></div>
                                {t.status === "APPROVED"
                                  ? "Active - Quality pending"
                                  : t.status === "PENDING"
                                  ? "In Review"
                                  : t.status}
                              </span>
                            </td>
                            <td className="text-center py-4 text-[15px]">
                              {t.messages_delivered || 0}
                            </td>
                            <td className="text-center py-4 text-[15px]">
                              {t.read_rate || "0%"}
                            </td>
                            <td className="text-center py-4 text-[15px]">--</td>
                            <td className="text-right py-4 text-gray-500 text-[14px]">
                              {formatDate(t.last_updated_time)}
                            </td>
                            <td className="py-4">
                              <button
                                className="btn btn-xs btn-ghost opacity-0 group-hover:opacity-100"
                                onClick={() => handleEdit(t)}
                              >
                                <PencilSquareIcon className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* --- CREATE / EDIT FORM --- */
              <div className="h-full">
                <TemplateForm
                  initialData={
                    editTemplateId
                      ? templates.find((t) => t.id === editTemplateId)
                      : null
                  }
                  wabaId={selectedWabaId}
                  authToken={authToken}
                  onSubmit={handleFormSubmit}
                  onCancel={() => {
                    setView("list");
                    setEditTemplateId(null);
                  }}
                  loading={loading}
                  error={formError}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManager;
