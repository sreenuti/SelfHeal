import { RemediationTable } from "@/components/remediation-table";

export default function RemediationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Remediation Center
        </h1>
        <p className="text-slate-400 mt-1">
          Incident knowledge base with Quick Action to redeploy
        </p>
      </div>
      <RemediationTable />
    </div>
  );
}
