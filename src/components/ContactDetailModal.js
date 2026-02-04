import React, { useEffect, useState, useCallback } from "react";
import { authFetch } from "../services/api";
import {
  FaPaperPlane,
  FaReply,
  FaCheckDouble,
  FaWhatsapp,
  FaInfoCircle,
  FaTag,
  FaStickyNote,
  FaPlus,
  FaTimes,
  FaSave,
} from "react-icons/fa";

const ContactDetailModal = ({ contactId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable Fields
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await authFetch(`/contacts/${contactId}/details`);
      if (res.success) {
        setData(res.data);
        setTags(res.data.contact.tags || []);
        setNotes(res.data.contact.notes || "");
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags, notes }),
      });
      if (res.success) {
        // Optional: show toast
        alert("Saved successfully");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-white">Loading details...</div>
      </div>
    );
  }

  if (!data) return null;

  const { contact, timeline, stats } = data;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#202d33] w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2a3942] p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {contact.name || "Unknown"}
              <span className="text-lg text-gray-400 font-normal">
                ({contact.phoneNumber})
              </span>
            </h2>
            <div className="text-sm text-emerald-500">
              {contact.contactList?.name}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#2a3942] p-4 rounded text-center">
              <div className="text-gray-400 text-sm uppercase mb-1">Sent</div>
              <div className="text-2xl font-bold text-white flex justify-center items-center gap-2">
                <FaPaperPlane className="text-blue-400" /> {stats.sent}
              </div>
            </div>
            <div className="bg-[#2a3942] p-4 rounded text-center">
              <div className="text-gray-400 text-sm uppercase mb-1">
                Delivered
              </div>
              <div className="text-2xl font-bold text-white flex justify-center items-center gap-2">
                <FaCheckDouble className="text-gray-400" /> {stats.delivered}
              </div>
            </div>
            <div className="bg-[#2a3942] p-4 rounded text-center">
              <div className="text-gray-400 text-sm uppercase mb-1">Read</div>
              <div className="text-2xl font-bold text-white flex justify-center items-center gap-2">
                <FaCheckDouble className="text-blue-400" /> {stats.read}
              </div>
            </div>
            <div className="bg-[#2a3942] p-4 rounded text-center">
              <div className="text-gray-400 text-sm uppercase mb-1">
                Replied
              </div>
              <div className="text-2xl font-bold text-white flex justify-center items-center gap-2">
                <FaReply className="text-emerald-400" /> {stats.replied}
              </div>
            </div>
          </div>

          {/* Tags & Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Tags */}
            <div className="bg-[#2a3942] p-4 rounded">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FaTag className="text-emerald-400" /> Tags
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-emerald-900 text-emerald-100 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-white"
                    >
                      <FaTimes />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-[#111b21] text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-emerald-500 outline-none"
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                />
                <button
                  onClick={handleAddTag}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                  disabled={!newTag.trim()}
                >
                  <FaPlus />
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-[#2a3942] p-4 rounded flex flex-col">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FaStickyNote className="text-yellow-400" /> Notes
              </h3>
              <textarea
                className="flex-1 bg-[#111b21] text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-emerald-500 outline-none resize-none h-24"
                placeholder="Add notes about this contact..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
              <div className="mt-3 text-right">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm flex items-center gap-2 ml-auto disabled:opacity-50"
                >
                  <FaSave /> {saving ? "Saving..." : "Save Details"}
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaInfoCircle /> Activity Timeline
          </h3>
          <div className="space-y-4">
            {timeline.length === 0 ? (
              <p className="text-gray-500">No activity recorded.</p>
            ) : (
              timeline.map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-24 flex-shrink-0 text-sm text-gray-400 text-right pt-1">
                    {new Date(event.date).toLocaleDateString()}
                    <br />
                    {new Date(event.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div className="relative flex-col items-center hidden sm:flex">
                    <div className="h-full w-px bg-gray-700 pointer-events-none absolute left-1/2 -ml-px"></div>
                    <div
                      className={`w-3 h-3 rounded-full mt-2 relative z-10 ${
                        event.type === "campaign_event"
                          ? "bg-blue-500"
                          : event.type === "incoming_message"
                            ? "bg-emerald-500"
                            : "bg-gray-500"
                      }`}
                    ></div>
                  </div>

                  <div
                    className={`flex-1 p-3 rounded-lg border ${
                      event.type === "incoming_message"
                        ? "bg-[#202d33] border-emerald-900/50"
                        : event.type === "campaign_event"
                          ? "bg-[#202d33] border-blue-900/50"
                          : "bg-[#202d33] border-gray-700"
                    }`}
                  >
                    {event.type === "campaign_event" && (
                      <div>
                        <div className="text-blue-400 font-semibold mb-1">
                          Campaign: {event.campaignName}
                        </div>
                        <div className="text-sm text-gray-300">
                          Status:{" "}
                          <span className="uppercase">{event.status}</span>
                          {event.details && (
                            <span className="text-red-400 ml-2">
                              ({event.details})
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {(event.type === "incoming_message" ||
                      event.type === "outgoing_message") && (
                      <div>
                        <div
                          className={`${event.type === "incoming_message" ? "text-emerald-400" : "text-gray-300"} font-semibold mb-1 flex items-center gap-2`}
                        >
                          {event.type === "incoming_message" ? (
                            <FaWhatsapp />
                          ) : (
                            <FaPaperPlane className="text-xs" />
                          )}
                          {event.type === "incoming_message"
                            ? "User Replied"
                            : "Bot Replied"}
                        </div>
                        <div className="text-sm text-gray-200">
                          {event.content}
                        </div>
                        {event.media && (
                          <a
                            href={event.media}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 underline mt-2 inline-block"
                          >
                            View Media
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailModal;
