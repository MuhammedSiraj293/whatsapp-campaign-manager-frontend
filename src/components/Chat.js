// frontend/src/components/Chat.js

import React from "react";
import Avatar from "./Avatar";

function Chat({
  name,
  contact,
  msg,
  time,
  dateLabel,
  unreadMsgs,
  active,
  onClick,
}) {
  return (
    <div
      className={`flex items-center cursor-pointer w-full h-[75px] px-3 hover:bg-[#202d33] ${
        active ? "bg-[#2a3942]" : ""
      }`}
      onClick={onClick}
    >
      <Avatar name={name} contactId={contact} />

      <div className="flex justify-between border-t border-neutral-700 w-full h-full py-3">
        <div className="flex flex-col justify-between text-white">
          <h1 className="font-medium mb-1 text-base">{name || contact}</h1>
          <p
            className={`text-sm overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] ${
              !unreadMsgs ? "text-neutral-400" : ""
            }`}
          >
            {msg}
          </p>
        </div>

        <div className="flex flex-col justify-between items-end h-full text-xs">
          <div className="flex flex-col items-end">
            <p className="text-emerald-500 min-w-[55px] text-right">{time}</p>
            {dateLabel && (
              <p className="text-[#8796a1] text-[10px] mt-0.5">{dateLabel}</p>
            )}
          </div>

          {/* This logic now uses the real unreadMsgs count */}
          {unreadMsgs > 0 && (
            <div className="flex justify-center items-center bg-emerald-500 rounded-full w-[20px] h-[20px]">
              <p className="text-emerald-900 font-bold">{unreadMsgs}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
