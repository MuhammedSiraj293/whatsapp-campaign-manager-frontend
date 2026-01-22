import React, { useState, useRef, useEffect } from "react";
import { API_URL } from "../config";
import { BsCheck, BsCheckAll, BsChevronDown } from "react-icons/bs";

// Helper to format text with bold (*) and italic (_)
// Helper to format text with bold (*), italic (_), strikethrough (~), and monospace (```)
const formatMessage = (text) => {
  if (!text) return null;

  // Split by supported formatters
  // Order matters: code blocks first to avoid formatting inside them
  const parts = text.split(/(```[\s\S]*?```|\*.*?\*|_.*?_|~.*?~)/g);

  return parts.map((part, index) => {
    // Monospace (```text```)
    if (part.startsWith("```") && part.endsWith("```") && part.length >= 6) {
      return (
        <code
          key={index}
          className="bg-black/20 px-1 rounded font-mono text-sm"
        >
          {part.slice(3, -3)}
        </code>
      );
    }
    // Bold (*text*)
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <strong key={index}>{part.slice(1, -1)}</strong>;
    }
    // Italic (_text_)
    if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    // Strikethrough (~text~)
    if (part.startsWith("~") && part.endsWith("~") && part.length >= 2) {
      return <del key={index}>{part.slice(1, -1)}</del>;
    }
    return part;
  });
};

