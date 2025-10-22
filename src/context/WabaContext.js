// frontend/src/context/WabaContext.js

import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
export const WabaContext = createContext(null);

// 2. Create the provider component
export const WabaProvider = ({ children }) => {
  // This state will hold the ID of the currently selected WABA account
  const [activeWaba, setActiveWaba] = useState(localStorage.getItem('activeWaba') || null);

  const selectWaba = (wabaId) => {
    if (wabaId) {
      localStorage.setItem('activeWaba', wabaId);
      setActiveWaba(wabaId);
    } else {
      localStorage.removeItem('activeWaba');
      setActiveWaba(null);
    }
  };

  const value = {
    activeWaba, // The ID of the selected WABA
    selectWaba, // The function to change the WABA
  };

  return (
    <WabaContext.Provider value={value}>
      {children}
    </WabaContext.Provider>
  );
};

// 3. Create a custom hook for easy access
export const useWaba = () => {
  const context = useContext(WabaContext);
  if (!context) {
    throw new Error('useWaba must be used within a WabaProvider');
  }
  return context;
};