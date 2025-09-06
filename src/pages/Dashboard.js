// frontend/src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { uploadRecipientsFile } from '../services/api';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [recipientCounts, setRecipientCounts] = useState({});
  const navigate = useNavigate(); // Hook for navigation

  const fetchCampaignsAndCounts = async () => {
    setIsLoading(true);
    try {
      const campaignsRes = await fetch(`${API_URL}/api/campaigns`);
      const campaignsData = await campaignsRes.json();
      if (campaignsData.success) {
        setCampaigns(campaignsData.data);
        const counts = {};
        for (const campaign of campaignsData.data) {
          const countRes = await fetch(`${API_URL}/api/campaigns/${campaign._id}/recipients/count`);
          const countData = await countRes.json();
          if (countData.success) {
            counts[campaign._id] = countData.count;
          }
        }
        setRecipientCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndCounts();
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async (campaignId) => {
    if (!selectedFile) return alert('Please select a CSV file.');
    try {
      const result = await uploadRecipientsFile(selectedFile, campaignId);
      alert(result.message);
      setSelectedFile(null);
      document.getElementById(`file-input-${campaignId}`).value = "";
      await fetchCampaignsAndCounts();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleSendCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to send this campaign?')) {
        return;
    }
    try {
        const response = await fetch(`${API_URL}/api/campaigns/${campaignId}/send`, {
            method: 'POST',
        });
        const result = await response.json();
        if (result.success) {
            alert(result.data.message);
            fetchCampaignsAndCounts();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error sending campaign:', error);
        alert('An error occurred while trying to send the campaign.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Existing Campaigns</h2>
        <button className='bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white p-2 rounded-xl' onClick={() => navigate('/create-campaign')}>
          + Create New Campaign
        </button>
      </div>

      <div className="list-container">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {campaigns.map((campaign) => (
              <li key={campaign._id}>
                <strong>{campaign.name}</strong>
                <p>"{campaign.message}"</p>
                <div className="campaign-footer">
                  <span>Status: {campaign.status}</span>
                  <span>Recipients: {recipientCounts[campaign._id] || 0}</span>
                </div>

                {campaign.status === 'draft' && (
                  <div className="upload-section" style={{ marginTop: '15px', borderTop: '1px solid #374248', paddingTop: '15px' }}>
                    <input type="file" accept=".csv, .xlsx, .xls" id={`file-input-${campaign._id}`} onChange={handleFileChange} />
                    <button onClick={() => handleFileUpload(campaign._id)} disabled={!selectedFile}>
                      Upload to this Campaign
                    </button>
                  </div>
                )}
                
                <div style={{marginTop: '15px'}}>
                    {campaign.status !== 'sent' && (
                      <button className="send-button" onClick={() => handleSendCampaign(campaign._id)}>
                        Send Campaign
                      </button>
                    )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}