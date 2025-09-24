// frontend/src/context/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check localStorage for user info when the app loads
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false); // Finished loading
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData)); // Save user object
    setAuthToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setAuthToken(null);
    setUser(null);
  };

  const value = {
    authToken,
    user,
    isLoading, // <-- Expose the loading state
    login,
    logout,
  };

  // Only render the app after we have checked for the user
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};