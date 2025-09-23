import React, { useState, useEffect } from 'react';
import { authFetch } from '../services/api'; // <-- 1. IMPORT THE SECURE SERVICE
import { FaPaperPlane, FaUsers, FaReply } from 'react-icons/fa';

// Reusable component for the stat cards
const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-[#202d33] p-6 rounded-lg shadow-lg flex items-center border-l-4 border-emerald-500">
      <div className="text-3xl text-emerald-500 mr-4">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h2>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  );
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // --- 2. THIS IS THE FIX ---
        // Use authFetch to make an authenticated request
        const data = await authFetch('/analytics/stats');
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching analytics stats:', error);
        // Display the specific error message to the user
        alert(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <p className="text-center text-gray-400">Loading analytics...</p>;
  }

  if (!stats) {
    return <p className="text-center text-red-500">Could not load analytics data.</p>;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black p-4 md:p-8">
      <h1 className="text-3xl font-bold text-white text-center mb-8">
        Analytics Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Campaigns Sent" 
          value={stats.campaignsSent}
          icon={<FaPaperPlane />}
        />
        <StatCard 
          title="Total Contacts" 
          value={stats.totalContacts}
          icon={<FaUsers />}
        />
        <StatCard 
          title="Replies Received" 
          value={stats.repliesReceived}
          icon={<FaReply />}
        />
      </div>
    </div>
  );
}