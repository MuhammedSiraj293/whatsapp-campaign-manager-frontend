import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const TrendChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Engagement Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorEngaged" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorUnresponsive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#4b5563" fontSize={12} />
          <YAxis stroke="#4b5563" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              color: "#111827",
            }}
          />
          <Legend wrapperStyle={{ color: "#9ca3af" }} iconType="circle" />
          <Area
            type="monotone"
            dataKey="avgScore"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorScore)"
            name="Avg Score"
          />
          <Area
            type="monotone"
            dataKey="engagedCount"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorEngaged)"
            name="Engaged"
          />
          <Area
            type="monotone"
            dataKey="unresponsiveCount"
            stroke="#f59e0b"
            fillOpacity={1}
            fill="url(#colorUnresponsive)"
            name="Unresponsive"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
