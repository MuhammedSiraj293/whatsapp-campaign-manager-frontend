import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Replies from "./pages/Replies";
import Contacts from "./pages/Contacts";
import Enquiries from "./pages/Enquiries.js";
import CreateCampaign from "./pages/CreateCampaign";
import Analytics from "./pages/Analytics";
import CampaignAnalytics from "./pages/CampaignAnalytics";
import TemplateAnalytics from "./pages/TemplateAnalytics.js";
import Logs from "./pages/Logs";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Integrations from "./pages/Integrations";
import BotStudio from "./pages/BotStudio";
import FlowBuilder from "./pages/FlowBuilder";
import AutoReply from "./pages/AutoReply";
import Properties from "./pages/Properties";
import TemplateManager from "./pages/TemplateManager"; // <-- NEW IMPORT
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* --- NEW ROLE-BASED ROUTES --- */}

          {/* Viewer, Manager, & Admin Routes */}
          <Route
            path="/replies"
            element={
              <ProtectedRoute roles={["admin", "manager", "viewer"]}>
                <Replies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["admin", "manager", "viewer"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* --- 2. ADD NEW ENQUIRIES ROUTE (ALL ROLES) --- */}
          <Route
            path="/enquiries"
            element={
              <ProtectedRoute roles={["admin", "manager", "viewer"]}>
                <Enquiries />
              </ProtectedRoute>
            }
          />

          {/* Manager & Admin Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <Contacts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-campaign"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <CreateCampaign />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/:campaignId"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <CampaignAnalytics />
              </ProtectedRoute>
            }
          />
          {/* This is the new route for a specific template */}
          <Route
            path="/analytics/template/:templateName"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <TemplateAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Admin Only Routes */}
          <Route
            path="/logs"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Logs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Integrations />
              </ProtectedRoute>
            }
          />
          {/* --- 2. ADD NEW BOT ROUTES --- */}
          <Route
            path="/bot-studio"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <BotStudio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bot-studio/:flowId"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <FlowBuilder />
              </ProtectedRoute>
            }
          />

          {/* --- NEW AUTO-REPLY ROUTE --- */}
          <Route
            path="/auto-reply"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <AutoReply />
              </ProtectedRoute>
            }
          />
          {/* --- NEW PROPERTIES ROUTE --- */}
          <Route
            path="/properties"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <Properties />
              </ProtectedRoute>
            }
          />
          {/* --- NEW TEMPLATE MANAGER ROUTE --- */}
          <Route
            path="/template-manager"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <TemplateManager />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
