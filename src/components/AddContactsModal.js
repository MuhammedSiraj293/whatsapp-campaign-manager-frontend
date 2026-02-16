import React, { useState } from "react";
import { authFetch } from "../services/api";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";

export default function AddContactsModal({ list, onClose, onRefresh }) {
  const [pastedData, setPastedData] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  if (!list) return null;

  const handleUpload = async () => {
    if (!pastedData.trim()) return alert("Please paste data to upload.");

    setIsUploading(true);
    const rows = pastedData.trim().split("\n");
    // Assumes first row is header if user copies headers, OR we can just assume columns.
    // The previous implementation assumed headers: 'phoneNumber\tname\t...'
    // Lets keep consistent with previous logic:
    // It parsed headers from the first row.

    // We will try to parse headers. If the user just pastes numbers, it might fail if we don't have headers.
    // The previous app required: "phoneNumber name var1..." in the placeholder.
    // We should strictly follow that or make it smarter. For now, strict compatibility.

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
      const result = await authFetch(`/contacts/lists/${list._id}/bulk-add`, {
        method: "POST",
        body: JSON.stringify({ contacts }),
      });

      if (result.success) {
        alert(result.message || "Contacts added successfully!");
        onRefresh();
        onClose();
      } else {
        alert(result.message || "Failed to add contacts.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#202d33] rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-white">Add Contacts</h3>
            <p className="text-gray-400 text-sm mt-1">
              Adding to:{" "}
              <span className="text-emerald-400 font-medium">{list.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-4">
            <p className="text-yellow-200 text-sm">
              <strong>Format Required:</strong> The first line must be headers
              (separated by tabs).
              <br />
              Example: <code>phoneNumber name email</code>
            </p>
          </div>

          <textarea
            className="w-full bg-[#111b21] text-gray-200 p-4 rounded-lg border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono text-sm"
            rows="10"
            placeholder={`phoneNumber\tname\temail\n971500000000\tJohn Doe\tjohn@example.com`}
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
          ></textarea>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !pastedData.trim()}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-emerald-900/20"
          >
            {isUploading ? (
              "Uploading..."
            ) : (
              <>
                <FaCloudUploadAlt /> Upload Contacts
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
