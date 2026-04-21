import React, { useState, useEffect } from "react";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { FaSave, FaCommentDots } from "react-icons/fa";


export default function AutoReply() {
  const { activeWaba } = useWaba();
  // const { user } = useContext(AuthContext); // Unused
  // const [isLoading, setIsLoading] = useState(false); // Unused
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState("");

  // Config State
  const [config, setConfig] = useState({
    greetingEnabled: true,
    greetingText: "",
  });

  const fetchPhones = React.useCallback(async () => {
    try {
      const res = await authFetch("/waba/accounts"); // Or a more specific endpoint if needed
      if (res.success) {
        // Flatten to find all phones for the active WABA
        const account = res.data.find((a) => a._id === activeWaba);
        if (account && account.phoneNumbers) {
          setPhoneNumbers(account.phoneNumbers);
          if (account.phoneNumbers.length > 0) {
            setSelectedPhone(account.phoneNumbers[0].phoneNumberId);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeWaba]);

  const fetchConfig = React.useCallback(async (phoneId) => {
    try {
      const res = await authFetch(`/auto-reply/${phoneId}`);
      if (res.success && res.data) {
        setConfig({
          greetingEnabled: res.data.greetingEnabled ?? true,
          greetingText: res.data.greetingText || "",
        });
      }
    } catch (err) {
      console.error("Error loading config", err);
    }
  }, []);

  // Load Phone Numbers for the active WABA to allow selection
  useEffect(() => {
    if (activeWaba) {
      fetchPhones();
    }
  }, [activeWaba, fetchPhones]);

  // Load Config when a phone is selected
  useEffect(() => {
    if (selectedPhone) {
      fetchConfig(selectedPhone);
    }
  }, [selectedPhone, fetchConfig]);

  const handleSave = async () => {
    try {
      const res = await authFetch("/auto-reply", {
        method: "POST",
        body: JSON.stringify({
          phoneNumberId: selectedPhone,
          ...config,
        }),
      });
      if (res.success) {
        alert("Settings Saved!");
      } else {
        alert("Error saving settings");
      }
    } catch (err) {
      alert(err.message);
    }
  };


  const inputStyle =
    "bg-[#202d33] border border-gray-600 text-white text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";
  const toggleStyle =
    "w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600";

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#111b21] text-white">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaCommentDots /> Automation Settings
      </h1>

      {/* Phone Selector */}
      <div className="mb-8">
        <label className="block mb-2 text-sm font-medium text-gray-300">
          Select Phone Number
        </label>
        <select
          value={selectedPhone}
          onChange={(e) => setSelectedPhone(e.target.value)}
          className={inputStyle}
        >
          {phoneNumbers.map((p) => (
            <option key={p.phoneNumberId} value={p.phoneNumberId}>
              {p.phoneNumberName} ({p.phoneNumberId})
            </option>
          ))}
        </select>
      </div>

      {/* Greeting Message */}
      <div className="max-w-xl">
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FaCommentDots className="text-emerald-400" /> Greeting Message
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.greetingEnabled}
                onChange={(e) =>
                  setConfig({ ...config, greetingEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className={toggleStyle}></div>
            </label>
          </div>
          <p className="text-xs text-gray-400 mb-2">
            Sent to new customers or after 24 hours of inactivity.
          </p>
          <textarea
            rows="3"
            value={config.greetingText}
            onChange={(e) =>
              setConfig({ ...config, greetingText: e.target.value })
            }
            disabled={!config.greetingEnabled}
            className={`${inputStyle} ${
              !config.greetingEnabled ? "opacity-50" : ""
            }`}
            placeholder="Type your greeting message..."
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
        >
          <FaSave size={24} />
        </button>
      </div>
    </div>
  );
}
