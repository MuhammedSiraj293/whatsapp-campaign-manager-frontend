import React from "react";
import {
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const TemplatePreview = ({
  template,
  headerType,
  headerText,
  headerMediaUrl,
  bodyText,
  footerText,
  buttons,
  language,
}) => {
  // Logic to handle both passed template object OR individual props (for form preview)
  const isStatic = !!template;

  let pHeaderType = headerType;
  let pHeaderText = headerText;
  let pHeaderMediaUrl = headerMediaUrl;
  let pBodyText = bodyText;
  let pFooterText = footerText;
  let pButtons = buttons || [];

  if (isStatic && template) {
    pHeaderType = "NONE";
    pHeaderText = "";
    pHeaderMediaUrl = null;
    pBodyText = "";
    pFooterText = "";
    pButtons = [];

    template.components.forEach((c) => {
      if (c.type === "HEADER") {
        pHeaderType = c.format;
        if (c.format === "TEXT") pHeaderText = c.text;
      }
      if (c.type === "BODY") pBodyText = c.text;
      if (c.type === "FOOTER") pFooterText = c.text;
      if (c.type === "BUTTONS") {
        pButtons = c.buttons;
      }
    });
  }

  // Helper to format WhatsApp text
  const formatMessage = (text) => {
    if (!text) return "";

    // Split by newlines first
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      let parts = [line];

      // Bold: *text*
      parts = parts.flatMap((part) => {
        if (typeof part !== "string") return part;
        return part.split(/(\*[^*]+\*)/g).map((sub, i) => {
          if (sub.startsWith("*") && sub.endsWith("*") && sub.length > 2) {
            return <strong key={i}>{sub.slice(1, -1)}</strong>;
          }
          return sub;
        });
      });

      // Italics: _text_
      parts = parts.flatMap((part) => {
        if (typeof part !== "string") return part;
        return part.split(/(_[^_]+_)/g).map((sub, i) => {
          if (sub.startsWith("_") && sub.endsWith("_") && sub.length > 2) {
            return <em key={i}>{sub.slice(1, -1)}</em>;
          }
          return sub;
        });
      });

      // Strikethrough: ~text~
      parts = parts.flatMap((part) => {
        if (typeof part !== "string") return part;
        return part.split(/(~[^~]+~)/g).map((sub, i) => {
          if (sub.startsWith("~") && sub.endsWith("~") && sub.length > 2) {
            return <del key={i}>{sub.slice(1, -1)}</del>;
          }
          return sub;
        });
      });

      // Monospace: ```text```
      parts = parts.flatMap((part) => {
        if (typeof part !== "string") return part;
        return part.split(/(```[^`]+```)/g).map((sub, i) => {
          if (sub.startsWith("```") && sub.endsWith("```") && sub.length > 6) {
            return (
              <code
                key={i}
                className="bg-gray-100 px-1 rounded font-mono text-xs"
              >
                {sub.slice(3, -3)}
              </code>
            );
          }
          return sub;
        });
      });

      return (
        <div key={lineIdx} className="min-h-[1.2em]">
          {parts}
        </div>
      );
    });
  };

  return (
    <div className="bg-[#E5DDD5] p-4 rounded-lg shadow-inner h-[600px] w-full max-w-sm mx-auto overflow-y-auto relative border-4 border-gray-800 rounded-3xl">
      <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 rounded-t-2xl z-10 flex justify-center">
        <div className="w-16 h-3 bg-gray-900 rounded-b-lg"></div>
      </div>
      <div className="mt-8 flex flex-col gap-2">
        <div className="bg-white rounded-lg p-2 shadow-sm max-w-[85%] self-start relative">
          {/* Header Media */}
          {pHeaderType === "IMAGE" && (
            <div className="rounded-t-lg bg-gray-200 h-32 flex items-center justify-center overflow-hidden mb-2">
              {pHeaderMediaUrl ? (
                <img
                  src={pHeaderMediaUrl}
                  alt="Header"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                  <PhotoIcon className="w-4 h-4" /> Image Header
                </span>
              )}
            </div>
          )}
          {pHeaderType === "VIDEO" && (
            <div className="rounded-t-lg bg-gray-200 h-32 flex items-center justify-center overflow-hidden mb-2">
              {pHeaderMediaUrl ? (
                <video
                  src={pHeaderMediaUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <span className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                  <VideoCameraIcon className="w-4 h-4" /> Video Header
                </span>
              )}
            </div>
          )}
          {pHeaderType === "DOCUMENT" && (
            <div className="bg-gray-100 p-3 rounded mb-2 flex items-center gap-3 border border-gray-200">
              <DocumentTextIcon className="w-8 h-8 text-gray-400" />
              <div className="text-xs text-gray-600 font-medium">
                {pHeaderMediaUrl ? "Document.pdf" : "Document Header"}
              </div>
            </div>
          )}
          {pHeaderType === "LOCATION" && (
            <div className="bg-gray-200 h-32 rounded-md mb-2 flex items-center justify-center text-gray-500 text-xs flex-col gap-1">
              <span>📍 Location Header</span>
            </div>
          )}

          {pHeaderType === "TEXT" && pHeaderText && (
            <div className="font-bold text-sm mb-1 text-gray-900">
              {pHeaderText}
            </div>
          )}
          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-snug">
            {pBodyText ? formatMessage(pBodyText) : "Enter body text..."}
          </div>
          {pFooterText && (
            <div className="text-xs text-gray-500 mt-1">{pFooterText}</div>
          )}
          <div className="text-[10px] text-gray-400 text-right mt-1">
            10:00 AM
          </div>
        </div>

        {/* Buttons */}
        {pButtons.map((btn, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg p-2.5 shadow-sm max-w-[90%] self-start w-full text-center text-[#00A5F4] font-medium text-sm cursor-pointer hover:bg-gray-50 mt-1 ml-1 flex items-center justify-center gap-2"
          >
            {btn.type === "URL" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
              </svg>
            )}
            {btn.type === "PHONE_NUMBER" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {btn.type === "QUICK_REPLY" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 0 0 1.28.53l3.58-3.579a.78.78 0 0 1 .527-.224 41.202 41.202 0 0 0 5.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0 0 10 2Zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {btn.text || "Button Text"}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatePreview;
