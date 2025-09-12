// frontend/src/pages/Contacts.js

import React, { useState, useEffect } from 'react';
import { authFetch, uploadFile } from '../services/api'; // <-- 1. IMPORT AUTH SERVICES

export default function Contacts() {
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Function to fetch all contact lists
  const fetchContactLists = async () => {
    try {
      setIsLoading(true);
      // 2. Use authFetch to get the lists
      const data = await authFetch('/contacts/lists');
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
      // 3. Use authFetch to create a new list
      const data = await authFetch('/contacts/lists', {
        method: 'POST',
        body: JSON.stringify({ name: newListName }),
      });

      if (data.success) {
        alert('List created successfully!');
        setNewListName('');
        fetchContactLists(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating list:', error);
      alert(error.message);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async (listId) => {
    if (!selectedFile) {
      return alert('Please select a file to upload.');
    }
    try {
      // 4. Use the dedicated and secure uploadFile service
      const result = await uploadFile(`/contacts/lists/${listId}/upload`, selectedFile);
      alert(result.message);
      setSelectedFile(null);
      // Reset the specific file input that was used
      const fileInput = document.getElementById(`file-input-${listId}`);
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

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