"""
AZURE FUNCTION fn3 — Vessel Violation Detector
===============================================
Trigger : Azure Event Hubs (kadalkaval-ais-data)
Runtime : Python 3.11
Region  : centralindia

Deploy:
  az functionapp create --resource-group kadalkaval-rg --consumption-plan-location centralindia \
    --runtime python --runtime-version 3.11 --functions-version 4 \
    --name kadalkaval-fn3 --storage-account <your-storage-acct>

  az functionapp config appsettings set --name kadalkaval-fn3 --resource-group kadalkaval-rg \
    --settings AZURE_SQL_CONNECTION_STRING="<your-conn-string>" \
               AIS_EVENTHUB_CONNECTION_STRING="<your-ais-eventhub-conn-string>" \
               AIS_EVENTHUB_NAME="kadalkaval-ais-data"

Test: send a JSON event to the kadalkaval-ais-data Event Hub:
  {"vessel_id": "KL-123-MM", "lat": 9.62, "lon": 76.29, "speed_knots": 6.5}

What it does:
  1. Triggered by vessel AIS position events on the ais-data Event Hub
  2. Uses Haversine formula to check if vessel is inside any Kerala MPA
  3. Logs every position to vessel_detections table
  4. If violation → writes alert to fishing_zone_alerts table
"""
import azure.functions as func
import json, os, pyodbc, logging, math
from datetime import datetime, timezone

SQL_CONN = os.environ["AZURE_SQL_CONNECTION_STRING"]

PROTECTED_ZONES = [
    {"name": "Vembanad Wetland MPA",     "lat": 9.60,  "lon": 76.30, "radius_km": 10},
    {"name": "Gulf of Mannar Buffer",    "lat": 8.70,  "lon": 77.50, "radius_km": 15},
    {"name": "Kochi Backwaters Reserve", "lat": 9.93,  "lon": 76.24, "radius_km": 5},
]

app = func.FunctionApp()

def haversine_km(lat1, lon1, lat2, lon2):
    R    = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a    = (math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))

@app.event_hub_message_trigger(
    arg_name="event",
    event_hub_name="kadalkaval-ais-data",
    connection="AIS_EVENTHUB_CONNECTION_STRING",
)
def vessel_violation_detector(event: func.EventHubEvent):
    raw       = event.get_body().decode("utf-8")
    vessel    = json.loads(raw)
    vessel_id = vessel.get("vessel_id", "UNKNOWN")
    vlat      = vessel.get("lat", 0)
    vlon      = vessel.get("lon", 0)
    speed     = vessel.get("speed_knots", 0)
    logging.info(f"[fn3] checking vessel {vessel_id} at ({vlat}, {vlon})")

    # Check each MPA
    violated_zone = None
    dist_km       = None
    for zone in PROTECTED_ZONES:
        d = haversine_km(vlat, vlon, zone["lat"], zone["lon"])
        if d <= zone["radius_km"]:
            violated_zone = zone
            dist_km       = round(d, 2)
            break

    conn   = pyodbc.connect(SQL_CONN)
    cursor = conn.cursor()
    now    = datetime.now(timezone.utc).isoformat()

    # Always log vessel position
    cursor.execute("""
        INSERT INTO vessel_detections
            (timestamp, vessel_id, lat, lon, speed_knots, zone_violation_flag)
        VALUES (?, ?, ?, ?, ?, ?)
    """, now, vessel_id, vlat, vlon, speed, 1 if violated_zone else 0)

    # Write violation alert if inside MPA
    if violated_zone:
        severity = "HIGH" if dist_km < violated_zone["radius_km"] * 0.4 else "MEDIUM"
        cursor.execute("""
            INSERT INTO fishing_zone_alerts
                (timestamp, zone_id, buoy_id, alert_type, sst_celsius,
                 lat, lon, message_en, message_ml, recommended_action)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            now,
            violated_zone["name"].upper().replace(" ", "_"),
            "VESSEL",
            "VESSEL_VIOLATION",
            0.0,
            vlat,
            vlon,
            f"Vessel {vessel_id} detected in {violated_zone['name']} ({dist_km} km from center). Severity: {severity}",
            f"Vessel {vessel_id}: {violated_zone['name']} — violation",
            "NOTIFY_AUTHORITIES",
        )
        logging.info(f"[fn3] VIOLATION: {vessel_id} in {violated_zone['name']} — {severity}")
    else:
        logging.info(f"[fn3] no violation: {vessel_id}")

    conn.commit()
    conn.close()
