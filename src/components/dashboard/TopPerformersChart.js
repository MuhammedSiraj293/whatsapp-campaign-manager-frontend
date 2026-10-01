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
      case "engaged":
        return "#10b981";
      case "unresponsive":
        return "#f59e0b";
      case "new":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Performers</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#4b5563" fontSize={12} />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#4b5563"
            fontSize={12}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              color: "#111827",
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
