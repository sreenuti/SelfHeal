"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Loader2 } from "lucide-react";

export type IncidentRow = {
  id?: string;
  failure_type?: string;
  description?: string;
  suggested_action?: string;
  last_updated?: string;
  [key: string]: unknown;
};

function formatCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function RemediationTable() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query = `SELECT * FROM sre_monitoring_catalog.monitoring_system.incident_knowledge_base LIMIT 100`;
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
      .then((d: { columns?: string[]; rows?: Record<string, unknown>[] }) => {
        if (!cancelled && Array.isArray(d.rows)) setRows(d.rows as IncidentRow[]);
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

  const onQuickAction = async (row: IncidentRow) => {
    const key = (row.incident_id ?? row.id ?? row.failure_type ?? "") as string;
    if (!key) return;
    setActioning(key);
    try {
      const res = await fetch("/api/redeploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.incident_id ?? row.id, failure_type: row.error_signature ?? row.failure_type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Redeploy failed");
      alert(data.message ?? "Redeploy triggered.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Redeploy failed");
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <Skeleton className="h-8 w-48 mb-4 bg-slate-700" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <p className="text-amber-400">Failed to load: {error}</p>
      </div>
    );
  }

  const columns = rows.length > 0 ? Object.keys(rows[0]) : ["failure_type", "description", "suggested_action", "last_updated"];
  const displayCols = columns.filter(
    (c) => !["id", "created_at", "updated_at"].includes(c)
  );
  const primary = ["incident_id", "error_signature", "failure_type"].find((c) => displayCols.includes(c));
  if (primary && displayCols[0] !== primary) displayCols.unshift(...displayCols.splice(displayCols.indexOf(primary), 1));

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="w-10 text-slate-400"> </TableHead>
            {displayCols.map((col) => (
              <TableHead key={col} className="text-slate-400">
                {col.replace(/_/g, " ")}
              </TableHead>
            ))}
            <TableHead className="w-32 text-slate-400">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={displayCols.length + 2} className="text-slate-500 text-center py-8">
                No incidents in knowledge base
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => (
              <TableRow key={row.id ?? i} className="border-slate-800">
                <TableCell className="text-slate-500">
                  <AlertTriangle className="h-4 w-4" />
                </TableCell>
                {displayCols.map((col) => (
                  <TableCell key={col} className="text-slate-300 max-w-xs truncate">
                    {formatCell(row[col])}
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    onClick={() => onQuickAction(row)}
                    disabled={actioning !== null}
                  >
                    {actioning === (row.incident_id ?? row.id ?? row.failure_type) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Quick Action"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
