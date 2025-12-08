import React, { useRef, useEffect } from "react";
import {
  BsThreeDotsVertical,
  BsTrash,
  BsCheck,
  BsCheckAll,
} from "react-icons/bs";

export default function Chats({
  conversations,
  onSelectConversation,
  activeConversationId,
  onDeleteConversation,
  onLoadMore, // New prop
  hasMore, // New prop
  loading, // New prop
}) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [contextMenu, setContextMenu] = React.useState({
    visible: false,
    x: 0,
    y: 0,
    convoId: null,
  });

  const scrollRef = useRef(null);

  // Filter conversations
  const filteredConversations = conversations.filter((convo) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = convo.name && convo.name.toLowerCase().includes(term);
    const phoneMatch = convo._id.includes(term);
    return nameMatch || phoneMatch;
  });

  // Handle right-click context menu
  const handleContextMenu = (e, convoId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      convoId,
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false, convoId: null });
    }
  };

  // Format timestamp
  const formatChatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString(); // e.g., 10/24/2023
  };

  // --- SCROLL DETECTION ---
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // Check if scrolled to bottom with 50px buffer
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      if (hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    }
  };

  return (
    <div
      className="h-full flex flex-col relative"
      onClick={closeContextMenu} // Click anywhere to close menu
      onContextMenu={(e) => {
        // Prevent context menu on non-item areas if needed,
        // but generally we want it only on items.
        // We'll let native bubbles up unless caught.
      }}
    >
      {/* Search Input */}
      <div className="p-2 bg-[#111b21] border-b border-neutral-700 shrink-0">
        <input
          type="text"
          placeholder="Search or start new chat"
          className="w-full bg-[#202d33] text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 placeholder-gray-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Conversation List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {filteredConversations.map((convo) => {
          const isActive = convo._id === activeConversationId;
          return (
            <div
              key={convo._id}
              onClick={() => onSelectConversation(convo._id)}
              onContextMenu={(e) => handleContextMenu(e, convo._id)}
              className={`
                flex items-center p-3 cursor-pointer border-b border-[#202d33]/50 hover:bg-[#202d33] transition-colors
                ${isActive ? "bg-[#2a3942]" : ""}
              `}
            >
              {/* Avatar (Placeholder) */}
              <div className="w-[45px] h-[45px] rounded-full bg-gray-500 flex-shrink-0 mr-3 overflow-hidden">
                <img
                  src={`https://ui-avatars.com/api/?name=${
                    convo.name || "User"
                  }&background=random`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-[#e9edef] text-base font-normal truncate">
                    {convo.name || convo._id}
                  </h3>
                  <span className="text-xs text-[#8696a0] flex-shrink-0 ml-2">
                    {formatChatDate(convo.lastMessageTimestamp)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-[#8696a0] truncate flex-1 mr-2">
                    {convo.lastMessage}
                  </p>
                  {convo.unreadCount > 0 && (
                    <span className="bg-[#00a884] text-black text-[10px] font-bold px-[5px] py-[2px] rounded-full min-w-[18px] text-center">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Spinner at Bottom */}
        {loading && (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        )}
      </div>

      {/* Custom Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-[#233138] shadow-lg rounded py-2 z-50 text-[#d1d7db] text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} // Stop click from closing immediately
        >
          <div
            className="px-4 py-2 hover:bg-[#182229] cursor-pointer"
            onClick={() => {
              // Logic to "Close chat" - maybe just deselect
              onSelectConversation(null);
              closeContextMenu();
            }}
          >
            Close chat
          </div>
          <div
            className="px-4 py-2 hover:bg-[#182229] cursor-pointer text-red-400"
            onClick={() => {
              onDeleteConversation(contextMenu.convoId);
              closeContextMenu();
            }}
          >
            Delete chat
          </div>
        </div>
      )}
    </div>
  );
}
