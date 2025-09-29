// frontend/src/components/ProtectedRoute.js

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// The component now accepts an array of allowed roles
export default function ProtectedRoute({ children, roles }) {
  const { user, isLoading, authToken } = useContext(AuthContext);

  // If we are still checking for a user, show a loading message
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If not loading and there's no token, redirect to login
  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  // --- THIS IS THE NEW LOGIC ---
  // If the route requires specific roles and the user's role is not included, redirect.
  if (roles && !roles.includes(user.role)) {
    // Redirect viewers to their default page, and others to the main dashboard
    const fallbackPath = user.role === 'viewer' ? '/replies' : '/';
    return <Navigate to={fallbackPath} replace />;
  }

  // If all checks pass, show the page
  return children;
}