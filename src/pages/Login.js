// frontend/src/pages/Login.js

import React, { useState, useContext } from 'react'; // 1. Import useContext
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // 2. Import our AuthContext
import './style/Login.css'
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // 3. Get the login function from context

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      return alert('Please enter both email and password.');
    }

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // 4. Use the login function from context
        login(data.token);
        alert('Login successful!');
        navigate('/');
      } else {
        alert(`Login failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred during login.');
    }
  };

  // The JSX form remains the same
  return (
    <div className="form-container" style={{ margin: 'auto', flexBasis: '50%' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <textarea
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          // style={{ minHeight: 'auto' }}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}