import React, { useRef, useEffect } from "react";

export default function Chats({
  conversations,
  onSelectConversation,
  activeConversationId,
  onDeleteConversation,
  onLoadMore,
  hasMore,
  loading,
  onSearch,
  onToggleSubscription,
  filterMode, // Received from parent
  onFilterChange, // Received from parent
}) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [contextMenu, setContextMenu] = React.useState({
    visible: false,
    x: 0,
    y: 0,
    convoId: null,
  });

  // --- UNSUBSCRIBE MODAL STATE ---
  const [unsubscribeModal, setUnsubscribeModal] = React.useState({
    visible: false,
    convoId: null,
  });
  const [unsubscribeReason, setUnsubscribeReason] =
    React.useState("Requested by User");
  const [customReason, setCustomReason] = React.useState("");

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
    // Find the conversation object to check subscription status
    const convo = conversations.find((c) => c._id === convoId);
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      convoId,
      isSubscribed: convo?.isSubscribed !== false, // Default to true if undefined
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
      <div className="flex flex-col border-b border-neutral-700 shrink-0 bg-[#111b21]">
        {/* Search Input */}
        <div className="p-2 pb-1">
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full bg-[#202d33] text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 px-3 pb-2 pt-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onFilterChange("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterMode === "all"
                ? "bg-[#0a332c] text-[#00a884] ring-1 ring-[#00a884]"
                : "bg-[#202d33] text-[#8696a0] hover:bg-[#2a3942]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange("unread")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterMode === "unread"
                ? "bg-[#0a332c] text-[#00a884] ring-1 ring-[#00a884]"
                : "bg-[#202d33] text-[#8696a0] hover:bg-[#2a3942]"
            }`}
          >
            Unread
          </button>
        </div>
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

          {/* Unsubscribe / Resubscribe Option */}
          <div
            className={`px-4 py-2 hover:bg-[#182229] cursor-pointer ${
              !contextMenu.isSubscribed ? "text-emerald-400" : "text-yellow-400"
            }`}
            onClick={() => {
              if (onToggleSubscription) {
                if (contextMenu.isSubscribed) {
                  // Currently Subscribed -> Open Modal to Unsubscribe
                  setUnsubscribeModal({
                    visible: true,
                    convoId: contextMenu.convoId,
                  });
                } else {
                  // Currently Unsubscribed -> Resubscribe Immediately
                  onToggleSubscription(contextMenu.convoId, true);
                }
              }
              closeContextMenu();
            }}
          >
            {contextMenu.isSubscribed ? "Unsubscribe" : "Resubscribe"}
          </div>
        </div>
      )}

      {/* --- UNSUBSCRIBE REASON MODAL --- */}
      {unsubscribeModal.visible && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setUnsubscribeModal({ visible: false, convoId: null })}
        >
          <div
            className="bg-[#2a3942] p-6 rounded-lg w-full max-w-sm border border-gray-600 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Confirm Unsubscribe
            </h3>
            <p className="text-gray-300 mb-4 text-sm">
              Select a reason for unsubscribing this contact.
            </p>

            <div className="space-y-2 mb-4">
              {["Requested by User", "Spam", "Real Estate Broker", "Other"].map(
                (r) => (
                  <label
                    key={r}
                    className="flex items-center gap-2 text-gray-200 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={unsubscribeReason === r}
                      onChange={(e) => setUnsubscribeReason(e.target.value)}
                      className="text-emerald-500 focus:ring-emerald-500 bg-[#111b21] border-gray-600"
                    />
                    {r}
                  </label>
                ),
              )}
            </div>

            {unsubscribeReason === "Other" && (
              <textarea
                className="w-full bg-[#111b21] text-white text-sm p-2 rounded border border-gray-600 mb-4 outline-none focus:border-emerald-500 resize-none"
                placeholder="Enter reason..."
                rows="2"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setUnsubscribeModal({ visible: false, convoId: null })
                }
                className="text-gray-400 hover:text-white px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const finalReason =
                    unsubscribeReason === "Other"
                      ? customReason
                      : unsubscribeReason;

                  if (onToggleSubscription) {
                    onToggleSubscription(
                      unsubscribeModal.convoId,
                      false,
                      finalReason,
                    );
                  }

                  setUnsubscribeModal({ visible: false, convoId: null });
                  setUnsubscribeReason("Requested by User");
                  setCustomReason("");
                }}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded"
              >
                Unsubscribe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
