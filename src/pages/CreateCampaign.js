// frontend/src/pages/CreateCampaign.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function CreateCampaign() {
  const navigate = useNavigate();

  // Form state
  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [bodyVariablesText, setBodyVariablesText] = useState('');
  
  // Data for dropdowns
  const [templates, setTemplates] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  
  // Selected values from dropdowns
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedList, setSelectedList] = useState('');

  // Fetch both templates and contact lists when the page loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch templates
        const templatesRes = await fetch(`${API_URL}/api/campaigns/templates`);
        const templatesData = await templatesRes.json();
        if (templatesData.success) setTemplates(templatesData.data);

        // Fetch contact lists
        const listsRes = await fetch(`${API_URL}/api/contacts/lists`);
        const listsData = await listsRes.json();
        if (listsData.success) setContactLists(listsData.data);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
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
      if (bodyComponent) setFormMessage(bodyComponent.text);
    } else {
      setFormMessage('');
    }
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();
    const selectedTemplateObject = templates.find(t => t.name === selectedTemplate);

    if (!formName || !selectedTemplateObject || !selectedList) {
        return alert('Please fill out all required fields: Campaign Name, Template, and Contact List.');
    }
    
    try {
        const bodyVariables = bodyVariablesText 
          ? bodyVariablesText.split(',').map(item => item.trim()).filter(Boolean) 
          : [];

        const campaignData = {
          name: formName,
          message: formMessage,
          templateName: selectedTemplateObject.name,
          templateLanguage: selectedTemplateObject.language,
          headerImageUrl: headerImageUrl,
          bodyVariables: bodyVariables,
          contactList: selectedList, // <-- Add the selected contact list ID
        };

        const response = await fetch(`${API_URL}/api/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(campaignData),
        });
        
        const data = await response.json();
        if(data.success) {
            alert('Campaign created successfully!');
            navigate('/'); // Redirect back to the dashboard
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error creating campaign:', error);
    }
  };

  return (
    <div className="form-container" style={{ margin: 'auto', flexBasis: '60%' }}>
      <h2>Create a New Campaign</h2>
      <form onSubmit={handleCreateCampaign}>
        <input
          type="text"
          placeholder="Campaign Name"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
        />
        
        <select value={selectedTemplate} onChange={handleTemplateChange}>
          <option value="">-- Select a Message Template --</option>
          {templates.map((template) => (
            <option key={template.id} value={template.name}>
              {template.name} ({template.language})
            </option>
          ))}
        </select>
        
        <textarea
          placeholder="Template message body will appear here..."
          value={formMessage}
          readOnly
        />
        
        <input
          type="text"
          placeholder="Header Image URL (optional)"
          value={headerImageUrl}
          onChange={(e) => setHeaderImageUrl(e.target.value)}
        />
        
        <input
          type="text"
          placeholder="Body variables, comma-separated"
          value={bodyVariablesText}
          onChange={(e) => setBodyVariablesText(e.target.value)}
        />
        
        <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
          <option value="">-- Select a Contact List --</option>
          {contactLists.map((list) => (
            <option key={list._id} value={list._id}>
              {list.name}
            </option>
          ))}
        </select>

        <button type="submit">Create Campaign</button>
      </form>
    </div>
  );
}