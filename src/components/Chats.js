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
  onLoadMore,
  hasMore,
  loading,
  onSearch, // New prop
}) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [contextMenu, setContextMenu] = React.useState({
    visible: false,
    x: 0,
    y: 0,
    convoId: null,
  });

  const scrollRef = useRef(null);
  const isMounted = useRef(false);

  // Debounce Search
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  // Use conversations directly (server filters them)
  const displayConversations = conversations;

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

  // Helper: Get Time String
  const getChatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper: Get Date Label
  const getChatDateLabel = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return ""; // No date label for today
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: "long" });
    }
    return date.toLocaleDateString();
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
        // Prevent context menu on non-item areas if needed
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
        {displayConversations.map((convo) => {
          const isActive = convo._id === activeConversationId;
          const timeString = getChatTime(convo.lastMessageTimestamp);
          const dateLabel = getChatDateLabel(convo.lastMessageTimestamp);

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
              <div className="w-[49px] h-[49px] rounded-full bg-gray-500 flex-shrink-0 mr-3 overflow-hidden">
                <img
                  src={`https://ui-avatars.com/api/?name=${
                    convo.name || "User"
                  }&background=random`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="text-[#e9edef] text-[17px] font-normal truncate leading-tight">
                    {convo.name || convo._id}
                  </h3>
                  {/* Stacked Time/Date */}
                  <div className="flex flex-col items-end flex-shrink-0 ml-2">
                    <span className="text-[12px] text-[#00a884] font-normal leading-tight">
                      {timeString}
                    </span>
                    {dateLabel && (
                      <span className="text-[12px] text-[#8696a0] font-normal leading-tight mt-[2px]">
                        {dateLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p
                    className="text-sm text-[#8696a0] flex-1 mr-6 leading-tight"
                    title={convo.lastMessage}
                  >
                    {(convo.lastMessage || "").length > 30
                      ? (convo.lastMessage || "").substring(0, 30) + "..."
                      : convo.lastMessage || "Media"}
                  </p>
                  {convo.unreadCount > 0 && (
                    <span className="bg-[#00a884] text-[#111b21] text-[11px] font-bold px-[6px] py-[1px] rounded-full min-w-[18px] text-center mt-1">
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
