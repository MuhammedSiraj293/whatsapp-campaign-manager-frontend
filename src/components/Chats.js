// frontend/src/components/Chats.js

import React from "react";
import Chat from "./Chat";
import { ImFolderDownload } from "react-icons/im";

function Chats({ conversations, filterText, onSelectConversation, activeConversationId }) {
  // Filter conversations based on the search text (name or phone number)
  const filteredConversations = conversations.filter((convo) =>
    (convo.name && convo.name.toLowerCase().includes(filterText.toLowerCase())) ||
    convo._id.includes(filterText)
  );

  return (
    <div className="flex flex-col overflow-y-scroll cursor-pointer h-full">
      {/* Archived container */}
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
  );
}

export default Chats;