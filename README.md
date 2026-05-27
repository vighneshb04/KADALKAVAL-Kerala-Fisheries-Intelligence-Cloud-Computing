  # KADALKAVAL — Azure Edition
  ### Sea Guardian: Sustainable Fisheries Monitoring System for the Kerala Coastline

  > Built on **Microsoft Azure** using 4 cloud components — works entirely within Azure Student Pack ($100 free credits).

  ---

  ## Architecture

  ```
  simulator.py (real SST + weather APIs)
      │
      ▼
  Azure Event Hubs ──────── fn1: SST Anomaly Checker ──────┐
  (Component 1)    ──────── fn3: Vessel Violation Detector ─┤
                                                            ▼
  Azure Timer ──────────── fn2: Weather Alert Broadcaster ──► Azure SQL Database
              ──────────── fn4: Fish Zone Scorer ───────────► (Component 2)
                                                            │
                                                (Component 3: Azure Functions)
                                                            │
                                                            ▼
                                                Azure App Service (Component 4)
                                                FastAPI Backend + React Dashboard
  ```

  ## 4 Azure Components

  | # | Component | Purpose | Tier |
  |---|-----------|---------|------|
  | 1 | **Azure Event Hubs** | Real-time message broker — receives buoy sensor data from simulator.py every 5 min, triggers fn1 and fn3 | Basic |
  | 2 | **Azure SQL Database** | Stores all sensor readings, weather alerts, vessel detections, and fish zone scores | Basic (5 DTU) |
  | 3 | **Azure Functions** | 4 serverless functions: SST checker, weather alerts, vessel violations, fish zone scorer | Consumption (pay-per-use, free tier) |
  | 4 | **Azure App Service** | Hosts the FastAPI backend API + React dashboard | F1 (Free) |

  ## 4 Azure Functions

  | ID | Function | Trigger | What it does |
  |----|----------|---------|-------------|
  | fn1 | SST Anomaly Checker | Event Hub (`kadalkaval-sensor-data`) | Writes buoy readings to SQL; detects SST outside 27.5–30.5°C |
  | fn2 | Weather Alert Broadcaster | Timer (every hour) | Fetches live weather from Open-Meteo; writes STORM/CYCLONE/HIGH_WAVE alerts |
  | fn3 | Vessel Violation Detector | Event Hub (`kadalkaval-ais-data`) | Checks vessel position against Kerala MPAs using Haversine formula |
  | fn4 | Fish Zone Scorer | Timer (every 6 hours) | Scores each buoy zone by SST + chlorophyll; ranks optimal fishing areas |

  ## Real Data Sources

  - **Sea Surface Temperature**: NASA ERDDAP (jplMURSST41 dataset) — no API key
  - **Wave height + Wind speed**: Open-Meteo Marine API — no API key
  - **Salinity + Chlorophyll**: Scientific formula fallback (no free real-time API exists)

  ---

  ## Setup — Step by Step

  ### Prerequisites

  ```bash
  # Install Azure CLI
  # Windows: winget install Microsoft.AzureCLI
  # macOS:   brew install azure-cli
  # Linux:   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

  # Install Azure Functions Core Tools
  npm install -g azure-functions-core-tools@4

  # Install Python 3.11
  # Install ODBC Driver 18 for SQL Server:
  # https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
  ```

  ### Step 1 — Activate Azure Student Pack

  1. Go to **https://azure.microsoft.com/en-us/free/students**
  2. Sign in with your college email
  3. Complete student verification
  4. You get **$100 in Azure credits** — no credit card needed

  ```bash
  az login
  az group create --name kadalkaval-rg --location centralindia
  az configure --defaults group=kadalkaval-rg location=centralindia
  ```

  ---

  ### Step 2 — Azure Event Hubs (Component 1)

  ```bash
  # Create namespace
  az eventhubs namespace create \
    --name kadalkaval-ns \
    --resource-group kadalkaval-rg \
    --location centralindia \
    --sku Basic

  # Create Event Hub for buoy sensor data (triggers fn1)
  az eventhubs eventhub create \
    --name kadalkaval-sensor-data \
    --namespace-name kadalkaval-ns \
    --resource-group kadalkaval-rg

  # Create Event Hub for AIS vessel data (triggers fn3)
  az eventhubs eventhub create \
    --name kadalkaval-ais-data \
    --namespace-name kadalkaval-ns \
    --resource-group kadalkaval-rg

  # Get connection string — SAVE THIS
  az eventhubs namespace authorization-rule keys list \
    --resource-group kadalkaval-rg \
    --namespace-name kadalkaval-ns \
    --name RootManageSharedAccessKey \
    --query primaryConnectionString -o tsv
  ```

  ---

  ### Step 3 — Azure SQL Database (Component 2)

  ```bash
  # Create SQL Server
  az sql server create \
    --name kadalkaval-sqlserver \
    --resource-group kadalkaval-rg \
    --location centralindia \
    --admin-user kadalkaval \
    --admin-password "YourStrongPass123!"

  # Create database (Basic tier — cheapest)
  az sql db create \
    --resource-group kadalkaval-rg \
    --server kadalkaval-sqlserver \
    --name kadalkaval-db \
    --edition Basic \
    --capacity 5

  # Allow Azure services to connect
  az sql server firewall-rule create \
    --resource-group kadalkaval-rg \
    --server kadalkaval-sqlserver \
    --name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

  # Allow your local IP
  MY_IP=$(curl -s https://api.ipify.org)
  az sql server firewall-rule create \
    --resource-group kadalkaval-rg \
    --server kadalkaval-sqlserver \
    --name AllowMyIP \
    --start-ip-address $MY_IP \
    --end-ip-address $MY_IP

  # Get connection string — SAVE THIS
  az sql db show-connection-string \
    --server kadalkaval-sqlserver \
    --name kadalkaval-db \
    --client odbc
  ```

  Then open **portal.azure.com → SQL databases → kadalkaval-db → Query editor**.  
  Log in and paste + run the entire contents of `sql/schema_and_queries.sql`.

  ---

  ### Step 4 — Azure Functions (Component 3)

  ```bash
  # Create shared storage account
  az storage account create \
    --name kadalkavalstore \
    --resource-group kadalkaval-rg \
    --location centralindia \
    --sku Standard_LRS

  # Replace these placeholders in all commands below:
  #   <SQL_CONN>    = your ODBC connection string from Step 3
  #   <EH_CONN>     = your Event Hubs connection string from Step 2

  # ── fn1: SST Anomaly Checker ──────────────────────────────────
  az functionapp create \
    --resource-group kadalkaval-rg \
    --consumption-plan-location centralindia \
    --runtime python --runtime-version 3.11 \
    --functions-version 4 \
    --name kadalkaval-fn1 \
    --storage-account kadalkavalstore \
    --os-type linux

  az functionapp config appsettings set --name kadalkaval-fn1 \
    --resource-group kadalkaval-rg \
    --settings \
    AZURE_SQL_CONNECTION_STRING="<SQL_CONN>" \
    EVENTHUB_CONNECTION_STRING="<EH_CONN>"

  cd azure-functions/fn1
  func azure functionapp publish kadalkaval-fn1
  cd ../..

  # ── fn2: Weather Alert Broadcaster ───────────────────────────
  az functionapp create \
    --resource-group kadalkaval-rg \
    --consumption-plan-location centralindia \
    --runtime python --runtime-version 3.11 \
    --functions-version 4 \
    --name kadalkaval-fn2 \
    --storage-account kadalkavalstore \
    --os-type linux

  az functionapp config appsettings set --name kadalkaval-fn2 \
    --resource-group kadalkaval-rg \
    --settings AZURE_SQL_CONNECTION_STRING="<SQL_CONN>"

  cd azure-functions/fn2
  func azure functionapp publish kadalkaval-fn2
  cd ../..

  # ── fn3: Vessel Violation Detector ───────────────────────────
  az functionapp create \
    --resource-group kadalkaval-rg \
    --consumption-plan-location centralindia \
    --runtime python --runtime-version 3.11 \
    --functions-version 4 \
    --name kadalkaval-fn3 \
    --storage-account kadalkavalstore \
    --os-type linux

  az functionapp config appsettings set --name kadalkaval-fn3 \
    --resource-group kadalkaval-rg \
    --settings \
    AZURE_SQL_CONNECTION_STRING="<SQL_CONN>" \
    AIS_EVENTHUB_CONNECTION_STRING="<EH_CONN>"

  cd azure-functions/fn3
  func azure functionapp publish kadalkaval-fn3
  cd ../..

  # ── fn4: Fish Zone Scorer ─────────────────────────────────────
  az functionapp create \
    --resource-group kadalkaval-rg \
    --consumption-plan-location centralindia \
    --runtime python --runtime-version 3.11 \
    --functions-version 4 \
    --name kadalkaval-fn4 \
    --storage-account kadalkavalstore \
    --os-type linux

  az functionapp config appsettings set --name kadalkaval-fn4 \
    --resource-group kadalkaval-rg \
    --settings AZURE_SQL_CONNECTION_STRING="<SQL_CONN>"

  cd azure-functions/fn4
  func azure functionapp publish kadalkaval-fn4
  cd ../..
  ```

  ---

  ### Step 5 — Azure App Service (Component 4)

  ```bash
  # Create Free App Service plan
  az appservice plan create \
    --name kadalkaval-plan \
    --resource-group kadalkaval-rg \
    --location centralindia \
    --sku F1 \
    --is-linux

  # ── Backend: FastAPI API ──────────────────────────────────────
  az webapp create \
    --resource-group kadalkaval-rg \
    --plan kadalkaval-plan \
    --name kadalkaval-backend \
    --runtime "PYTHON:3.11"

  az webapp config appsettings set \
    --resource-group kadalkaval-rg \
    --name kadalkaval-backend \
    --settings \
    AZURE_CONNECTED="true" \
    AZURE_SQL_CONNECTION_STRING="<SQL_CONN>" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true

  # Package and deploy backend
  cd backend
  zip -r ../backend.zip . --exclude "__pycache__/*" "*.pyc"
  cd ..
  az webapp deployment source config-zip \
    --resource-group kadalkaval-rg \
    --name kadalkaval-backend \
    --src backend.zip

  # ── Frontend: React Dashboard ─────────────────────────────────
  cd frontend
  echo "VITE_API_URL=https://kadalkaval-backend.azurewebsites.net" > .env.production
  npm install
  npm run build

  cd dist
  zip -r ../../frontend.zip .
  cd ../..

  az webapp create \
    --resource-group kadalkaval-rg \
    --plan kadalkaval-plan \
    --name kadalkaval-frontend

  az webapp deployment source config-zip \
    --resource-group kadalkaval-rg \
    --name kadalkaval-frontend \
    --src frontend.zip
  ```

  **Live URLs after deploy:**
  - Dashboard: `https://kadalkaval-frontend.azurewebsites.net`
  - API:       `https://kadalkaval-backend.azurewebsites.net/api/status`

  ---

  ### Step 6 — Run Locally

  Open 3 terminals:

  ```bash
  # Terminal 1 — FastAPI Backend
  cd backend
  pip install fastapi uvicorn pyodbc requests
  AZURE_CONNECTED=true \
  AZURE_SQL_CONNECTION_STRING="Driver={ODBC Driver 18 for SQL Server};Server=tcp:kadalkaval-sqlserver.database.windows.net,1433;Database=kadalkaval-db;Uid=kadalkaval;Pwd=YourStrongPass123!;Encrypt=yes;TrustServerCertificate=no;" \
  uvicorn main:app --reload --port 8000

  # Terminal 2 — Buoy Simulator (publishes to Event Hubs every 5 min)
  cd backend
  pip install requests azure-eventhub
  AZURE_EVENTHUB_CONNECTION_STRING="Endpoint=sb://kadalkaval-ns.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=..." \
  python simulator.py --eventhub kadalkaval-sensor-data --interval 300

  # Terminal 3 — React Frontend
  cd frontend
  npm install
  npm run dev
  # Open: http://localhost:5173

  # Verify Azure connection:
  curl http://localhost:8000/api/status
  # Expected: {"azure_connected": true, "mode": "azure-sql"}
  ```

  ---

  ## Project Structure

  ```
  KADALKAVAL_AZURE/
  ├── backend/
  │   ├── main.py           ← FastAPI backend (reads Azure SQL)
  │   ├── simulator.py      ← Buoy simulator (publishes to Event Hubs)
  │   └── requirements.txt
  │
  ├── azure-functions/
  │   ├── fn1/              ← SST Anomaly Checker (Event Hub trigger)
  │   │   ├── function_app.py
  │   │   └── requirements.txt
  │   ├── fn2/              ← Weather Alert Broadcaster (Timer trigger, hourly)
  │   │   ├── function_app.py
  │   │   └── requirements.txt
  │   ├── fn3/              ← Vessel Violation Detector (Event Hub trigger)
  │   │   ├── function_app.py
  │   │   └── requirements.txt
  │   └── fn4/              ← Fish Zone Scorer (Timer trigger, every 6h)
  │       ├── function_app.py
  │       └── requirements.txt
  │
  ├── frontend/             ← React dashboard (UI unchanged)
  │   ├── src/
  │   │   ├── pages/
  │   │   │   ├── Dashboard.jsx
  │   │   │   ├── FishZones.jsx
  │   │   │   ├── SSTTrends.jsx
  │   │   │   ├── Alerts.jsx
  │   │   │   ├── Vessels.jsx
  │   │   │   └── CloudSetup.jsx   ← Azure setup guide (updated)
  │   │   └── ...
  │   └── package.json
  │
  └── sql/
      └── schema_and_queries.sql    ← Azure SQL tables + analytical queries
  ```

  ---

  ## Environment Variables Reference

  ### backend/.env (create this file locally)
  ```
  AZURE_CONNECTED=true
  AZURE_SQL_CONNECTION_STRING=Driver={ODBC Driver 18 for SQL Server};Server=tcp:kadalkaval-sqlserver.database.windows.net,1433;Database=kadalkaval-db;Uid=kadalkaval;Pwd=YourStrongPass123!;Encrypt=yes;TrustServerCertificate=no;
  ```

  ### Simulator
  ```
  AZURE_EVENTHUB_CONNECTION_STRING=Endpoint=sb://kadalkaval-ns.servicebus.windows.net/;SharedAccessKeyName=...;SharedAccessKey=...
  ```

  ### Each Azure Function (set via portal or CLI)
  ```
  AZURE_SQL_CONNECTION_STRING=<same ODBC string>
  EVENTHUB_CONNECTION_STRING=<same Event Hubs string>  # fn1 only
  AIS_EVENTHUB_CONNECTION_STRING=<same string>         # fn3 only
  ```

  ---

  ## SDGs Addressed

  | SDG | Connection |
  |-----|-----------|
  | SDG 2 — Zero Hunger | Fish zone predictions support sustainable catch for fishing communities |
  | SDG 13 — Climate Action | SST anomaly monitoring tracks ocean warming effects |
  | SDG 14 — Life Below Water | Vessel violation detection protects Marine Protected Areas |
  | SDG 1 — No Poverty | Early weather alerts protect livelihoods of 1.1M Kerala fisherfolk |
