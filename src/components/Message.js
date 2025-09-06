// frontend/src/components/Message.js

import React from "react";
import { API_URL } from '../config';

function Message({ msg, time, direction, mediaId, mediaType }) {
  const messageContainerClasses = direction === "outgoing" ? "justify-end" : "justify-start";
  const messageBubbleClasses = direction === "outgoing" ? "bg-[#005c4b]" : "bg-[#202d33]";

  // Helper function to render the correct media type
  const renderMedia = () => {
    if (!mediaId) return null;

    // Construct the URL to our own backend proxy
    const proxyUrl = `${API_URL}/api/media/${mediaId}`;

    switch (mediaType) {
      case 'image':
        return <img src={proxyUrl} alt="Received media" className="rounded-md max-w-xs my-2" />;
      case 'video':
        return <video src={proxyUrl} controls className="rounded-md max-w-xs my-2" />;
      case 'audio':
        return <audio src={proxyUrl} controls className="my-2" />;
      default:
        return <a href={proxyUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">View Document</a>;
    }
  };

  return (
    <div className={`flex w-full my-1 ${messageContainerClasses}`}>
      <div className={`flex flex-col text-white py-2 px-3 rounded-lg max-w-lg w-fit ${messageBubbleClasses}`}>
        {renderMedia()}
        
        {msg && (
          <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg}</p>
        )}
        
        <p className="text-xs text-neutral-400 self-end mt-1">{time}</p>
      </div>
    </div>
  );
}

export default Message;