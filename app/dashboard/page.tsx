"use client";

import { useEffect, useState } from "react";
import { HealthCards } from "@/components/executive-dashboard/health-cards";
import { IncidentFeed, type IncidentItem } from "@/components/executive-dashboard/incident-feed";

const CATALOG = "sre_monitoring_catalog";
const SCHEMA = "monitoring_system";

function useQuery(query: string) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ columns: string[]; rows: Record<string, unknown>[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/databricks/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(new Error(b.error ?? res.statusText)));
        return res.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
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
  }, [query]);

  return { loading, data, error };
}

export default function ExecutiveDashboardPage() {
  const [healthQuery] = useState(
    `SELECT 1 as pipelines_ok, 0 as pipelines_fail, 1 as jobs_ok, 0 as jobs_fail`
  );
  const incidentsQuery = `SELECT * FROM ${CATALOG}.${SCHEMA}.pipeline_logs ORDER BY COALESCE(start_time, recorded_at, starttime) DESC LIMIT 20`;

  const health = useQuery(healthQuery);
  const incidents = useQuery(incidentsQuery);

  const healthData = health.data?.rows?.[0]
    ? {
        pipelinesOk: Number(health.data.rows[0].pipelines_ok ?? 0),
        pipelinesFail: Number(health.data.rows[0].pipelines_fail ?? 0),
        jobsOk: Number(health.data.rows[0].jobs_ok ?? 0),
        jobsFail: Number(health.data.rows[0].jobs_fail ?? 0),
      }
    : undefined;

  const incidentRows: IncidentItem[] = incidents.data?.rows
    ? (incidents.data.rows as IncidentItem[])
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Executive Dashboard
        </h1>
        <p className="text-slate-400 mt-1">System health and incident feed</p>
      </div>

      {health.error && (
        <p className="text-sm text-amber-400">
          Health data: {health.error}. Using placeholder counts.
        </p>
      )}
      <HealthCards loading={health.loading} data={healthData} />

      {incidents.error && (
        <p className="text-sm text-amber-400">
          Incident feed: {incidents.error}. Check catalog/schema and pipeline_logs table.
        </p>
      )}
      <IncidentFeed loading={incidents.loading} incidents={incidentRows} />
    </div>
  );
}
