// frontend/src/pages/Contacts.js

import React, { useState, useEffect } from 'react';
import { authFetch } from '../services/api';

export default function Contacts() {
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  
  // State for the pasted text for each list
  const [pastedData, setPastedData] = useState({});

  const fetchContactLists = async () => {
    try {
      setIsLoading(true);
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

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return alert('Please provide a list name.');
    try {
      const data = await authFetch('/contacts/lists', {
        method: 'POST',
        body: JSON.stringify({ name: newListName }),
      });
      if (data.success) {
        alert('List created successfully!');
        setNewListName('');
        fetchContactLists();
      }
    } catch (error) {
      console.error('Error creating list:', error);
      alert(error.message);
    }
  };

  // Function to handle pasting and uploading data
  const handlePasteUpload = async (listId) => {
    const dataToUpload = pastedData[listId];
    if (!dataToUpload || !dataToUpload.trim()) {
      return alert('Please paste your contact data into the text box for this list.');
    }
    
    // Convert the pasted text (assumed to be tab-separated) into a JSON array
    const rows = dataToUpload.trim().split('\n');
    const headers = rows[0].split('\t');
    const contacts = rows.slice(1).map(row => {
      const values = row.split('\t');
      let contact = {};
      headers.forEach((header, index) => {
        contact[header.trim()] = values[index];
      });
      return contact;
    });

    try {
      // We will create this new API endpoint in the next steps
      const result = await authFetch(`/contacts/lists/${listId}/bulk-add`, {
          method: 'POST',
          body: JSON.stringify({ contacts }),
      });
      alert(result.message);
      // Clear the text area for this specific list
      setPastedData({ ...pastedData, [listId]: '' });
      // We can add a function here later to refresh contact counts
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handlePastedDataChange = (listId, value) => {
      setPastedData({ ...pastedData, [listId]: value });
  };

  return (
    <div className="App-main">
      <div className="form-container">
        <h2>Create New Contact List</h2>
        <form onSubmit={handleCreateList}>
          <input
            type="text"
            placeholder="New list name"
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
                {/* --- NEW PASTE-FROM-SHEET FORM --- */}
                <div className="upload-section" style={{ marginTop: '15px', borderTop: '1px solid #374248', paddingTop: '15px' }}>
                    <p style={{margin: '0 0 10px 0', fontSize: '0.9rem'}}>Copy columns from your sheet (with headers) and paste here:</p>
                    <textarea
                        className="bg-[#2c3943] text-neutral-200 text-sm rounded-lg block w-full p-2.5"
                        rows="5"
                        placeholder="phoneNumber	name	var1..."
                        value={pastedData[list._id] || ''}
                        onChange={(e) => handlePastedDataChange(list._id, e.target.value)}
                    ></textarea>
                    <button onClick={() => handlePasteUpload(list._id)} disabled={!pastedData[list._id] || !pastedData[list._id].trim()} style={{marginTop: '10px'}}>
                      Upload Pasted Contacts
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