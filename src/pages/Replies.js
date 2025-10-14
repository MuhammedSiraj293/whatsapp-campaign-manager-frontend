// frontend/src/pages/Replies.js

import React, { useState, useEffect, useRef } from 'react';
import { authFetch, uploadFile } from '../services/api';
import socket from '../services/socket';
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
    useEffect(() => {
    fetchConversations();

    const handleNewMessage = (data) => {
      fetchConversations();
      if (data.from === activeConversationIdRef.current) {
        setMessages(prevMessages => [...prevMessages, data.message]);
      }
    };

    // --- NEW LISTENER for status updates ---
    const handleStatusUpdate = (data) => {
        if (data.from === activeConversationIdRef.current) {
            setMessages(prevMessages => prevMessages.map(msg => 
                msg._id === data.wamid ? { ...msg, status: data.status } : msg
            ));
        }
    };
    
    socket.on('newMessage', handleNewMessage);
    socket.on('messageStatusUpdate', handleStatusUpdate); // <-- LISTEN for new event

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageStatusUpdate', handleStatusUpdate); // <-- CLEAN UP new listener
    };
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const handleConversationSelect = async (phoneNumber) => {
    setActiveConversationId(phoneNumber);
    const selectedConvo = conversations.find(c => c._id === phoneNumber);
    if (selectedConvo && selectedConvo.unreadCount > 0) {
      try {
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
      await authFetch(`/replies/conversations/${activeConversationId}`, {
        method: 'POST',
        body: JSON.stringify({ message: messageText }),
      });
      // The socket event from the backend will update the UI
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleSendMedia = async (file) => {
    if (!file || !activeConversationId) return;
    try {
      await uploadFile(`/replies/conversations/${activeConversationId}/media`, file);
      // The socket event from the backend will update the UI
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