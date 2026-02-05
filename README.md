# SRE Observability Dashboard

Next.js dashboard for SRE observability with Databricks `sre_monitoring_catalog` integration.

## Setup

1. Copy env and configure Databricks:

   ```bash
   cp .env.example .env.local
   ```

   In `.env.local` set:

   - `DATABRICKS_HOST` – workspace URL (e.g. `https://your-workspace.cloud.databricks.com`)
   - `DATABRICKS_TOKEN` – personal access token
   - `DATABRICKS_SQL_HTTP_PATH` – SQL warehouse HTTP path or warehouse ID (from SQL Warehouses → Connection details)

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000); the app redirects to `/dashboard`.

## Features

- **Executive Dashboard** – System health cards and incident feed from `pipeline_logs`
- **Metrics** – CPU/Memory line chart from `system_metrics` with spike highlight when `mem_pct > 85`
- **AI Genie** – Chat interface; intent-based queries run SQL against the monitoring catalog
- **Remediation Center** – Table of `incident_knowledge_base` with Quick Action calling `POST /api/redeploy`

## Schema

Expected catalog/schema: `sre_monitoring_catalog.monitoring_system` with tables:

- `pipeline_logs` – incident feed (e.g. `ts`/`log_ts`, `status`/`run_status`, `message`, `pipeline_name`)
- `system_metrics` – `ts`, `cpu_pct`, `mem_pct`
- `incident_knowledge_base` – remediation entries (e.g. `failure_type`, `description`, `suggested_action`, `last_updated`)

## API

- `POST /api/databricks/query` – body `{ "query": "SELECT ..." }` – runs SQL via Databricks Statement Execution API
- `POST /api/chat` – body `{ "message": "..." }` – AI Genie (intent-based SQL)
- `POST /api/redeploy` – body `{ "id"?, "failure_type"? }` – stub for redeploy pipeline; replace with your logic

## Deployment

See [DEPLOYMENT_AZURE.md](./DEPLOYMENT_AZURE.md) for deploying to Azure App Service with Azure Databricks.

## Tech

- Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, Lucide icons.
