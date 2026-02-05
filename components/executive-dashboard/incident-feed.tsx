"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, AlertTriangle } from "lucide-react";

export type IncidentItem = {
  id?: string;
  timestamp?: string;
  status?: string;
  message?: string;
  pipeline_name?: string;
  [key: string]: unknown;
};

type IncidentFeedProps = {
  loading: boolean;
  incidents: IncidentItem[] | null;
};

function formatTime(val: unknown): string {
  if (val == null) return "—";
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleString();
  }
  return String(val);
}

export function IncidentFeed({ loading, incidents }: IncidentFeedProps) {
  if (loading) {
    return (
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-slate-200">Incident Feed</CardTitle>
          <CardContent className="p-0 pt-4">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-slate-800 p-3">
                  <Skeleton className="h-5 w-5 shrink-0 rounded bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 bg-slate-700" />
                    <Skeleton className="h-3 w-full bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CardHeader>
      </Card>
    );
  }

  const list = Array.isArray(incidents) ? incidents : [];
  const hasFailure = (s: unknown) =>
    String(s).toLowerCase().includes("fail") ||
    String(s).toLowerCase().includes("error") ||
    String(s) === "FAILED";

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-slate-200">Incident Feed</CardTitle>
        <p className="text-sm text-slate-500">Recent pipeline_logs</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[340px] pr-4">
          <div className="space-y-2">
            {list.length === 0 ? (
              <p className="text-sm text-slate-500">No recent incidents</p>
            ) : (
              list.map((inc, i) => {
                const status = inc.status ?? inc.run_status ?? "";
                const failed = hasFailure(status);
                const msg = inc.message ?? inc.error_message ?? inc.remediation_steps ?? inc.log_message ?? "—";
                const ts = inc.timestamp ?? inc.start_time ?? inc.recorded_at ?? inc.starttime ?? inc.log_ts ?? inc.run_ts ?? inc.ts;
                return (
                  <div
                    key={inc.id ?? i}
                    className="flex gap-3 rounded-lg border border-slate-800 bg-slate-800/30 p-3"
                  >
                    {failed ? (
                      <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                    ) : (
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400">{formatTime(ts)}</p>
                      <p className="text-sm font-medium text-slate-200">
                        {String(inc.pipeline_name ?? inc.pipeline_id ?? "Pipeline")}
                      </p>
                      <p className="text-xs text-slate-400 truncate" title={String(msg)}>
                        {String(msg)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
