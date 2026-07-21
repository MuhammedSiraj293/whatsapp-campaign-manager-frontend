// frontend/src/context/AlertContext.js

import React, { createContext, useState, useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

export const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Function to add a toast manually
  const showAlert = (message, type = null) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Auto-detect type based on keywords if not specified
    let detectedType = type || "info";
    if (!type) {
      const msgLower = message.toLowerCase();
      if (
        msgLower.includes("fail") ||
        msgLower.includes("error") ||
        msgLower.includes("not found") ||
        msgLower.includes("cannot") ||
        msgLower.includes("invalid") ||
        msgLower.includes("forbidden") ||
        msgLower.includes("unauthorized") ||
        msgLower.includes("not authorized") ||
        msgLower.includes("incorrect")
      ) {
        detectedType = "error";
      } else if (
        msgLower.includes("success") ||
        msgLower.includes("successfully") ||
        msgLower.includes("created") ||
        msgLower.includes("updated") ||
        msgLower.includes("saved") ||
        msgLower.includes("sent") ||
        msgLower.includes("deleted") ||
        msgLower.includes("restored")
      ) {
        detectedType = "success";
      }
    }

    const newToast = { id, message, type: detectedType };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after 4.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Override window.alert globally on mount
  useEffect(() => {
    window.alert = (message) => {
      if (message) {
        showAlert(message);
      }
    };
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => {
          let bgColor = "bg-[#202d33]";
          let borderCol = "border-sky-500/50";
          let icon = <FaInfoCircle className="text-sky-400 size-5 shrink-0" />;

          if (toast.type === "success") {
            borderCol = "border-[#00a884]/60";
            icon = <FaCheckCircle className="text-[#00a884] size-5 shrink-0" />;
          } else if (toast.type === "error") {
            borderCol = "border-red-500/60";
            icon = <FaExclamationCircle className="text-red-400 size-5 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-2xl border ${bgColor} ${borderCol} transition-all duration-300 transform translate-x-0`}
              style={{
                animation: "toast-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              {icon}
              <div className="flex-1 text-sm font-medium text-neutral-200 pr-1 break-words leading-tight">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-white transition-colors shrink-0 mt-0.5"
              >
                <FaTimes className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Global CSS for toast animations */}
      <style>{`
        @keyframes toast-slide-in {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </AlertContext.Provider>
  );
}
