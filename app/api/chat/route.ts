import { NextRequest, NextResponse } from "next/server";
import { executeSql } from "@/lib/databricks";

export const dynamic = "force-dynamic";

const CATALOG = "sre_monitoring_catalog";
const SCHEMA = "monitoring_system";

/**
 * Simple intent-based responses: map keywords to predefined SQL or answers.
 * For production, replace with an LLM that generates SQL from natural language.
 */
function getQueryForMessage(message: string): string | null {
  const lower = message.toLowerCase().trim();
  if (lower.includes("pipeline") && (lower.includes("fail") || lower.includes("failure"))) {
    return `SELECT status, COUNT(*) as cnt FROM ${CATALOG}.${SCHEMA}.pipeline_logs WHERE LOWER(COALESCE(status, '')) LIKE '%fail%' GROUP BY status`;
  }
  if (lower.includes("pipeline") && (lower.includes("recent") || lower.includes("last"))) {
    return `SELECT * FROM ${CATALOG}.${SCHEMA}.pipeline_logs ORDER BY COALESCE(start_time, recorded_at, starttime) DESC LIMIT 10`;
  }
  if (lower.includes("metric") || lower.includes("cpu") || lower.includes("memory")) {
    return `SELECT timestamp as ts, cpu_pct, mem_pct FROM ${CATALOG}.${SCHEMA}.system_metrics ORDER BY timestamp DESC LIMIT 20`;
  }
  if (lower.includes("incident") || lower.includes("knowledge")) {
    return `SELECT * FROM ${CATALOG}.${SCHEMA}.incident_knowledge_base LIMIT 10`;
  }
  return null;
}

function formatResult(columns: string[], rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "No rows returned.";
  const header = columns.join(" | ");
  const sep = columns.map(() => "---").join(" | ");
  const body = rows
    .slice(0, 50)
    .map((r) => columns.map((c) => String(r[c] ?? "null")).join(" | "))
    .join("\n");
  return ["```", header, sep, body, "```"].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body as { message?: string };
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'message' in body" },
        { status: 400 }
      );
    }
    const query = getQueryForMessage(message);
    if (!query) {
      return NextResponse.json({
        reply:
          "I can answer questions about pipeline failures, recent pipelines, metrics (CPU/Memory), and incidents. Try: \"Recent pipeline failures\" or \"Show metrics\".",
      });
    }
    const { columns, rows } = await executeSql(query);
    const reply = formatResult(columns, rows);
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
