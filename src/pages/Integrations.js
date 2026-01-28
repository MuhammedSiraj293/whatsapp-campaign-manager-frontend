// frontend/src/pages/Integrations.js
import React, { useState, useEffect, useCallback, useContext } from "react";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { AuthContext } from "../context/AuthContext";
import {
  FaTrash,
  FaSave,
  FaEdit,
  FaTimes,
  FaPlus,
  FaRobot,
  FaWhatsapp,
} from "react-icons/fa";

export default function Integrations() {
  const [accounts, setAccounts] = useState([]);
  const [botFlows, setBotFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { activeWaba } = useWaba();
  const { user } = useContext(AuthContext);

  // Form states (Add New)
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountName: "",
    accessToken: "",
    businessAccountId: "",
  });

  const [showAddPhone, setShowAddPhone] = useState(null); // stores accountId to show form for
  const [newPhone, setNewPhone] = useState({
    phoneName: "",
    phoneId: "",
  });

  // Edit States (Map ID -> Data)
  const [editingAccount, setEditingAccount] = useState(null); // ID of account being edited
  const [editAccountData, setEditAccountData] = useState({});

  const [editingPhone, setEditingPhone] = useState(null); // ID of phone being edited
  const [editPhoneData, setEditPhoneData] = useState({});

  // ---------------------------------------------
  // Data Fetching
  // ---------------------------------------------
  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Get Accounts
      const accountsRes = await authFetch("/waba/accounts");
      if (accountsRes.success) {
        setAccounts(accountsRes.data);
      }
      // 2. Get Flows (if active waba, or just get all? The API is by WABA usually)
      // We will try to fetch flows for the *first* account if no active one, or just when needed.
      // For now, let's just fetch for the active one to populate the dropdowns correctly if context matches.
      // ideally we need ALL flows for ALL accounts to show in dropdowns properly.
      // existing code fetched only for activeWaba. Let's stick effectively to that or iterate.
      if (activeWaba) {
        const flowRes = await authFetch(`/bot-flows/waba/${activeWaba}`);
        if (flowRes.success) setBotFlows(flowRes.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWaba, user]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ---------------------------------------------
  // Handlers - Accounts
  // ---------------------------------------------
  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await authFetch("/waba/accounts", {
        method: "POST",
        body: JSON.stringify(newAccount),
      });
      alert("WABA account added!");
      setNewAccount({
        accountName: "",
        accessToken: "",
        businessAccountId: "",
      });
      setShowAddAccount(false);
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateAccount = async (id) => {
    try {
      await authFetch(`/waba/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(editAccountData),
      });
      alert("Account updated!");
      setEditingAccount(null);
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Delete this account and all phone numbers?")) return;
    try {
      await authFetch(`/waba/accounts/${id}`, { method: "DELETE" });
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------------------------------------------
  // Handlers - Phones
  // ---------------------------------------------
  const handleAddPhone = async (e, accountId) => {
    e.preventDefault();
    try {
      await authFetch("/waba/phones", {
        method: "POST",
        body: JSON.stringify({
          phoneNumberName: newPhone.phoneName,
          phoneNumberId: newPhone.phoneId,
          wabaAccount: accountId,
        }),
      });
      alert("Phone number added!");
      setNewPhone({ phoneName: "", phoneId: "" });
      setShowAddPhone(null);
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePhone = async (id, data) => {
    // data can be passed explicitly (for toggles) or use state (for full edit)
    const payload = data || editPhoneData;
    try {
      await authFetch(`/waba/phones/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!data) {
        // if it was a manual edit (not a toggle), close edit mode
        alert("Phone details updated!");
        setEditingPhone(null);
        fetchAllData();
      } else {
        // quiet update for toggles
        fetchAllData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePhone = async (id) => {
    if (!window.confirm("Delete this phone number?")) return;
    try {
      await authFetch(`/waba/phones/${id}`, { method: "DELETE" });
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------------------------------------------
  // Embedded Signup
  // ---------------------------------------------
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  useEffect(() => {
    const initFacebook = () => {
      if (window.FB) {
        window.FB.init({
          appId: process.env.REACT_APP_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v20.0",
        });
        setIsSdkLoaded(true);
      }
    };
    if (window.FB) initFacebook();
    else {
      window.fbAsyncInit = initFacebook;
      if (!document.getElementById("facebook-jssdk")) {
        const js = document.createElement("script");
        js.id = "facebook-jssdk";
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        document.body.appendChild(js);
      }
    }
  }, []);

  const launchWhatsAppSignup = () => {
    if (!window.FB) return alert("SDK loading...");
    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          handleEmbeddedSignup(response.authResponse.code);
        }
      },
      {
        config_id: process.env.REACT_APP_FACEBOOK_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {} },
      },
    );
  };

  const handleEmbeddedSignup = async (code) => {
    try {
      const res = await authFetch("/waba/connect", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (res.success) {
        alert("Connected Successfully!");
        fetchAllData();
      } else {
        alert("Connection failed: " + res.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // ---------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------
  const inputClass =
    "bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5";
  const btnPrimary =
    "text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-4 py-2 transition-colors flex items-center gap-2";
  const btnSecondary =
    "text-white bg-slate-600 hover:bg-slate-500 font-medium rounded-lg text-sm px-4 py-2 transition-colors flex items-center gap-2";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Integrations
            </h1>
            <p className="text-slate-400 mt-1">
              Manage your WhatsApp Business Accounts and Phone Numbers
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={launchWhatsAppSignup}
              className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
              disabled={!isSdkLoaded}
            >
              <FaWhatsapp className="text-xl" />
              Connect with Facebook
            </button>
            <button
              onClick={() => setShowAddAccount(!showAddAccount)}
              className={btnPrimary}
            >
              <FaPlus />
              Manual Connect
            </button>
          </div>
        </div>

        {/* MANUAL ADD FORM (Collapsible) */}
        {showAddAccount && (
          <div className="bg-slate-800 rounded-xl p-6 border border-emerald-500/30 shadow-2xl animate-fade-in-down">
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">
              Add New WABA Account
            </h3>
            <form
              onSubmit={handleAddAccount}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Business"
                  className={inputClass}
                  value={newAccount.accountName}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      accountName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Business ID
                </label>
                <input
                  type="text"
                  placeholder="123456789..."
                  className={inputClass}
                  value={newAccount.businessAccountId}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      businessAccountId: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">
                  Permanent Access Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="EAAG..."
                    className={inputClass}
                    value={newAccount.accessToken}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        accessToken: e.target.value,
                      })
                    }
                    required
                  />
                  <button type="submit" className={btnPrimary}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAccount(false)}
                    className={btnSecondary}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ACCOUNTS LIST */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-500 animate-pulse">
            Loading accounts...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {accounts.map((acc) => (
              <div
                key={acc._id}
                className="bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-all shadow-lg overflow-hidden"
              >
                {/* ACCOUNT HEADER / EDIT MODE */}
                <div className="p-5 bg-slate-800/50 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {editingAccount === acc._id ? (
                    // EDIT MODE
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      <input
                        className={inputClass}
                        value={editAccountData.accountName}
                        onChange={(e) =>
                          setEditAccountData({
                            ...editAccountData,
                            accountName: e.target.value,
                          })
                        }
                        placeholder="Name"
                      />
                      <input
                        className={inputClass}
                        value={editAccountData.businessAccountId}
                        onChange={(e) =>
                          setEditAccountData({
                            ...editAccountData,
                            businessAccountId: e.target.value,
                          })
                        }
                        placeholder="Business ID"
                      />
                      <input
                        className={inputClass}
                        value={editAccountData.masterSpreadsheetId || ""}
                        onChange={(e) =>
                          setEditAccountData({
                            ...editAccountData,
                            masterSpreadsheetId: e.target.value,
                          })
                        }
                        placeholder="Spreadsheet ID"
                      />
                      <div className="md:col-span-3">
                        <input
                          className={inputClass}
                          value={editAccountData.accessToken}
                          onChange={(e) =>
                            setEditAccountData({
                              ...editAccountData,
                              accessToken: e.target.value,
                            })
                          }
                          placeholder="Access Token"
                        />
                      </div>
                      <div className="flex gap-2 md:col-span-3 justify-end">
                        <button
                          onClick={() => handleUpdateAccount(acc._id)}
                          className={btnPrimary}
                        >
                          <FaSave /> Save
                        </button>
                        <button
                          onClick={() => setEditingAccount(null)}
                          className={btnSecondary}
                        >
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold text-white tracking-tight">
                            {acc.accountName}
                          </h2>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                            ID: {acc.businessAccountId}
                          </span>
                        </div>
                        {acc.masterSpreadsheetId && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <span className="opacity-50">Sheet:</span>{" "}
                            {acc.masterSpreadsheetId}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingAccount(acc._id);
                            setEditAccountData(acc);
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                          title="Edit Account"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc._id)}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete Account"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* PHONE NUMBERS SECTION */}
                <div className="p-5 bg-[#1e293b]/50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                      Phone Numbers
                    </h3>
                    <button
                      onClick={() =>
                        setShowAddPhone(
                          showAddPhone === acc._id ? null : acc._id,
                        )
                      }
                      className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      <FaPlus /> Add Phone
                    </button>
                  </div>

                  {/* ADD PHONE FORM */}
                  {showAddPhone === acc._id && (
                    <div className="bg-slate-900/50 p-4 rounded-lg mb-4 border border-slate-600 animate-fade-in">
                      <form
                        onSubmit={(e) => handleAddPhone(e, acc._id)}
                        className="flex flex-col md:flex-row gap-3 items-end"
                      >
                        <div className="flex-1">
                          <label className="text-xs text-slate-500">
                            Display Name
                          </label>
                          <input
                            className={inputClass}
                            placeholder="Sales Number"
                            value={newPhone.phoneName}
                            onChange={(e) =>
                              setNewPhone({
                                ...newPhone,
                                phoneName: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-slate-500">
                            Phone ID
                          </label>
                          <input
                            className={inputClass}
                            placeholder="10034..."
                            value={newPhone.phoneId}
                            onChange={(e) =>
                              setNewPhone({
                                ...newPhone,
                                phoneId: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <button className={btnPrimary}>Add</button>
                      </form>
                    </div>
                  )}

                  {/* NUMBERS LIST */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {acc.phoneNumbers.map((phone) => (
                      <div
                        key={phone._id}
                        className="bg-slate-900 rounded-lg p-4 border border-slate-700 flex flex-col gap-3"
                      >
                        {/* PHONE HEADER */}
                        <div className="flex justify-between items-start">
                          {editingPhone === phone._id ? (
                            <div className="flex-1 space-y-2 mr-2">
                              <input
                                className={inputClass}
                                value={editPhoneData.phoneNumberName}
                                onChange={(e) =>
                                  setEditPhoneData({
                                    ...editPhoneData,
                                    phoneNumberName: e.target.value,
                                  })
                                }
                              />
                              <input
                                className={inputClass}
                                value={editPhoneData.phoneNumberId}
                                onChange={(e) =>
                                  setEditPhoneData({
                                    ...editPhoneData,
                                    phoneNumberId: e.target.value,
                                  })
                                }
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  size="sm"
                                  onClick={() => handleUpdatePhone(phone._id)}
                                  className="text-xs bg-emerald-600 text-white px-2 py-1 rounded"
                                >
                                  Save
                                </button>
                                <button
                                  size="sm"
                                  onClick={() => setEditingPhone(null)}
                                  className="text-xs bg-slate-600 text-white px-2 py-1 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h4 className="font-bold text-white">
                                {phone.phoneNumberName}
                              </h4>
                              <p className="text-xs text-slate-500 font-mono">
                                {phone.phoneNumberId}
                              </p>
                            </div>
                          )}

                          {!editingPhone && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingPhone(phone._id);
                                  setEditPhoneData(phone);
                                }}
                                className="text-slate-500 hover:text-white p-1"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeletePhone(phone._id)}
                                className="text-slate-500 hover:text-red-500 p-1"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* ACTIONS / TOGGLES */}
                        <div className="pt-3 border-t border-slate-700/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <FaRobot /> AI Assistant
                            </div>
                            <Toggle
                              checked={phone.isAiEnabled}
                              onChange={(e) =>
                                handleUpdatePhone(phone._id, {
                                  isAiEnabled: e.target.checked,
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-300 pl-6">
                              Follow-up
                            </div>
                            <Toggle
                              checked={phone.isFollowUpEnabled}
                              onChange={(e) =>
                                handleUpdatePhone(phone._id, {
                                  isFollowUpEnabled: e.target.checked,
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-300 pl-6">
                              Review
                            </div>
                            <Toggle
                              checked={phone.isReviewEnabled}
                              onChange={(e) =>
                                handleUpdatePhone(phone._id, {
                                  isReviewEnabled: e.target.checked,
                                })
                              }
                            />
                          </div>

                          {/* BOT FLOW */}
                          <div className="pt-2">
                            <select
                              className="bg-slate-800 border border-slate-600 text-xs rounded block w-full p-2 text-slate-300"
                              value={phone.activeBotFlow || ""}
                              onChange={(e) =>
                                handleUpdatePhone(phone._id, {
                                  activeBotFlow: e.target.value,
                                })
                              }
                            >
                              <option value="">-- No Bot Flow --</option>
                              {botFlows
                                .filter((f) => f.wabaAccount === acc._id)
                                .map((f) => (
                                  <option key={f._id} value={f._id}>
                                    {f.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    {acc.phoneNumbers.length === 0 && (
                      <div className="p-4 text-center text-slate-500 text-sm italic">
                        No phone numbers
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                <h2 className="text-xl text-slate-400 font-semibold">
                  No Accounts Connected
                </h2>
                <p className="text-slate-500 mt-2">
                  Connect with Facebook or add manually to get started
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple Reusable Toggle Component
function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked || false}
        onChange={onChange}
      />
      <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
    </label>
  );
}
