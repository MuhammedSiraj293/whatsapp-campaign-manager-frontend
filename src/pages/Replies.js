// frontend/src/pages/Replies.js

import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import LeftMenu from '../components/LeftMenu';
import ChatDetail from '../components/ChatDetail';
import './style/Replies.css';
import LoadingScreen from "../components/LoadingScreen";

export default function Replies() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
   const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => {
      if (progress >= 100) setLoading(false);
      else {
        const increment = Math.floor(Math.random() * (10 + 1)) + 7;
        setProgress(progress + increment);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [progress]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/replies/conversations`);
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (phoneNumber) => {
    if (!phoneNumber) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/replies/conversations/${phoneNumber}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    fetchMessages(activeConversationId);
    const intervalId = setInterval(() => fetchMessages(activeConversationId), 5000);
    return () => clearInterval(intervalId);
  }, [activeConversationId]);

  // --- THIS FUNCTION IS CORRECTED ---
  const handleConversationSelect = async (phoneNumber) => {
    // 1. Set the active conversation to load its messages
    setActiveConversationId(phoneNumber);

    // 2. Find the selected conversation to check its unread count
    const selectedConvo = conversations.find(c => c._id === phoneNumber);
    
    // 3. Only mark as read if there are unread messages
    if (selectedConvo && selectedConvo.unreadCount > 0) {
      try {
        await fetch(`${API_URL}/api/replies/conversations/${phoneNumber}/read`, {
          method: 'PATCH',
        });
        // 4. Refresh the conversation list to update the unread counts
        await fetchConversations();
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };


  const handleSendReply = async (messageText) => {
    if (!messageText.trim() || !activeConversationId) return;
    try {
      await fetch(`${API_URL}/api/replies/conversations/${activeConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      await fetchMessages(activeConversationId);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleSendMedia = async (file) => {
    if (!file || !activeConversationId) return;
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch(`${API_URL}/api/replies/conversations/${activeConversationId}/media`, {
        method: 'POST',
        body: formData,
      });
      await fetchMessages(activeConversationId);
    } catch (error) {
      console.error('Error sending media:', error);
      alert('Failed to send media file.');
    }
  };

  return (
    <>
      {loading ? (
        <LoadingScreen progress={progress} />
      ) : (
    <div className="chat-container">
      <div className="conversations-list">
        <LeftMenu 
          conversations={conversations} 
          onSelectConversation={handleConversationSelect}
          activeConversationId={activeConversationId}
        />
      </div>

      <div className="message-view">
        {activeConversationId ? (
          <ChatDetail 
            key={activeConversationId}
            activeConversationId={activeConversationId}
            messages={messages}
            onSendMessage={handleSendReply}
            onSendMedia={handleSendMedia}
          />
        ) : (
          <div className="placeholder">Select a conversation to start chatting.</div>
        )}
      </div>
    </div>
      )}</>
  );
}