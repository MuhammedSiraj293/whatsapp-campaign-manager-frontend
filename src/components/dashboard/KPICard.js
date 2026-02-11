import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const KPICard = ({ title, value, subtitle, icon, color = "blue", trend }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
  };

  const bgColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-[#202d33] p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wide">
            {title}
          </p>
        </div>
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-4xl font-bold text-white">{value}</div>
      </div>

      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}

      {trend && (
        <div
          className={`flex items-center gap-1 mt-2 text-sm ${trend.direction === "up" ? "text-green-400" : "text-red-400"}`}
        >
          {trend.direction === "up" ? (
            <FaArrowUp size={12} />
          ) : (
            <FaArrowDown size={12} />
          )}
          <span>{trend.value}</span>
          <span className="text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default KPICard;
