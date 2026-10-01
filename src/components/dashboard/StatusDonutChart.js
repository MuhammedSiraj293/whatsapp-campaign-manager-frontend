import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const StatusDonutChart = ({ data }) => {
  const chartData = [
    { name: "Engaged", value: data.engagedLeadsCount || 0, color: "#10b981" },
    { name: "Unresponsive", value: data.unresponsiveLeadsCount || 0, color: "#f59e0b" },
    { name: "New", value: data.newLeadsCount || 0, color: "#3b82f6" },
    { name: "Dead", value: data.deadLeadsCount || 0, color: "#6b7280" },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Status Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              color: "#111827",
            }}
          />
          <Legend
            wrapperStyle={{ color: "#4b5563" }}
            iconType="circle"
            formatter={(value, entry) => (
              <span style={{ color: "#4b5563" }}>
                {value}: {entry.value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusDonutChart;
