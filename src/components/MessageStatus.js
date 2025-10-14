// frontend/src/components/MessageStatus.js

import React from 'react';

// This component renders the correct tick icon based on the message status
export default function MessageStatus({ status }) {
  // Single grey tick for 'sent'
  if (status === 'sent') {
    return (
      <svg viewBox="0 0 18 18" height="18" width="18" className="inline-block ml-1" style={{ fill: '#aebac1' }}>
        <path d="M17.394 5.035l-1.179-1.179-10.465 10.465-4.729-4.729-1.179 1.179 5.908 5.908 11.644-11.644z"></path>
      </svg>
    );
  }

  // Double grey ticks for 'delivered'
  if (status === 'delivered') {
    return (
      <svg viewBox="0 0 18 18" height="18" width="18" className="inline-block ml-1" style={{ fill: '#aebac1' }}>
        <path d="M17.394 5.035l-1.179-1.179-10.465 10.465-4.729-4.729-1.179 1.179 5.908 5.908 11.644-11.644z"></path>
        <path d="M12.5 5.035l-1.179-1.179-10.465 10.465-1.5-1.5 1.179-1.179 1.5 1.5 9.286-9.286z"></path>
      </svg>
    );
  }

  // Double blue ticks for 'read'
  if (status === 'read') {
    return (
      <svg viewBox="0 0 18 18" height="18" width="18" className="inline-block ml-1" style={{ fill: '#53bdeb' }}>
        <path d="M17.394 5.035l-1.179-1.179-10.465 10.465-4.729-4.729-1.179 1.179 5.908 5.908 11.644-11.644z"></path>
        <path d="M12.5 5.035l-1.179-1.179-10.465 10.465-1.5-1.5 1.179-1.179 1.5 1.5 9.286-9.286z"></path>
      </svg>
    );
  }

  // For 'failed' or any other status, we show nothing.
  return null;
}