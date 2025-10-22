// frontend/src/pages/Integrations.js

import React, { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import { FaTrash, FaPlus, FaSave } from "react-icons/fa";

export default function Integrations() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for the new WABA account form
  const [accountName, setAccountName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");

  // State for the new Phone Number form
  const [phoneName, setPhoneName] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [selectedWaba, setSelectedWaba] = useState("");

  // --- NEW: State to manage editing the Master Sheet ID ---
  const [editingSheetId, setEditingSheetId] = useState({});

  const inputStyle =
    "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";
  const labelStyle = "block mb-2 text-sm font-medium text-gray-400";
  const buttonStyle =
    "text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const data = await authFetch("/waba/accounts");
      if (data.success) {
        setAccounts(data.data);
        // Initialize the editing state with current values
        const sheetIdState = {};
        data.data.forEach((acc) => {
          sheetIdState[acc._id] = acc.masterSpreadsheetId || "";
        });
        setEditingSheetId(sheetIdState);
      }
    } catch (error) {
      console.error("Error fetching WABA accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await authFetch("/waba/accounts", {
        method: "POST",
        body: JSON.stringify({ accountName, accessToken, businessAccountId }),
      });
      alert("WABA account added successfully!");
      fetchAccounts();
      setAccountName("");
      setAccessToken("");
      setBusinessAccountId("");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddPhone = async (e) => {
    e.preventDefault();
    if (!selectedWaba) {
      alert("Please select a WABA account to add this phone to.");
      return;
    }
    try {
      await authFetch("/waba/phones", {
        method: "POST",
        body: JSON.stringify({
          phoneNumberName: phoneName,
          phoneNumberId: phoneId,
          wabaAccount: selectedWaba,
        }),
      });
      alert("Phone number added successfully!");
      fetchAccounts();
      setPhoneName("");
      setPhoneId("");
      setSelectedWaba("");
    } catch (error) {
      alert(error.message);
    }
  };

  // --- NEW: Function to save the Master Sheet ID ---
  const handleSaveMasterSheetId = async (accountId) => {
    const sheetId = editingSheetId[accountId];
    try {
      await authFetch(`/waba/accounts/${accountId}`, {
        method: "PUT",
        body: JSON.stringify({ masterSpreadsheetId: sheetId }),
      });
      alert("Master Sheet ID updated successfully!");
      fetchAccounts(); // Refresh data
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this account AND all its phone numbers?"
      )
    )
      return;
    try {
      await authFetch(`/waba/accounts/${id}`, { method: "DELETE" });
      alert("Account deleted.");
      fetchAccounts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeletePhone = async (id) => {
    if (!window.confirm("Are you sure you want to delete this phone number?"))
      return;
    try {
      await authFetch(`/waba/phones/${id}`, { method: "DELETE" });
      alert("Phone number deleted.");
      fetchAccounts();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full">
      {/* Column 1: Add New Accounts/Phones */}
      <div className="flex flex-col gap-8">
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">
            Add New WABA Account
          </h2>
          <form onSubmit={handleAddAccount} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Account Name (e.g., Client A)"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Permanent Access Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Business Account ID"
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
              className={inputStyle}
              required
            />
            <button type="submit" className={buttonStyle}>
              Save Account
            </button>
          </form>
        </div>

        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">
            Add Phone Number to Account
          </h2>
          <form onSubmit={handleAddPhone} className="flex flex-col gap-4">
            <select
              value={selectedWaba}
              onChange={(e) => setSelectedWaba(e.target.value)}
              className={inputStyle}
              required
            >
              <option value="">-- Select WABA Account --</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountName}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Phone Number Name (e.g., Sales Team)"
              value={phoneName}
              onChange={(e) => setPhoneName(e.target.value)}
              className={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Phone Number ID"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              className={inputStyle}
              required
            />
            <button type="submit" className={buttonStyle}>
              Save Phone Number
            </button>
          </form>
        </div>
      </div>

      {/* Column 2: View Existing Accounts */}
      <div className="bg-[#202d33] p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Managed Accounts</h2>
        {isLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="flex flex-col gap-6">
            {accounts.map((account) => (
              <div key={account._id} className="bg-[#2a3942] p-4 rounded-lg">
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

                {/* --- NEW MASTER SHEET ID INPUT --- */}
                <div className="mt-4">
                  <label className={labelStyle}>Master Leads Sheet ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste Master Sheet ID here..."
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

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Phone Numbers:
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {account.phoneNumbers.map((phone) => (
                      <li
                        key={phone._id}
                        className="flex justify-between items-center bg-[#202d33] p-2 rounded"
                      >
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
                      </li>
                    ))}
                  </ul>
                  {account.phoneNumbers.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No phone numbers added to this account yet.
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
