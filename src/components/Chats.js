import React, { useState } from "react";
import Chat from "./Chat";
import { ImFolderDownload } from "react-icons/im";

// Helper function to format date
const formatChatDate = (timestamp) => {
  if (!timestamp) return { time: "", dateLabel: "" };
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
  const timeString = date.toLocaleTimeString([], timeOptions);

  // Check if today
  if (date.toDateString() === now.toDateString()) {
    return { time: timeString, dateLabel: "Today" };
  }

  // Check if yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return { time: timeString, dateLabel: "Yesterday" };
  }

  // Check if within last 7 days
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) {
    return {
      time: timeString,
      dateLabel: date.toLocaleDateString([], { weekday: "long" }),
    };
  }

  // Older dates
  return {
    time: timeString,
    dateLabel: date.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  };
};

function Chats({
  conversations,
  onSelectConversation,
  activeConversationId,
  onDeleteConversation,
}) {
  const [filterText, setFilterText] = useState("");
  const [contextMenu, setContextMenu] = useState(null);

  const filteredConversations = conversations.filter(
    (convo) =>
      (convo.name &&
        convo.name.toLowerCase().includes(filterText.toLowerCase())) ||
      (convo._id && convo._id.includes(filterText))
  );

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      chat,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <div
      className="flex flex-col h-full bg-[#111b21]"
      onClick={closeContextMenu}
    >
      {/* Search and filter */}
      <div className="flex justify-between items-center h-[60px] p-2">
        <input
          type="text"
          placeholder="Search or start a new chat"
          className="rounded-lg bg-[#202d33] text-[#8796a1] text-sm font-light outline-none px-4 py-2 w-full h-[35px] placeholder:text-[#8796a1] placeholder:text-sm placeholder:font-light"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>

      {/* Chats main container */}
      <div className="flex-grow flex-col overflow-y-scroll cursor-pointer h-full relative">
        {/* Archived container (this is static for now) */}
        <div className="flex justify-between items-center w-full min-h-[55px] px-3 hover:bg-[#202d33]">
          <div className="flex items-center gap-4">
            <span className="text-emerald-500 text-lg">
              <ImFolderDownload />
            </span>
            <h1 className="text-white">Archived</h1>
          </div>
        </div>

        {/* Map over the FILTERED conversation data */}
        {filteredConversations.map((convo) => {
          const { time, dateLabel } = formatChatDate(
            convo.lastMessageTimestamp
          );
          return (
            <div
              key={convo._id}
              onContextMenu={(e) => handleContextMenu(e, convo)}
            >
              <Chat
                name={convo.name}
                contact={convo._id}
                msg={convo.lastMessage}
                time={time}
                dateLabel={dateLabel}
                unreadMsgs={convo.unreadCount}
                active={convo._id === activeConversationId}
                onClick={() => onSelectConversation(convo._id)}
              />
            </div>
          );
        })}

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-[#233138] text-white rounded-md shadow-lg z-50 py-2 w-40"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <div
              className="px-4 py-2 hover:bg-[#182229] cursor-pointer"
              onClick={() => {
                // Close action: just deselect for now
                onSelectConversation(null);
                closeContextMenu();
              }}
            >
              Close chat
            </div>
            <div
              className="px-4 py-2 hover:bg-[#182229] cursor-pointer"
              onClick={() => {
                if (onDeleteConversation) {
                  onDeleteConversation(contextMenu.chat._id);
                }
                closeContextMenu();
              }}
            >
              Delete chat
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chats;
