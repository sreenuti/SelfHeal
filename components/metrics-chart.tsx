"use client";

import { useMemo } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export type MetricPoint = {
  ts: string;
  timestamp?: string;
  cpu_pct?: number;
  mem_pct?: number;
  cpu?: number;
  mem?: number;
  [key: string]: unknown;
};

const MEM_THRESHOLD = 85;

function toNum(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

function formatTs(v: string): string {
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

type MetricsChartProps = {
  data: MetricPoint[];
  loading?: boolean;
};

export function MetricsChart({ data, loading }: MetricsChartProps) {
  const chartData = useMemo(() => {
    return data.map((row) => {
      const ts = (row.ts ?? row.timestamp ?? "") as string;
      const cpu = toNum(row.cpu_pct ?? row.cpu);
      const mem = toNum(row.mem_pct ?? row.mem);
      return {
        time: formatTs(ts),
        fullTs: ts,
        cpu,
        mem,
        memSpike: mem > MEM_THRESHOLD,
      };
    });
  }, [data]);

  if (loading || chartData.length === 0) {
    return (
      <div className="h-[400px] w-full rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-500">
        {loading ? "Loading metrics…" : "No data"}
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={chartData}
          margin={{ top: 28, right: 20, left: 0, bottom: 36 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            interval="preserveStartEnd"
            label={{
              value: "Time",
              position: "insideBottom",
              offset: -10,
              fill: "#94a3b8",
              fontSize: 12,
            }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value: number) => [`${value}%`, ""]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullTs
                ? new Date(payload[0].payload.fullTs).toLocaleString()
                : ""
            }
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span className="text-slate-300">{value}</span>}
          />
          <ReferenceLine
            y={MEM_THRESHOLD}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: "Mem spike threshold (85%)", fill: "#f87171" }}
          />
          <Line
            type="monotone"
            dataKey="cpu"
            name="CPU %"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="mem"
            name="Memory %"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={({ payload }) =>
              payload.memSpike ? (
                <circle r={4} fill="#ef4444" stroke="#fca5a5" strokeWidth={2} />
              ) : (
                <circle r={2} fill="#f59e0b" />
              )
            }
            connectNulls
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
