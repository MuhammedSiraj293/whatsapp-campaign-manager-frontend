// frontend/src/components/ChatDetail.js

import React, { useState, useEffect, useRef, useCallback } from "react";
import Message from "./Message";
import { MdSend } from "react-icons/md";
import { AiOutlinePaperClip } from "react-icons/ai";
import { BsFillMicFill } from "react-icons/bs";
import Avatar from "./Avatar";

// --- NEW HELPER FUNCTION to group messages by date ---
const groupMessagesByDate = (messages) => {
  const grouped = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  messages.forEach((msg) => {
    const msgDate = new Date(msg.timestamp);
    let dateKey;

    if (msgDate.toDateString() === today.toDateString()) {
      dateKey = "Today";
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      dateKey = "Yesterday";
    } else {
      dateKey = msgDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(msg);
  });
  return grouped;
};

function ChatDetail({
  activeConversationId,
  messages,
  onSendMessage,
  onSendMedia,
}) {
  const [typing, setTyping] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Group the messages by date
  const groupedMessages = groupMessagesByDate(messages);

  const handleInputChange = () => {
    if (inputRef.current.value.length > 0) setTyping(true);
    else setTyping(false);
  };

  // 2. Wrap handleInputSubmit in useCallback
  // This gives the function a stable identity so it can be used in useEffect
  const handleInputSubmit = useCallback(() => {
    if (inputRef.current.value.length > 0) {
      onSendMessage(inputRef.current.value);
      inputRef.current.value = "";
      setTyping(false);
    }
  }, [onSendMessage, inputRef]); // Add dependencies

  const handleAttachmentClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onSendMedia(file);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // 3. This useEffect is now safe

  useEffect(() => {
    const listener = (e) => {
      if (e.code === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        handleInputSubmit();
      }
    };
    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener("keydown", listener);
    }
    return () => {
      if (inputElement) {
        inputElement.removeEventListener("keydown", listener);
      }
    };
  }, [handleInputSubmit]); // Add the new stable function to the array

  return (
    <div className="flex flex-col h-screen bg-[#0a131a]">
      <div className="flex justify-between bg-[#202d33] h-[60px] p-3">
        <div className="flex items-center">
          <Avatar contactId={activeConversationId} />
          <div className="flex flex-col">
            <h1 className="text-white font-medium">{activeConversationId}</h1>
            <p className="text-[#8796a1] text-xs">online</p>
          </div>
        </div>
      </div>

      <div
        className="bg-[#0a131a] bg-chat-bg bg-contain overflow-y-scroll h-full flex flex-col"
        style={{ padding: "12px 7%" }}
      >
        {/* --- NEW RENDER LOGIC with date groups --- */}
        {Object.entries(groupedMessages).map(([date, messagesForDate]) => (
          <React.Fragment key={date}>
            <div className="flex justify-center my-2">
              <span className="bg-[#1f2c33] text-gray-400 text-xs py-1 px-3 rounded-full">
                {date}
              </span>
            </div>
            {messagesForDate.map((msg) => (
              <Message
                key={msg._id}
                msg={msg.body}
                time={new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                direction={msg.direction}
                mediaId={msg.mediaId}
                mediaType={msg.mediaType}
                status={msg.status}
              />
            ))}
          </React.Fragment>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center bg-[#202d33] w-full h-[70px] p-2">
        <button
          className="text-neutral-400 p-2"
          onClick={handleAttachmentClick}
        >
          <AiOutlinePaperClip size={24} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept="image/*,video/*,audio/*,.pdf"
        />
        <input
          type="text"
          placeholder="Type a message"
          className="bg-[#2c3943] rounded-lg outline-none text-sm text-neutral-200 w-full h-full px-3"
          onChange={handleInputChange}
          ref={inputRef}
        />
        <span className="ml-2">
          {typing ? (
            <button className="text-white p-2" onClick={handleInputSubmit}>
              <MdSend size={24} />
            </button>
          ) : (
            <button className="text-white p-2">
              <BsFillMicFill size={24} />
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

export default ChatDetail;
