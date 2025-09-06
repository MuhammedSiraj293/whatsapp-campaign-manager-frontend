// frontend/src/pages/Contacts.js

import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { uploadRecipientsFile } from '../services/api'; // We can reuse this service

export default function Contacts() {
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // <-- NEW: State for the selected file

  // Function to fetch all contact lists
  const fetchContactLists = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/contacts/lists`);
      const data = await response.json();
      if (data.success) {
        setLists(data.data);
      }
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactLists();
  }, []);

  // Handler for creating a new list
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) {
      return alert('Please provide a list name.');
    }
    try {
      const response = await fetch(`${API_URL}/api/contacts/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newListName }),
      });
      const data = await response.json();
      if (data.success) {
        alert('List created successfully!');
        setNewListName('');
        fetchContactLists();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  // --- NEW HANDLERS FOR FILE UPLOAD ---
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async (listId) => {
    if (!selectedFile) {
      return alert('Please select a file to upload.');
    }
    try {
      // We will reuse the upload service, but we need to create a new one for contacts
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_URL}/api/contacts/lists/${listId}/upload`, {
          method: 'POST',
          body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setSelectedFile(null);
        document.getElementById(`file-input-${listId}`).value = ""; // Reset file input
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };
  // --- END OF NEW HANDLERS ---

  return (
    <div className="App-main">
      <div className="form-container">
        <h2>Create New Contact List</h2>
        <form onSubmit={handleCreateList}>
          <input
            type="text"
            placeholder="New list name (e.g., 'August Leads')"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
          />
          <button type="submit">Create List</button>
        </form>
      </div>

      <div className="list-container" style={{ flexBasis: '60%' }}>
        <h2>Existing Lists</h2>
        {isLoading ? (
          <p>Loading lists...</p>
        ) : (
          <ul>
            {lists.map((list) => (
              <li key={list._id}>
                <strong>{list.name}</strong>
                {/* --- NEW UPLOAD FORM PER LIST --- */}
                <div className="upload-section" style={{ marginTop: '15px', borderTop: '1px solid #374248', paddingTop: '15px' }}>
                    <p style={{margin: '0 0 10px 0', fontSize: '0.9rem'}}>Upload contacts to this list:</p>
                    <input type="file" accept=".csv, .xlsx, .xls" id={`file-input-${list._id}`} onChange={handleFileChange} />
                    <button onClick={() => handleFileUpload(list._id)} disabled={!selectedFile}>
                      Upload
                    </button>
                  </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}