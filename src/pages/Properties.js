import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);

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

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/properties`);
      setProperties(res.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

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

  return (
    <div className="p-4 md:p-8 min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
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

        {/* Table Container */}
        <div className="bg-[#202d33] rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-uppercase bg-[#2c3943] text-gray-400">
                <tr>
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
              <tbody>
                {properties.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-gray-700 hover:bg-[#2a373f]"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{p.name}</div>
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                tag.includes("Hot")
                                  ? "text-red-400 border-red-400 bg-red-400/10"
                                  : tag.includes("New")
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
                    <td className="px-6 py-4">{p.developer}</td>
                    <td className="px-6 py-4">
                      {p.propertyType} {p.unitType ? `(${p.unitType})` : ""}
                    </td>
                    <td className="px-6 py-4">{p.location}</td>
                    <td className="px-6 py-4">{p.priceRange}</td>
                    <td className="px-6 py-4">{p.handoverDate}</td>
                    <td className="px-6 py-4">
                      {p.isActive ? (
                        <span className="text-green-400">Active</span>
                      ) : (
                        <span className="text-red-400">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpen(p)}
                        className="font-medium text-sky-400 hover:underline mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="font-medium text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No properties found. Add your first project!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 overflow-y-auto">
          <div className="bg-[#202d33] rounded-lg shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">
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
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-1">
                  <label className="block mb-2 text-sm font-medium text-gray-300">
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
                  <label className="block mb-2 text-sm font-medium text-gray-300">
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
                  <label className="block mb-2 text-sm font-medium text-gray-300">
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
                  <label className="block mb-2 text-sm font-medium text-gray-300">
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
                <div className="col-span-1 md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Highlights / Badges
                  </label>
                  <div className="flex flex-wrap gap-2">
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
                    ].map((tag) => (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => {
                            const newTags = prev.tags.includes(tag.value)
                              ? prev.tags.filter((t) => t !== tag.value) // Remove
                              : [...prev.tags, tag.value]; // Add
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
                </div>

                {/* Description */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Description / Selling Points
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    className="bg-[#2c3943] border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5 placeholder-gray-500"
                    placeholder="Details for the AI..."
                  ></textarea>
                </div>

                {/* Active Toggle */}
                <div className="col-span-1 md:col-span-2 flex items-center">
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