function Message({
  msg,
  time,
  direction,
  mediaId,
  mediaType,
  status,
  onReply,
  onReact,
  onDeleteMessage,
  isSelectionMode,
  isSelected,
  onToggleSelection,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!msg.body && !msg.interactive && !mediaId) {
    console.log("⚠️ Empty message detected:", msg);
  }
  const messageBubbleClasses =
    direction === "outgoing"
      ? "bg-[#005c4b] self-end"
      : "bg-[#202d33] self-start";

  const handleCopy = () => {
    if (msg.body) {
      navigator.clipboard.writeText(msg.body);
      setShowMenu(false);
    }
  };

  const handleReplyClick = () => {
    if (onReply) onReply(msg);
    setShowMenu(false);
  };

  const handleReactionClick = (emoji) => {
    if (onReact) onReact(msg, emoji);
    setShowMenu(false);
  };

  const handleSelectClick = () => {
    if (onToggleSelection) onToggleSelection();
    setShowMenu(false);
  };

  const handleSaveAs = async () => {
    const mediaSource =
      msg.mediaUrl || (mediaId ? `${API_URL}/api/media/${mediaId}` : null);
    if (!mediaSource) return;

    try {
      const response = await fetch(mediaSource);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      const ext =
        mediaType === "image" ? "jpg" : mediaType === "video" ? "mp4" : "file";
      link.download = `whatsapp-media-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed, opening in new tab", error);
      window.open(mediaSource, "_blank");
    }
    setShowMenu(false);
  };

  const renderMedia = () => {
    // We prefer the persistent mediaUrl (Cloudinary) if available
    // Otherwise fallback to the proxy (Meta API)
    const mediaSource =
      msg.mediaUrl || (mediaId ? `${API_URL}/api/media/${mediaId}` : null);

    if (!mediaSource) return null;

    switch (mediaType) {
      case "image":
        return (
          <img
            src={mediaSource}
            alt="Sent media"
            className="rounded-md max-w-xs mb-1"
            loading="lazy"
          />
        );
      case "video":
        return (
          <video
            src={mediaSource}
            controls
            className="rounded-md max-w-xs mb-1"
          />
        );
      case "audio":
      case "voice":
        return <audio src={mediaSource} controls className="my-2" />;
      default:
        return (
          <a
            href={mediaSource}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 underline"
          >
            {msg.body || "View Document"}
          </a>
        );
    }
  };

  const renderInteractive = () => {
    if (!msg.interactive) return null;

    if (msg.interactive.type === "button") {
      return (
        <div className="mt-2 flex flex-col gap-2">
          {msg.interactive.action.buttons.map((btn, idx) => (
            <button
              key={idx}
              className="bg-[#2c3943] text-[#00a884] py-2 px-4 rounded-lg text-sm font-medium border border-[#2c3943] hover:bg-[#374248] transition-colors w-full text-center"
              disabled
            >
              {btn.reply.title}
            </button>
          ))}
        </div>
      );
    }

    if (msg.interactive.type === "list") {
      return (
        <div className="mt-2">
          <button
            className="bg-[#2c3943] text-[#00a884] py-2 px-4 rounded-lg text-sm font-medium border border-[#2c3943] w-full text-center mb-2"
            disabled
          >
            {msg.interactive.action.button}
          </button>
          {msg.interactive.action.sections.map((section, sIdx) => (
            <div key={sIdx} className="mb-2">
              <p className="text-xs text-gray-400 mb-1 uppercase font-bold">
                {section.title}
              </p>
              {section.rows.map((row, rIdx) => (
                <div
                  key={rIdx}
                  className="bg-[#2a3942] p-2 rounded mb-1 border-l-4 border-[#00a884]"
                >
                  <p className="text-sm font-medium text-white">{row.title}</p>
                  {row.description && (
                    <p className="text-xs text-gray-400">{row.description}</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`w-full flex my-1 group relative ${
        isSelectionMode ? "flex-row items-center" : "flex-col"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isSelectionMode && (
        <div
          className="w-12 flex justify-center cursor-pointer shrink-0"
          onClick={onToggleSelection}
        >
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className="w-5 h-5 accent-[#00a884] cursor-pointer"
          />
        </div>
      )}

      {/* Wrapper to ensure bubbles align correctly within the flex row */}
      <div
        className={`flex flex-col flex-1 ${isSelectionMode ? "" : "w-full"}`}
      >
        <div
          className={`text-white py-2 px-3 rounded-lg max-w-[85%] md:max-w-[65%] w-fit relative ${messageBubbleClasses} ${
            isSelectionMode ? "cursor-pointer" : ""
          }`}
          onClick={(e) => {
            if (isSelectionMode) {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelection();
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowMenu(true);
          }}
        >
          {/* --- MENU TRIGGER --- */}

          {isHovered && (
            <button
              className="absolute top-0 right-0 p-1 bg-gradient-to-l from-black/40 to-transparent rounded-tr-lg text-gray-300 hover:text-white"
              onClick={() => setShowMenu(!showMenu)}
            >
              <BsChevronDown size={14} />
            </button>
          )}

          {/* --- CONTEXT MENU --- */}
          {showMenu && (
            <div
              ref={menuRef}
              className="absolute top-6 right-0 bg-[#233138] py-2 rounded shadow-xl z-50 w-48 border border-[#101b20]"
            >
              {/* Reactions Row */}
              <div className="flex justify-around px-2 pb-2 border-b border-[#101b20] mb-1">
                {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className="hover:bg-[#182229] p-1 rounded transition text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={handleReplyClick}
                className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm text-gray-300"
              >
                Reply
              </button>
              <button
                onClick={handleCopy}
                className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm text-gray-300"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  if (onDeleteMessage) onDeleteMessage(msg._id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm text-gray-300"
              >
                Delete
              </button>
              <button
                onClick={handleSelectClick}
                className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm text-gray-300"
              >
                Select
              </button>
              {(mediaType === "image" ||
                mediaType === "video" ||
                mediaType === "audio" ||
                mediaType === "document") && (
                <button
                  onClick={handleSaveAs}
                  className="w-full text-left px-4 py-2 hover:bg-[#182229] text-sm text-gray-300"
                >
                  Save as
                </button>
              )}
            </div>
          )}

          {/* --- RENDER REACTION --- */}
          {msg.type === "reaction" && (
            <div className="flex items-center gap-2 italic text-gray-300">
              <span className="text-xl">{msg.reaction?.emoji}</span>
              <span className="text-sm">Reacted to a message</span>
            </div>
          )}

          {/* --- RENDER QUOTED CONTEXT --- */}
          {msg.quotedMessage && (
            <div className="bg-black/20 p-2 rounded mb-2 border-l-4 border-white/50 text-xs text-gray-300">
              <p className="font-bold text-[#00a884] mb-1">
                {msg.quotedMessage.from}
              </p>
              <p className="line-clamp-2">
                {msg.quotedMessage.body ||
                  (msg.quotedMessage.mediaType
                    ? `📷 ${msg.quotedMessage.mediaType}`
                    : "Original message not found")}
              </p>
            </div>
          )}

          {renderMedia()}

          {/* Only show the text if it's not a media-only message with no caption */}
          {msg.body && (
            // Add margin-right to make space for the timestamp and ticks
            <p className="text-sm mr-16" style={{ whiteSpace: "pre-wrap" }}>
              {formatMessage(msg.body)}
            </p>
          )}

          {/* --- RENDER INTERACTIVE (Buttons / List) --- */}
          {renderInteractive()}

          {/* --- TIMESTAMP & TICKS --- */}
          <div className="absolute bottom-1 right-2 flex items-center space-x-1">
            <span className="text-[10px] text-gray-300 min-w-[45px] text-right">
              {time}
            </span>
            {direction === "outgoing" && (
              <span>
                {status === "read" ? (
                  <BsCheckAll size={16} className="text-[#53bdeb]" />
                ) : status === "delivered" ? (
                  <BsCheckAll size={16} className="text-gray-400" />
                ) : (
                  <BsCheck size={16} className="text-gray-400" />
                )}
              </span>
            )}
          </div>

          {/* --- RENDER REACTIONS BADGE --- */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="absolute -bottom-3 right-0 bg-[#202d33] border border-[#0a131a] rounded-full px-1.5 py-0.5 flex items-center shadow-sm z-10">
              {msg.reactions.map((r, idx) => (
                <span key={idx} className="text-xs">
                  {r.emoji}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Message;
