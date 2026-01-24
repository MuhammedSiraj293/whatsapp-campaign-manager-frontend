import React, { useState, useEffect } from "react";
import {
  InformationCircleIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import TemplatePreview from "./TemplatePreview";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:10000";

const TemplateForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading,
  error,
  wabaId,
  authToken,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [language, setLanguage] = useState(initialData?.language || "en_US");
  const [category, setCategory] = useState(
    initialData?.category || "MARKETING",
  );

  // Header State
  const [headerType, setHeaderType] = useState("NONE"); // NONE, TEXT, IMAGE, VIDEO, DOCUMENT, LOCATION
  const [headerText, setHeaderText] = useState("");
  const [headerMediaUrl, setHeaderMediaUrl] = useState(null); // URL for preview
  const [headerFile, setHeaderFile] = useState(null); // Actual file object

  // Body State
  const [bodyText, setBodyText] = useState(initialData?.bodyText || "");
  const [variables, setVariables] = useState([]); // Array of detected variables { key: "{{1}}", type: "text", sample: "" }

  // Footer State
  const [footerText, setFooterText] = useState(initialData?.footerText || "");

  // Buttons State
  const [buttons, setButtons] = useState(initialData?.buttons || []);

  // Initialize from existing template content if editing
  useEffect(() => {
    if (initialData && initialData.components) {
      initialData.components.forEach((c) => {
        if (c.type === "HEADER") {
          setHeaderType(c.format);
          if (c.format === "TEXT") setHeaderText(c.text);
        }
        if (c.type === "BODY") setBodyText(c.text);
        if (c.type === "FOOTER") setFooterText(c.text);
        if (c.type === "BUTTONS") {
          const btns = c.buttons.map((b) => ({
            type: b.type,
            text: b.text,
            url: b.url || "",
            phoneNumber: b.phone_number || "",
          }));
          setButtons(btns);
        }
      });
      setName(initialData.name);
      setCategory(initialData.category);
      setLanguage(initialData.language);
    }
  }, [initialData]);

  // Detect Variables in Body
  useEffect(() => {
    const matches = bodyText.match(/{{\d+}}/g);
    if (matches) {
      // Unique matches
      const unique = [...new Set(matches)];
      // Preserve existing config if possible
      setVariables((prev) => {
        return unique.map((m) => {
          const existing = prev.find((p) => p.key === m);
          return existing || { key: m, type: "TEXT", sample: "" };
        });
      });
    } else {
      setVariables([]);
    }
  }, [bodyText]);

  const handleAddButton = (type) => {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { type, text: "", url: "", phoneNumber: "" }]);
  };

  const handleRemoveButton = (index) => {
    const newButtons = [...buttons];
    newButtons.splice(index, 1);
    setButtons(newButtons);
  };

  const handleButtonChange = (index, field, value) => {
    const newButtons = [...buttons];
    newButtons[index][field] = value;
    setButtons(newButtons);
  };

  const handleVariableChange = (key, field, value) => {
    setVariables((prev) =>
      prev.map((v) => (v.key === key ? { ...v, [field]: value } : v)),
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeaderFile(file);
      // Create a fake local URL for preview
      const url = URL.createObjectURL(file);
      setHeaderMediaUrl(url);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Construct components array
    const components = [];

    // Header
    if (headerType !== "NONE") {
      const headerComp = { type: "HEADER", format: headerType };
      if (headerType === "TEXT") headerComp.text = headerText;

      // MEDIA HEADER UPLOAD LOGIC
      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType)) {
        if (headerFile) {
          try {
            // Determine handle key based on type
            let handleKey = "image_handle"; // default
            if (headerType === "VIDEO") handleKey = "video_handle";
            if (headerType === "DOCUMENT") handleKey = "document_handle";

            // Upload to Backend -> Meta
            const formData = new FormData();
            formData.append("file", headerFile);
            formData.append("wabaId", wabaId);

            // We can set a local loading state here if desired,
            // but for now relying on form submission flow
            console.log("Uploading media header...");

            const uploadRes = await axios.post(
              `${API_URL}/api/media/upload-template-media`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "multipart/form-data",
                },
              },
            );

            if (uploadRes.data && uploadRes.data.handle) {
              const handle = uploadRes.data.handle;
              console.log("Media handle received:", handle);

              // Add example payload with handle
              headerComp.example = {
                [handleKey]: [handle],
              };
            }
          } catch (err) {
            console.error("Media upload failed:", err);
            // Optionally show error to user, but let's proceed to try submitting (will fail at Meta but consistent)
            // Or maybe we should alert the user?
            alert("Failed to upload media header. Please try again.");
            return;
          }
        } else if (initialData) {
          // If editing and no new file selected, we might assume existing media...
          // BUT Meta requires handle for creation. For editing, it might differ.
          // If editing, we often don't re-upload unless changed.
        } else {
          // Creating new with no file?
          // If local file not selected, maybe we have a URL?
          // But for creation `example` is required.
        }
      }

      components.push(headerComp);
    }

    // Body
    const bodyComp = { type: "BODY", text: bodyText };
    // Add variable examples if any
    if (variables.length > 0) {
      bodyComp.example = { body_text: [variables.map((v) => v.sample)] };
    }
    components.push(bodyComp);

    // Footer
    if (footerText) {
      components.push({ type: "FOOTER", text: footerText });
    }

    // Buttons
    if (buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: buttons.map((btn) => {
          if (btn.type === "QUICK_REPLY")
            return { type: "QUICK_REPLY", text: btn.text };
          if (btn.type === "URL")
            return { type: "URL", text: btn.text, url: btn.url };
          if (btn.type === "PHONE_NUMBER")
            return {
              type: "PHONE_NUMBER",
              text: btn.text,
              phone_number: btn.phoneNumber,
            };
          return null;
        }),
      });
    }

    const payload = {
      name,
      category,
      language,
      components,
    };

    onSubmit(payload);
  };

  return (
    <div className="flex flex-col h-full bg-[#F0F2F5]">
      {/* Top Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-300 flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-gray-800">
            {initialData ? name : "New Template"}
          </div>
          <div className="text-xs text-gray-500">
            {category} • {language}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onCancel}
          >
            Exit
          </button>
          <button
            type="button"
            className={`btn btn-sm bg-[#0C8CE9] hover:bg-[#0A7AC9] text-white border-none px-6 ${
              loading ? "loading" : ""
            }`}
            onClick={handleFormSubmit}
          >
            Submit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="w-full max-w-6xl flex gap-8 items-start">
          {/* LEFT COLUMN - FORM */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* 1. Name & Language */}
            <div className="bg-white p-5 rounded border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-4">
                Template name and language
              </h3>
              <div className="flex gap-4">
                <div className="flex-1 form-control">
                  <label className="label text-xs font-semibold text-gray-600 uppercase">
                    Name your template
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="input input-bordered w-full text-sm h-10 bg-gray-50"
                      placeholder="template_name"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value.toLowerCase().replace(/\s/g, "_"),
                        )
                      }
                      disabled={!!initialData}
                    />
                    <span className="absolute right-3 top-3 text-xs text-gray-400">
                      {name.length}/512
                    </span>
                  </div>
                </div>
                <div className="w-1/3 form-control">
                  <label className="label text-xs font-semibold text-gray-600 uppercase">
                    Select language
                  </label>
                  <select
                    className="select select-bordered w-full text-sm h-10 bg-gray-50"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={!!initialData}
                  >
                    <option value="en_US">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Content */}
            <div className="bg-white p-5 rounded border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-1">Content</h3>
              <p className="text-xs text-gray-500 mb-6">
                Add a header, body and footer for your template. Cloud API
                hosted by Meta will review the template variables and content to
                protect the security and integrity of our services.{" "}
                <button className="text-blue-500 hover:underline bg-transparent border-none p-0 cursor-pointer">
                  Learn More
                </button>
              </p>

              {/* HEADERS */}
              <div className="form-control mb-6">
                <label className="label text-xs font-semibold text-gray-600 uppercase">
                  Header{" "}
                  <span className="font-normal text-gray-400 normal-case ml-1">
                    • Optional
                  </span>
                </label>
                <select
                  className="select select-bordered w-full max-w-xs text-sm h-10 mb-3"
                  value={headerType}
                  onChange={(e) => setHeaderType(e.target.value)}
                >
                  <option value="NONE">None</option>
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="LOCATION">Location</option>
                </select>

                {headerType === "TEXT" && (
                  <div className="relative">
                    <input
                      type="text"
                      className="input input-bordered w-full text-sm h-10"
                      placeholder="Enter header text..."
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      maxLength={60}
                    />
                    <span className="absolute right-3 top-3 text-xs text-gray-400">
                      {headerText.length}/60
                    </span>
                  </div>
                )}

                {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded p-4 flex flex-col items-center justify-center text-center">
                    <div className="mb-2">
                      {headerType === "IMAGE" && (
                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                      )}
                      {headerType === "VIDEO" && (
                        <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                      )}
                      {headerType === "DOCUMENT" && (
                        <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-600">
                      Choose {headerType.toLowerCase()} file
                    </div>
                    <div className="text-xs text-gray-400 mb-3">JPG or PNG</div>
                    <input
                      type="file"
                      className="file-input file-input-sm file-input-bordered w-full max-w-xs"
                      accept="image/*,video/*,application/pdf"
                      onChange={handleFileChange}
                    />
                    {headerFile && (
                      <div className="text-xs text-green-600 mt-2">
                        Selected: {headerFile.name}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BODY */}
              <div className="form-control mb-6">
                <label className="label text-xs font-semibold text-gray-600 uppercase">
                  Body
                </label>
                <div className="relative">
                  <textarea
                    className="textarea textarea-bordered w-full h-32 text-base leading-relaxed p-3"
                    placeholder="Enter text for your message in the language you've selected..."
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                  ></textarea>
                  <div className="flex justify-between mt-2 px-1">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost gap-1 bg-gray-100 hover:bg-gray-200"
                        onClick={() =>
                          setBodyText(
                            (prev) => prev + ` {{${variables.length + 1}}}`,
                          )
                        }
                      >
                        <PlusIcon className="w-3 h-3" /> Add variable
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost text-gray-400"
                      >
                        😊
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost text-gray-400"
                      >
                        Bold
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost text-gray-400"
                      >
                        Italic
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">
                      {bodyText.length}/1024
                    </span>
                  </div>
                </div>

                {/* VARIABLE SAMPLES */}
                {variables.length > 0 && (
                  <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 flex gap-1 items-center">
                      Variable samples{" "}
                      <InformationCircleIcon className="w-3 h-3" />
                    </h4>
                    <div className="grid gap-3">
                      {variables.map((v, i) => (
                        <div key={v.key} className="flex gap-3 items-center">
                          <div className="w-16 font-mono text-sm text-gray-500 bg-white border px-2 py-2 rounded text-center">
                            {v.key}
                          </div>
                          <select
                            className="select select-bordered select-sm w-32"
                            value={v.type}
                            onChange={(e) =>
                              handleVariableChange(
                                v.key,
                                "type",
                                e.target.value,
                              )
                            }
                          >
                            <option value="TEXT">Text</option>
                            <option value="NUMBER">Number</option>
                            <option value="CURRENCY">Currency</option>
                            <option value="DATE_TIME">Date/Time</option>
                          </select>
                          <input
                            type="text"
                            className="input input-bordered input-sm flex-1"
                            placeholder={`Sample content for ${v.key}`}
                            value={v.sample}
                            onChange={(e) =>
                              handleVariableChange(
                                v.key,
                                "sample",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="form-control">
                <label className="label text-xs font-semibold text-gray-600 uppercase">
                  Footer{" "}
                  <span className="font-normal text-gray-400 normal-case ml-1">
                    • Optional
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input input-bordered w-full text-sm h-10"
                    placeholder="Enter footer text..."
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    maxLength={60}
                  />
                  <span className="absolute right-3 top-3 text-xs text-gray-400">
                    {footerText.length}/60
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Buttons */}
            <div className="bg-white p-5 rounded border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-sm">
                  Buttons{" "}
                  <span className="font-normal text-gray-400 ml-1">
                    • Optional
                  </span>
                </h3>
                <div className="dropdown dropdown-end">
                  <label
                    tabIndex={0}
                    className="btn btn-sm btn-outline gap-1 rounded font-normal normal-case border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                  >
                    + Add button
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-50 text-sm"
                  >
                    <li>
                      <button onClick={() => handleAddButton("QUICK_REPLY")}>
                        Quick Reply
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleAddButton("URL")}>
                        URL
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleAddButton("PHONE_NUMBER")}>
                        Phone Number
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                {buttons.map((btn, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-start bg-gray-50 p-4 rounded border border-gray-200 relative group"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="badge badge-neutral text-xs font-bold py-3">
                          {btn.type.replace("_", " ")}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label text-[10px] font-bold text-gray-500 uppercase pb-1">
                            Button text
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            value={btn.text}
                            onChange={(e) =>
                              handleButtonChange(idx, "text", e.target.value)
                            }
                            placeholder="Button Text"
                          />
                        </div>
                        {btn.type === "URL" && (
                          <div className="form-control">
                            <label className="label text-[10px] font-bold text-gray-500 uppercase pb-1">
                              Website URL
                            </label>
                            <input
                              type="url"
                              className="input input-bordered input-sm w-full"
                              value={btn.url}
                              onChange={(e) =>
                                handleButtonChange(idx, "url", e.target.value)
                              }
                              placeholder="https://..."
                            />
                          </div>
                        )}
                        {btn.type === "PHONE_NUMBER" && (
                          <div className="form-control">
                            <label className="label text-[10px] font-bold text-gray-500 uppercase pb-1">
                              Phone number
                            </label>
                            <input
                              type="tel"
                              className="input input-bordered input-sm w-full"
                              value={btn.phoneNumber}
                              onChange={(e) =>
                                handleButtonChange(
                                  idx,
                                  "phoneNumber",
                                  e.target.value,
                                )
                              }
                              placeholder="+1..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-circle btn-ghost absolute top-2 right-2 text-gray-300 hover:text-red-500"
                      onClick={() => handleRemoveButton(idx)}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {buttons.length === 0 && (
                  <div className="text-sm text-gray-400 italic py-2">
                    No buttons added.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - PREVIEW */}
          <div className="w-[360px] shrink-0 sticky top-4 self-start">
            <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
              <TemplatePreview
                headerType={headerType}
                headerText={headerText}
                headerMediaUrl={headerMediaUrl}
                bodyText={bodyText}
                footerText={footerText}
                buttons={buttons}
              />
              <div className="mt-4 text-xs text-gray-400 text-center">
                Preview shows how your message might look in WhatsApp. Actual
                appearance may vary by device.
              </div>
            </div>
          </div>
        </div>
      </div>
      {error && (
        <div className="toast toast-end">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateForm;
