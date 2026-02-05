"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Activity, Database } from "lucide-react";

type HealthCardsProps = {
  loading: boolean;
  data?: {
    pipelinesOk?: number;
    pipelinesFail?: number;
    jobsOk?: number;
    jobsFail?: number;
  } | null;
};

export function HealthCards({ loading, data }: HealthCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-24 bg-slate-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-slate-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pipelinesOk = data?.pipelinesOk ?? 0;
  const pipelinesFail = data?.pipelinesFail ?? 0;
  const jobsOk = data?.jobsOk ?? 0;
  const jobsFail = data?.jobsFail ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Pipelines
          </CardTitle>
          <Activity className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-100">{pipelinesOk + pipelinesFail}</span>
            <span className="text-xs text-slate-500">total</span>
          </div>
          <div className="mt-1 flex gap-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="h-3 w-3" /> {pipelinesOk}
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-3 w-3" /> {pipelinesFail}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Jobs
          </CardTitle>
          <Database className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-100">{jobsOk + jobsFail}</span>
            <span className="text-xs text-slate-500">total</span>
          </div>
          <div className="mt-1 flex gap-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="h-3 w-3" /> {jobsOk}
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-3 w-3" /> {jobsFail}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            System Health
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-emerald-400">Operational</p>
          <p className="text-xs text-slate-500 mt-1">All systems nominal</p>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            Data Quality
          </CardTitle>
          <Activity className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-slate-100">—</p>
          <p className="text-xs text-slate-500 mt-1">From monitoring_system</p>
        </CardContent>
      </Card>
    </div>
  );
}
