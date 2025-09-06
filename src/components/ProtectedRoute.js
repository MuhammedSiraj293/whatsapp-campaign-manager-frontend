// frontend/src/components/ProtectedRoute.js

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { authToken } = useContext(AuthContext);

  if (!authToken) {
    // If no token, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If token exists, render the child component (e.g., Dashboard)
  return children;
}