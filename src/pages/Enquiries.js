import React, { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import { FaTrash, FaSearch } from "react-icons/fa";
import { useWaba } from "../context/WabaContext";

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // New Phone Number Filter State
  const [wabaAccounts, setWabaAccounts] = useState([]);
  const [availablePhoneNumbers, setAvailablePhoneNumbers] = useState([]);
  const [phoneNumberFilter, setPhoneNumberFilter] = useState("");

  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // WABA Context
  const { activeWaba } = useWaba();

  // Fetch WABA accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await authFetch("/waba/accounts");
        if (data.success) {
          setWabaAccounts(data.data);
        }
      } catch (error) {
        console.error("Error fetching WABA accounts:", error);
      }
    };
    fetchAccounts();
  }, []);

  // Update available phone numbers when activeWaba changes
  useEffect(() => {
    if (activeWaba && wabaAccounts.length > 0) {
      const account = wabaAccounts.find((acc) => acc._id === activeWaba);
      const phones = account ? account.phoneNumbers : [];
      setAvailablePhoneNumbers(phones);

      // Default to the first number if available
      if (phones.length > 0) {
        setPhoneNumberFilter(phones[0].phoneNumberId);
      } else {
        setPhoneNumberFilter("");
      }
    } else {
      setAvailablePhoneNumbers([]);
      setPhoneNumberFilter("");
    }
  }, [activeWaba, wabaAccounts]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on new search
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch when filters change
  useEffect(() => {
    fetchEnquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, statusFilter, activeWaba, phoneNumberFilter]);

  const fetchEnquiries = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        wabaId: activeWaba || "",
        phoneNumberFilter: phoneNumberFilter || "", // Send specific phone filter
      });

      const data = await authFetch(`/enquiries?${params}`);

      if (data.success) {
        setEnquiries(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.totalRecords);
        }
      }
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      // alert(error.message); // Suppress alert on component mount errors to be less annoying
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (enquiryId) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?"))
      return;
    try {
      await authFetch(`/enquiries/${enquiryId}`, { method: "DELETE" });
      fetchEnquiries(); // Refresh the list
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      alert(error.message);
    }
  };

  // --- SELECTION LOGIC ---
  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = enquiries.map((p) => p._id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.length} enquiries?`
      )
    ) {
      try {
        await authFetch(`/enquiries/bulk-delete`, {
          method: "POST",
          body: JSON.stringify({ ids: selectedIds }),
          headers: { "Content-Type": "application/json" }, // Ensure generic fetch handles this, typically authFetch handles auth headers
        });
        setSelectedIds([]);
        fetchEnquiries();
      } catch (err) {
        console.error("Error deleting enquiries:", err);
        alert("Failed to delete selected enquiries");
      }
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-900/40 text-green-400 border border-green-800";
      case "contacted":
        return "bg-blue-900/40 text-blue-400 border border-blue-800";
      case "pending":
        return "bg-yellow-900/40 text-yellow-400 border border-yellow-800";
      case "handover":
        return "bg-purple-900/40 text-purple-400 border border-purple-800";
      default:
        return "bg-gray-800 text-gray-400 border border-gray-700";
    }
  };

  return (
    <div className="p-2 md:p-4 min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white">
      <div className="w-full px-2 md:px-4">
        <h1 className="text-3xl font-bold text-white mb-6">Enquiries</h1>

        {/* --- FILTERS SECTION --- */}
        <div className="bg-[#202d33] p-3 rounded-lg shadow-lg mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-500 text-xs" />
            </div>
            <input
              type="text"
              placeholder="Search Name, Phone, Project..."
              className="bg-[#2c3943] text-white pl-8 px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 w-full placeholder-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="bg-[#2c3943] text-white px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 w-full"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="handover">Handover</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Phone Number Filter */}
          <div>
            <select
              className="bg-[#2c3943] text-white px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 w-full"
              value={phoneNumberFilter}
              onChange={(e) => {
                setPhoneNumberFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Phone Numbers</option>
              {availablePhoneNumbers.map((phone) => (
                <option key={phone._id} value={phone.phoneNumberId}>
                  {phone.phoneNumberName} ({phone.phoneNumberId})
                </option>
              ))}
            </select>
          </div>

          {/* Actions / Total */}
          <div className="flex items-center justify-end gap-3 text-xs">
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedIds([]);
              }}
              className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
            >
              {isSelectionMode ? "Cancel Selection" : "Select"}
            </button>

            {isSelectionMode && selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="text-red-500 hover:text-red-400 font-medium flex items-center gap-1 transition-colors"
              >
                <FaTrash className="w-3 h-3" />
                Delete ({selectedIds.length})
              </button>
            )}

            <div className="text-gray-400 border-l border-gray-600 pl-3">
              Found{" "}
              <span className="text-emerald-400 font-bold mx-1">
                {totalRecords}
              </span>{" "}
              enquiries
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-[#202d33] rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-uppercase bg-[#2c3943] text-gray-400">
                <tr>
                  {isSelectionMode && (
                    <th className="px-6 py-3 w-4">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          enquiries.length > 0 &&
                          selectedIds.length === enquiries.length
                        }
                        className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-600"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Project</th>
                  <th className="px-6 py-3">Bedrooms</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">URL</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={isSelectionMode ? 10 : 9}
                      className="px-6 py-8 text-center text-emerald-500 animate-pulse"
                    >
                      Loading enquiries...
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSelectionMode ? 10 : 9}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No enquiries match your search.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enquiry) => (
                    <tr
                      key={enquiry._id}
                      className="border-b border-gray-700 hover:bg-[#2a373f] transition-colors"
                    >
                      {isSelectionMode && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(enquiry._id)}
                            onChange={() => handleSelectOne(enquiry._id)}
                            className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-600"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {new Date(enquiry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${getStatusClass(
                            enquiry.status
                          )}`}
                        >
                          {enquiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                        {enquiry.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {enquiry.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-emerald-400">
                        {enquiry.projectName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enquiry.bedrooms || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enquiry.budget || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap truncate max-w-xs text-xs">
                        {enquiry.pageUrl && (
                          <a
                            href={enquiry.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300 underline"
                            title={enquiry.pageUrl}
                          >
                            View Link
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(enquiry._id)}
                          className="text-red-500 hover:text-red-400 transition-colors p-1"
                          title="Delete Enquiry"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- PAGINATION --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-gray-400 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows:</span>
              <select
                className="bg-[#202d33] text-white px-2 py-1 rounded outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs"
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded text-xs transition-colors ${page === 1
                ? "text-gray-600 cursor-not-allowed"
                : "text-emerald-500 hover:bg-emerald-500/10"
                }`}
            >
              PREVIOUS
            </button>
            <span className="text-xs">
              Page <span className="text-white font-medium">{page}</span> of{" "}
              {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className={`px-3 py-1 rounded text-xs transition-colors ${page === totalPages || totalPages === 0
                ? "text-gray-600 cursor-not-allowed"
                : "text-emerald-500 hover:bg-emerald-500/10"
                }`}
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
