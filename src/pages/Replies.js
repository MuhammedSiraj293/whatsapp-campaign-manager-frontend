import React, { useState, useEffect, useRef } from "react";
import { authFetch, uploadFile } from "../services/api";
import socket from "../services/socket"; // Import the socket connection
import LeftMenu from "../components/LeftMenu";
import ChatDetail from "../components/ChatDetail";
import "./style/Replies.css";
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
      const data = await authFetch("/replies/conversations");
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
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
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // This useEffect now sets up the real-time listeners
  useEffect(() => {
    fetchConversations(); // Fetch initial list

    const handleNewMessage = (data) => {
      // Refresh the conversation list to show new last message and unread count
      fetchConversations();
      // If the new message belongs to the currently active chat, add it to the view
      if (data.from === activeConversationIdRef.current) {
        setMessages((prevMessages) => [...prevMessages, data.message]);
      }
    };

    socket.on("newMessage", handleNewMessage);

    // Clean up the listener when the component is unmounted
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, []); // Runs only once when the component mounts

  // This useEffect ONLY fetches messages when the active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]); // Clear messages if no conversation is selected
    }
  }, [activeConversationId]);

  const handleConversationSelect = async (phoneNumber) => {
    setActiveConversationId(phoneNumber);
    const selectedConvo = conversations.find((c) => c._id === phoneNumber);
    if (selectedConvo && selectedConvo.unreadCount > 0) {
      try {
        await authFetch(`/replies/conversations/${phoneNumber}/read`, {
          method: "PATCH",
        });
        await fetchConversations(); // Refresh list to show unread count as 0
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
  };

  const handleSendReply = async (messageText) => {
    if (!messageText.trim() || !activeConversationId) return;
    try {
      const data = await authFetch(
        `/replies/conversations/${activeConversationId}`,
        {
          method: "POST",
          body: JSON.stringify({ message: messageText }),
        }
      );
      // The socket event from the backend will update the UI, but we can add it manually for a faster feel
      if (data.success) {
        const sentMessage = {
          _id: data.data.messages[0].id,
          body: messageText,
          timestamp: new Date().toISOString(),
          direction: "outgoing",
        };
        setMessages((prevMessages) => [...prevMessages, sentMessage]);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  const handleSendMedia = async (file) => {
    if (!file || !activeConversationId) return;
    try {
      const data = await uploadFile(
        `/replies/conversations/${activeConversationId}/media`,
        file
      );
      if (data.success) {
        await fetchMessages(activeConversationId); // Refresh to get the saved media message
      }
    } catch (error) {
      console.error("Error sending media:", error);
      alert("Failed to send media file.");
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
              <div className="placeholder">
                Select a conversation to start chatting.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
