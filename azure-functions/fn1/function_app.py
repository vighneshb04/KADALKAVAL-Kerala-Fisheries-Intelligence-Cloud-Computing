"""
AZURE FUNCTION fn1 — SST Anomaly Checker
==========================================
Trigger : Azure Event Hubs (kadalkaval-sensor-data)
Runtime : Python 3.11
Region  : centralindia

Deploy via Azure Portal or CLI:
  az functionapp create --resource-group kadalkaval-rg --consumption-plan-location centralindia \
    --runtime python --runtime-version 3.11 --functions-version 4 \
    --name kadalkaval-fn1 --storage-account <your-storage-acct>

  az functionapp config appsettings set --name kadalkaval-fn1 --resource-group kadalkaval-rg \
    --settings AZURE_SQL_CONNECTION_STRING="<your-conn-string>" \
               EVENTHUB_CONNECTION_STRING="<your-eventhub-conn-string>" \
               EVENTHUB_NAME="kadalkaval-sensor-data"

What it does:
  1. Triggered by each buoy reading sent to Event Hub 
  2. Writes raw sensor reading to Azure SQL sensor_readings table
  3. Checks SST against Kerala normal range (27.5–30.5 C)
  4. If anomaly → writes alert to fishing_zone_alerts table
"""
import azure.functions as func
import json, os, pyodbc, logging
from datetime import datetime, timezone

SQL_CONN = os.environ["AZURE_SQL_CONNECTION_STRING"]

app = func.FunctionApp()

@app.event_hub_message_trigger(
    arg_name="event",
    event_hub_name="kadalkaval-sensor-data",
    connection="EVENTHUB_CONNECTION_STRING",
)
def sst_anomaly_checker(event: func.EventHubEvent):
    raw     = event.get_body().decode("utf-8")
    reading = json.loads(raw)
    buoy_id = reading.get("buoy_id")
    sst     = reading.get("sst_celsius")
    wave    = reading.get("wave_height_m")
    logging.info(f"[fn1] buoy={buoy_id} sst={sst}")

    conn   = pyodbc.connect(SQL_CONN)
    cursor = conn.cursor()

    # 1. Write raw reading to sensor_readings
    cursor.execute("""
        INSERT INTO sensor_readings
            (timestamp, buoy_id, buoy_name, lat, lon,
             sst_celsius, salinity_psu, wave_height_m, wind_speed_kmh, chlorophyll)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
        reading["timestamp"],
        reading["buoy_id"],
        reading["buoy_name"],
        reading["lat"],
        reading["lon"],
        sst,
        reading["salinity_psu"],
        wave,
        reading["wind_speed_kmh"],
        reading["chlorophyll"],
    )

    # 2. Check SST anomaly
    anomaly = sst > 30.5 or sst < 27.5
    if anomaly:
        alert_type = "SST_HIGH" if sst > 30.5 else "SST_LOW"
        now        = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
            INSERT INTO fishing_zone_alerts
                (timestamp, zone_id, buoy_id, alert_type, sst_celsius,
                 lat, lon, message_en, message_ml, recommended_action)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            now,
            f"Z{reading['buoy_id']}",
            reading["buoy_id"],
            alert_type,
            sst,
            reading["lat"],
            reading["lon"],
            f"SST anomaly at {reading['buoy_name']}: {sst}°C (normal 27.5–30.5°C)",
            f"{reading['buoy_name']}: SST {sst}°C — anomaly detected",
            "AVOID_ZONE",
        )
        logging.info(f"[fn1] alert written: {alert_type} at {reading['buoy_name']}")

    conn.commit()
    conn.close()
    logging.info(f"[fn1] done: {buoy_id}")
