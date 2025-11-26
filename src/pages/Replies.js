// frontend/src/pages/Replies.js

import React, { useState, useEffect, useRef, useContext } from "react";
import { authFetch, uploadFile } from "../services/api";
import socket from "../services/socket";
import Chats from "../components/Chats";
import LeftMenu from "../components/LeftMenu";
import ChatDetail from "../components/ChatDetail";
// import "./style/Replies.css"; // REMOVED
import LoadingScreen from "../components/LoadingScreen";
import { pp } from "../assets/whatsapp"; // <-- Import profile picture
import { useWaba } from "../context/WabaContext"; // <-- 1. IMPORT THE WABA CONTEXT
import { AuthContext } from "../context/AuthContext"; // To check user role

export default function Replies() {
  const [wabaAccounts, setWabaAccounts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const { activeWaba } = useWaba(); // <-- 2. GET THE GLOBALLY ACTIVE WABA
  const { user } = useContext(AuthContext); // Get user for role check

  // --- NEW STATE FOR MULTI-ACCOUNT ---
  const [selectedPhoneId, setSelectedPhoneId] = useState(""); // This is the 'recipientId'
  const [availablePhones, setAvailablePhones] = useState([]);

  const [activeConversationId, setActiveConversationId] = useState(null); // Customer's phone number

  const activeChatRef = useRef({
    customerPhone: activeConversationId,
    businessPhone: selectedPhoneId,
  });

  useEffect(() => {
    activeChatRef.current = {
      customerPhone: activeConversationId,
      businessPhone: selectedPhoneId,
    };
  }, [activeConversationId, selectedPhoneId]);

  // Fetch WABA accounts when component mounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await authFetch("/waba/accounts");
        if (data.success) {
          setWabaAccounts(data.data);
        }
      } catch (error) {
        console.error("Error fetching WABA accounts:", error);
      }
      setLoading(false);
    };
    if (user) {
      // Only fetch if user is logged in
      fetchAccounts();
    }
  }, [user]);

  // --- 3. UPGRADED: Automatically filter phones based on global WABA ---
  useEffect(() => {
    if (activeWaba && wabaAccounts.length > 0) {
      const account = wabaAccounts.find((acc) => acc._id === activeWaba);
      setAvailablePhones(account ? account.phoneNumbers : []);
      setSelectedPhoneId(""); // Reset phone selection
    } else {
      setAvailablePhones([]);
    }
    // Clear all chat data when WABA changes
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
  }, [activeWaba, wabaAccounts]);

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
    // setIsLoading(true);
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
      // setIsLoading(false);
    }
  };

  // Setup Socket.IO listeners
  useEffect(() => {
    const handleNewMessage = (data) => {
      // Check if the message is for the currently selected business phone number
      if (data.recipientId === activeChatRef.current.businessPhone) {
        // INCOMING MESSAGE (from customer to business)
        console.log("Socket: Incoming message received", data);
        fetchConversations(activeChatRef.current.businessPhone);
        if (data.from === activeChatRef.current.customerPhone) {
          setMessages((prevMessages) => {
            // Prevent duplicates
            if (prevMessages.some((m) => m._id === data.message._id)) {
              console.warn(
                "Socket: Duplicate incoming message ignored",
                data.message._id
              );
              return prevMessages;
            }
            return [...prevMessages, data.message];
          });
        }
      } else if (data.from === activeChatRef.current.businessPhone) {
        // OUTGOING MESSAGE (from business to customer)
        console.log("Socket: Outgoing message received", data);
        if (data.recipientId === activeChatRef.current.customerPhone) {
          setMessages((prevMessages) => {
            // Prevent duplicates
            if (prevMessages.some((m) => m._id === data.message._id)) {
              console.warn(
                "Socket: Duplicate outgoing message ignored",
                data.message._id
              );
              return prevMessages;
            }
            return [...prevMessages, data.message];
          });
        }
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, []);

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
  const handleSendReply = async (messageText, context) => {
    if (!messageText.trim() || !activeConversationId || !selectedPhoneId)
      return;
    try {
      await authFetch(
        `/replies/send/${activeConversationId}/${selectedPhoneId}`,
        {
          method: "POST",
          body: JSON.stringify({ message: messageText, context }),
        }
      );
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  // Handle sending reactions
  const handleReact = async (msg, emoji) => {
    if (!activeConversationId || !selectedPhoneId) return;
    try {
      await authFetch(
        `/replies/react/${activeConversationId}/${selectedPhoneId}`,
        {
          method: "POST",
          body: JSON.stringify({ messageId: msg.messageId, emoji }),
        }
      );
    } catch (error) {
      console.error("Error sending reaction:", error);
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
        <div className="flex h-screen bg-black rounded-lg overflow-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#111b21] [&::-webkit-scrollbar-thumb]:bg-[#374045] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-[#111b21]">
          <div className="flex-none w-[30%] border-r border-black overflow-y-auto flex flex-col">
            {/* --- RESTORED HEADER --- */}
            <div className="flex justify-between items-center bg-[#202d33] h-[60px] p-3 border-b border-neutral-700">
              <img
                src={pp}
                alt="profile_picture"
                className="rounded-full w-[40px]"
              />
            </div>

            {/* --- NEW ACCOUNT SELECTORS --- */}
            <div className="p-3 bg-[#111b21] border-b border-neutral-700">
              <label className="block mb-2 text-sm font-medium text-gray-400">
                Business Phone
              </label>
              <select
                value={selectedPhoneId}
                onChange={(e) => setSelectedPhoneId(e.target.value)}
                className={inputStyle}
              >
                <option value="" disabled>
                  Select Phone Number
                </option>
                {availablePhones.map((phone) => (
                  <option key={phone._id} value={phone.phoneNumberId}>
                    {phone.phoneNumberName} ({phone.phoneNumberId})
                  </option>
                ))}
              </select>
            </div>

            {/* --- CONVERSATION LIST --- */}
            <div className="flex-1 overflow-hidden">
              <Chats
                conversations={conversations}
                onSelectConversation={handleConversationSelect}
                activeConversationId={activeConversationId}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-[#0a131a]">
            {activeConversationId ? (
              <ChatDetail
                activeConversationId={activeConversationId}
                messages={messages}
                onSendMessage={handleSendReply}
                onSendMedia={handleSendMedia}
                onReact={handleReact}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#8796a1]">
                <div className="text-center">
                  <h2 className="text-2xl font-light mb-4">
                    WhatsApp Web Clone
                  </h2>
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
