import React, { useState, useEffect, useContext } from "react";
import { authFetch } from "../services/api";
import { useWaba } from "../context/WabaContext";
import { AuthContext } from "../context/AuthContext";
import { FaSave, FaClock, FaCommentDots, FaBusinessTime } from "react-icons/fa";

export default function AutoReply() {
  const { activeWaba } = useWaba();
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState("");

  // Config State
  const [config, setConfig] = useState({
    greetingEnabled: true,
    greetingText: "",
    awayMessageEnabled: false,
    awayMessageText: "",
    officeHoursEnabled: false,
    officeHours: [],
    timezone: "UTC",
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Load Phone Numbers for the active WABA to allow selection
  useEffect(() => {
    if (activeWaba) {
      fetchPhones();
    }
  }, [activeWaba]);

  // Load Config when a phone is selected
  useEffect(() => {
    if (selectedPhone) {
      fetchConfig(selectedPhone);
    }
  }, [selectedPhone]);

  const fetchPhones = async () => {
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
  };

  const fetchConfig = async (phoneId) => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/auto-reply/${phoneId}`);
      if (res.success && res.data) {
        // Ensure officeHours array is populated for all days if empty
        let loadedConfig = res.data;
        if (
          !loadedConfig.officeHours ||
          loadedConfig.officeHours.length === 0
        ) {
          loadedConfig.officeHours = daysOfWeek.map((day) => ({
            day,
            startTime: "09:00",
            endTime: "17:00",
            isOpen: true,
          }));
        } else {
          // Merge with defaults if missing days
          const mergedHours = daysOfWeek.map((day) => {
            const existing = loadedConfig.officeHours.find(
              (h) => h.day === day
            );
            return (
              existing || {
                day,
                startTime: "09:00",
                endTime: "17:00",
                isOpen: true,
              }
            );
          });
          loadedConfig.officeHours = mergedHours;
        }
        setConfig(loadedConfig);
      }
    } catch (err) {
      console.error("Error loading config", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const updateOfficeHour = (index, field, value) => {
    const newHours = [...config.officeHours];
    newHours[index][field] = value;
    setConfig({ ...config, officeHours: newHours });
  };

  const inputStyle =
    "bg-[#202d33] border border-gray-600 text-white text-sm rounded-lg focus:ring-emerald-500 block w-full p-2.5";
  const toggleStyle =
    "w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600";

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#111b21] text-white">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaBusinessTime /> Automation Settings
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Greeting & Away Message */}
        <div className="flex flex-col gap-6">
          {/* Greeting */}
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

          {/* Away Message */}
          <div className="bg-[#202d33] p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaClock className="text-amber-400" /> Away Message
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.awayMessageEnabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      awayMessageEnabled: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className={toggleStyle}></div>
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Sent when you are closed (outside Office Hours).
            </p>
            <textarea
              rows="3"
              value={config.awayMessageText}
              onChange={(e) =>
                setConfig({ ...config, awayMessageText: e.target.value })
              }
              disabled={!config.awayMessageEnabled}
              className={`${inputStyle} ${
                !config.awayMessageEnabled ? "opacity-50" : ""
              }`}
              placeholder="Type your away message..."
            />
          </div>
        </div>

        {/* Office Hours */}
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FaBusinessTime className="text-blue-400" /> Office Hours
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.officeHoursEnabled}
                onChange={(e) =>
                  setConfig({ ...config, officeHoursEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className={toggleStyle}></div>
            </label>
          </div>

          <div
            className={`space-y-4 ${
              !config.officeHoursEnabled ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {config.officeHours.map((slot, index) => (
              <div
                key={slot.day}
                className="flex items-center justify-between bg-[#111b21] p-3 rounded"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={slot.isOpen}
                    onChange={(e) =>
                      updateOfficeHour(index, "isOpen", e.target.checked)
                    }
                    className="w-4 h-4 text-emerald-600 rounded bg-gray-700 border-gray-600 focus:ring-emerald-500"
                  />
                  <span className="w-24 text-sm font-medium">{slot.day}</span>
                </div>

                {slot.isOpen ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        updateOfficeHour(index, "startTime", e.target.value)
                      }
                      className="bg-gray-800 text-white text-xs rounded p-1"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        updateOfficeHour(index, "endTime", e.target.value)
                      }
                      className="bg-gray-800 text-white text-xs rounded p-1"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-red-400 uppercase font-bold tracking-wider">
                    Closed
                  </span>
                )}
              </div>
            ))}
          </div>
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
