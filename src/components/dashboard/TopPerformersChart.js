import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const TopPerformersChart = ({ data }) => {
  const getBarColor = (status) => {
    switch (status?.toLowerCase()) {
      case "hot":
        return "#ef4444";
      case "warm":
        return "#f97316";
      case "cold":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="bg-[#202d33] p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-white mb-4">Top Performers</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9ca3af" fontSize={12} />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#9ca3af"
            fontSize={12}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#2a3942",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value, name, props) => [
              value,
              `Score (${props.payload.replied} replies)`,
            ]}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopPerformersChart;
