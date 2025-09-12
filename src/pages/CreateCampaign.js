// frontend/src/pages/CreateCampaign.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api'; // <-- IMPORT THE SECURE FETCH FUNCTION

export default function CreateCampaign() {
  const navigate = useNavigate();

  // Form state
  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [bodyVariablesText, setBodyVariablesText] = useState('');
  const [expectedVariables, setExpectedVariables] = useState(0);
  const [scheduledFor, setScheduledFor] = useState('');

  // Data for dropdowns
  const [templates, setTemplates] = useState([]);
  const [contactLists, setContactLists] = useState([]);

  // Selected values from dropdowns
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedList, setSelectedList] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use authFetch to get templates and lists
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
          name: formName,
          message: formMessage,
          templateName: selectedTemplateObject.name,
          templateLanguage: selectedTemplateObject.language,
          contactList: selectedList,
          headerImageUrl: headerImageUrl,
          expectedVariables: parseInt(expectedVariables, 10) || 0,
          bodyVariables: bodyVariablesText ? bodyVariablesText.split(',').map(item => item.trim()) : [],
          ...(scheduledFor && { scheduledFor }),
        };

        // Use authFetch to create the campaign
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

  return (
    <div className="form-container" style={{ margin: 'auto', flexBasis: '60%' }}>
      <h2>{scheduledFor ? 'Schedule Campaign' : 'Create Campaign'}</h2>
      <form onSubmit={handleCreateCampaign}>
        <input
          type="text"
          placeholder="Campaign Name"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          required
        />
        
        <select value={selectedTemplate} onChange={handleTemplateChange} required>
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
            type="number"
            placeholder="Number of Body Variables"
            value={expectedVariables}
            onChange={(e) => setExpectedVariables(e.target.value)}
            min="0"
            required
        />
        
        <input
          type="text"
          placeholder="Static Body variables (optional)"
          value={bodyVariablesText}
          onChange={(e) => setBodyVariablesText(e.target.value)}
        />
        
        <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)} required>
          <option value="">-- Select a Contact List --</option>
          {contactLists.map((list) => (
            <option key={list._id} value={list._id}>
              {list.name}
            </option>
          ))}
        </select>

        <label style={{ marginTop: '10px', fontSize: '0.9rem', color: '#b0b0b0' }}>Schedule for (optional):</label>
        <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
        />

        <button type="submit">{scheduledFor ? 'Schedule Campaign' : 'Create as Draft'}</button>
      </form>
    </div>
  );
}