/**
 * Databricks SQL Warehouse integration via Statement Execution REST API 2.0.
 * Uses DATABRICKS_HOST, DATABRICKS_TOKEN, and DATABRICKS_SQL_HTTP_PATH from env.
 */

const getConfig = () => {
  const host = process.env.DATABRICKS_HOST;
  const token = process.env.DATABRICKS_TOKEN;
  const path = process.env.DATABRICKS_SQL_HTTP_PATH;
  if (!host || !token || !path) {
    throw new Error(
      "Missing Databricks config: set DATABRICKS_HOST, DATABRICKS_TOKEN, and DATABRICKS_SQL_HTTP_PATH"
    );
  }
  return { host: host.replace(/\/$/, ""), token, path };
};

export type QueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
};

/**
 * Execute a single SQL statement and return columns + rows.
 * Uses async Statement Execution API: submit, then poll until complete, then fetch result.
 */
export async function executeSql(query: string): Promise<QueryResult> {
  const { host, token, path } = getConfig();

  const submitUrl = `${host}/api/2.0/sql/statements`;
  const submitRes = await fetch(submitUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      warehouse_id: path.includes("/warehouses/") ? path.split("/warehouses/").pop()?.split("/")[0] : path,
      statement: query,
      wait_timeout: "30s",
    }),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`Databricks submit failed: ${submitRes.status} ${errText}`);
  }

  const submitJson = (await submitRes.json()) as {
    statement_id?: string;
    status?: { state: string };
    manifest?: { schema?: { columns?: { name: string }[] } };
    result?: { data_array?: unknown[][] };
  };

  const statementId = submitJson.statement_id;
  if (!statementId) {
    throw new Error("Databricks response missing statement_id");
  }

  let state = submitJson.status?.state ?? "PENDING";
  let result = submitJson.result;
  let manifest = submitJson.manifest;

  while (state === "PENDING" || state === "RUNNING") {
    await new Promise((r) => setTimeout(r, 500));
    const getUrl = `${host}/api/2.0/sql/statements/${statementId}`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!getRes.ok) {
      throw new Error(`Databricks get status failed: ${getRes.status}`);
    }
    const getJson = (await getRes.json()) as {
      status?: { state: string };
      manifest?: { schema?: { columns?: { name: string }[] } };
      result?: { data_array?: unknown[][] };
    };
    state = getJson.status?.state ?? "PENDING";
    if (getJson.result) result = getJson.result;
    if (getJson.manifest) manifest = getJson.manifest;
  }

  if (state === "FAILED" || state === "CANCELED") {
    throw new Error(`Databricks statement ${state}`);
  }

  const schemaCols = manifest?.schema;
  const columns: string[] = Array.isArray(schemaCols)
    ? (schemaCols as { name?: string }[]).map((c) => c.name ?? "")
    : (schemaCols as { columns?: { name: string }[] })?.columns?.map((c) => c.name) ?? [];
  const dataArray = result?.data_array ?? [];
  const rows: Record<string, unknown>[] = dataArray.map((arr) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = arr[i];
    });
    return obj;
  });

  return { columns, rows };
}
