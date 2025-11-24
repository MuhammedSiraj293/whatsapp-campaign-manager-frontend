// frontend/src/pages/Login.js

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(''); // State for the 6-digit 2FA code
  
  // State to manage which step of the login we are on
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      return alert('Please enter both email and password.');
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.twoFactorRequired) {
          // If 2FA is needed, move to the next step
          setIsTwoFactorStep(true);
        } else {
          // If no 2FA, log in directly
          login(data.user, data.token);
          navigate('/');
        }
      } else {
        alert(`Login failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred during login.');
    }
  };

  const handleVerify2FASubmit = async (event) => {
    event.preventDefault();
    if (!token) return alert('Please enter your 2FA code.');

    try {
      // Call the new verification endpoint
      const response = await fetch(`${API_URL}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token }),
      });

      const data = await response.json();

      if (data.success) {
        // If verification is successful, complete the login
        login(data.user, data.token);
        navigate('/');
      } else {
        alert(`Verification failed: ${data.error}`);
      }
    } catch (error) {
        console.error('Error during 2FA verification:', error);
        alert('An error occurred during verification.');
    }
  };


  const inputStyle = "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";
  const labelStyle = "block mb-2 text-sm font-medium text-gray-400";
  const buttonStyle = "w-full text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full flex items-center justify-center">
      <div className="w-full max-w-md bg-[#202d33] p-8 rounded-lg shadow-lg">
        
        {isTwoFactorStep ? (
            // --- 2FA VERIFICATION FORM ---
            <>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Enter Verification Code</h2>
                <form onSubmit={handleVerify2FASubmit} className="flex flex-col gap-6">
                    <div>
                        <label htmlFor="token" className={labelStyle}>6-Digit Code</label>
                        <input
                            id="token" type="text" placeholder="123456" value={token}
                            onChange={(e) => setToken(e.target.value)} className={inputStyle} required
                        />
                    </div>
                    <button type="submit" className={buttonStyle}>Verify & Login</button>
                </form>
            </>
        ) : (
            // --- STANDARD LOGIN FORM ---
            <>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In to Your Account</h2>
                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
                    <div>
                        <label htmlFor="email" className={labelStyle}>Email Address</label>
                        <input
                            id="email" type="email" placeholder="you@example.com" value={email}
                            onChange={(e) => setEmail(e.target.value)} className={inputStyle} required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className={labelStyle}>Password</label>
                        <input
                            id="password" type="password" placeholder="••••••••" value={password}
                            onChange={(e) => setPassword(e.target.value)} className={inputStyle} required
                        />
                    </div>
                    <button type="submit" className={buttonStyle}>Sign In</button>
                </form>
            </>
        )}

      </div>
    </div>
  );
}