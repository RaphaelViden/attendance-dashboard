"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  label: string;
  attendance: number;
}

interface AttendanceLast30DaysProps {
  rawData?: { date: string; attendance: number }[];
}

/* ── Custom tooltip matching the spec exactly ── */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="attendance-chart-tooltip">
      <span className="att-tooltip-date">{point.label}</span>
      <span className="att-tooltip-value">
        attendance : {point.attendance}
      </span>
    </div>
  );
}

/* ── Custom dot renderer ── */
function RenderDot(props: Record<string, unknown>) {
  const { cx, cy } = props as { cx: number; cy: number };
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill="#1E3A8A"
      stroke="#1E3A8A"
      strokeWidth={0}
    />
  );
}

function RenderActiveDot(props: Record<string, unknown>) {
  const { cx, cy } = props as { cx: number; cy: number };
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#1E3A8A"
      stroke="#1E3A8A"
      strokeWidth={0}
    />
  );
}

/* ── Main component ── */
export default function AttendanceLast30Days({
  rawData,
}: AttendanceLast30DaysProps) {
  const data = useMemo<DataPoint[]>(() => {
    if (rawData && rawData.length > 0) {
      return rawData.map((item) => {
        const d = new Date(item.date + "T00:00:00");
        return {
          date: item.date,
          label: new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "2-digit",
          }).format(d),
          attendance: item.attendance,
        };
      });
    }

    /* Fallback: generate 30 days of data ending today */
    const points: DataPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      points.push({
        date: iso,
        label: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
        }).format(d),
        attendance: 0,
      });
    }
    return points;
  }, [rawData]);

  /* Build tick values: every 5 days + last day */
  const tickValues = useMemo(() => {
    const ticks: string[] = [];
    data.forEach((item, idx) => {
      if (idx % 5 === 0 || idx === data.length - 1) {
        ticks.push(item.label);
      }
    });
    return ticks;
  }, [data]);

  return (
    <div className="attendance-chart-card">
      <div className="attendance-chart-header">
        <h2 className="attendance-chart-title">
          Attendance — Last 30 Days
        </h2>
        <p className="attendance-chart-subtitle">
          Unique employees who tapped per day.
        </p>
      </div>

      <div className="attendance-chart-body">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={data}
            margin={{ top: 12, right: 16, bottom: 4, left: -8 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E5E7EB"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={{ stroke: "#1E3A8A", strokeWidth: 1 }}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              ticks={tickValues}
              interval="preserveStartEnd"
              dy={8}
            />
            <YAxis
              domain={[0, 4]}
              ticks={[0, 1, 2, 3, 4]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              dx={-4}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "transparent" }}
            />
            <Line
              type="monotone"
              dataKey="attendance"
              stroke="#1E3A8A"
              strokeWidth={2}
              dot={<RenderDot />}
              activeDot={<RenderActiveDot />}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
