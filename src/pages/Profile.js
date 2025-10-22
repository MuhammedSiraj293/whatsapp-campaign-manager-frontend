// frontend/src/pages/Profile.js

import React, { useState, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user } = useContext(AuthContext);
  
  // State to hold the QR code and secret from the backend
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');

  const handleEnable2FA = async () => {
    try {
      // Ask the backend to generate a new 2FA secret
      const data = await authFetch('/auth/2fa/setup', { method: 'POST' });
      if (data.success) {
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      alert('Failed to set up 2FA. Please try again.');
    }
  };

  const inputStyle = "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg block w-full p-2.5 text-center";
  const buttonStyle = "w-full text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full">
    <div className="max-w-xl mx-auto bg-[#202d33] p-8 rounded-lg shadow-lg text-center">
      <h1 className="text-2xl font-bold text-white mb-6">My Profile & Security</h1>
      
      <div className="text-gray-300 mb-6">
        <p><span className="font-medium text-gray-400">Name:</span> {user.name}</p>
        <p><span className="font-medium text-gray-400">Email:</span> {user.email}</p>
        <p><span className="font-medium text-gray-400">Role:</span> <span className="capitalize">{user.role}</span></p>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h2 className="text-xl font-bold text-white mb-4">Two-Factor Authentication (2FA)</h2>
        
        {!qrCodeUrl ? (
          <>
            <button onClick={handleEnable2FA} className={buttonStyle}>
              Enable 2FA
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-gray-300 mb-2">1. Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</p>
            <img src={qrCodeUrl} alt="2FA QR Code" className="bg-white p-2 rounded-lg" />
            
            <p className="text-gray-300 mt-4 mb-2">2. Or, manually enter this secret key:</p>
            <input 
                type="text" 
                value={secret} 
                readOnly 
                className={inputStyle} 
            />

            <p className="text-emerald-400 font-bold mt-6">
              2FA is now enabled. The next time you log in, you will be asked for a code from your app.
            </p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}