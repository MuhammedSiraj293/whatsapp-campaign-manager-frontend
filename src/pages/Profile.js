// frontend/src/pages/Profile.js

import React, { useState, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user } = useContext(AuthContext);
  
  // State to hold the QR code and secret from the backend for 2FA
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');

  // State for password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleEnable2FA = async () => {
    try {
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return alert('New passwords do not match.');
    }
    try {
      setIsChangingPassword(true);
      const data = await authFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (data.success) {
        alert('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const inputStyle = "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg block w-full p-2.5";
  const buttonStyle = "w-full text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors duration-150";

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full py-8 px-4">
      <div className="max-w-xl mx-auto bg-[#202d33] p-8 rounded-lg shadow-lg border border-gray-700/50">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">My Profile & Security</h1>
        
        <div className="text-gray-300 mb-6 text-center">
          <p className="mb-2"><span className="font-semibold text-gray-400">Name:</span> {user.name}</p>
          <p className="mb-2"><span className="font-semibold text-gray-400">Email:</span> {user.email}</p>
          <p className="mb-2"><span className="font-semibold text-gray-400">Role:</span> <span className="capitalize">{user.role}</span></p>
        </div>

        {/* Change Password Form */}
        <div className="border-t border-gray-700/80 pt-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 text-center">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm mx-auto">
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-400">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputStyle}
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-400">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputStyle}
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-400">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputStyle}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={isChangingPassword} className={buttonStyle}>
              {isChangingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Two Factor Authentication */}
        <div className="border-t border-gray-700/80 pt-6">
          <h2 className="text-lg font-bold text-white mb-4 text-center">Two-Factor Authentication (2FA)</h2>
          
          {!qrCodeUrl ? (
            <div className="max-w-sm mx-auto">
              <button onClick={handleEnable2FA} className={buttonStyle}>
                Enable 2FA
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center max-w-sm mx-auto">
              <p className="text-gray-300 text-xs mb-3 text-center">1. Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</p>
              <div className="bg-white p-3 rounded-lg mb-4">
                <img src={qrCodeUrl} alt="2FA QR Code" />
              </div>
              
              <p className="text-gray-300 text-xs mb-2 text-center">2. Or, manually enter this secret key:</p>
              <input 
                type="text" 
                value={secret} 
                readOnly 
                className={`${inputStyle} text-center font-mono select-all`} 
              />

              <p className="text-emerald-400 font-bold text-sm text-center mt-6">
                2FA is now enabled. The next time you log in, you will be asked for a code from your app.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}