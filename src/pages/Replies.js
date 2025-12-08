// frontend/src/pages/Replies.js

import React, { useState, useEffect, useRef, useContext } from "react";
import { authFetch, uploadFile } from "../services/api";
import socket from "../services/socket";
import Chats from "../components/Chats";
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

  // --- PAGINATION STATE ---
  const [convoPage, setConvoPage] = useState(1);
  const [hasMoreConvos, setHasMoreConvos] = useState(true);
  const [loadingConvos, setLoadingConvos] = useState(false);

  const [msgPage, setMsgPage] = useState(1);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

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
      if (selectedPhoneId !== "") {
        setSelectedPhoneId(""); // Reset phone selection only if not empty
      }
    } else {
      setAvailablePhones([]);
    }
    // Clear all chat data when WABA changes
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    setConvoPage(1);
    setHasMoreConvos(true);
  }, [activeWaba, wabaAccounts]);

  // Fetch conversations for the selected business phone number
  const fetchConversations = async (recipientId, page = 1, search = "") => {
    if (!recipientId) return;
    setLoadingConvos(true);
    try {
      const limit = 20;
      // encodeURIComponent for safety
      const query = `/replies/conversations/${recipientId}?page=${page}&limit=${limit}&search=${encodeURIComponent(
        search
      )}`;
      const data = await authFetch(query);

      if (data.success) {
        if (page === 1) {
          setConversations(data.data);
        } else {
          setConversations((prev) => {
            // Filter out potential duplicates based on _id (customer phone)
            const newConvos = data.data.filter(
              (newC) => !prev.some((existing) => existing._id === newC._id)
            );
            return [...prev, ...newConvos];
          });
        }
        // If we got fewer than limit, there are no more to load
        setHasMoreConvos(data.data.length === limit);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoadingConvos(false);
    }
  };

  const handleLoadMoreConversations = () => {
    if (!hasMoreConvos || loadingConvos) return;
    const nextPage = convoPage + 1;
    setConvoPage(nextPage);
    fetchConversations(selectedPhoneId, nextPage);
  };

  // Fetch messages for the selected chat
  const fetchMessages = async (customerPhone, recipientId, page = 1) => {
    if (!customerPhone || !recipientId) return;
    setLoadingMsgs(true);
    try {
      const limit = 50;
      const data = await authFetch(
        `/replies/messages/${customerPhone}/${recipientId}?page=${page}&limit=${limit}`
      );
      if (data.success) {
        if (page === 1) {
          setMessages(data.data);
        } else {
          setMessages((prev) => {
            // Prepend new (older) messages
            // Filter duplicates just in case
            const newMsgs = data.data.filter(
              (newM) => !prev.some((existing) => existing._id === newM._id)
            );
            return [...newMsgs, ...prev];
          });
        }
        setHasMoreMsgs(data.data.length === limit);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleLoadMoreMessages = () => {
    if (!hasMoreMsgs || loadingMsgs) return;
    const nextPage = msgPage + 1;
    setMsgPage(nextPage);
    fetchMessages(activeConversationId, selectedPhoneId, nextPage);
  };

  // Setup Socket.IO listeners
  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log("🔌 Socket Event Received:", data);
      // Check if the message is for the currently selected business phone number
      if (data.recipientId === activeChatRef.current.businessPhone) {
        // INCOMING MESSAGE (from customer to business)
        console.log("Socket: Incoming message received", data);
        fetchConversations(activeChatRef.current.businessPhone);

        if (data.from === activeChatRef.current.customerPhone) {
          setMessages((prevMessages) => {
            // 1. Handle Reactions
            if (data.message.type === "reaction") {
              const targetMsgId = data.message.reaction.messageId;
              return prevMessages.map((msg) => {
                if (msg.messageId === targetMsgId || msg._id === targetMsgId) {
                  // Add reaction to the target message
                  const newReaction = {
                    emoji: data.message.reaction.emoji,
                    from: data.message.from,
                  };
                  return {
                    ...msg,
                    reactions: msg.reactions
                      ? [...msg.reactions, newReaction]
                      : [newReaction],
                  };
                }
                return msg;
              });
            }

            // 2. Handle Normal Messages (check for duplicates)
            if (prevMessages.some((m) => m._id === data.message._id)) {
              console.warn(
                "Socket: Duplicate incoming message ignored",
                data.message._id
              );
              return prevMessages;
            }

            // 3. Handle Replies (populate quotedMessage)
            let newMessage = { ...data.message };
            if (newMessage.context && newMessage.context.id) {
              const quotedMsg = prevMessages.find(
                (m) =>
                  m.messageId === newMessage.context.id ||
                  m._id === newMessage.context.id
              );
              if (quotedMsg) {
                newMessage.quotedMessage = quotedMsg;
              }
            }

            return [...prevMessages, newMessage];
          });
        }
      } else if (data.from === activeChatRef.current.businessPhone) {
        // OUTGOING MESSAGE (from business to customer)
        console.log("Socket: Outgoing message received", data);
        if (data.recipientId === activeChatRef.current.customerPhone) {
          setMessages((prevMessages) => {
            // 1. Handle Reactions (Outgoing)
            if (data.message.type === "reaction") {
              const targetMsgId = data.message.reaction.messageId;
              return prevMessages.map((msg) => {
                if (msg.messageId === targetMsgId || msg._id === targetMsgId) {
                  const newReaction = {
                    emoji: data.message.reaction.emoji,
                    from: data.message.from,
                  };
                  return {
                    ...msg,
                    reactions: msg.reactions
                      ? [...msg.reactions, newReaction]
                      : [newReaction],
                  };
                }
                return msg;
              });
            }

            // 2. Handle Normal Messages (check for duplicates)
            if (prevMessages.some((m) => m._id === data.message._id)) {
              console.warn(
                "Socket: Duplicate outgoing message ignored",
                data.message._id
              );
              return prevMessages;
            }

            // 3. Handle Replies (populate quotedMessage)
            let newMessage = { ...data.message };
            if (newMessage.context && newMessage.context.id) {
              const quotedMsg = prevMessages.find(
                (m) =>
                  m.messageId === newMessage.context.id ||
                  m._id === newMessage.context.id
              );
              if (quotedMsg) {
                newMessage.quotedMessage = quotedMsg;
              }
            }

            return [...prevMessages, newMessage];
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
      setConvoPage(1); // Reset page on phone switch
      fetchConversations(selectedPhoneId, 1);
    }
  }, [selectedPhoneId]);

  // Fetch messages when activeConversationId (customer phone) changes
  useEffect(() => {
    if (activeConversationId && selectedPhoneId) {
      setMsgPage(1); // Reset page on chat switch
      setHasMoreMsgs(true);
      fetchMessages(activeConversationId, selectedPhoneId, 1);
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
    }
  };

  // Handle deleting a conversation
  const handleDeleteConversation = async (customerPhone) => {
    if (!customerPhone || !selectedPhoneId) return;
    try {
      await authFetch(
        `/replies/conversations/${customerPhone}/${selectedPhoneId}`,
        {
          method: "DELETE",
        }
      );
      // Refresh conversations
      fetchConversations(selectedPhoneId);
      // If the deleted chat was active, clear selection
      if (activeConversationId === customerPhone) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleBackToList = () => {
    setActiveConversationId(null);
  };

  // Handle deleting a single message
  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return;

    try {
      await authFetch(`/replies/messages/${messageId}`, {
        method: "DELETE",
      });
      // Remove message from local state
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const inputStyle =
    "bg-[#2c3943] border border-gray-700 text-neutral-200 text-base md:text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";

  return (
    <>
      {loading ? (
        <LoadingScreen progress={100} />
      ) : (
        <div className="relative flex h-[100dvh] md:h-screen bg-[#111b21] md:bg-black md:rounded-lg rounded-none overflow-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#111b21] [&::-webkit-scrollbar-thumb]:bg-[#374045] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-[#111b21]">
          {/* --- LEFT SIDE: CHAT LIST --- */}
          <div
            className={`
              absolute top-0 left-0 w-full h-full z-10 
              transition-transform duration-300 ease-out 
              md:static md:w-[30%] md:translate-x-0 md:z-auto
              bg-[#111b21] border-r border-[#202d33] flex flex-col shrink-0
              ${activeConversationId ? "-translate-x-full" : "translate-x-0"}
            `}
          >
            {/* Header */}
            <div className="flex justify-between items-center bg-[#202d33] h-[60px] p-3 border-b border-neutral-700 shrink-0">
              <img
                src={pp}
                alt="profile_picture"
                className="rounded-full w-[40px]"
              />
            </div>

            {/* Account Selector */}
            <div className="p-3 bg-[#111b21] border-b border-neutral-700 shrink-0">
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

            {/* Conversation List */}
            <div className="flex-1 overflow-hidden relative">
              <Chats
                conversations={conversations}
                onSelectConversation={handleConversationSelect}
                activeConversationId={activeConversationId}
                onDeleteConversation={handleDeleteConversation}
                onLoadMore={handleLoadMoreConversations}
                hasMore={hasMoreConvos}
                loading={loadingConvos}
                onSearch={handleSearch}
              />
            </div>
          </div>

          {/* --- RIGHT SIDE: CHAT DETAIL --- */}
          <div
            className={`
              absolute top-0 left-0 w-full h-full z-20 
              transition-transform duration-300 ease-out 
              md:static md:flex-1 md:translate-x-0 md:z-auto
              bg-[#222e35] flex flex-col shrink-0
              ${activeConversationId ? "translate-x-0" : "translate-x-full"}
            `}
          >
            {activeConversationId ? (
              <ChatDetail
                key={activeConversationId} // Force remount
                messages={messages}
                activeConversationId={activeConversationId}
                contactName={
                  conversations.find((c) => c._id === activeConversationId)
                    ?.name
                }
                onSendMessage={handleSendReply}
                onSendMedia={handleSendMedia}
                onDeleteMessage={handleDeleteMessage}
                onReact={handleReact}
                onBack={handleBackToList}
                onLoadMore={handleLoadMoreMessages}
                hasMore={hasMoreMsgs}
                loading={loadingMsgs}
              />
            ) : (
              <div className="flex items-center justify-center h-full flex-col text-[#8796a1]">
                <div className="text-center">
                  <h2 className="text-3xl font-light mb-4">WhatsApp Web</h2>
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
