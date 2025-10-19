// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Replies from './pages/Replies';
import Contacts from './pages/Contacts';
import CreateCampaign from './pages/CreateCampaign';
import Analytics from './pages/Analytics';
import CampaignAnalytics from './pages/CampaignAnalytics';
import Logs from './pages/Logs'; // <-- IMPORT NEW PAGE
import Users from './pages/Users';
import Profile from './pages/Profile'; 
import Integrations from './pages/Integrations';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/replies" 
            element={<ProtectedRoute><Replies /></ProtectedRoute>} 
          />
          <Route 
            path="/contacts" 
            element={<ProtectedRoute><Contacts /></ProtectedRoute>} 
          />
          <Route 
            path="/create-campaign" 
            element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} 
          />
          <Route 
            path="/analytics" 
            element={<ProtectedRoute><Analytics /></ProtectedRoute>} 
          />
          <Route 
            path="/analytics/:campaignId" 
            element={<ProtectedRoute><CampaignAnalytics /></ProtectedRoute>} 
          />
          {/* --- ADD NEW ROUTE --- */}
          <Route 
            path="/logs" 
            element={<ProtectedRoute><Logs /></ProtectedRoute>} 
          />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute roles={['admin']}><Integrations /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;