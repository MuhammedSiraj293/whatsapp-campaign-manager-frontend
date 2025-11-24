// frontend/src/components/Chats.js

import React, { useState } from "react";
import Chat from "./Chat";
import { ImFolderDownload } from "react-icons/im";

// This component now handles its own search and filtering
function Chats({ conversations, onSelectConversation, activeConversationId }) {
  const [filterText, setFilterText] = useState("");

  // Filter conversations based on the search text (name or phone number)
  const filteredConversations = conversations.filter((convo) =>
    (convo.name && convo.name.toLowerCase().includes(filterText.toLowerCase())) ||
    (convo._id && convo._id.includes(filterText))
  );

  return (
    <div className="flex flex-col h-full bg-[#111b21]">
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
      <div className="flex-grow flex-col overflow-y-scroll cursor-pointer h-full">
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
          return (
            <Chat
              key={convo._id}
              name={convo.name}
              contact={convo._id}
              msg={convo.lastMessage}
              time={new Date(convo.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              unreadMsgs={convo.unreadCount}
              active={convo._id === activeConversationId}
              onClick={() => onSelectConversation(convo._id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Chats;