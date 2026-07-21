import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext"; // <-- IMPORT
import { WabaProvider } from "./context/WabaContext";
import { AlertProvider } from "./context/AlertContext";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <WabaProvider>
      <AlertProvider>
        <App />
      </AlertProvider>
    </WabaProvider>
  </AuthProvider>
);
