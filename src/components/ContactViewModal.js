// frontend/src/components/ContactViewModal.js

import React, { useState } from 'react';
import { authFetch } from '../services/api';
import { FaEdit, FaTrash, FaSave } from 'react-icons/fa';
import { MdCancel } from 'react-icons/md';

export default function ContactViewModal({ list, contacts, onClose, onRefresh }) {
  const [editingContactId, setEditingContactId] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [filter, setFilter] = useState(""); // <-- 2. Add state for the filter
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
            method: 'PUT',
            body: JSON.stringify(updatedData),
        });
        alert('Contact updated successfully.');
        setEditingContactId(null);
        onRefresh(); // Refresh the contact list in the parent
    } catch (error) {
        console.error('Error updating contact:', error);
        alert('Failed to update contact.');
    }
  };
  
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
        await authFetch(`/contacts/contacts/${contactId}`, { method: 'DELETE' });
        alert('Contact deleted successfully.');
        onRefresh(); // Refresh the contact list in the parent
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to delete contact.');
    }
  };

  // --- 3. FILTER THE CONTACTS ---
  const filteredContacts = contacts.filter(contact => {
    const name = contact.name || '';
    const phone = contact.phoneNumber || '';
    const search = filter.toLowerCase();
    return name.toLowerCase().includes(search) || phone.includes(search);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#202d33] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Contacts in "{list.name}" ({contacts.length})</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* --- 4. ADD THE SEARCH BAR --- */}
        <div className="p-4 border-b border-gray-700">
            <input
                type="text"
                placeholder="Search by name or phone number..."
                className="bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />
        </div>

        <div className="p-6 overflow-y-auto">
          <table className="min-w-full">
            <thead className="bg-[#2a3942]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Phone Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredContacts.map((contact) => (
                <tr key={contact._id}>
                  {editingContactId === contact._id ? (
                    <>
                      <td className="px-6 py-4"><input type="text" value={updatedData.phoneNumber} onChange={(e) => setUpdatedData({...updatedData, phoneNumber: e.target.value})} className="bg-[#2c3943] text-white text-sm rounded-md p-1 w-full" /></td>
                      <td className="px-6 py-4"><input type="text" value={updatedData.name} onChange={(e) => setUpdatedData({...updatedData, name: e.target.value})} className="bg-[#2c3943] text-white text-sm rounded-md p-1 w-full" /></td>
                      <td className="px-6 py-4 flex gap-4">
                          <button onClick={handleUpdateContact} className="text-green-500 hover:text-green-400"><FaSave /></button>
                          <button onClick={handleCancelEdit} className="text-gray-400 hover:text-white"><MdCancel /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{contact.phoneNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{contact.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-4">
                        <button onClick={() => handleEditClick(contact)} className="text-sky-500 hover:text-sky-400"><FaEdit /></button>
                        <button onClick={() => handleDeleteContact(contact._id)} className="text-red-500 hover:text-red-400"><FaTrash /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {contacts.length === 0 && <p className="text-center text-gray-500 py-8">No contacts found in this list.</p>}
          {contacts.length > 0 && filteredContacts.length === 0 && (
              <p className="text-center text-gray-500 py-8">No contacts match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}