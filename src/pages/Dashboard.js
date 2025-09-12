// frontend/src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authFetch, uploadFile } from '../services/api'; // <-- IMPORT OUR NEW SERVICES

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipientCounts, setRecipientCounts] = useState({});
  const navigate = useNavigate();

  const fetchCampaignsAndCounts = async () => {
    setIsLoading(true);
    try {
      // Use authFetch to get campaigns
      const campaignsData = await authFetch('/campaigns');
      if (campaignsData.success) {
        setCampaigns(campaignsData.data);
        
        const counts = {};
        for (const campaign of campaignsData.data) {
          // Use authFetch to get recipient counts
          const countData = await authFetch(`/campaigns/${campaign._id}/recipients/count`);
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

  const handleSendCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to send this campaign?')) return;
    try {
      // Use authFetch to send a campaign
      const result = await authFetch(`/campaigns/${campaignId}/send`, { method: 'POST' });
      if (result.success) {
        alert(result.data.message);
        fetchCampaignsAndCounts();
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert(error.message);
    }
  };

  // This component is no longer used here but can be moved to the Contacts page
  // For simplicity, we are removing the file upload from the dashboard.
  // The primary upload functionality is on the Contacts page.

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Existing Campaigns</h2>
        <button onClick={() => navigate('/create-campaign')} className="send-button">
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
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  {campaign.status !== 'sent' && (
                    <button className="send-button" onClick={() => handleSendCampaign(campaign._id)}>
                      Send Campaign
                    </button>
                  )}
                  {campaign.status === 'sent' && (
                    <Link to={`/analytics/${campaign._id}`} className="analytics-button">
                      View Analytics
                    </Link>
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