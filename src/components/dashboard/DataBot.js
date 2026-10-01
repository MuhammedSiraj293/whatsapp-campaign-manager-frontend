import React, { useState, useRef, useEffect } from "react";
import { authFetch } from "../../services/api";

const DataBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hi! I'm your local data assistant. I can answer questions about templates, contact list failures, and enquiry volume." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textOverride) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { type: "user", text: textToSend }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await authFetch("/bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (response && response.success) {
        setMessages((prev) => [...prev, { type: "bot", text: response.reply }]);
      } else {
        setMessages((prev) => [...prev, { type: "bot", text: "Sorry, I encountered an error." }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { type: "bot", text: "Connection error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    "Which template got the most leads?",
    "Which contact list has the most failures?",
    "How many enquiries recently?"
  ];

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-slate-800 text-white p-4 rounded-full shadow-xl hover:bg-slate-700 transition z-50 focus:outline-none"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50 font-sans" style={{ height: "500px" }}>
          {/* Header */}
          <div className="bg-slate-800 text-white p-4">
            <h3 className="font-semibold text-lg">Data Assistant</h3>
        
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-3 flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${msg.type === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-100"}`}>
                  {msg.text.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-3">
                 <div className="p-3 bg-white text-gray-800 rounded-2xl rounded-bl-none shadow-sm text-sm border border-gray-100 flex space-x-1">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length < 3 && (
            <div className="px-3 pb-2 flex overflow-x-auto gap-2 bg-slate-50 hide-scrollbar">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="whitespace-nowrap text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me about your data..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleSend()}
              className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DataBot;
