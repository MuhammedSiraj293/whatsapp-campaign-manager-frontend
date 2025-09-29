// frontend/src/components/LeftMenu.js

import React from "react";
import Chats from "./Chats";
import { pp } from "../assets/whatsapp";

function LeftMenu({
  conversations,
  onSelectConversation,
  activeConversationId,
}) {
  return (
    <div className="flex flex-col border-r border-neutral-700 w-full h-screen">
      {/* Profile nav */}
      <div className="flex justify-between items-center bg-[#202d33] h-[60px] p-3">
        <img src={pp} alt="profile_picture" className="rounded-full w-[40px]" />
      </div>

      {/* The Chats component will now handle its own search and filtering */}
      <Chats
        conversations={conversations}
        onSelectConversation={onSelectConversation}
        activeConversationId={activeConversationId}
      />
    </div>
  );
}

export default LeftMenu;
