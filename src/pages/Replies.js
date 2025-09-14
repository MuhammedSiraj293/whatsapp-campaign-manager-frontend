// frontend/src/pages/Replies.js

import React, { useState, useEffect, useRef } from 'react';
import { authFetch, uploadFile } from '../services/api';
import socket from '../services/socket'; // <-- 1. IMPORT THE SOCKET CONNECTION
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
  
  // Use a ref to access the latest activeConversationId inside the socket listener
  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

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
      const data = await authFetch('/replies/conversations');
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

  // This useEffect now sets up the real-time listeners
  useEffect(() => {
    fetchConversations(); // Fetch initial list of conversations

    // --- 2. LISTEN FOR NEW MESSAGES ---
    const handleNewMessage = (data) => {
      // Refresh the conversation list to show new last message and unread count
      fetchConversations();
      // If the new message belongs to the currently active chat, add it to the view
      if (data.from === activeConversationIdRef.current) {
        setMessages(prevMessages => [...prevMessages, data.message]);
      }
    };
    
    socket.on('newMessage', handleNewMessage);

    // --- 3. CLEAN UP THE LISTENER ---
    // This is important to prevent memory leaks
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, []); // This runs only once when the component mounts

  // This useEffect now ONLY fetches messages when the active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]); // Clear messages if no conversation is selected
    }
  }, [activeConversationId]);

  const handleConversationSelect = async (phoneNumber) => {
    setActiveConversationId(phoneNumber);
    const selectedConvo = conversations.find(c => c._id === phoneNumber);
    if (selectedConvo && selectedConvo.unreadCount > 0) {
      try {
        await authFetch(`/replies/conversations/${phoneNumber}/read`, { method: 'PATCH' });
        await fetchConversations(); // Refresh list to show unread count as 0
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const handleSendReply = async (messageText) => {
    if (!messageText.trim() || !activeConversationId) return;
    try {
      const data = await authFetch(`/replies/conversations/${activeConversationId}`, {
        method: 'POST',
        body: JSON.stringify({ message: messageText }),
      });
      // Add the sent message to the UI instantly
      if (data.success) {
          const newMessage = {
              _id: data.data.messages[0].id,
              body: messageText,
              timestamp: new Date().toISOString(),
              direction: 'outgoing',
          };
          setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleSendMedia = async (file) => {
    if (!file || !activeConversationId) return;
    try {
      const data = await uploadFile(`/replies/conversations/${activeConversationId}/media`, file);
      if (data.success) {
        await fetchMessages(activeConversationId); // Refresh to get the saved media message
      }
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