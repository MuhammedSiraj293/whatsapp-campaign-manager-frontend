// frontend/src/components/ContactViewModal.js

import React from 'react';

// This component receives the list of contacts and a function to close itself
export default function ContactViewModal({ contacts, onClose }) {
  if (!contacts) {
    return null; // Don't render anything if the modal isn't active
  }

  return (
    // Modal Overlay: a semi-transparent background
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose} // Close the modal if the user clicks the background
    >
      {/* Modal Content: the white box */}
      <div 
        className="bg-[#202d33] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Contacts in List ({contacts.length})</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Modal Body with scrollbar */}
        <div className="p-6 overflow-y-auto">
          <table className="min-w-full">
            <thead className="bg-[#2a3942]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Variables</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {contacts.map((contact) => (
                <tr key={contact._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{contact.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{contact.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {/* Display variables as key=value pairs */}
                    {contact.variables && Object.entries(contact.variables).map(([key, value]) => `${key}=${value}`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contacts.length === 0 && <p className="text-center text-gray-500 py-8">No contacts found in this list.</p>}
        </div>
      </div>
    </div>
  );
}