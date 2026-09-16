"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { day: "Day 1", ideal: 40, actual: 40 },
  { day: "Day 3", ideal: 32, actual: 36 },
  { day: "Day 5", ideal: 24, actual: 26 },
  { day: "Day 7", ideal: 16, actual: 18 },
  { day: "Day 9", ideal: 8, actual: 9 },
  { day: "Day 10", ideal: 0, actual: 2 },
];

export function BurndownChart() {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Sprint 4 Burndown Trajectory</h3>
          <p className="text-xs text-muted-foreground">Remaining story points vs. ideal linear velocity</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f8fafc",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            <Line
              type="monotone"
              dataKey="ideal"
              name="Ideal Guideline"
              stroke="#64748b"
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Burn"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#3b82f6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
