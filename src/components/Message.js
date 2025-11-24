// frontend/src/components/Message.js

import React from "react";
import { API_URL } from '../config';
import MessageStatus from './MessageStatus'; // <-- 1. IMPORT the new component

function Message({ msg, time, direction, mediaId, mediaType, status }) { // <-- 2. ACCEPT status prop
  const messageBubbleClasses = direction === "outgoing" 
    ? "bg-[#005c4b] self-end" 
    : "bg-[#202d33] self-start";

  const renderMedia = () => {
    if (!mediaId) return null;
    const proxyUrl = `${API_URL}/api/media/${mediaId}`;

    switch (mediaType) {
      case 'image':
        return <img src={proxyUrl} alt="Sent media" className="rounded-md max-w-xs mb-1" />;
      case 'video':
        return <video src={proxyUrl} controls className="rounded-md max-w-xs mb-1" />;
      case 'audio':
      case 'voice':
        return <audio src={proxyUrl} controls className="my-2" />;
      default:
        return <a href={proxyUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">{msg || 'View Document'}</a>;
    }
  };

  return (
    <div className={`w-full flex flex-col my-1`}>
      <div className={`text-white py-2 px-3 rounded-lg max-w-lg w-fit relative ${messageBubbleClasses}`}>
        {renderMedia()}
        
        {/* Only show the text if it's not a media-only message with no caption */}
        {(msg && mediaType !== 'document') && (
          // Add margin-right to make space for the timestamp and ticks
          <p className="text-sm mr-16" style={{ whiteSpace: 'pre-wrap' }}>{msg}</p>
        )}
        
        {/* --- 3. NEW TIMESTAMP AND STATUS TICKS --- */}
        <div className="absolute bottom-1 right-2 flex items-center">
            <p className="text-xs text-neutral-400">{time}</p>
            {/* Only show status ticks for outgoing messages */}
            {direction === 'outgoing' && <MessageStatus status={status} />}
        </div>
      </div>
    </div>
  );
}

export default Message;