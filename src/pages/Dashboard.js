// frontend/src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- IMPORT LINK
import { API_URL } from '../config';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipientCounts, setRecipientCounts] = useState({});
  const navigate = useNavigate();

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

  const handleSendCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to send this campaign?')) return;
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
        <button onClick={() => navigate('/create-campaign')}>
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
                  {/* --- NEW ANALYTICS LINK --- */}
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