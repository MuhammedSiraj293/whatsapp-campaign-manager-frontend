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
import TemplateAnalytics from './pages/TemplateAnalytics.js';
import Logs from './pages/Logs';
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
          
          {/* --- NEW ROLE-BASED ROUTES --- */}
          
          {/* Viewer, Manager, & Admin Routes */}
          <Route 
            path="/replies" 
            element={
              <ProtectedRoute roles={['admin', 'manager', 'viewer']}>
                <Replies />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute roles={['admin', 'manager', 'viewer']}>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* Manager & Admin Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/contacts" 
            element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <Contacts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-campaign" 
            element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <CreateCampaign />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics/:campaignId" 
            element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <CampaignAnalytics />
              </ProtectedRoute>
            } 
          />
          {/* This is the new route for a specific template */}
          <Route 
            path="/analytics/template/:templateName" 
            element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <TemplateAnalytics />
              </ProtectedRoute>
            } 
          />

          {/* Admin Only Routes */}
          <Route 
            path="/logs" 
            element={
              <ProtectedRoute roles={['admin']}>
                <Logs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute roles={['admin']}>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/integrations" 
            element={
              <ProtectedRoute roles={['admin']}>
                <Integrations />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;