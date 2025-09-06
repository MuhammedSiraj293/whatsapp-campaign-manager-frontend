// frontend/src/components/Navbar.js

import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const navStyle = {
  background: '#202c33',
  padding: '1rem',
  marginBottom: '2rem',
  borderRadius: '8px',
  display: 'flex',
  gap: '1.5rem',
};

const linkStyle = {
  color: '#00a884',
  textDecoration: 'none',
  fontSize: '1.2rem',
  fontWeight: 'bold',
};

export default function Navbar() {
  const { authToken, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={navStyle}>
      {authToken ? (
        <>
          <Link to="/" style={linkStyle}>Dashboard</Link>
          <Link to="/replies" style={linkStyle}>Replies</Link>
          <Link to="/contacts" style={linkStyle}>Contacts</Link> {/* <-- ADD THIS LINK */}
          <button onClick={handleLogout} style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
            Logout
          </button>
        </>
      ) : (
        <Link to="/login" style={linkStyle}>Login</Link>
      )}
    </nav>
  );
}