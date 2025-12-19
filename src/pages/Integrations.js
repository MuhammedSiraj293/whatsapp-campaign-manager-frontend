// frontend/src/pages/Integrations.js

import React, { useState, useEffect, useCallback, useContext } from "react";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { AuthContext } from "../context/AuthContext";
import { FaTrash, FaSave } from "react-icons/fa";

export default function Integrations() {
  const [accounts, setAccounts] = useState([]);
  const [botFlows, setBotFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { activeWaba } = useWaba();
  const { user } = useContext(AuthContext);

  // Form states
  const [accountName, setAccountName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [phoneName, setPhoneName] = useState("");
  const [phoneId, setPhoneId] = useState("");

  // Editing states
  const [editingSheetId, setEditingSheetId] = useState({});
  const [editingBotFlow, setEditingBotFlow] = useState({});

  const inputStyle =
    "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";
  const labelStyle = "block mb-2 text-sm font-medium text-gray-400";
  const buttonStyle =
    "text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";

  // ---------------------------------------------
  // 🔥 Unified Fetch (Dashboard Style)
  // ---------------------------------------------

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Step 1: Load all WABA accounts first
      const accountsRes = await authFetch("/waba/accounts");

      if (accountsRes.success) {
        const accs = accountsRes.data;
        setAccounts(accs);

        // Initialize editing states
        const sheetState = {};
        const botState = {};

        accs.forEach((acc) => {
          sheetState[acc._id] = acc.masterSpreadsheetId || "";
          acc.phoneNumbers.forEach((phone) => {
            botState[phone._id] = phone.activeBotFlow || "";
          });
        });

        setEditingSheetId(sheetState);
        setEditingBotFlow(botState);
      }

      // Step 2: Only fetch bot flows if a WABA is active
      if (activeWaba) {
        const flowRes = await authFetch(`/bot-flows/waba/${activeWaba}`);
        if (flowRes.success) {
          setBotFlows(flowRes.data);
        }
      } else {
        setBotFlows([]); // no WABA = no flows displayed
      }
    } catch (err) {
      console.error("Error fetching integrations data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWaba, user]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ---------------------------------------------
  // 🔧 WABA ACCOUNT HANDLERS
  // ---------------------------------------------

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await authFetch("/waba/accounts", {
        method: "POST",
        body: JSON.stringify({ accountName, accessToken, businessAccountId }),
      });
      alert("WABA account added!");
      fetchAllData();
      setAccountName("");
      setAccessToken("");
      setBusinessAccountId("");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Delete this account and all phone numbers?")) return;

    try {
      await authFetch(`/waba/accounts/${id}`, { method: "DELETE" });
      alert("Account deleted.");
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveMasterSheetId = async (accountId) => {
    try {
      await authFetch(`/waba/accounts/${accountId}`, {
        method: "PUT",
        body: JSON.stringify({
          masterSpreadsheetId: editingSheetId[accountId],
        }),
      });
      alert("Master Sheet ID updated!");
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------------------------------------------
  // 📱 PHONE HANDLERS
  // ---------------------------------------------

  const handleAddPhone = async (e) => {
    e.preventDefault();

    if (!activeWaba) {
      return alert("Please select a WABA first.");
    }

    try {
      await authFetch("/waba/phones", {
        method: "POST",
        body: JSON.stringify({
          phoneNumberName: phoneName,
          phoneNumberId: phoneId,
          wabaAccount: activeWaba,
        }),
      });
      alert("Phone number added!");
      fetchAllData();
      setPhoneName("");
      setPhoneId("");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePhone = async (phoneId) => {
    if (!window.confirm("Delete this phone number?")) return;

    try {
      await authFetch(`/waba/phones/${phoneId}`, { method: "DELETE" });
      alert("Phone deleted.");
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------------------------------------------
  // 🤖 BOT FLOW ASSIGNMENT
  // ---------------------------------------------

  const handleBotFlowChange = (phoneId, botFlowId) => {
    setEditingBotFlow({ ...editingBotFlow, [phoneId]: botFlowId });
  };

  const handleSaveBotFlow = async (phoneId) => {
    try {
      await authFetch(`/waba/phones/${phoneId}`, {
        method: "PUT",
        body: JSON.stringify({ activeBotFlow: editingBotFlow[phoneId] }),
      });
      alert("Bot flow assigned!");
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------------------------------------------
  // 🚀 EMBEDDED SIGNUP (CONNECT WHATSAPP)
  // ---------------------------------------------

  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.REACT_APP_FACEBOOK_APP_ID, // NEED THIS IN .ENV
        autoLogAppEvents: true,
        xfbml: true,
        version: "v20.0",
      });
    };

    // Load the SDK script asynchronously
    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      alert("Facebook SDK is loading... please wait.");
      return;
    }

    // Launch Facebook Login with Configuration ID for Embedded Signup
    window.FB.login(
      function (response) {
        if (response.authResponse && response.authResponse.code) {
          const code = response.authResponse.code;
          // Send code to backend
          handleEmbeddedSignup(code);
        } else {
          console.log("User cancelled login or did not fully authorize.");
        }
      },
      {
        config_id: process.env.REACT_APP_FACEBOOK_CONFIG_ID, // NEED THIS IN .ENV
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {}, // Triggers Embedded Signup
        },
      }
    );
  };

  const handleEmbeddedSignup = async (code) => {
    try {
      const res = await authFetch("/waba/connect", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (res.success) {
        alert("WhatsApp Connected Successfully!");
        fetchAllData(); // Refresh list
      } else {
        alert("Connection failed: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      alert("Connection error: " + err.message);
    }
  };

  // ---------------------------------------------
  // ✨ UI
  // ---------------------------------------------
  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* LEFT COLUMN — Add Accounts & Phones */}
      <div className="flex flex-col gap-8">
        {/* 🆕 CONNECT WHATSAPP (Embedded Signup) */}
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg border border-emerald-600/30">
          <h2 className="text-xl font-bold text-white mb-2">
            Connect WhatsApp
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Use your Facebook account to automatically connect your WhatsApp
            Business number.
          </p>
          <button
            onClick={launchWhatsAppSignup}
            className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2"
          >
            {/* Facebook Icon */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Connect with Facebook
          </button>
        </div>

        {/* Add WABA Account (Manual) */}
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">
            Manually Add WABA Account
          </h2>

          <form onSubmit={handleAddAccount} className="flex flex-col gap-4">
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Account Name (e.g., Client A)"
              className={inputStyle}
              required
            />

            <input
              type="text"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Permanent Access Token"
              className={inputStyle}
              required
            />

            <input
              type="text"
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
              placeholder="Business Account ID"
              className={inputStyle}
              required
            />

            <button type="submit" className={buttonStyle}>
              Save Account
            </button>
          </form>
        </div>

        {/* Add Phone */}
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">
            Add Phone Number to:{" "}
            {activeWaba
              ? accounts.find((a) => a._id === activeWaba)?.accountName
              : "..."}
          </h2>

          <form onSubmit={handleAddPhone} className="flex flex-col gap-4">
            <input
              type="text"
              value={phoneName}
              onChange={(e) => setPhoneName(e.target.value)}
              placeholder="Phone Number Name"
              className={inputStyle}
              disabled={!activeWaba}
              required
            />

            <input
              type="text"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              placeholder="Phone Number ID (from Meta)"
              className={inputStyle}
              disabled={!activeWaba}
              required
            />

            <button className={buttonStyle} disabled={!activeWaba}>
              Add Phone
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN — List Accounts */}
      <div className="bg-[#202d33] p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Managed Accounts</h2>

        {isLoading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <div className="flex flex-col gap-6">
            {accounts.map((account) => (
              <div key={account._id} className="bg-[#2a3942] p-4 rounded-lg">
                {/* Account Header */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">
                    {account.accountName}
                  </h3>
                  <button
                    onClick={() => handleDeleteAccount(account._id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <FaTrash />
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  ID: {account.businessAccountId}
                </p>

                {/* Master Sheet */}
                <div className="mt-4">
                  <label className={labelStyle}>Master Leads Sheet ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingSheetId[account._id] || ""}
                      onChange={(e) =>
                        setEditingSheetId({
                          ...editingSheetId,
                          [account._id]: e.target.value,
                        })
                      }
                      className={inputStyle}
                    />

                    <button
                      onClick={() => handleSaveMasterSheetId(account._id)}
                      className="text-white bg-sky-600 hover:bg-sky-700 rounded-lg p-2.5"
                    >
                      <FaSave />
                    </button>
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Phone Numbers:
                  </h4>

                  {account.phoneNumbers.map((phone) => (
                    <div
                      key={phone._id}
                      className="bg-[#202d33] p-3 rounded mb-2"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white">{phone.phoneNumberName}</p>
                          <p className="text-xs text-gray-400">
                            {phone.phoneNumberId}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeletePhone(phone._id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      {/* Bot Flow Selector */}
                      <div className="mt-3">
                        <label className={labelStyle}>Active Bot Flow</label>
                        <div className="flex gap-2">
                          <select
                            value={editingBotFlow[phone._id] || ""}
                            onChange={(e) =>
                              handleBotFlowChange(phone._id, e.target.value)
                            }
                            className={inputStyle}
                          >
                            <option value="">-- No Bot --</option>

                            {botFlows
                              .filter(
                                (flow) => flow.wabaAccount === account._id
                              )
                              .map((flow) => (
                                <option key={flow._id} value={flow._id}>
                                  {flow.name}
                                </option>
                              ))}
                          </select>

                          <button
                            onClick={() => handleSaveBotFlow(phone._id)}
                            className="text-white bg-sky-600 hover:bg-sky-700 rounded-lg p-2.5"
                          >
                            <FaSave />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {account.phoneNumbers.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      No phone numbers yet.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
