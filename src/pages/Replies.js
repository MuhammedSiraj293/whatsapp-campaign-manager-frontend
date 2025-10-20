// frontend/src/pages/Replies.js

import React, { useState, useEffect, useRef } from "react";
import { authFetch, uploadFile } from "../services/api";
import socket from "../services/socket";
import LeftMenu from "../components/LeftMenu";
import ChatDetail from "../components/ChatDetail";
import "./style/Replies.css";
import LoadingScreen from "../components/LoadingScreen";

export default function Replies() {
  const [wabaAccounts, setWabaAccounts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- NEW STATE FOR MULTI-ACCOUNT ---
  const [selectedWabaId, setSelectedWabaId] = useState("");
  const [selectedPhoneId, setSelectedPhoneId] = useState(""); // This is the 'recipientId'
  const [availablePhones, setAvailablePhones] = useState([]);

  const [activeConversationId, setActiveConversationId] = useState(null); // This is the customer's phone number

  // Ref to hold the most current state for the socket listener
  const activeChatRef = useRef({
    customerPhone: activeConversationId,
    businessPhone: selectedPhoneId,
  });

  // Keep the ref updated
  useEffect(() => {
    activeChatRef.current = {
      customerPhone: activeConversationId,
      businessPhone: selectedPhoneId,
    };
  }, [activeConversationId, selectedPhoneId]);

  useEffect(() => {
    // Fetch WABA accounts when component mounts
    const fetchAccounts = async () => {
      try {
        const data = await authFetch("/waba/accounts");
        if (data.success) {
          setWabaAccounts(data.data);
        }
      } catch (error) {
        console.error("Error fetching WABA accounts:", error);
      }
      setLoading(false); // Stop the main loading screen
    };
    fetchAccounts();
  }, []);

  // Update available phones when a WABA is selected
  useEffect(() => {
    if (selectedWabaId) {
      const account = wabaAccounts.find((acc) => acc._id === selectedWabaId);
      setAvailablePhones(account ? account.phoneNumbers : []);
      setSelectedPhoneId(""); // Reset phone selection
    } else {
      setAvailablePhones([]);
    }
    // Clear all chat data when WABA changes
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
  }, [selectedWabaId, wabaAccounts]);

  // Fetch conversations for the selected business phone number
  const fetchConversations = async (recipientId) => {
    if (!recipientId) return;
    try {
      const data = await authFetch(`/replies/conversations/${recipientId}`);
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // Fetch messages for the selected chat
  const fetchMessages = async (customerPhone, recipientId) => {
    if (!customerPhone || !recipientId) return;
    setIsLoading(true);
    try {
      const data = await authFetch(
        `/replies/messages/${customerPhone}/${recipientId}`
      );
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup Socket.IO listeners
  useEffect(() => {
    const handleNewMessage = (data) => {
      // Check if the message is for the currently selected business phone number
      if (data.recipientId === activeChatRef.current.businessPhone) {
        fetchConversations(activeChatRef.current.businessPhone);
        // If it's for the active chat, add it to the window
        if (data.from === activeChatRef.current.customerPhone) {
          setMessages((prevMessages) => [...prevMessages, data.message]);
        }
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, []); // Runs only once

  // Fetch conversations when selectedPhoneId (business phone) changes
  useEffect(() => {
    if (selectedPhoneId) {
      fetchConversations(selectedPhoneId);
    }
  }, [selectedPhoneId]);

  // Fetch messages when activeConversationId (customer phone) changes
  useEffect(() => {
    if (activeConversationId && selectedPhoneId) {
      fetchMessages(activeConversationId, selectedPhoneId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, selectedPhoneId]);

  // Handle selecting a conversation
  const handleConversationSelect = async (customerPhone) => {
    setActiveConversationId(customerPhone);
    const selectedConvo = conversations.find((c) => c._id === customerPhone);
    if (selectedConvo && selectedConvo.unreadCount > 0) {
      try {
        await authFetch(`/replies/read/${customerPhone}/${selectedPhoneId}`, {
          method: "PATCH",
        });
        await fetchConversations(selectedPhoneId); // Refresh list
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
  };

  // Send replies from the correct phone number
  const handleSendReply = async (messageText) => {
    if (!messageText.trim() || !activeConversationId || !selectedPhoneId)
      return;
    try {
      await authFetch(
        `/replies/send/${activeConversationId}/${selectedPhoneId}`,
        {
          method: "POST",
          body: JSON.stringify({ message: messageText }),
        }
      );
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  // Send media from the correct phone number
  const handleSendMedia = async (file) => {
    if (!file || !activeConversationId || !selectedPhoneId) return;
    try {
      await uploadFile(
        `/replies/send-media/${activeConversationId}/${selectedPhoneId}`,
        file
      );
    } catch (error) {
      console.error("Error sending media:", error);
      alert("Failed to send media file.");
    }
  };

  const inputStyle =
    "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";

  return (
    <>
      {loading ? (
        <LoadingScreen progress={100} />
      ) : (
        <div className="chat-container">
          <div className="conversations-list">
            {/* --- NEW ACCOUNT SELECTORS --- */}
            <div className="p-3 bg-[#111b21] border-b border-neutral-700">
              <select
                value={selectedWabaId}
                onChange={(e) => setSelectedWabaId(e.target.value)}
                className={inputStyle}
              >
                <option value="">-- Select an Account --</option>
                {wabaAccounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountName}
                  </option>
                ))}
              </select>
              {availablePhones.length > 0 && (
                <select
                  value={selectedPhoneId}
                  onChange={(e) => setSelectedPhoneId(e.target.value)}
                  className={`${inputStyle} mt-2`}
                >
                  <option value="">-- Select a Phone Number --</option>
                  {availablePhones.map((phone) => (
                    <option key={phone._id} value={phone.phoneNumberId}>
                      {phone.phoneNumberName} ({phone.phoneNumberId})
                    </option>
                  ))}
                </select>
              )}
            </div>

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
                Select a WABA account, a phone number, and then a conversation
                to start chatting.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
