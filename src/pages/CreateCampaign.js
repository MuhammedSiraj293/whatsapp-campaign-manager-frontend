// frontend/src/pages/CreateCampaign.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/api";

export default function CreateCampaign() {
  const navigate = useNavigate();

  // Form state
  const [formName, setFormName] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [expectedVariables, setExpectedVariables] = useState(0);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [buttons, setButtons] = useState([]);

  // Data for dropdowns
  const [templates, setTemplates] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [wabaAccounts, setWabaAccounts] = useState([]);

  // Selected values from dropdowns
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(""); // The required field

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesData, listsData, accountsData] = await Promise.all([
          authFetch("/campaigns/templates"),
          authFetch("/contacts/lists"),
          authFetch("/waba/accounts"), // Fetch WABA accounts
        ]);

        if (templatesData.success) setTemplates(templatesData.data);
        if (listsData.success) setContactLists(listsData.data);
        if (accountsData.success) setWabaAccounts(accountsData.data);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchData();
  }, []);

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
      return alert('Please fill out all fields, including "Send From".');
    }

    try {
      const campaignData = {
        name: formName,
        message: formMessage,
        templateName: selectedTemplateObject.name,
        templateLanguage: selectedTemplateObject.language,
        contactList: selectedList,
        headerImageUrl: headerImageUrl,
        expectedVariables: parseInt(expectedVariables, 10) || 0,
        spreadsheetId: spreadsheetId,
        buttons: buttons,
        // --- THIS IS THE FIX ---
        phoneNumber: selectedPhoneNumber, // This line was missing or incorrect
        // ---
        ...(scheduledFor && {
          scheduledFor: new Date(scheduledFor).toISOString(),
        }),
      };

      const data = await authFetch("/campaigns", {
        method: "POST",
        body: JSON.stringify(campaignData),
      });

      if (data.success) {
        alert("Campaign created/scheduled successfully!");
        navigate("/");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert(error.message);
    }
  };

  // --- STYLING (unchanged) ---
  const inputStyle =
    "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";
  const labelStyle = "block mb-2 text-sm font-medium text-gray-400";
  const buttonStyle =
    "w-full text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";

  return (
    <div className="max-w-2xl mx-auto bg-[#202d33] p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {scheduledFor ? "Schedule New Campaign" : "Create New Campaign"}
      </h2>
      <form onSubmit={handleCreateCampaign} className="flex flex-col gap-4">
        <div>
          <label htmlFor="sendFrom" className={labelStyle}>
            Send From (Phone Number)
          </label>
          <select
            id="sendFrom"
            value={selectedPhoneNumber}
            onChange={(e) => setSelectedPhoneNumber(e.target.value)}
            className={inputStyle}
            required
          >
            <option value="">-- Select a Phone Number --</option>
            {wabaAccounts.map((account) => (
              <optgroup label={account.accountName} key={account._id}>
                {account.phoneNumbers.map((phone) => (
                  <option key={phone._id} value={phone._id}>
                    {phone.phoneNumberName} ({phone.phoneNumberId})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contactList" className={labelStyle}>
            Send To (Contact List)
          </label>
          <select
            id="contactList"
            value={selectedList}
            onChange={(e) => setSelectedList(e.target.value)}
            className={inputStyle}
            required
          >
            <option value="">-- Select a Contact List --</option>
            {contactLists.map((list) => (
              <option key={list._id} value={list._id}>
                {list.name}
              </option>
            ))}
          </select>
        </div>

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

        <div>
          <label htmlFor="template" className={labelStyle}>
            Message Template
          </label>
          <select
            id="template"
            value={selectedTemplate}
            onChange={handleTemplateChange}
            className={inputStyle}
            required
          >
            <option value="">-- Select a Template --</option>
            {templates.map((template) => (
              <option key={template.id} value={template.name}>
                {template.name} ({template.language})
              </option>
            ))}
          </select>
        </div>

        <textarea
          placeholder="Template message body..."
          value={formMessage}
          className={`${inputStyle} h-28`}
          readOnly
        />
        <input
          type="text"
          placeholder="Header Image URL (Optional)"
          value={headerImageUrl}
          onChange={(e) => setHeaderImageUrl(e.target.value)}
          className={inputStyle}
        />
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
  );
}
