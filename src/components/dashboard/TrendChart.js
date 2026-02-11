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
    <div className="bg-[#202d33] p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-white mb-4">
        Engagement Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorHot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorWarm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#2a3942",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
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
            dataKey="hotCount"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorHot)"
            name="Hot Leads"
          />
          <Area
            type="monotone"
            dataKey="warmCount"
            stroke="#f97316"
            fillOpacity={1}
            fill="url(#colorWarm)"
            name="Warm Leads"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
