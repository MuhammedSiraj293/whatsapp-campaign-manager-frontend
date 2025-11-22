import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { API_URL } from "../config";

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
  const [selectedList, setSelectedList] = useState("");
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
      (t) => t.wabaAccountId === activeWaba
    );
    setFilteredTemplates(activeTemplates);

    setSelectedPhoneNumber("");
    setSelectedTemplate("");
    setFormMessage("");
  }, [activeWaba, wabaAccounts, templates]);

  const handleTemplateChange = (e) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);
    const template = templates.find((t) => t.name === templateName);
    if (template) {
      const bodyComponent = template.components.find((c) => c.type === "BODY");
      setFormMessage(bodyComponent ? bodyComponent.text : "");
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
    const selectedTemplateObject = templates.find(
      (t) => t.name === selectedTemplate
    );

    if (
      !formName ||
      !selectedTemplateObject ||
      !selectedList ||
      !selectedPhoneNumber
    ) {
      return alert("Please fill out all fields.");
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("name", formName);
    formData.append("message", formMessage);
    formData.append("templateName", selectedTemplateObject.name);
    formData.append("templateLanguage", selectedTemplateObject.language);
    formData.append("contactList", selectedList);
    formData.append("phoneNumber", selectedPhoneNumber);
    formData.append("expectedVariables", expectedVariables);
    formData.append("spreadsheetId", spreadsheetId);

    // Important: Append buttons as string because FormData handles text
    formData.append("buttons", JSON.stringify(buttons));

    if (scheduledFor) {
      formData.append("scheduledFor", scheduledFor);
    }

    // Handle Image
    if (imageMode === "file" && headerImageFile) {
      formData.append("headerImage", headerImageFile);
    } else if (imageMode === "url" && headerImageUrl) {
      formData.append("headerImageUrl", headerImageUrl);
    }

    try {
      // Note: We cannot use standard authFetch here easily because we need to
      // let the browser set the Content-Type header for multipart/form-data.
      // We will use fetch directly but add the auth token.

      const token = localStorage.getItem("authToken"); // Or however you store token
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type here, browser does it for FormData
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

  const inputStyle =
    "bg-[#2c3943] border border-gray-700 text-white text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";
  const labelStyle = "block mb-2 text-sm font-medium text-white";
  const buttonStyle =
    "w-full text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";

  // --- React Select custom dark styles ---
  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "#2c3943",
      borderColor: "#475569",
      color: "#ffffff",
      boxShadow: "none",
      "&:hover": { borderColor: "#10b981" },
    }),
    singleValue: (base) => ({ ...base, color: "#ffffff" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#1e293b",
      color: "#ffffff",
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? "#047857" : "#1e293b",
      color: "#ffffff",
    }),
    placeholder: (base) => ({ ...base, color: "#ffffff" }),
    input: (base) => ({
      ...base,
      color: "#ffffff", // Text color while typing
      caretColor: "#ffffff", // Cursor color
    }),
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full">
      <div className="max-w-2xl mx-auto bg-[#202d33] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {scheduledFor ? "Schedule New Campaign" : "Create New Campaign"}
        </h2>

        {!activeWaba && (
          <p className="text-center text-yellow-400 p-4 bg-yellow-900/50 rounded-lg">
            Please select a WABA account from the navbar to create a campaign.
          </p>
        )}

        <form
          onSubmit={handleCreateCampaign}
          className={`flex flex-col gap-4 ${
            !activeWaba ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {/* --- Send From --- */}
          <div>
            <label htmlFor="sendFrom" className={labelStyle}>
              Send From (Phone Number)
            </label>
            <Select
              id="sendFrom"
              options={filteredPhones.map((phone) => ({
                value: phone._id,
                label: `${phone.phoneNumberName} (${phone.phoneNumberId})`,
              }))}
              value={
                selectedPhoneNumber
                  ? {
                      value: selectedPhoneNumber,
                      label:
                        filteredPhones.find(
                          (p) => p._id === selectedPhoneNumber
                        )?.phoneNumberName || "",
                    }
                  : null
              }
              onChange={(option) => setSelectedPhoneNumber(option?.value || "")}
              placeholder="-- Select a Phone Number --"
              styles={selectStyles}
              isSearchable
            />
          </div>

          {/* --- Send To --- */}
          <div>
            <label htmlFor="contactList" className={labelStyle}>
              Send To (Contact List)
            </label>
            <Select
              id="contactList"
              options={contactLists.map((list) => ({
                value: list._id,
                label: `${list.name} (${list.contacts?.length || 0})`,
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
              onChange={(option) => setSelectedList(option?.value || "")}
              placeholder="-- Select a Contact List --"
              styles={selectStyles}
              isSearchable
            />
          </div>

          {/* --- Campaign Name --- */}
          <div>
            <label htmlFor="campaignName" className={labelStyle}>
              Campaign Name
            </label>
            <input
              id="campaignName"
              type="text"
              placeholder="e.g., August Open House"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className={inputStyle}
              required
            />
          </div>

          {/* --- Message Template --- */}
          <div>
            <label htmlFor="template" className={labelStyle}>
              Message Template
            </label>
            <Select
              id="template"
              options={filteredTemplates.map((template) => ({
                value: template.name,
                label: `${template.name} (${template.language})`,
              }))}
              value={
                selectedTemplate
                  ? {
                      value: selectedTemplate,
                      label:
                        filteredTemplates.find(
                          (t) => t.name === selectedTemplate
                        )?.name || "",
                    }
                  : null
              }
              onChange={(option) =>
                handleTemplateChange({ target: { value: option?.value || "" } })
              }
              placeholder="-- Select a Template --"
              styles={selectStyles}
              isSearchable
            />
          </div>

          <textarea
            placeholder="Template message body..."
            value={formMessage}
            className={`${inputStyle} h-28`}
            readOnly
          />
          {/* --- NEW IMAGE UPLOAD SECTION --- */}
          <div className="p-3 border border-gray-700 rounded-lg">
            <label className={labelStyle}>Header Image</label>
            <div className="flex gap-4 mb-3">
              <label className="text-white flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="imgMode"
                  checked={imageMode === "url"}
                  onChange={() => setImageMode("url")}
                  className="mr-2"
                />{" "}
                Use URL
              </label>
              <label className="text-white flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="imgMode"
                  checked={imageMode === "file"}
                  onChange={() => setImageMode("file")}
                  className="mr-2"
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
                className="text-white text-sm w-full"
                accept="image/*"
              />
            )}
          </div>
          <input
            type="number"
            placeholder="Number of Body Variables"
            value={expectedVariables}
            onChange={(e) => setExpectedVariables(e.target.value)}
            className={inputStyle}
            min="0"
            required
          />
          <input
            type="text"
            placeholder="Google Sheet ID for Live Leads (Optional)"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            className={inputStyle}
          />

          {/* Buttons Section */}
          <div>
            <label className={labelStyle}>Interactive Buttons (Optional)</label>
            {buttons.map((button, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 border border-gray-700 rounded-lg mb-2"
              >
                <select
                  value={button.type}
                  onChange={(e) =>
                    handleButtonChange(index, "type", e.target.value)
                  }
                  className={inputStyle}
                >
                  <option value="QUICK_REPLY">Quick Reply</option>
                  <option value="URL">URL Button</option>
                </select>
                <input
                  type="text"
                  placeholder="Button Text"
                  value={button.text}
                  onChange={(e) =>
                    handleButtonChange(index, "text", e.target.value)
                  }
                  className={inputStyle}
                  required
                />
                {button.type === "URL" && (
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={button.url || ""}
                    onChange={(e) =>
                      handleButtonChange(index, "url", e.target.value)
                    }
                    className={inputStyle}
                    required
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeButton(index)}
                  className="text-red-500 p-2"
                >
                  &times;
                </button>
              </div>
            ))}
            {buttons.length < 3 && (
              <button
                type="button"
                onClick={addButton}
                className="text-emerald-500 text-sm font-medium mt-2"
              >
                + Add Button
              </button>
            )}
          </div>

          {/* Schedule */}
          <div>
            <label htmlFor="schedule" className={labelStyle}>
              Schedule For (Optional)
            </label>
            <input
              id="schedule"
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className={`${inputStyle} text-gray-400`}
            />
          </div>

          <button type="submit" className={`${buttonStyle} mt-4`}>
            {scheduledFor ? "Schedule Campaign" : "Create as Draft"}
          </button>
        </form>
      </div>
    </div>
  );
}
