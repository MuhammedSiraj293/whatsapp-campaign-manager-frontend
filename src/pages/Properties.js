// frontend/src/pages/Properties.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { FaEdit, FaTrash, FaExpand } from "react-icons/fa"; // Imported Icons

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false); // Description Expand State

  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]); // Selected Rows State
  const [isSelectionMode, setIsSelectionMode] = useState(false); // Selection Mode State

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    propertyType: "",
    location: "",
    developer: "",
    priceRange: "",
    unitSize: "",
    unitType: "",
    handoverDate: "",
    description: "",
    tags: [],
    isActive: true,
  });

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
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, locationFilter, typeFilter, statusFilter]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        search: debouncedSearch,
        location: locationFilter,
        propertyType: typeFilter,
        status: statusFilter,
      });

      const res = await axios.get(`${API_URL}/api/properties?${params}`);

      // Handle both new paginated response and old array response (fallback)
      if (res.data.pagination) {
        setProperties(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalRecords(res.data.count);
      } else {
        setProperties(res.data); // Fallback if backend not updated yet
      }
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleOpen = (property = null) => {
    if (property) {
      setFormData({
        name: property.name,
        propertyType: property.propertyType || "",
        location: property.location,
        developer: property.developer || "",
        priceRange: property.priceRange || "",
        unitSize: property.unitSize || "",
        unitType: property.unitType || "",
        handoverDate: property.handoverDate || "",
        description: property.description || "",
        tags: property.tags || [],
        isActive: property.isActive,
      });
      setCurrentId(property._id);
      setIsEdit(true);
    } else {
      setFormData({
        name: "",
        propertyType: "",
        location: "",
        developer: "",
        priceRange: "",
        unitSize: "",
        unitType: "",
        handoverDate: "",
        description: "",
        tags: [],
        isActive: true,
      });
      setIsEdit(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/api/properties/${currentId}`, formData);
      } else {
        await axios.post(`${API_URL}/api/properties`, formData);
      }
      fetchProperties();
      handleClose();
    } catch (err) {
      console.error("Error saving property:", err);
      alert("Failed to save. Check console.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this property?")) {
      try {
        await axios.delete(`${API_URL}/api/properties/${id}`);
        fetchProperties();
      } catch (err) {
        console.error("Error deleting property:", err);
      }
    }
  };

  // --- SELECTION LOGIC ---
  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = properties.map((p) => p._id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.length} properties?`,
      )
    ) {
      try {
        await axios.post(`${API_URL}/api/properties/bulk-delete`, {
          ids: selectedIds,
        });
        setSelectedIds([]);
        fetchProperties();
      } catch (err) {
        console.error("Error deleting properties:", err);
        alert("Failed to delete selected properties");
      }
    }
  };

  return (
    <div className="p-2 md:p-4 min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white">
      <div className="w-full px-2 md:px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-white">
            Properties & Projects
          </h1>
          <button
            onClick={() => handleOpen()}
            className="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center gap-2"
          >
            <span>+</span> Add Property
          </button>
        </div>

        {/* --- FILTERS SECTION --- */}
        <div className="bg-[#202d33] p-3 rounded-lg shadow-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="col-span-1 md:col-span-1">
            <input
              type="text"
              placeholder="Search Project / Tag..."
              className="bg-[#2c3943] text-white px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 w-full placeholder-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <input
              type="text"
              placeholder="Filter Location..."
              className="bg-[#2c3943] text-white px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 w-full placeholder-gray-500"
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Type */}
          <div>
            <input
              type="text"
              placeholder="Filter Type (Villa...)"
              className="bg-[#2c3943] text-white px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 w-full placeholder-gray-500"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status */}
          <div>
            <select
              className="bg-[#2c3943] text-white px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 w-full"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-[#202d33] rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-uppercase bg-[#2c3943] text-gray-400">
                <tr>
                  {isSelectionMode && (
                    <th className="px-6 py-3">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          properties.length > 0 &&
                          selectedIds.length === properties.length
                        }
                        className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-600"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Developer</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Handover</th>
                  <th className="px-6 py-3">Active</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-emerald-500 animate-pulse"
                    >
                      Loading properties...
                    </td>
                  </tr>
                ) : properties.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No properties found.
                    </td>
                  </tr>
                ) : (
                  properties.map((p) => (
                    <tr
                      key={p._id}
                      className="border-b border-gray-700 hover:bg-[#2a373f] transition-colors"
                    >
                      {isSelectionMode && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p._id)}
                            onChange={() => handleSelectOne(p._id)}
                            className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-600"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="font-medium text-white text-base">
                          {p.name}
                        </div>
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                  tag.toLowerCase().includes("hot")
                                    ? "text-red-400 border-red-400 bg-red-400/10"
                                    : tag.toLowerCase().includes("new")
                                      ? "text-green-400 border-green-400 bg-green-400/10"
                                      : "text-blue-400 border-blue-400 bg-blue-400/10"
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {p.developer || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-700/50 px-2 py-1 rounded text-xs">
                          {p.propertyType} {p.unitType ? `(${p.unitType})` : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4">{p.location}</td>
                      <td className="px-6 py-4 font-medium text-emerald-400">
                        {p.priceRange || "-"}
                      </td>
                      <td className="px-6 py-4">{p.handoverDate || "-"}</td>
                      <td className="px-6 py-4">
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>{" "}
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>{" "}
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleOpen(p)}
                            className="font-medium text-sky-400 hover:text-sky-300 transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="font-medium text-red-500 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- PAGINATION & ACTION BAR --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-gray-400 text-sm">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            {/* Total Records */}
            <div>
              Total Records:{" "}
              <span className="text-white font-bold">{totalRecords}</span>
            </div>

            {/* Selection Actions (integrated minimally) */}
            <div className="h-4 w-px bg-gray-700 mx-2"></div>

            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedIds([]);
              }}
              className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
            >
              {isSelectionMode ? "Cancel Selection" : "Select"}
            </button>

            {isSelectionMode && selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1 transition-colors"
              >
                <FaTrash className="w-3 h-3" />
                Delete ({selectedIds.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                className="bg-[#202d33] text-white px-2 py-1 rounded outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded transition-colors ${
                  page === 1
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-emerald-500 hover:bg-emerald-500/10"
                }`}
              >
                PREVIOUS
              </button>
              <span>
                Page <span className="text-white font-medium">{page}</span> of{" "}
                {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages || totalPages === 0}
                className={`px-3 py-1 rounded transition-colors ${
                  page === totalPages || totalPages === 0
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

      {/* Modal Overlay (Unchanged Form Logic) */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-[#202d33] rounded-xl shadow-2xl w-full max-w-4xl border border-gray-700">
            <div className="flex justify-between items-center p-5 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">
                {isEdit ? "Edit Property" : "Add New Property"}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 placeholder-gray-500"
                  />
                </div>
                {/* Developer */}
                <div className="col-span-1">
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Developer
                  </label>
                  <input
                    type="text"
                    name="developer"
                    value={formData.developer}
                    onChange={handleChange}
                    className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 placeholder-gray-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Property Type
                  </label>
                  <input
                    type="text"
                    name="propertyType"
                    placeholder="e.g. Villa"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5 placeholder-gray-500"
                  />
                </div>
                {/* Unit Type */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Unit Type
                  </label>
                  <input
                    type="text"
                    name="unitType"
                    placeholder="e.g. 1BR, 2BR"
                    value={formData.unitType}
                    onChange={handleChange}
                    className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5 placeholder-gray-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5 placeholder-gray-500"
                  />
                </div>
                {/* Price */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Price Range
                  </label>
                  <input
                    type="text"
                    name="priceRange"
                    placeholder="e.g. AED 1.5M - 3M"
                    value={formData.priceRange}
                    onChange={handleChange}
                    className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5 placeholder-gray-500"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Unit Size
                  </label>
                  <input
                    type="text"
                    name="unitSize"
                    placeholder="e.g. 1,200 sqft"
                    value={formData.unitSize}
                    onChange={handleChange}
                    className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5 placeholder-gray-500"
                  />
                </div>
                {/* Handover */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Handover Date
                  </label>
                  <input
                    type="text"
                    name="handoverDate"
                    placeholder="e.g. Q4 2026"
                    value={formData.handoverDate}
                    onChange={handleChange}
                    className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5 placeholder-gray-500"
                  />
                </div>

                {/* Highlights / Tags */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Highlights / Badges
                  </label>

                  {/* Preset Toggles */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      {
                        label: "Hot Deal 🔥",
                        value: "Hot Deal",
                        color: "text-red-400 border-red-400",
                      },
                      {
                        label: "Super Hot 🔫",
                        value: "Super Hot Deal",
                        color: "text-orange-400 border-orange-400",
                      },
                      {
                        label: "New Listing 🆕",
                        value: "New Listing",
                        color: "text-green-400 border-green-400",
                      },
                      {
                        label: "New Launch 🚀",
                        value: "New Launch",
                        color: "text-purple-400 border-purple-400",
                      },
                      {
                        label: "Direct Developer 🏗️",
                        value: "Direct from Developer",
                        color: "text-blue-400 border-blue-400",
                      },
                      {
                        label: "Ready to Move 🔑",
                        value: "Ready to Move",
                        color: "text-emerald-400 border-emerald-400",
                      },
                      {
                        label: "High ROI 📈",
                        value: "High ROI",
                        color: "text-yellow-400 border-yellow-400",
                      },
                      {
                        label: "Off Plan 🏗️",
                        value: "Off Plan",
                        color: "text-cyan-400 border-cyan-400",
                      },
                      {
                        label: "Rental 🏠",
                        value: "Rental",
                        color: "text-indigo-400 border-indigo-400",
                      },
                      {
                        label: "Leasing 📝",
                        value: "Leasing",
                        color: "text-slate-300 border-slate-300",
                      },
                      {
                        label: "Payment Plan 💳",
                        value: "Payment Plan",
                        color: "text-pink-400 border-pink-400",
                      },
                      {
                        label: "Luxury ✨",
                        value: "Luxury",
                        color: "text-amber-200 border-amber-200",
                      },
                      {
                        label: "Waterfront 🌊",
                        value: "Waterfront",
                        color: "text-teal-400 border-teal-400",
                      },
                    ].map((tag) => (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => {
                            const newTags = prev.tags.includes(tag.value)
                              ? prev.tags.filter((t) => t !== tag.value)
                              : [...prev.tags, tag.value];
                            return { ...prev, tags: newTags };
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          formData.tags.includes(tag.value)
                            ? `bg-opacity-20 bg-white ${tag.color}`
                            : "border-gray-600 text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Tag Input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Type custom tag (e.g. Offplan, Rental)..."
                      className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5 placeholder-gray-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = e.target.value.trim();
                          if (val && !formData.tags.includes(val)) {
                            setFormData((prev) => ({
                              ...prev,
                              tags: [...prev.tags, val],
                            }));
                            e.target.value = "";
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="text-gray-400 text-sm"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        const val = input.value.trim();
                        if (val && !formData.tags.includes(val)) {
                          setFormData((prev) => ({
                            ...prev,
                            tags: [...prev.tags, val],
                          }));
                          input.value = "";
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>

                  {/* Active Tags Display (Removable) */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-[#111b21] rounded-lg border border-gray-700">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-white border border-gray-600"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                tags: prev.tags.filter((t) => t !== tag),
                              }))
                            }
                            className="text-gray-400 hover:text-white ml-1"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="col-span-1 md:col-span-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-300">
                      Description / Selling Points
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded(true)}
                      className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1"
                    >
                      <FaExpand /> Expand
                    </button>
                  </div>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5 placeholder-gray-500"
                    placeholder="Details for the AI..."
                  ></textarea>
                </div>

                {/* --- EXPANDED DESCRIPTION MODAL --- */}
                {isDescriptionExpanded && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm">
                    <div className="bg-[#202d33] rounded-xl shadow-2xl w-full max-w-4xl border border-gray-700 h-[80vh] flex flex-col">
                      <div className="flex justify-between items-center p-4 border-b border-gray-700 shrink-0 bg-[#2c3943] rounded-t-xl">
                        <h3 className="text-lg font-bold text-white">
                          Edit Description
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsDescriptionExpanded(false)}
                          className="text-gray-400 hover:text-white text-2xl"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="flex-1 p-4">
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          className="w-full h-full bg-[#111b21] border border-gray-600 text-white text-base p-4 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none placeholder-gray-500 font-mono leading-relaxed"
                          placeholder="Type detailed description here..."
                        />
                      </div>
                      <div className="p-4 border-t border-gray-700 flex justify-end bg-[#2c3943] rounded-b-xl">
                        <button
                          type="button"
                          onClick={() => setIsDescriptionExpanded(false)}
                          className="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-6 py-2.5"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Toggle */}
                <div className="col-span-1 md:col-span-3 flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-600"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm font-medium text-gray-300"
                  >
                    Active (Visible to AI)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end p-6 border-t border-gray-700 gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-300 bg-gray-700 hover:bg-gray-600 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  {isEdit ? "Update Property" : "Save Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
