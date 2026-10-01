import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const KPICard = ({ title, value, subtitle, icon, color = "blue", trend }) => {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100 text-blue-600 border border-blue-200",
    green: "from-emerald-50 to-emerald-100 text-emerald-600 border border-emerald-200",
    orange: "from-orange-50 to-orange-100 text-orange-600 border border-orange-200",
    red: "from-red-50 to-red-100 text-red-600 border border-red-200",
  };

  const bgColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">
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
        <div className="text-4xl font-bold text-gray-900">{value}</div>
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
