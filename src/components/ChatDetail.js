import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import Message from "./Message";
import { MdSend } from "react-icons/md";
import { AiOutlinePaperClip } from "react-icons/ai";
import { BsFillMicFill } from "react-icons/bs";
import Avatar from "./Avatar";
import EmojiPicker from "emoji-picker-react";
import {
  BsCheck,
  BsCheckAll,
  BsChevronDown,
  BsEmojiSmile,
} from "react-icons/bs";
import { BsArrowLeft } from "react-icons/bs";

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

export default function ChatDetail({
  messages,
  activeConversationId,
  onSendMessage,
  onSendMedia,
  onDeleteMessage,
  onReact,
  onBack,
  contactName,
  onLoadMore, // Pagination
  hasMore,
  loading,
}) {
  const [typing, setTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null); // Ref for scroll container
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Scroll Preservation Refs
  const prevScrollHeightRef = useRef(0);
  const firstMessageIdRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const [replyingToMessage, setReplyingToMessage] = useState(null);

  // --- RECORDING STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState(null); // URL for preview
  const [audioFile, setAudioFile] = useState(null); // File to send

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const longPressTimeoutRef = useRef(null); // Ref for long press delay

  // Filter out reaction messages so they don't appear as bubbles
  const filteredMessages = messages.filter((msg) => msg.type !== "reaction");

  // Group the messages by date
  const groupedMessages = groupMessagesByDate(filteredMessages);

  // --- SCROLL PRESERVATION LOGIC ---
  useLayoutEffect(() => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;

    const currentScrollHeight = container.scrollHeight;
    const currentFirstMsgId =
      filteredMessages.length > 0 ? filteredMessages[0]._id : null;
    const currentLastMsgId =
      filteredMessages.length > 0
        ? filteredMessages[filteredMessages.length - 1]._id
        : null;

    // 1. Detect PREPEND (History Load): First message changed, list got longer
    if (
      prevScrollHeightRef.current > 0 &&
      currentFirstMsgId !== firstMessageIdRef.current &&
      currentLastMsgId === lastMessageIdRef.current // Last message didn't change (roughly) or handled handled separately
    ) {
      // Restore scroll position
      const diff = currentScrollHeight - prevScrollHeightRef.current;
      container.scrollTop = diff; // Jump down by amount of added content
    }

    // 2. Detect APPEND (New Message): Last message changed
    if (currentLastMsgId !== lastMessageIdRef.current) {
      // Determine behavior: 'auto' (instant) for initial load, 'smooth' for new incoming text
      const isInitial = lastMessageIdRef.current === null;
      bottomRef.current?.scrollIntoView({
        behavior: isInitial ? "auto" : "smooth",
      });
    }

    // Update refs for next render
    prevScrollHeightRef.current = currentScrollHeight;
    firstMessageIdRef.current = currentFirstMsgId;
    lastMessageIdRef.current = currentLastMsgId;
  }, [filteredMessages]); // Run when messages change

  // --- INFINITE SCROLL HANDLER ---
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop } = messagesContainerRef.current;

    // If scrolled to top (within 50px)
    if (scrollTop < 50 && hasMore && !loading) {
      if (onLoadMore) onLoadMore();
    }
  };

  const handleInputChange = () => {
    if (inputRef.current.value.length > 0) setTyping(true);
    else setTyping(false);
  };

  const handleInputSubmit = useCallback(() => {
    if (inputRef.current.value.length > 0) {
      onSendMessage(inputRef.current.value, replyingToMessage);
      inputRef.current.value = "";
      setTyping(false);
      setShowEmojiPicker(false);
      setReplyingToMessage(null);
    }
    // Ensure existing timeouts are cleared if any interaction was ongoing
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, [onSendMessage, replyingToMessage]);

  const handleReply = (msg) => {
    setReplyingToMessage(msg);
    inputRef.current.focus();
  };

  const handleCancelReply = () => {
    setReplyingToMessage(null);
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
        !event.target.closest("button")
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
    // Only scroll to bottom on initial mount or very specific updates handled by useLayoutEffect
  }, []);

  // Helper to determine the best supported MIME type
  const getMimeType = () => {
    if (MediaRecorder.isTypeSupported("audio/mp4")) {
      return { type: "audio/mp4", ext: "mp4" };
    }
    if (MediaRecorder.isTypeSupported("audio/ogg")) {
      return { type: "audio/ogg", ext: "ogg" };
    }
    // WhatsApp supports 'audio/opus'. WebM audio is often Opus, but the container is WebM.
    // We will send it as .webm and let the backend force it to be a "Document" so it sends reliably.
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      return { type: "audio/webm;codecs=opus", ext: "webm" };
    }
    // Fallback
    if (MediaRecorder.isTypeSupported("audio/webm")) {
      return { type: "audio/webm", ext: "webm" };
    }
    return { type: "", ext: "" };
  };

  // --- AUDIO RECORDING HANDLERS ---

  // 1. TRIGGER: User Presses Button
  const handleStartInteraction = () => {
    // Clear any existing timeout
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);

    // Set a delay: Recording only starts if held for 500ms
    longPressTimeoutRef.current = setTimeout(() => {
      handleStartRecording();
    }, 500);
  };

  // 2. TRIGGER: User Releases Button
  const handleStopInteraction = () => {
    // If release happens BEFORE 500ms, clear timeout -> No recording starts (Accidental tap blocked)
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    // If recording IS active, stop it
    if (isRecording) {
      handleStopRecording();
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { type, ext } = getMimeType();

      const options = type ? { mimeType: type } : undefined;
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Create blob using the same type we recorded with
        const blobType = type || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
        const url = URL.createObjectURL(audioBlob);

        // We do NOT rename to .opus anymore because WhatsApp validated the WebM container and failed.
        // We now intentionally send as .webm. The backend will catch this and send as "Document" type.
        // This ensures the file is delivered (playable file attachment).

        let fileType = blobType;
        if (ext === "mp4") fileType = "audio/mp4";

        const file = new File([audioBlob], `voice_message.${ext}`, {
          type: fileType,
        });

        setAudioPreview(url);
        setAudioFile(file);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (recordingDuration < 2) {
        // Discard if less than 2 seconds
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        clearInterval(timerRef.current);
        setAudioPreview(null);
        setAudioFile(null);
        return;
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleDiscardAudio = () => {
    // Clean up URL object
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
    }
    setAudioPreview(null);
    setAudioFile(null);
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const handleSendAudio = () => {
    if (audioFile) {
      onSendMedia(audioFile);
      handleDiscardAudio();
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a131a]">
      {/* ... Header ... */}
      <div className="flex justify-between bg-[#202d33] h-[60px] p-3 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {/* --- BACK BUTTON (Mobile Only) --- */}
          <button
            onClick={onBack}
            className="md:hidden text-[#8796a1] hover:text-white mr-1"
          >
            <BsArrowLeft size={24} />
          </button>

          <Avatar contactId={activeConversationId} name={contactName} />
          <div className="flex flex-col">
            <h1 className="text-white font-medium">{activeConversationId}</h1>
            <p className="text-[#8796a1] text-xs">{contactName || "online"}</p>
          </div>
        </div>
      </div>

      {/* ... Messages Area ... */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="bg-[#0a131a] bg-chat-bg bg-contain overflow-y-scroll h-full flex flex-col custom-scrollbar"
        style={{ padding: "12px 7%" }}
      >
        {/* Loading Spinner at Top (History) */}
        {loading && (
          <div className="flex justify-center py-2 h-10">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        )}

        {/* ... (Keep existing Messages Map) ... */}
        {Object.keys(groupedMessages).map((dateKey) => (
          <div key={dateKey} className="relative">
            <div className="flex justify-center my-4 sticky top-2 z-10">
              <span className="bg-[#182229] text-[#8696a0] text-xs py-1.5 px-3 rounded-lg shadow-sm uppercase font-medium tracking-wide">
                {dateKey}
              </span>
            </div>
            {groupedMessages[dateKey].map((msg) => (
              <Message
                key={msg._id}
                msg={msg}
                time={new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
                direction={msg.direction}
                status={msg.status}
                mediaId={msg.mediaId}
                mediaType={msg.mediaType}
                onReply={handleReply}
                onReact={onReact}
                onDeleteMessage={onDeleteMessage}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ... Reply Banner ... */}
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

      {/* ... Footer / Input Area ... */}
      <div className="flex items-center bg-[#202d33] w-full h-[70px] p-2 relative">
        {/* --- AUDIO PREVIEW UI --- */}
        {audioPreview ? (
          <div className="flex items-center w-full justify-between px-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscardAudio}
                className="text-red-500 p-2 hover:bg-[#182229] rounded-full"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="currentColor"
                >
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                </svg>
              </button>
              <audio
                src={audioPreview}
                controls
                className="h-[40px] w-[200px]"
              />
            </div>
            <button
              onClick={handleSendAudio}
              className="bg-[#00a884] p-3 rounded-full text-white shadow-lg hover:bg-[#008f6f]"
            >
              <MdSend />
            </button>
          </div>
        ) : (
          <>
            {showEmojiPicker && (
              <div
                className="absolute bottom-[70px] left-0 z-50"
                ref={emojiPickerRef}
              >
                <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
              </div>
            )}
            {/* ... Normal Input UI ... */}
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

            {isRecording ? (
              <div className="flex items-center w-full mx-2 text-red-500 animate-pulse">
                <span className="mr-2">●</span>
                <span className="font-medium">
                  Recording {formatTime(recordingDuration)}...
                </span>
              </div>
            ) : (
              <textarea
                placeholder="Type a message"
                className="w-full bg-[#2a3942] text-white text-base md:text-sm rounded-lg px-4 py-2 mx-2 focus:outline-none resize-none overflow-hidden"
                rows={1}
                onChange={(e) => {
                  handleInputChange();
                  // Auto-resize
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(
                    e.target.scrollHeight,
                    100
                  )}px`;
                }}
                ref={inputRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleInputSubmit();
                    // Reset height
                    e.target.style.height = "auto";
                  }
                }}
              />
            )}

            {typing && !isRecording ? (
              <button
                className="text-[#8796a1] text-2xl p-2"
                onClick={handleInputSubmit}
              >
                <MdSend />
              </button>
            ) : (
              /* MIC BUTTON with Press & Hold (Long Press) */
              <button
                className={`text-2xl p-2 transition-colors duration-200 ${
                  isRecording ? "text-red-500 scale-110" : "text-[#8796a1]"
                }`}
                onMouseDown={handleStartInteraction}
                onMouseUp={handleStopInteraction}
                onMouseLeave={handleStopInteraction}
                onTouchStart={handleStartInteraction}
                onTouchEnd={handleStopInteraction}
              >
                <BsFillMicFill />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
