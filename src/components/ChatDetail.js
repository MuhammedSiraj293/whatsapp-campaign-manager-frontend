// frontend/src/components/ChatDetail.js

import React, { useState, useEffect, useRef } from "react";
import Message from "./Message";
import { MdSearch, MdSend } from "react-icons/md";
import { HiDotsVertical } from "react-icons/hi";
import { BiHappy } from "react-icons/bi";
import { AiOutlinePaperClip } from "react-icons/ai";
import { BsFillMicFill } from "react-icons/bs";
import Avatar from './Avatar';

function ChatDetail({ activeConversationId, messages, onSendMessage, onSendMedia }) {
  const [typing, setTyping] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleInputChange = () => {
    if (inputRef.current.value.length > 0) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const handleInputSubmit = () => {
    if (inputRef.current.value.length > 0) {
      onSendMessage(inputRef.current.value);
      inputRef.current.value = "";
      setTyping(false);
    }
  };

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
  }, [messages]);

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
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0a131a]">
      {/* Contact nav */}
      <div className="flex justify-between bg-[#202d33] h-[60px] p-3">
        <div className="flex items-center">
          <Avatar contactId={activeConversationId} />
          <div className="flex flex-col">
            <h1 className="text-white font-medium">{activeConversationId}</h1>
            <p className="text-[#8796a1] text-xs">online</p>
          </div>
        </div>
        <div className="flex justify-between items-center w-[85px]"></div>
      </div>

      {/* Messages section */}
      <div
        className="bg-[#0a131a] bg-chat-bg bg-contain overflow-y-scroll h-full flex flex-col"
        style={{ padding: "12px 7%" }}
      >
        {/* --- THIS IS THE CORRECTED SECTION --- */}
        {messages.map((msg) => (
          <Message
            key={msg._id}
            msg={msg.body}
            time={new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            direction={msg.direction}
            mediaUrl={msg.mediaUrl} // This prop is no longer used but doesn't hurt
            mediaId={msg.mediaId} // Pass the mediaId
            mediaType={msg.mediaType} // Pass the mediaType
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Bottom section */}
      <div className="flex items-center bg-[#202d33] w-full h-[70px] p-2">
        <button className="text-neutral-400 p-2" onClick={handleAttachmentClick}>
            <AiOutlinePaperClip size={24} />
        </button>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept="image/*,video/*,audio/*,.pdf"
        />

        <input
          type="text"
          placeholder="Type a message"
          className="bg-[#2c3943] rounded-lg outline-none text-sm text-neutral-200 w-full h-full px-3 placeholder:text-sm placeholder:text-[#8796a1]"
          onChange={handleInputChange}
          ref={inputRef}
        />
        <span className="ml-2">
          {typing ? (
            <button className="text-white p-2" onClick={handleInputSubmit}><MdSend size={24} /></button>
          ) : (
            <button className="text-white p-2"><BsFillMicFill size={24} /></button>
          )}
        </span>
      </div>
    </div>
  );
}

export default ChatDetail;