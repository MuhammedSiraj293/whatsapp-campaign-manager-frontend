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
    { name: "Hot", value: data.hotLeadsCount || 0, color: "#ef4444" },
    { name: "Warm", value: data.warmLeadsCount || 0, color: "#f97316" },
    { name: "Cold", value: data.coldLeadsCount || 0, color: "#3b82f6" },
    { name: "Dead", value: data.deadLeadsCount || 0, color: "#6b7280" },
  ];

  return (
    <div className="bg-[#202d33] p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-white mb-4">
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
              backgroundColor: "#2a3942",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Legend
            wrapperStyle={{ color: "#9ca3af" }}
            iconType="circle"
            formatter={(value, entry) => (
              <span style={{ color: "#9ca3af" }}>
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
