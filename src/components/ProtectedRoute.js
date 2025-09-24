// frontend/src/components/ProtectedRoute.js

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { authToken, isLoading } = useContext(AuthContext);

  // 1. If the authentication state is still loading, show a loading message.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // 2. After loading, if there is no token, redirect to the login page.
  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  // 3. If loading is finished and a token exists, show the protected page.
  return children;
}