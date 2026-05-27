"""
AZURE FUNCTION fn2 — Weather Alert Broadcaster
================================================
Trigger : Azure Timer (runs every hour via cron)
Runtime : Python 3.11
Region  : centralindia

Deploy:
  az functionapp create --resource-group kadalkaval-rg --consumption-plan-location centralindia \
    --runtime python --runtime-version 3.11 --functions-version 4 \
    --name kadalkaval-fn2 --storage-account <your-storage-acct>

  az functionapp config appsettings set --name kadalkaval-fn2 --resource-group kadalkaval-rg \
    --settings AZURE_SQL_CONNECTION_STRING="<your-conn-string>"

What it does:
  1. Runs every hour (Azure Timer Trigger — free)
  2. Fetches REAL live weather from Open-Meteo marine API for 8 Kerala districts (no API key)
  3. Classifies alert: CYCLONE / STORM / HIGH_WAVE / CLEAR
  4. Writes alert to Azure SQL fishing_zone_alerts table
"""
import azure.functions as func
import json, os, pyodbc, logging, requests
from datetime import datetime, timezone

SQL_CONN = os.environ["AZURE_SQL_CONNECTION_STRING"]

KERALA_DISTRICTS = [
    {"name": "Thiruvananthapuram", "lat": 8.50,  "lon": 76.95},
    {"name": "Kollam",             "lat": 8.89,  "lon": 76.58},
    {"name": "Alappuzha",          "lat": 9.49,  "lon": 76.33},
    {"name": "Ernakulam",          "lat": 9.93,  "lon": 76.24},
    {"name": "Thrissur",           "lat": 10.53, "lon": 76.03},
    {"name": "Kozhikode",          "lat": 11.25, "lon": 75.78},
    {"name": "Kannur",             "lat": 11.87, "lon": 75.37},
    {"name": "Kasaragod",          "lat": 12.50, "lon": 74.99},
]

ALERT_MESSAGES = {
    "CYCLONE":   "Cyclone warning. Do not go to sea.",
    "STORM":     "Storm warning. Return to shore immediately.",
    "HIGH_WAVE": "High wave warning. Sea conditions dangerous.",
    "CLEAR":     "Sea conditions normal. Safe for fishing.",
}

app = func.FunctionApp()

def fetch_real_weather(lat, lon):
    try:
        url = (
            f"https://marine-api.open-meteo.com/v1/marine"
            f"?latitude={lat}&longitude={lon}"
            f"&current=wave_height,wind_speed_10m"
            f"&wind_speed_unit=kmh"
        )
        resp    = requests.get(url, timeout=10)
        resp.raise_for_status()
        current = resp.json().get("current", {})
        return {
            "wind_speed_kmh": round(float(current.get("wind_speed_10m", 0)), 1),
            "wave_height_m":  round(float(current.get("wave_height", 0)), 2),
        }
    except Exception as e:
        logging.warning(f"[fn2] Open-Meteo failed for ({lat},{lon}): {e}")
        return None

def classify_alert(wind_kmh, wave_m):
    if wind_kmh >= 89:
        return "CYCLONE"
    elif wind_kmh >= 62 or wave_m >= 3.5:
        return "STORM"
    elif wind_kmh >= 40 or wave_m >= 2.0:
        return "HIGH_WAVE"
    return "CLEAR"

@app.timer_trigger(
    schedule="0 0 * * * *",   # every hour
    arg_name="mytimer",
    run_on_startup=True,
)
def weather_alert_broadcaster(mytimer: func.TimerRequest):
    logging.info("[fn2] Fetching real weather for all Kerala districts...")
    conn   = pyodbc.connect(SQL_CONN)
    cursor = conn.cursor()
    now    = datetime.now(timezone.utc).isoformat()
    count  = 0

    for district in KERALA_DISTRICTS:
        weather = fetch_real_weather(district["lat"], district["lon"])
        if weather is None:
            logging.warning(f"[fn2] Skipping {district['name']} — API unavailable")
            continue

        wind       = weather["wind_speed_kmh"]
        wave       = weather["wave_height_m"]
        alert_type = classify_alert(wind, wave)
        msg_en     = ALERT_MESSAGES[alert_type]

        logging.info(f"[fn2] {district['name']}: wind={wind}km/h wave={wave}m → {alert_type}")

        cursor.execute("""
            INSERT INTO fishing_zone_alerts
                (timestamp, zone_id, buoy_id, alert_type, sst_celsius,
                 lat, lon, message_en, message_ml, recommended_action)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            now,
            f"WEATHER_{district['name'].upper().replace(' ', '_')}",
            "WEATHER",
            alert_type,
            0.0,
            district["lat"],
            district["lon"],
            f"[{district['name']}] {msg_en} Wind: {wind} km/h, Wave: {wave} m (Open-Meteo live data)",
            f"[{district['name']}] {msg_en}",
            "AVOID_SEA" if alert_type != "CLEAR" else "SAFE",
        )
        count += 1

    conn.commit()
    conn.close()
    logging.info(f"[fn2] Done. {count}/{len(KERALA_DISTRICTS)} districts processed.")
