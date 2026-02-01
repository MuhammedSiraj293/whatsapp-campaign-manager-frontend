// frontend/src/components/ContactViewModal.js

import React, { useState } from "react";
import { authFetch } from "../services/api";
import { FaEdit, FaTrash, FaSave, FaEye } from "react-icons/fa";
import { MdCancel } from "react-icons/md";

export default function ContactViewModal({
  list,
  contacts,
  onClose,
  onRefresh,
}) {
  const [editingContactId, setEditingContactId] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // New Status Filter
  const [viewingStats, setViewingStats] = useState(null); // New Stats Viewing State

  if (!list) return null; // The modal is controlled by the 'list' prop

  const handleEditClick = (contact) => {
    setEditingContactId(contact._id);
    setUpdatedData({ name: contact.name, phoneNumber: contact.phoneNumber });
  };

  const handleCancelEdit = () => {
    setEditingContactId(null);
    setUpdatedData({});
  };

  const handleUpdateContact = async () => {
    try {
      await authFetch(`/contacts/contacts/${editingContactId}`, {
        method: "PUT",
        body: JSON.stringify(updatedData),
      });
      alert("Contact updated successfully.");
      setEditingContactId(null);
      onRefresh(); // Refresh the contact list in the parent
    } catch (error) {
      console.error("Error updating contact:", error);
      alert("Failed to update contact.");
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to delete this contact?"))
      return;
    try {
      await authFetch(`/contacts/contacts/${contactId}`, { method: "DELETE" });
      alert("Contact deleted successfully.");
      onRefresh(); // Refresh the contact list in the parent
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Failed to delete contact.");
    }
  };

  // --- NEW HANDLER FOR STATS ---
  const handleViewStats = async (contactId) => {
    try {
      const response = await authFetch(`/contacts/contacts/${contactId}/stats`);
      if (response.success) {
        setViewingStats(response.data);
      } else {
        alert("Failed to fetch contact stats.");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      alert("Error fetching stats.");
    }
  };

  // --- 3. FILTER THE CONTACTS ---
  const filteredContacts = contacts.filter((contact) => {
    const name = contact.name || "";
    const phone = contact.phoneNumber || "";
    const search = filter.toLowerCase();
    const matchesSearch =
      name.toLowerCase().includes(search) || phone.includes(search);

    let matchesStatus = true;
    if (statusFilter === "subscribed")
      matchesStatus = contact.isSubscribed !== false;
    if (statusFilter === "unsubscribed")
      matchesStatus = contact.isSubscribed === false;

    return matchesSearch && matchesStatus;
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#202d33] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- STATS OVERLAY MODAL --- */}
        {viewingStats && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 rounded-lg">
            <div className="bg-[#111b21] p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Contact Preview
                </h3>
                <button
                  onClick={() => setViewingStats(null)}
                  className="text-gray-400 hover:text-white font-bold text-xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Name</span>
                  <span className="text-white font-medium">
                    {viewingStats.contact.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Phone</span>
                  <span className="text-white font-medium">
                    {viewingStats.contact.phoneNumber}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Status</span>
                  {viewingStats.contact.isSubscribed !== false ? (
                    <span className="bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded text-xs">
                      Subscribed
                    </span>
                  ) : (
                    <span className="bg-red-900 text-red-300 px-2 py-0.5 rounded text-xs">
                      Unsubscribed
                    </span>
                  )}
                </div>
                {viewingStats.contact.isSubscribed === false && (
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Unsubscribe Reason</span>
                    <span className="text-red-400 italic text-right text-sm">
                      {viewingStats.contact.unsubscribeReason ||
                        "Not specified"}
                    </span>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-[#2a3942] p-3 rounded text-center">
                    <div className="text-xl font-bold text-emerald-400">
                      {viewingStats.stats.campaignsSent}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Sent
                    </div>
                  </div>
                  <div className="bg-[#2a3942] p-3 rounded text-center">
                    <div className="text-xl font-bold text-sky-400">
                      {viewingStats.stats.repliesCount}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Replied
                    </div>
                  </div>
                  <div className="bg-[#2a3942] p-3 rounded text-center">
                    <div className="text-xl font-bold text-red-400">
                      {viewingStats.stats.campaignsFailed}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Failed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            Contacts in "{list.name}" ({contacts.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        {/* --- 4. ADD THE SEARCH BAR --- */}
        <div className="p-4 border-b border-gray-700 flex gap-4">
          <input
            type="text"
            placeholder="Search by name or phone number..."
            className="bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select
            className="bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 block p-2.5"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>

        <div className="p-6 overflow-y-auto">
          <table className="min-w-full">
            <thead className="bg-[#2a3942]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredContacts.map((contact) => (
                <tr key={contact._id}>
                  {editingContactId === contact._id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={updatedData.phoneNumber}
                          onChange={(e) =>
                            setUpdatedData({
                              ...updatedData,
                              phoneNumber: e.target.value,
                            })
                          }
                          className="bg-[#2c3943] text-white text-sm rounded-md p-1 w-full"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={updatedData.name}
                          onChange={(e) =>
                            setUpdatedData({
                              ...updatedData,
                              name: e.target.value,
                            })
                          }
                          className="bg-[#2c3943] text-white text-sm rounded-md p-1 w-full"
                        />
                      </td>
                      <td className="px-6 py-4 flex gap-4">
                        <button
                          onClick={handleUpdateContact}
                          className="text-green-500 hover:text-green-400"
                        >
                          <FaSave />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-400 hover:text-white"
                        >
                          <MdCancel />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {contact.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {contact.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-4">
                        <button
                          onClick={() => handleViewStats(contact._id)}
                          className="text-sky-400 hover:text-sky-300"
                          title="View Stats"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleEditClick(contact)}
                          className="text-gray-400 hover:text-gray-300"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact._id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {contacts.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No contacts found in this list.
            </p>
          )}
          {contacts.length > 0 && filteredContacts.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No contacts match your search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
