// frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // <-- IMPORT
import { WabaProvider } from './context/WabaContext';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* <-- WRAP YOUR APP */}
      <WabaProvider>
      <App />
      </WabaProvider>
    </AuthProvider>
  </React.StrictMode>
);