"""
AZURE FUNCTION fn4 — Fish Zone Scorer
======================================
Trigger : Azure Timer (every 6 hours)
Runtime : Python 3.11
Region  : centralindia

Deploy:
  az functionapp create --resource-group kadalkaval-rg --consumption-plan-location centralindia \
    --runtime python --runtime-version 3.11 --functions-version 4 \
    --name kadalkaval-fn4 --storage-account <your-storage-acct>

  az functionapp config appsettings set --name kadalkaval-fn4 --resource-group kadalkaval-rg \
    --settings AZURE_SQL_CONNECTION_STRING="<your-conn-string>"

What it does:
  1. Runs every 6 hours via Azure Timer Trigger (free)
  2. Queries Azure SQL for latest avg SST + chlorophyll per buoy (last 6 hours)
  3. Applies rule-based fish probability formula (SST optimal range + chlorophyll index)
  4. Writes ranked zone scores back to fishing_zone_alerts table
"""
import azure.functions as func
import os, pyodbc, logging
from datetime import datetime, timezone

SQL_CONN = os.environ["AZURE_SQL_CONNECTION_STRING"]

app = func.FunctionApp()

def score_zone(sst, chlorophyll):
    """
    Rule-based fish probability scoring.
    Based on Kerala oceanographic parameters:
      - Optimal SST: 27.5–30.5°C
      - Higher chlorophyll = more phytoplankton = more fish food
    """
    sst_score = max(0, 1 - abs(sst - 29.0) / 4.5)
    chl_score = min(1, chlorophyll / 4.0)
    return round(sst_score * 0.45 + chl_score * 0.55, 3)

@app.timer_trigger(
    schedule="0 0 */6 * * *",   # every 6 hours
    arg_name="mytimer",
    run_on_startup=True,
)
def fish_zone_scorer(mytimer: func.TimerRequest):
    logging.info("[fn4] Fish Zone Scorer triggered")
    conn   = pyodbc.connect(SQL_CONN)
    cursor = conn.cursor()

    # 1. Query latest avg readings per buoy (last 6 hours)
    cursor.execute("""
        SELECT buoy_id, buoy_name, lat, lon,
               ROUND(AVG(sst_celsius), 2)  AS avg_sst,
               ROUND(AVG(chlorophyll), 3)  AS avg_chlorophyll
        FROM sensor_readings
        WHERE timestamp >= DATEADD(HOUR, -6, GETUTCDATE())
        GROUP BY buoy_id, buoy_name, lat, lon
        ORDER BY buoy_id
    """)
    columns = [col[0] for col in cursor.description]
    rows    = [dict(zip(columns, row)) for row in cursor.fetchall()]

    if not rows:
        logging.warning("[fn4] No recent data in Azure SQL — is the simulator running?")
        conn.close()
        return

    # 2. Score each zone and insert back to fishing_zone_alerts
    now = datetime.now(timezone.utc).isoformat()
    for row in rows:
        sst       = row["avg_sst"]
        chl       = row["avg_chlorophyll"]
        fish_prob = score_zone(sst, chl)
        zone_status = "OPTIMAL" if fish_prob > 0.72 else ("MODERATE" if fish_prob > 0.50 else "AVOID")

        cursor.execute("""
            INSERT INTO fishing_zone_alerts
                (timestamp, zone_id, buoy_id, alert_type, sst_celsius,
                 lat, lon, message_en, message_ml, recommended_action)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            now,
            f"Z{row['buoy_id']}",
            row["buoy_id"],
            f"ZONE_SCORE_{zone_status}",
            sst,
            row["lat"],
            row["lon"],
            f"Zone {row['buoy_name']}: fish_prob={fish_prob}, status={zone_status}, SST={sst}°C, Chl={chl} mg/m³",
            f"{row['buoy_name']}: fish_prob={fish_prob}, {zone_status}",
            zone_status,
        )
        logging.info(f"[fn4] {row['buoy_name']}: fish_prob={fish_prob} → {zone_status}")

    conn.commit()
    conn.close()
    logging.info(f"[fn4] Scored {len(rows)} zones successfully")
