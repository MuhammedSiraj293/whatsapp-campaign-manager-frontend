import React, { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import { useNavigate } from "react-router-dom";
import ContactViewModal from "../components/ContactViewModal";
import AddContactsModal from "../components/AddContactsModal"; // Import the new modal
import {
  FaUser,
  FaUserCheck,
  FaUserSlash,
  FaCopy,
  FaPlus,
  FaTrash,
  FaEye,
  FaFileImport,
} from "react-icons/fa";

export default function Contacts() {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [stats, setStats] = useState(null);

  // Modals State
  const [viewingList, setViewingList] = useState(null); // For View Contacts
  const [viewingContacts, setViewingContacts] = useState([]);
  const [addingContactList, setAddingContactList] = useState(null); // For Add Contacts Modal

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  const fetchContactLists = async (search = "") => {
    try {
      setIsLoading(true);
      const query = search ? `?search=${encodeURIComponent(search)}` : "";

      const [listData, statsData] = await Promise.all([
        authFetch(`/contacts/lists${query}`),
        authFetch("/contacts/analytics"),
      ]);

      if (listData.success) setLists(listData.data);
      if (statsData.success) setStats(statsData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactLists();
  }, []);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return alert("Please provide a list name.");
    try {
      const data = await authFetch("/contacts/lists", {
        method: "POST",
        body: JSON.stringify({ name: newListName }),
      });
      if (data.success) {
        setNewListName("");
        fetchContactLists();
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteList = async (listId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this list and all its contacts?",
      )
    )
      return;
    try {
      await authFetch(`/contacts/lists/${listId}`, { method: "DELETE" });
      fetchContactLists();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleViewContacts = async (list) => {
    setViewingList(list);
    try {
      let url = `/contacts/lists/${list._id}/contacts`;
      if (list.isAnalyticsView) {
        const encodedReason = encodeURIComponent(list.reasonFilter);
        url = `/contacts/unsubscribed?reason=${encodedReason}`;
      }

      const data = await authFetch(url);
      if (data.success) {
        setViewingContacts(data.data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setViewingContacts([]);
    }
  };

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchContactLists(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="p-4 md:p-8 min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* --- MODALS --- */}
      {viewingList && (
        <ContactViewModal
          list={viewingList}
          contacts={viewingContacts}
          onClose={() => {
            setViewingList(null);
            setViewingContacts([]);
          }}
          onRefresh={() => handleViewContacts(viewingList)}
        />
      )}

      {addingContactList && (
        <AddContactsModal
          list={addingContactList}
          onClose={() => setAddingContactList(null)}
          onRefresh={fetchContactLists}
        />
      )}

      {/* --- ANALYTICS DASHBOARD --- */}
      {stats && (
        <div className="max-w-7xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Contacts"
              value={stats.totalContacts}
              icon={<FaUser />}
              color="blue"
              onClick={() => navigate("/contact-analytics")}
            />
            <StatsCard
              title="Subscribed"
              value={stats.subscribed}
              icon={<FaUserCheck />}
              color="emerald"
            />
            <StatsCard
              title="Unsubscribed"
              value={stats.unsubscribed}
              icon={<FaUserSlash />}
              color="red"
            />
            <StatsCard
              title="Duplicates"
              value={stats.duplicates}
              icon={<FaCopy />}
              color="amber"
            />
          </div>

          {/* Unsubscribe Reasons Breakdown */}
          {stats.reasons && stats.reasons.length > 0 && (
            <div className="bg-[#202d33] p-6 rounded-xl border border-gray-700 shadow-lg mb-8">
              <h3 className="text-lg font-bold text-white mb-4">
                Unsubscribe Reasons
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {stats.reasons.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() =>
                      handleViewContacts({
                        _id: "analytics_view",
                        name: `Unsubscribed: ${r.reason}`,
                        isAnalyticsView: true,
                        reasonFilter: r.reason,
                      })
                    }
                    className="bg-[#2c3943] p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-[#374151] transition-colors group border border-gray-700/50 hover:border-emerald-500/30"
                  >
                    <span
                      className="text-gray-300 text-sm truncate mr-2 group-hover:text-white"
                      title={r.reason}
                    >
                      {r.reason}
                    </span>
                    <span className="bg-red-900/50 text-red-300 text-xs px-2 py-1 rounded-full font-bold">
                      {r.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- LISTS MANAGEMENT --- */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold text-white">Contact Lists</h2>
            <span className="text-emerald-400 font-mono text-sm bg-emerald-900/30 px-2 py-1 rounded-md border border-emerald-900/50">
              {lists.length} Lists
            </span>
          </div>

          <div className="flex w-full md:w-auto gap-3">
            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search Lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#202d33] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
              />
            </div>

            {/* Create List Form (Inline for compactness) */}
            <form
              onSubmit={handleCreateList}
              className="flex gap-2 w-full md:w-auto"
            >
              <input
                type="text"
                placeholder="New list name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="bg-[#202d33] border border-gray-700 text-neutral-200 text-sm rounded-lg block w-full md:w-48 p-2.5"
              />
              <button
                type="submit"
                className="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-4 py-2.5 flex items-center gap-2 whitespace-nowrap shadow-lg hover:shadow-emerald-900/30 transition-all"
              >
                <FaPlus /> Create
              </button>
            </form>
          </div>
        </div>

        {/* --- TABLE LAYOUT --- */}
        <div className="bg-[#202d33] rounded-xl shadow-2xl overflow-hidden border border-gray-700">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your lists...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300">
                <thead className="bg-[#111b21] uppercase text-xs font-semibold text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-5 tracking-wider">List Name</th>
                    <th className="px-6 py-5 tracking-wider">Contacts</th>
                    <th className="px-6 py-5 text-center tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {lists.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <FaFileImport className="text-4xl text-gray-600" />
                          <p>
                            No contact lists found. Create one above to get
                            started.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    lists.map((list, index) => (
                      <tr
                        key={list._id}
                        className="hover:bg-[#2a3942]/50 transition-all duration-200 group"
                      >
                        <td className="px-6 py-5 font-medium text-white">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-900/80 to-emerald-800/20 flex items-center justify-center text-emerald-400 border border-emerald-900/50 shadow-sm group-hover:scale-105 transition-transform">
                              <span className="font-bold text-sm">
                                {index + 1}
                              </span>
                            </div>
                            <span className="text-lg group-hover:text-emerald-400 transition-colors">
                              {list.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="bg-[#111b21] border border-gray-700 text-gray-300 py-1.5 px-4 rounded-full text-sm font-medium shadow-sm">
                            {list.contactCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                            <ActionButton
                              onClick={() => setAddingContactList(list)}
                              icon={<FaFileImport />}
                              label="Add Contacts"
                              color="sky"
                            />
                            <ActionButton
                              onClick={() => handleViewContacts(list)}
                              icon={<FaEye />}
                              label="View Contacts"
                              color="gray"
                            />
                            <ActionButton
                              onClick={() => handleDeleteList(list._id)}
                              icon={<FaTrash />}
                              label="Delete"
                              color="red"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components for Cleaner JSX
const StatsCard = ({ title, value, icon, color, onClick }) => {
  const colors = {
    blue: "text-blue-400 bg-blue-900/30",
    emerald: "text-emerald-400 bg-emerald-900/30",
    red: "text-red-400 bg-red-900/30",
    amber: "text-amber-400 bg-amber-900/30",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[#202d33] p-6 rounded-xl border border-gray-700 flex items-center justify-between shadow-lg ${onClick ? "cursor-pointer hover:bg-[#2a3942] transition-colors" : ""}`}
    >
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          {title}
        </p>
        <h3
          className={`text-3xl font-bold mt-1 ${colors[color].split(" ")[0]}`}
        >
          {value}
        </h3>
      </div>
      <div className={`p-3 rounded-lg ${colors[color].split(" ")[1]}`}>
        <span className={`text-2xl ${colors[color].split(" ")[0]}`}>
          {icon}
        </span>
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, icon, label, color }) => {
  const colors = {
    sky: "text-sky-400 hover:bg-sky-900/30",
    gray: "text-gray-400 hover:bg-gray-700",
    red: "text-red-400 hover:bg-red-900/30",
  };

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all ${colors[color]}`}
      title={label}
    >
      {icon}
    </button>
  );
};
