// frontend/src/pages/CreateCampaign.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';

export default function CreateCampaign() {
  const navigate = useNavigate();

  // Form state
  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [bodyVariablesText, setBodyVariablesText] = useState('');
  const [expectedVariables, setExpectedVariables] = useState(0);
  const [scheduledFor, setScheduledFor] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');

  // Data for dropdowns
  const [templates, setTemplates] = useState([]);
  const [contactLists, setContactLists] = useState([]);

  // Selected values from dropdowns
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedList, setSelectedList] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const templatesData = await authFetch('/campaigns/templates');
        if (templatesData.success) setTemplates(templatesData.data);

        const listsData = await authFetch('/contacts/lists');
        if (listsData.success) setContactLists(listsData.data);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        alert("Failed to load necessary data. Please try logging in again.");
      }
    };
    fetchData();
  }, []);

  const handleTemplateChange = (e) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);
    const template = templates.find(t => t.name === templateName);
    if (template) {
      const bodyComponent = template.components.find(c => c.type === 'BODY');
      setFormMessage(bodyComponent ? bodyComponent.text : '');
    } else {
      setFormMessage('');
    }
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();
    const selectedTemplateObject = templates.find(t => t.name === selectedTemplate);

    if (!formName || !selectedTemplateObject || !selectedList) {
        return alert('Please fill out all required fields.');
    }
    
    try {
        const campaignData = {
          name: formName, message: formMessage,
          templateName: selectedTemplateObject.name,
          templateLanguage: selectedTemplateObject.language,
          contactList: selectedList, headerImageUrl: headerImageUrl,
          expectedVariables: parseInt(expectedVariables, 10) || 0,
          bodyVariables: bodyVariablesText ? bodyVariablesText.split(',').map(item => item.trim()) : [],
          ...(scheduledFor && { scheduledFor }),
          ...(spreadsheetId && { spreadsheetId }),
        };

        const data = await authFetch('/campaigns', {
            method: 'POST',
            body: JSON.stringify(campaignData),
        });
        
        if(data.success) {
            alert('Campaign created/scheduled successfully!');
            navigate('/');
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error creating campaign:', error);
        alert(error.message);
    }
  };

  // --- STYLING CLASSES ---
  const inputStyle = "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5";
  const labelStyle = "block mb-2 text-sm font-medium text-gray-400";
  const buttonStyle = "w-full text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center";


  return (
    <div className="max-w-2xl mx-auto bg-[#202d33] p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {scheduledFor ? 'Schedule New Campaign' : 'Create New Campaign'}
      </h2>
      <form onSubmit={handleCreateCampaign} className="flex flex-col gap-4">
        <div>
            <label htmlFor="campaignName" className={labelStyle}>Campaign Name</label>
            <input id="campaignName" type="text" placeholder="e.g., August Open House" value={formName} onChange={(e) => setFormName(e.target.value)} className={inputStyle} required />
        </div>

        <div>
            <label htmlFor="template" className={labelStyle}>Message Template</label>
            <select id="template" value={selectedTemplate} onChange={handleTemplateChange} className={inputStyle} required>
              <option value="">-- Select a Template --</option>
              {templates.map((template) => (
                <option key={template.id} value={template.name}>{template.name} ({template.language})</option>
              ))}
            </select>
        </div>

        <textarea placeholder="Template message body..." value={formMessage} className={`${inputStyle} h-28`} readOnly />

        <div>
            <label htmlFor="headerUrl" className={labelStyle}>Header Image URL (Optional)</label>
            <input id="headerUrl" type="text" placeholder="https://..." value={headerImageUrl} onChange={(e) => setHeaderImageUrl(e.target.value)} className={inputStyle} />
        </div>

        <div>
            <label htmlFor="numVars" className={labelStyle}>Number of Body Variables</label>
            <input id="numVars" type="number" value={expectedVariables} onChange={(e) => setExpectedVariables(e.target.value)} className={inputStyle} min="0" required />
        </div>

        <div>
            <label htmlFor="staticVars" className={labelStyle}>Static Body Variables (Optional)</label>
            <input id="staticVars" type="text" placeholder="e.g., SALE25,Monday" value={bodyVariablesText} onChange={(e) => setBodyVariablesText(e.target.value)} className={inputStyle} />
        </div>

        <div>
            <label htmlFor="contactList" className={labelStyle}>Contact List</label>
            <select id="contactList" value={selectedList} onChange={(e) => setSelectedList(e.target.value)} className={inputStyle} required>
              <option value="">-- Select a Contact List --</option>
              {contactLists.map((list) => (
                <option key={list._id} value={list._id}>{list.name}</option>
              ))}
            </select>
        </div>

        <div>
            <label htmlFor="sheetId" className={labelStyle}>Google Sheet ID for Live Leads (Optional)</label>
            <input id="sheetId" type="text" placeholder="Paste Sheet ID from URL" value={spreadsheetId} onChange={(e) => setSpreadsheetId(e.target.value)} className={inputStyle} />
        </div>
        
        <div>
            <label htmlFor="schedule" className={labelStyle}>Schedule For (Optional)</label>
            <input id="schedule" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className={`${inputStyle} text-gray-400`} />
        </div>
        
        <button type="submit" className={`${buttonStyle} mt-4`}>{scheduledFor ? 'Schedule Campaign' : 'Create as Draft'}</button>
      </form>
    </div>
  );
}