// frontend/src/components/LeftMenu.js

import React, { useState } from "react";
import Chats from "./Chats";
// We'll add back icons and assets as we build features
// import { pp } from "../assets/whatsapp";

function LeftMenu({ conversations, onSelectConversation, activeConversationId }) {
  const [filterText, setFilterText] = useState("");

  return (
    <div className="flex flex-col border-r border-neutral-700 w-full h-screen">
      {/* Profile nav */}
      <div className="flex justify-between items-center bg-[#202d33] h-[60px] p-3">
        {/* <img src={pp} alt="profile_picture" className="rounded-full w-[40px]" /> */}
      </div>

      {/* Search and filter */}
      <div className="flex justify-between items-center h-[60px] p-2 bg-[#111b21]">
        <input
          type="text"
          placeholder="Search or start a new chat"
          className="rounded-lg bg-[#202d33] text-[#8796a1] text-sm font-light outline-none px-4 py-2 w-full h-[35px] placeholder:text-[#8796a1] placeholder:text-sm placeholder:font-light"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>

      {/* Chats */}
      <div className="flex-grow overflow-y-auto bg-[#111b21]">
        <Chats 
          conversations={conversations} 
          filterText={filterText} // Pass the search text down
          onSelectConversation={onSelectConversation}
          activeConversationId={activeConversationId}
        />
      </div>
    </div>
  );
}

export default LeftMenu;