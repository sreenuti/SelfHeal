"use client";

import { useEffect, useState } from "react";
import { MetricsChart, type MetricPoint } from "@/components/metrics-chart";

const CATALOG = "sre_monitoring_catalog";
const SCHEMA = "monitoring_system";

export default function MetricsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query = `SELECT timestamp as ts, cpu_pct, mem_pct FROM ${CATALOG}.${SCHEMA}.system_metrics ORDER BY timestamp ASC LIMIT 500`;
    fetch("/api/databricks/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => {
        if (!res.ok)
          return res.json().then((b) => Promise.reject(new Error(b.error ?? res.statusText)));
        return res.json();
      })
      .then((d: { rows?: Record<string, unknown>[] }) => {
        if (!cancelled && Array.isArray(d.rows)) setData(d.rows as MetricPoint[]);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Request failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Metrics
        </h1>
        <p className="text-slate-400 mt-1">
          CPU and Memory from system_metrics. Memory spike (mem_pct &gt; 85%) highlighted.
        </p>
      </div>
      {error && (
        <p className="text-sm text-amber-400">
          {error}. Ensure {CATALOG}.{SCHEMA}.system_metrics exists.
        </p>
      )}
      <MetricsChart data={data} loading={loading} />
    </div>
  );
}
