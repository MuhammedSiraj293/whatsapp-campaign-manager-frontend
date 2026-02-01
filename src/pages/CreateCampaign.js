import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { API_URL } from "../config";
import TemplatePreview from "../components/TemplatePreview"; // Value Import
import {
  CalendarIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  CodeBracketIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { activeWaba } = useWaba();

  // Form state
  const [formName, setFormName] = useState("");
  const [formMessage, setFormMessage] = useState("");

  // Image handling
  const [imageMode, setImageMode] = useState("url"); // 'url' or 'file'
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [headerImageFile, setHeaderImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null); // For local file preview

  const [expectedVariables, setExpectedVariables] = useState(0);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [buttons, setButtons] = useState([]);

  // Data for dropdowns
  const [templates, setTemplates] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [wabaAccounts, setWabaAccounts] = useState([]);

  // Selected values
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedTemplateObject, setSelectedTemplateObject] = useState(null); // Store full object for preview
  const [selectedList, setSelectedList] = useState("");
  const [selectedExclusionList, setSelectedExclusionList] = useState("");
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");

  // Filtered data
  const [filteredPhones, setFilteredPhones] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeWaba) {
          const [templatesData, listsData, accountsData] = await Promise.all([
            authFetch(`/campaigns/templates/${activeWaba}`),
            authFetch("/contacts/lists"),
            authFetch("/waba/accounts"),
          ]);

          if (templatesData.success) setTemplates(templatesData.data);
          if (listsData.success) setContactLists(listsData.data);
          if (accountsData.success) setWabaAccounts(accountsData.data);
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchData();
  }, [activeWaba]);

  useEffect(() => {
    const activeAccount = wabaAccounts.find((acc) => acc._id === activeWaba);
    setFilteredPhones(activeAccount ? activeAccount.phoneNumbers : []);

    const activeTemplates = templates.filter(
      (t) => t.wabaAccountId === activeWaba,
    );
    setFilteredTemplates(activeTemplates);

    // Reset fields on WABA change
    setSelectedPhoneNumber("");
    setSelectedTemplate("");
    setSelectedTemplateObject(null);
    setFormMessage("");
    setButtons([]);
  }, [activeWaba, wabaAccounts, templates]);

  // Auto-select Unsubscribe list for exclusion if found
  useEffect(() => {
    if (contactLists.length > 0) {
      const unsubList = contactLists.find((l) =>
        l.name.toLowerCase().includes("unsubscribe"),
      );
      if (unsubList) {
        setSelectedExclusionList(unsubList._id);
      }
    }
  }, [contactLists]);

  // Handle File Preview
  useEffect(() => {
    if (headerImageFile) {
      const objectUrl = URL.createObjectURL(headerImageFile);
      setPreviewImageUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewImageUrl(null);
    }
  }, [headerImageFile]);

  const handleTemplateChange = (e) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);
    const template = templates.find((t) => t.name === templateName);
    setSelectedTemplateObject(template);

    if (template) {
      const bodyComponent = template.components.find((c) => c.type === "BODY");
      setFormMessage(bodyComponent ? bodyComponent.text : "");

      // Auto-load existing buttons from template for preview (optional, if we want to show template buttons)
      // For now, we keep the manual button adder as per original logic,
      // but if the template has buttons, they are usually static or URL params.
      // We'll stick to manual button management for simplicity unless template enforces them.
    } else {
      setFormMessage("");
    }
  };

  const addButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, { type: "QUICK_REPLY", text: "" }]);
    }
  };

  const handleButtonChange = (index, field, value) => {
    const newButtons = [...buttons];
    newButtons[index][field] = value;
    if (field === "type" && value === "QUICK_REPLY") {
      delete newButtons[index].url;
    }
    setButtons(newButtons);
  };

  const removeButton = (index) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();
    if (
      !formName ||
      !selectedTemplateObject ||
      !selectedList ||
      !selectedPhoneNumber
    ) {
      return alert("Please fill out all required fields.");
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("name", formName);
    formData.append("message", formMessage); // Note: This might be redundant if backend uses template, but keeping for compatibility
    formData.append("templateName", selectedTemplateObject.name);
    formData.append("templateLanguage", selectedTemplateObject.language);
    formData.append("contactList", selectedList);
    formData.append("exclusionList", selectedExclusionList);
    formData.append("phoneNumber", selectedPhoneNumber);
    formData.append("expectedVariables", expectedVariables);
    formData.append("spreadsheetId", spreadsheetId);

    // Important: Append buttons as string because FormData handles text
    formData.append("buttons", JSON.stringify(buttons));

    if (scheduledFor) {
      const utcDate = new Date(scheduledFor).toISOString();
      formData.append("scheduledFor", utcDate);
    }

    // Handle Image
    if (imageMode === "file" && headerImageFile) {
      formData.append("headerImage", headerImageFile);
    } else if (imageMode === "url" && headerImageUrl) {
      formData.append("headerImageUrl", headerImageUrl);
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Campaign created/scheduled successfully!");
        navigate("/");
      } else {
        alert(`Error: ${data.error || "Failed to create campaign"}`);
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert(error.message);
    }
  };

  // --- STYLES ---
  const cardStyle =
    "bg-[#202d33] p-6 rounded-xl shadow-sm border border-gray-800";
  const labelStyle =
    "block mb-2 text-sm font-medium text-gray-300 flex items-center gap-2";
  const inputStyle =
    "bg-[#2c3943] border border-gray-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 transition-colors";

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "#2c3943",
      borderColor: state.isFocused ? "#10b981" : "#374151",
      color: "#ffffff",
      padding: "2px",
      borderRadius: "0.5rem",
      boxShadow: "none",
      "&:hover": { borderColor: "#10b981" },
    }),
    singleValue: (base) => ({ ...base, color: "#ffffff" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#1e293b",
      color: "#ffffff",
      zIndex: 50,
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? "#047857" : "#1e293b",
      color: "#ffffff",
      cursor: "pointer",
    }),
    placeholder: (base) => ({ ...base, color: "#9ca3af" }),
    input: (base) => ({ ...base, color: "#ffffff" }),
  };

  const renderPreviewSection = () => {
    // 1. Prepare Template Object
    // Clone to avoid mutating state directly
    const displayTemplate = selectedTemplateObject
      ? JSON.parse(JSON.stringify(selectedTemplateObject))
      : null;
    const overrideMedia = previewImageUrl || headerImageUrl;

    // 2. Override Header Logic for Preview
    if (displayTemplate && overrideMedia) {
      const headerComp = displayTemplate.components.find(
        (c) => c.type === "HEADER",
      );
      if (headerComp) {
        // If header exists, force it to IMAGE type for preview if user uploaded one
        // This is a visual override only
        headerComp.format = "IMAGE";
      }
    }

    return (
      <>
        <TemplatePreview
          template={displayTemplate}
          headerMediaUrl={overrideMedia}
        />

        {/* Fallback/Extra Image Preview */}
        {overrideMedia && !displayTemplate && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Header Preview:</p>
            <img
              src={overrideMedia}
              alt="Header"
              className="h-32 mx-auto rounded-lg border border-gray-600 object-cover"
            />
          </div>
        )}

        {overrideMedia && displayTemplate && (
          <div className="mt-2 text-center">
            <p className="text-[10px] text-gray-500">Includes attached image</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-[#111b21] min-h-screen w-full p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {scheduledFor ? "Schedule Campaign" : "New Campaign"}
            </h1>
          </div>
          {!activeWaba && (
            <div className="text-amber-400 bg-amber-900/30 px-4 py-2 rounded-lg border border-amber-900 flex items-center gap-2">
              ⚠️ Please select a WABA account.
            </div>
          )}
        </div>

        <form
          onSubmit={handleCreateCampaign}
          className={!activeWaba ? "opacity-50 pointer-events-none" : ""}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: Form Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Campaign Basics */}
              <div className={cardStyle}>
                <h3 className="text-lg font-semibold text-emerald-400 mb-4 border-b border-gray-700 pb-2">
                  1. Campaign Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="campaignName" className={labelStyle}>
                      <span className="text-emerald-500">#</span> Campaign Name
                    </label>
                    <input
                      id="campaignName"
                      type="text"
                      placeholder="e.g. Q1 Promo 2026"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="sendFrom" className={labelStyle}>
                      <DevicePhoneMobileIcon className="w-4 h-4" /> Send From
                    </label>
                    <Select
                      id="sendFrom"
                      options={filteredPhones.map((p) => ({
                        value: p._id,
                        label: `${p.phoneNumberName} (${p.phoneNumberId})`,
                      }))}
                      value={
                        selectedPhoneNumber
                          ? {
                              value: selectedPhoneNumber,
                              label:
                                filteredPhones.find(
                                  (p) => p._id === selectedPhoneNumber,
                                )?.phoneNumberName || "",
                            }
                          : null
                      }
                      onChange={(opt) =>
                        setSelectedPhoneNumber(opt?.value || "")
                      }
                      placeholder="Select Number..."
                      styles={selectStyles}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="schedule" className={labelStyle}>
                      <CalendarIcon className="w-4 h-4" /> Schedule (Optional)
                    </label>
                    <input
                      id="schedule"
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className={`${inputStyle} text-gray-300`} // Force lighter text
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to send immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Audience */}
              <div className={cardStyle}>
                <h3 className="text-lg font-semibold text-emerald-400 mb-4 border-b border-gray-700 pb-2">
                  2. Audience Target
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactList" className={labelStyle}>
                      <UserGroupIcon className="w-4 h-4" /> Include List
                    </label>
                    <Select
                      id="contactList"
                      options={contactLists.map((l) => ({
                        value: l._id,
                        label: `${l.name} (${l.contacts?.length || 0})`,
                      }))}
                      value={
                        selectedList
                          ? {
                              value: selectedList,
                              label:
                                contactLists.find((l) => l._id === selectedList)
                                  ?.name || "",
                            }
                          : null
                      }
                      onChange={(opt) => setSelectedList(opt?.value || "")}
                      placeholder="Select List..."
                      styles={selectStyles}
                    />
                  </div>
                  <div>
                    <label htmlFor="exclusionList" className={labelStyle}>
                      Exclusion List
                    </label>
                    <Select
                      id="exclusionList"
                      options={contactLists.map((l) => ({
                        value: l._id,
                        label: `${l.name} (${l.contacts?.length || 0})`,
                      }))}
                      value={
                        selectedExclusionList
                          ? {
                              value: selectedExclusionList,
                              label:
                                contactLists.find(
                                  (l) => l._id === selectedExclusionList,
                                )?.name || "",
                            }
                          : null
                      }
                      onChange={(opt) =>
                        setSelectedExclusionList(opt?.value || "")
                      }
                      placeholder="None"
                      styles={selectStyles}
                      isClearable
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelStyle}>
                      Google Sheet ID (Live Leads)
                    </label>
                    <input
                      type="text"
                      placeholder="Paste Sheet ID here..."
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Content */}
              <div className={cardStyle}>
                <h3 className="text-lg font-semibold text-emerald-400 mb-4 border-b border-gray-700 pb-2">
                  3. Message Content
                </h3>

                {/* Template Selection */}
                <div className="mb-6">
                  <label htmlFor="template" className={labelStyle}>
                    Select Template
                  </label>
                  <Select
                    id="template"
                    options={filteredTemplates.map((t) => ({
                      value: t.name,
                      label: `${t.name} (${t.language}) - ${t.category}`,
                    }))}
                    onChange={(opt) =>
                      handleTemplateChange({
                        target: { value: opt?.value || "" },
                      })
                    }
                    placeholder="Search templates..."
                    styles={selectStyles}
                  />
                </div>

                {/* Read-Only Body View */}
                <div className="mb-6">
                  <label className={labelStyle}>Message Preview</label>
                  <div className="p-4 bg-[#111b21] rounded-lg border border-gray-700 text-gray-300 text-sm whitespace-pre-wrap min-h-[100px]">
                    {formMessage || (
                      <span className="text-gray-600 italic">
                        Select a template to view content...
                      </span>
                    )}
                  </div>
                </div>

                {/* Media Header Config */}
                <div className="mb-6 p-4 bg-[#1e293b] rounded-lg border border-gray-700">
                  <label className={`${labelStyle} mb-3`}>
                    <PhotoIcon className="w-4 h-4" /> Header Image
                  </label>

                  <div className="flex gap-6 mb-4">
                    <label className="flex items-center cursor-pointer text-sm text-gray-300 hover:text-white">
                      <input
                        type="radio"
                        name="imgMode"
                        checked={imageMode === "url"}
                        onChange={() => setImageMode("url")}
                        className="mr-2 text-emerald-500 focus:ring-emerald-500 bg-gray-700 border-gray-500"
                      />{" "}
                      Use URL
                    </label>
                    <label className="flex items-center cursor-pointer text-sm text-gray-300 hover:text-white">
                      <input
                        type="radio"
                        name="imgMode"
                        checked={imageMode === "file"}
                        onChange={() => setImageMode("file")}
                        className="mr-2 text-emerald-500 focus:ring-emerald-500 bg-gray-700 border-gray-500"
                      />{" "}
                      Upload File
                    </label>
                  </div>

                  {imageMode === "url" ? (
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={headerImageUrl}
                      onChange={(e) => setHeaderImageUrl(e.target.value)}
                      className={inputStyle}
                    />
                  ) : (
                    <input
                      type="file"
                      onChange={(e) => setHeaderImageFile(e.target.files[0])}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-900 file:text-emerald-300 hover:file:bg-emerald-800"
                      accept="image/*"
                    />
                  )}
                </div>

                {/* Variables & Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelStyle}>
                      <CodeBracketIcon className="w-4 h-4" /> Body Variables
                    </label>
                    <input
                      type="number"
                      value={expectedVariables}
                      onChange={(e) => setExpectedVariables(e.target.value)}
                      className={inputStyle}
                      min="0"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Number of {"{{1}}"}, {"{{2}}"} placeholders in body.
                    </p>
                  </div>

                  <div>
                    <label className={labelStyle}>Interactive Buttons</label>
                    <div className="space-y-2">
                      {buttons.map((btn, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={btn.text}
                            onChange={(e) =>
                              handleButtonChange(idx, "text", e.target.value)
                            }
                            placeholder="Button Label"
                            className={`${inputStyle} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() => removeButton(idx)}
                            className="text-red-400 hover:text-red-300 px-2"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      {buttons.length < 3 && (
                        <button
                          type="button"
                          onClick={addButton}
                          className="text-emerald-400 text-xs hover:underline"
                        >
                          + Add Button
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center gap-2">
                  <PaperAirplaneIcon className="w-5 h-5" />
                  {scheduledFor ? "Schedule Campaign" : "Launch Campaign Now"}
                </span>
              </button>
            </div>

            {/* RIGHT COLUMN: Sticky Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="text-center mb-4">
                  <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold">
                    Live Preview
                  </h3>
                </div>

                {/* Render the preview */}
                {renderPreviewSection()}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
