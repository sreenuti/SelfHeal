# Deploy to Azure

This guide covers deploying the SRE Observability Dashboard to Azure. Choose **Azure Static Web Apps** (free, recommended) or **Azure App Service**.

---

## Option 1: Azure Static Web Apps (Free)

Static Web Apps supports Next.js with API routes via hybrid rendering. No quota limits like App Service.

### 1. Create the Static Web App in Azure Portal

1. Go to [portal.azure.com](https://portal.azure.com) → **Create a resource** → **Static Web Apps** → **Create**
2. **Basics:** Select subscription, resource group, name `selfheal-dashboard`, Plan **Free**
3. **Deployment:** Source **GitHub**, sign in, select repo `SelfHeal`, branch `main`
4. **Build:** Preset **Next.js**, App location `/`, Api location empty, Output location empty
5. **Create**

### 2. Add deployment token to GitHub

1. In Azure Portal, open your Static Web App → **Manage deployment token** → Copy token
2. In GitHub: repo **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`, Value: paste token

### 3. Configure environment variables

In Azure Portal → Static Web App → **Settings** → **Environment variables**, add:

- `DATABRICKS_HOST` – your Databricks workspace URL
- `DATABRICKS_TOKEN` – your Databricks token
- `DATABRICKS_SQL_HTTP_PATH` – SQL warehouse path

### 4. Deploy

Push to `main`. The workflow in `.github/workflows/azure-static-web-apps.yml` will build and deploy.

Site URL: `https://<app-name>.azurestaticapps.net`

---

## Option 2: Azure App Service

This guide walks through deploying to Azure App Service with Azure Databricks as the data backend.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed and logged in (`az login`)
- Node.js 18+ (for local build validation)
- Azure Databricks workspace with SQL Warehouse and `sre_monitoring_catalog`

## 1. Create the App Service

```bash
# Variables (customize these)
RESOURCE_GROUP="rg-selfheal-dashboard"
APP_NAME="selfheal-dashboard"
LOCATION="eastus"
PLAN_NAME="plan-selfheal"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan (B1 = Basic, F1 = Free tier)
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --is-linux \
  --sku B1

# Create Web App with Node 20
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --runtime "NODE:20-lts"
```

## 2. Configure environment variables

Set your Databricks credentials as App Settings:

```bash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABRICKS_HOST="https://adb-xxxxx.xx.azuredatabricks.net" \
    DATABRICKS_TOKEN="dapixxxxxxxxxxxxxxxxxxxxxxxx" \
    DATABRICKS_SQL_HTTP_PATH="/sql/2.0/warehouses/your_warehouse_id"
```

**Security tip:** For production, store secrets in [Azure Key Vault](https://docs.microsoft.com/en-us/azure/app-service/app-service-key-vault-references) and reference them in App Settings.

## 3. Set startup command

The app uses Next.js `standalone` output for a lean production build. Set the startup command:

- **Git/GitHub deploy** (Oryx builds from source):
  ```bash
  az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "cd .next/standalone && node server.js"
  ```

- **ZIP deploy** (you deploy the contents of `.next/standalone`):
  ```bash
  az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "node server.js"
  ```

## 4. Deploy the app

### Option A: Deploy from local build (ZIP)

```bash
# Build and prepare
npm install
npm run build

# Copy static assets into standalone (required for CSS/JS)
cp -r .next/static .next/standalone/.next/

# Create deployment package
cd .next/standalone
zip -r ../../deploy.zip .
cd ../..

# Deploy via ZIP
az webapp deploy \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --src-path deploy.zip \
  --type zip
```

**Windows PowerShell:**

```powershell
npm install
npm run build
Copy-Item -Recurse ".next\static" ".next\standalone\.next\"
Compress-Archive -Path ".next\standalone\*" -DestinationPath deploy.zip -Force
az webapp deploy --name $APP_NAME --resource-group $RESOURCE_GROUP --src-path deploy.zip --type zip
```

Use startup command `node server.js` for ZIP deploy (standalone contents are at app root).

### Option B: Deploy from Git/GitHub

1. Enable local Git or GitHub deployment:
   ```bash
   az webapp deployment source config-local-git --name $APP_NAME --resource-group $RESOURCE_GROUP
   ```
2. Push to the given Git URL. Azure Oryx will run `npm install` and `npm run build` automatically.
3. **Important:** With Git deploy, the startup command runs from the repo root. Oryx builds into the app directory, so `node .next/standalone/server.js` should work.

### Option C: GitHub Actions (CI/CD)

Create `.github/workflows/azure-webapp.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [main]

env:
  AZURE_WEBAPP_NAME: selfheal-dashboard

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install and build
        run: |
          npm ci
          npm run build

      - name: Prepare standalone deploy
        run: |
          cd .next/standalone
          cp -r ../static .next/
          zip -r ../../deploy.zip .

      - name: Deploy to Azure
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: deploy.zip
```

Add your App Service publish profile as a GitHub secret (`AZURE_WEBAPP_PUBLISH_PROFILE`).

## 5. Verify

```bash
az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv
```

Open `https://<your-app-name>.azurewebsites.net` and confirm the dashboard loads and Databricks queries work.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App won't start | Check logs: `az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP` |
| 502 Bad Gateway | Verify startup command is `node .next/standalone/server.js` and standalone build completed |
| Databricks connection fails | Confirm env vars are set; check firewall allows outbound HTTPS from App Service |
| Static assets 404 | Ensure `.next/static` is copied into `standalone/.next/static` before deploy |
| SCM_COMMAND_IDLE_TIMEOUT | For large builds, increase: `az webapp config set --generic-configurations '{"scmCommandIdleTimeoutInSeconds": 1200}'` |

## Scaling and cost

- **Free (F1):** Dev/test only; limits on CPU time
- **Basic (B1):** ~$13/mo; suitable for internal dashboards
- **Standard (S1+):** Auto-scale, staging slots, custom domains
