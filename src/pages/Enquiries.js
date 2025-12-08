// frontend/src/pages/Enquiries.js

import React, { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import { FaTrash } from "react-icons/fa";

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnquiries = async () => {
    try {
      setIsLoading(true);
      const data = await authFetch("/enquiries");
      if (data.success) {
        setEnquiries(data.data);
      }
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleDelete = async (enquiryId) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?"))
      return;
    try {
      await authFetch(`/enquiries/${enquiryId}`, { method: "DELETE" });
      alert("Enquiry deleted successfully.");
      fetchEnquiries(); // Refresh the list
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      alert(error.message);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-800 text-green-200";
      case "contacted":
        return "bg-blue-800 text-blue-200";
      default:
        return "bg-yellow-800 text-yellow-200";
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <h1 className="text-3xl font-bold text-white text-center mb-8">
        New Enquiries
      </h1>
      <div className="bg-[#202d33] rounded-lg shadow-lg overflow-x-auto">
        {isLoading ? (
          <p className="text-center text-gray-400 p-8">Loading enquiries...</p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-[#2a3942]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Bedrooms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Source URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {enquiries.map((enquiry) => (
                <tr key={enquiry._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(enquiry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusClass(
                        enquiry.status
                      )}`}
                    >
                      {enquiry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {enquiry.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {enquiry.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {enquiry.email || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {enquiry.projectName || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {enquiry.budget || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {enquiry.bedrooms || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs">
                    <a
                      href={enquiry.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline"
                    >
                      {enquiry.pageUrl}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDelete(enquiry._id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && enquiries.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No new enquiries found.
          </p>
        )}
      </div>
    </div>
  );
}
