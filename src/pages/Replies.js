// frontend/src/pages/Replies.js

import React, { useState, useEffect } from 'react';
import { authFetch, uploadFile } from '../services/api'; // <-- IMPORT authFetch and uploadFile
import LeftMenu from '../components/LeftMenu';
import ChatDetail from '../components/ChatDetail';
import './style/Replies.css'; // Assuming you have this CSS file
import LoadingScreen from "../components/LoadingScreen";


export default function Replies() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  // This loading screen effect is fine, no changes needed.
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

  // Use authFetch to get conversations
  const fetchConversations = async () => {
    try {
      const data = await authFetch('/replies/conversations');
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Use authFetch to get messages
  const fetchMessages = async (phoneNumber) => {
    if (!phoneNumber) return;
    setIsLoading(true);
    try {
      const data = await authFetch(`/replies/conversations/${phoneNumber}`);
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
    const conversationInterval = setInterval(fetchConversations, 10000); // Poll for new conversations
    return () => clearInterval(conversationInterval);
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    fetchMessages(activeConversationId);
    const messageInterval = setInterval(() => fetchMessages(activeConversationId), 5000); // Poll for new messages
    return () => clearInterval(messageInterval);
  }, [activeConversationId]);

  const handleConversationSelect = async (phoneNumber) => {
    setActiveConversationId(phoneNumber);
    const selectedConvo = conversations.find(c => c._id === phoneNumber);
    if (selectedConvo && selectedConvo.unreadCount > 0) {
      try {
        // Use authFetch to mark as read
        await authFetch(`/replies/conversations/${phoneNumber}/read`, { method: 'PATCH' });
        await fetchConversations();
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const handleSendReply = async (messageText) => {
    if (!messageText.trim() || !activeConversationId) return;
    try {
      // Use authFetch to send a reply
      await authFetch(`/replies/conversations/${activeConversationId}`, {
        method: 'POST',
        body: JSON.stringify({ message: messageText }),
      });
      await fetchMessages(activeConversationId);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleSendMedia = async (file) => {
    if (!file || !activeConversationId) return;
    try {
      // Use the dedicated uploadFile service for media
      await uploadFile(`/replies/conversations/${activeConversationId}/media`, file);
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
      )}
    </>
  );
}