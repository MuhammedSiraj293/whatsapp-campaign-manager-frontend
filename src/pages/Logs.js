// frontend/src/pages/Logs.js

import React, { useState, useEffect } from 'react';
import { authFetch } from '../services/api'; // <-- IMPORT AUTH SERVICE

// Helper to determine the color for the log level badge
const getLogLevelClass = (level) => {
  switch (level) {
    case 'success':
      return 'bg-green-500 text-green-900';
    case 'error':
      return 'bg-red-500 text-red-900';
    default:
      return 'bg-blue-500 text-blue-900';
  }
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        // Use authFetch to get the logs
        const data = await authFetch('/logs');
        if (data.success) {
          setLogs(data.data);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
        alert(error.message); // Show the error (e.g., "Not authorized")
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (isLoading) {
    return <p className="text-center text-gray-400">Loading activity logs...</p>;
  }

  return (
    <div className="p-4 md:p-8 min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <h1 className="text-3xl font-bold text-white text-center mb-8">
        Server Activity Logs
      </h1>
      <div className="bg-[#202d33] rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[#2a3942]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {logs.map((log) => (
              <tr key={log._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLogLevelClass(log.level)}`}>
                    {log.level}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {log.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-center text-gray-500 py-8">No log entries found.</p>}
      </div>
    </div>
  );
}