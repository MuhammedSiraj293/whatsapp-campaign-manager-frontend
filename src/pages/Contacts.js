// frontend/src/pages/Contacts.js

import React, { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import ContactViewModal from "../components/ContactViewModal";

export default function Contacts() {
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  // State for the pasted text for each list
  const [pastedData, setPastedData] = useState({});

  // --- 2. NEW STATE for the modal ---
  const [viewingContacts, setViewingContacts] = useState(null); // Will hold the array of contacts
  const [modalListId, setModalListId] = useState(null); // Will hold the ID of the list being viewed

  const fetchContactLists = async () => {
    try {
      setIsLoading(true);
      const data = await authFetch("/contacts/lists");
      if (data.success) {
        setLists(data.data);
      }
    } catch (error) {
      console.error("Error fetching contact lists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactLists();
  }, []);

  // --- 3. NEW FUNCTION to open the modal and fetch contacts ---
  const handleViewContacts = async (listId) => {
    setModalListId(listId);
    try {
      const data = await authFetch(`/contacts/lists/${listId}/contacts`);
      if (data.success) {
        setViewingContacts(data.data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return alert("Please provide a list name.");
    try {
      const data = await authFetch("/contacts/lists", {
        method: "POST",
        body: JSON.stringify({ name: newListName }),
      });
      if (data.success) {
        alert("List created successfully!");
        setNewListName("");
        fetchContactLists();
      }
    } catch (error) {
      console.error("Error creating list:", error);
      alert(error.message);
    }
  };

  // Function to handle pasting and uploading data
  const handlePasteUpload = async (listId) => {
    const dataToUpload = pastedData[listId];
    if (!dataToUpload || !dataToUpload.trim()) {
      return alert(
        "Please paste your contact data into the text box for this list."
      );
    }

    // Convert the pasted text (assumed to be tab-separated) into a JSON array
    const rows = dataToUpload.trim().split("\n");
    const headers = rows[0].split("\t");
    const contacts = rows.slice(1).map((row) => {
      const values = row.split("\t");
      let contact = {};
      headers.forEach((header, index) => {
        contact[header.trim()] = values[index];
      });
      return contact;
    });

    try {
      const result = await authFetch(`/contacts/lists/${listId}/bulk-add`, {
        method: "POST",
        body: JSON.stringify({ contacts }),
      });
      alert(result.message);
      // Clear the text area for this specific list
      setPastedData({ ...pastedData, [listId]: "" });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handlePastedDataChange = (listId, value) => {
    setPastedData({ ...pastedData, [listId]: value });
  };

  // Function to delete a contact list and all its contacts
  const handleDeleteList = async (listId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this list and all its contacts permanently?"
      )
    ) {
      return;
    }
    try {
      await authFetch(`/contacts/lists/${listId}`, {
        method: "DELETE",
      });
      alert("Contact list deleted successfully.");
      fetchContactLists(); // Refresh the list
    } catch (error) {
      console.error("Error deleting contact list:", error);
      alert(error.message);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* --- 4. RENDER THE MODAL when it's active --- */}
      <ContactViewModal
        contacts={viewingContacts}
        onClose={() => setViewingContacts(null)}
      />
      <div className="max-w-xl mx-auto mb-8">
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">
            Create New Contact List
          </h2>
          <form onSubmit={handleCreateList} className="flex gap-4">
            <input
              type="text"
              placeholder="New list name (e.g., 'August Leads')"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg block w-full p-2.5"
            />
            <button
              type="submit"
              className="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center whitespace-nowrap"
            >
              Create List
            </button>
          </form>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Existing Lists
        </h2>
        {isLoading ? (
          <p className="text-center text-gray-400">Loading lists...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <div
                key={list._id}
                className="bg-[#202d33] p-6 rounded-lg shadow-lg flex flex-col justify-between"
              >
                <div>
                  <strong className="text-lg font-bold text-white truncate">
                    {list.name}
                  </strong>
                  <p className="text-sm text-gray-400 mt-2">
                    Contacts: {list.contactCount}
                  </p>
                </div>
                <div className="upload-section mt-4 pt-4 border-t border-gray-700">
                  <p className="mb-2 text-sm text-gray-400">
                    Copy & Paste from Sheet:
                  </p>
                  <textarea
                    className="bg-[#2c3943] text-neutral-200 text-sm rounded-lg block w-full p-2.5"
                    rows="5"
                    placeholder="phoneNumber	name	var1..."
                    value={pastedData[list._id] || ""}
                    onChange={(e) =>
                      handlePastedDataChange(list._id, e.target.value)
                    }
                  ></textarea>
                  <button
                    onClick={() => handlePasteUpload(list._id)}
                    disabled={
                      !pastedData[list._id] || !pastedData[list._id].trim()
                    }
                    className="w-full text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center mt-2 disabled:bg-gray-600"
                  >
                    Upload Pasted Contacts
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                  {/* --- 5. CONNECT the "View Contacts" button --- */}
                  <button
                    onClick={() => handleViewContacts(list._id)}
                    className="w-full text-white bg-gray-600 hover:bg-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    View Contacts
                  </button>
                  <button
                    onClick={() => handleDeleteList(list._id)}
                    className="w-full text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    Delete List
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
