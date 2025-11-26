import React, { useState, useEffect, useRef, useCallback } from "react";
import Message from "./Message";
import { MdSend } from "react-icons/md";
import { AiOutlinePaperClip } from "react-icons/ai";
import { BsFillMicFill } from "react-icons/bs";
import Avatar from "./Avatar";
import EmojiPicker from "emoji-picker-react";
import { BsEmojiSmile } from "react-icons/bs";

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
  onReact, // Assuming onReact is passed as a prop
}) {
  const [typing, setTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null); // <-- NEW REF

  const [replyingToMessage, setReplyingToMessage] = useState(null); // <-- NEW STATE

  // Filter out reaction messages so they don't appear as bubbles
  const filteredMessages = messages.filter((msg) => msg.type !== "reaction");

  // Group the messages by date
  const groupedMessages = groupMessagesByDate(filteredMessages);

  const handleInputChange = () => {
    if (inputRef.current.value.length > 0) setTyping(true);
    else setTyping(false);
  };

  // 2. Wrap handleInputSubmit in useCallback
  // This gives the function a stable identity so it can be used in useEffect
  const handleInputSubmit = useCallback(() => {
    if (inputRef.current.value.length > 0) {
      // Pass the replyingToMessage context if it exists
      onSendMessage(inputRef.current.value, replyingToMessage);
      inputRef.current.value = "";
      setTyping(false);
      setShowEmojiPicker(false); // Close picker on send
      setReplyingToMessage(null); // Clear reply state
    }
  }, [onSendMessage, inputRef, replyingToMessage]); // Add dependencies

  const handleReply = (msg) => {
    setReplyingToMessage(msg);
    inputRef.current.focus();
  };

  const handleCancelReply = () => {
    setReplyingToMessage(null);
  };

  const handleReact = (msg, emoji) => {
    // We will implement the actual API call in the parent or here
    // For now, let's assume onSendMessage handles it or we pass a new prop
    // But the plan said "Pass onReact handler".
    // Let's assume onSendMedia/onSendMessage are for new messages.
    // We might need a new prop `onReact` from props.
    // For now, I'll just log it or try to use a new prop if I add it to ChatDetail signature.
    if (onReact) {
      onReact(msg, emoji);
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

  const onEmojiClick = (emojiObject) => {
    if (inputRef.current) {
      inputRef.current.value += emojiObject.emoji;
      setTyping(true);
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest("button") // Prevent closing if clicking the toggle button itself
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
                msg={msg}
                time={new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                direction={msg.direction}
                mediaId={msg.mediaId}
                mediaType={msg.mediaType}
                status={msg.status}
                onReply={handleReply} // <-- PASS HANDLER
                onReact={onReact} // <-- PASS HANDLER
              />
            ))}
          </React.Fragment>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* --- REPLY BANNER --- */}
      {replyingToMessage && (
        <div className="bg-[#202d33] p-2 flex justify-between items-center border-l-4 border-[#00a884] mx-2 mt-2 rounded-t-lg">
          <div className="flex flex-col overflow-hidden">
            <span className="text-[#00a884] font-bold text-sm">
              Replying to{" "}
              {replyingToMessage.direction === "outgoing"
                ? "yourself"
                : activeConversationId}
            </span>
            <span className="text-gray-400 text-xs truncate">
              {replyingToMessage.body ||
                (replyingToMessage.mediaType
                  ? `📷 ${replyingToMessage.mediaType}`
                  : "Message")}
            </span>
          </div>
          <button
            onClick={handleCancelReply}
            className="text-gray-400 hover:text-white"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-center bg-[#202d33] w-full h-[70px] p-2 relative">
        {showEmojiPicker && (
          <div
            className="absolute bottom-[70px] left-0 z-50"
            ref={emojiPickerRef}
          >
            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
          </div>
        )}
        <button
          className="text-[#8796a1] text-2xl p-2"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <BsEmojiSmile />
        </button>
        <button
          className="text-[#8796a1] text-2xl p-2"
          onClick={handleAttachmentClick}
        >
          <AiOutlinePaperClip />
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
          className="w-full bg-[#2a3942] text-white text-sm rounded-lg px-4 py-2 mx-2 focus:outline-none"
          onChange={handleInputChange}
          ref={inputRef}
        />
        {typing ? (
          <button
            className="text-[#8796a1] text-2xl p-2"
            onClick={handleInputSubmit}
          >
            <MdSend />
          </button>
        ) : (
          <button className="text-[#8796a1] text-2xl p-2">
            <BsFillMicFill />
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatDetail;
