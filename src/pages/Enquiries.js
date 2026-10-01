import React, { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import { FaTrash, FaSearch } from "react-icons/fa";
import { ListBulletIcon, Squares2X2Icon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";
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
  const [viewMode, setViewMode] = useState("list");
  const [calendarDate, setCalendarDate] = useState(new Date());

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
        return "bg-green-100 text-green-700 border border-green-200";
      case "contacted":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "handover":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const renderBoardView = () => {
    const statuses = ['pending', 'contacted', 'handover', 'completed'];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {statuses.map(status => {
          const colEnquiries = enquiries.filter(e => e.status.toLowerCase() === status);
          return (
            <div key={status} className="bg-gray-100 rounded-xl p-3 min-w-[280px]">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-semibold text-gray-700 capitalize">{status}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full font-medium">{colEnquiries.length}</span>
              </div>
              <div className="flex flex-col gap-3 h-[600px] overflow-y-auto scrollbar-hide pb-10">
                {colEnquiries.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 py-4">No enquiries</div>
                ) : (
                  colEnquiries.map(enquiry => (
                    <div key={enquiry._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow relative group">
                      {isSelectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(enquiry._id)}
                          onChange={() => handleSelectOne(enquiry._id)}
                          className="absolute top-3 right-3 w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-600 z-10"
                        />
                      )}
                      <div className="font-semibold text-gray-900 mb-1 pr-6">{enquiry.name || "N/A"}</div>
                      <div className="text-xs text-gray-500 mb-3">{enquiry.phoneNumber}</div>
                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-50">
                        <div className="text-xs font-medium text-indigo-600 truncate max-w-[120px]">{enquiry.projectName || "-"}</div>
                        <div className="text-[10px] text-gray-400">{new Date(enquiry.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCalendarView = () => {
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const nextMonth = () => setCalendarDate(addMonths(calendarDate, 1));
    const prevMonth = () => setCalendarDate(subMonths(calendarDate, 1));

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find enquiries for this day
        const dayEnquiries = enquiries.filter(e => isSameDay(new Date(e.createdAt), cloneDay));

        days.push(
          <div
            key={day}
            className={`min-h-[120px] bg-white border border-gray-100 p-2 ${
              !isSameMonth(day, monthStart)
                ? "text-gray-300 bg-gray-50"
                : "text-gray-700"
            }`}
          >
            <div className="flex justify-end">
              <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white' : ''}`}>
                {formattedDate}
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[80px] scrollbar-hide">
              {dayEnquiries.map(enq => (
                <div key={enq._id} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${getStatusClass(enq.status)}`}>
                  {enq.name || enq.phoneNumber}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{format(calendarDate, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="flex flex-col">
          {rows}
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-4 min-h-screen w-full bg-[#F7F8FA] text-gray-900">
      <div className="w-full px-2 md:px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Enquiries</h1>

        {/* --- FILTERS SECTION --- */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 mb-4 flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-500 text-xs" />
            </div>
              <input
              type="text"
              placeholder="Search Name, Phone, Project..."
              className="bg-gray-50 text-gray-900 border border-gray-200 pl-8 px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-gray-300 w-full placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40 shrink-0">
            <select
              className="bg-gray-50 text-gray-900 border border-gray-200 px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-gray-300 w-full"
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
          <div className="w-full md:w-56 shrink-0">
            <select
              className="bg-gray-50 text-gray-900 border border-gray-200 px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-gray-300 w-full truncate"
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

          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'board' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
              <CalendarDaysIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Actions / Total */}
          <div className="flex items-center justify-between md:justify-end gap-3 text-xs w-full md:w-auto shrink-0">
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedIds([]);
              }}
              className="text-gray-900 hover:text-gray-800 font-semibold font-medium transition-colors whitespace-nowrap"
            >
              {isSelectionMode ? "Cancel" : "Select"}
            </button>

            {isSelectionMode && selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="text-red-500 hover:text-red-400 font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
              >
                <FaTrash className="w-3 h-3" />
                Del ({selectedIds.length})
              </button>
            )}

            <div className="text-gray-600 border-l border-gray-200 pl-3 whitespace-nowrap">
              Found{" "}
              <span className="text-gray-800 font-semibold font-bold mx-1">
                {totalRecords}
              </span>
            </div>
          </div>
        </div>

        {/* View Container */}
        {viewMode === "list" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-uppercase bg-gray-50 text-gray-600 border-b border-gray-200">
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
                        className="w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-600"
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
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={isSelectionMode ? 10 : 9}
                      className="px-6 py-8 text-center text-gray-900 animate-pulse"
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
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {isSelectionMode && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(enquiry._id)}
                            onChange={() => handleSelectOne(enquiry._id)}
                            className="w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-600"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {enquiry.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {enquiry.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold">
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

        )}
        {viewMode === "board" && renderBoardView()}
        {viewMode === "calendar" && renderCalendarView()}

        {/* --- PAGINATION --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-gray-500 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows:</span>
              <select
                className="bg-gray-50 border border-gray-200 text-gray-900 px-2 py-1 rounded outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer text-xs"
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
                : "text-gray-900 hover:bg-gray-100"
                }`}
            >
              PREVIOUS
            </button>
            <span className="text-xs">
              Page <span className="text-gray-900 font-medium">{page}</span> of{" "}
              {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className={`px-3 py-1 rounded text-xs transition-colors ${page === totalPages || totalPages === 0
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-900 hover:bg-gray-100"
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
