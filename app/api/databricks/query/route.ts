import { NextRequest, NextResponse } from "next/server";
import { executeSql } from "@/lib/databricks";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body as { query?: string };
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'query' in body" },
        { status: 400 }
      );
    }
    const trimmed = query.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Query is empty" }, { status: 400 });
    }
    const { columns, rows } = await executeSql(trimmed);
    return NextResponse.json({ columns, rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Databricks query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
