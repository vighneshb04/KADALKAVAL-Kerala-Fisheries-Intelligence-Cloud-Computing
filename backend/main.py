"""
KADALKAVAL — FastAPI Backend (Azure Edition)
=============================================
Local:  uvicorn main:app --reload --port 8000
Azure:  Set env vars AZURE_SQL_CONNECTION_STRING and AZURE_CONNECTED=true

Environment variables:
  AZURE_SQL_CONNECTION_STRING  — Azure SQL ODBC connection string
  AZURE_CONNECTED              — set to "true" to enable Azure SQL reads
"""
import os, math, random
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from sqlalchemy import text

app = FastAPI(title="KADALKAVAL API", version="2.0.0")
@app.get("/")
def root():
    return {"message": "KADALKAVAL backend running"}
@app.get("/status")
def status():
    return {"status": "ok"}
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AZURE_SQL_CONN = os.getenv("AZURE_SQL_CONNECTION_STRING", "")
USE_AZURE = False

BUOYS = [
    {"id": "B01", "name": "Trivandrum",  "lat": 8.500,  "lon": 76.950},
    {"id": "B02", "name": "Kollam",      "lat": 8.890,  "lon": 76.580},
    {"id": "B03", "name": "Alappuzha",   "lat": 9.490,  "lon": 76.330},
    {"id": "B04", "name": "Kochi",       "lat": 9.930,  "lon": 76.240},
    {"id": "B05", "name": "Thrissur",    "lat": 10.530, "lon": 76.030},
    {"id": "B06", "name": "Kozhikode",   "lat": 11.250, "lon": 75.780},
    {"id": "B07", "name": "Kannur",      "lat": 11.870, "lon": 75.370},
    {"id": "B08", "name": "Kasaragod",   "lat": 12.500, "lon": 74.990},
]
SPECIES = ["Indian Sardine", "Indian Mackerel", "Yellowfin Tuna", "Seer Fish", "Pomfret"]


# ── Simulation helpers ────────────────────────────────────────────────────────
def _sst(lat, doy):
    return round(
        (29.2 - (lat - 9.0) * 0.28)
        + 1.6 * math.sin(2 * math.pi * (doy - 55) / 365)
        + random.uniform(-0.4, 0.4),
        2,
    )

def _simulated_reading(b):
    now  = datetime.now(timezone.utc)
    doy  = now.timetuple().tm_yday
    mon  = 6 <= now.month <= 9
    sst  = _sst(b["lat"], doy)
    chl  = round(random.uniform(1.2 if mon else 0.4, 4.0 if mon else 2.8), 3)
    wave = round(random.uniform(1.4 if mon else 0.3, 4.8 if mon else 2.0), 2)
    fp   = round(min(0.95, max(0.1, (chl / 4.0) * 0.55 + (1 - abs(sst - 29) / 5) * 0.45)), 3)
    return {
        "buoy_id":        b["id"],
        "buoy_name":      b["name"],
        "lat":            b["lat"],
        "lon":            b["lon"],
        "sst_celsius":    sst,
        "salinity_psu":   round(random.uniform(31.5 if mon else 34.0, 34.0 if mon else 36.5), 2),
        "wave_height_m":  wave,
        "wind_speed_kmh": round(random.uniform(18 if mon else 4, 48 if mon else 26), 1),
        "chlorophyll":    chl,
        "fish_prob":      fp,
        "species":        SPECIES[int(fp * len(SPECIES)) % len(SPECIES)],
        "status":         "HIGH" if sst > 30.5 or sst < 27.5 else ("MEDIUM" if wave > 3 else "LOW"),
        "zone_status":    "OPTIMAL" if fp > 0.72 else ("MODERATE" if fp > 0.50 else "AVOID"),
        "timestamp":      now.isoformat(),
        "source":         "simulated",
    }


# ── Azure SQL helpers ─────────────────────────────────────────────────────────
def _get_conn():
    return None

def _sql_fetch(query, params=None):
    try:
        conn   = _get_conn()
        cursor = conn.cursor()
        cursor.execute(query, params or [])
        columns = [col[0] for col in cursor.description]
        rows    = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        print(f"Azure SQL error: {e}")
        return []

def _fetch_buoys_sql():
    rows = _sql_fetch("""
        SELECT b.buoy_id, b.buoy_name, b.lat, b.lon,
               b.sst_celsius, b.salinity_psu, b.wave_height_m,
               b.wind_speed_kmh, b.chlorophyll,
               CONVERT(varchar, b.timestamp, 127) AS timestamp,
               CASE WHEN b.sst_celsius > 30.5 OR b.sst_celsius < 27.5 THEN 'HIGH'
                    WHEN b.wave_height_m > 3 THEN 'MEDIUM' ELSE 'LOW' END AS status,
               CASE WHEN b.chlorophyll > 2.0 AND b.sst_celsius BETWEEN 27.5 AND 30.5 THEN 'OPTIMAL'
                    WHEN b.chlorophyll > 1.0 THEN 'MODERATE' ELSE 'AVOID' END AS zone_status
        FROM sensor_readings b
        INNER JOIN (
            SELECT buoy_id, MAX(timestamp) AS max_ts
            FROM sensor_readings
            WHERE CAST(timestamp AS DATE) = CAST(GETUTCDATE() AS DATE)
            GROUP BY buoy_id
        ) latest ON b.buoy_id = latest.buoy_id AND b.timestamp = latest.max_ts
        ORDER BY b.buoy_id
    """)
    for r in rows:
        chl = r.get("chlorophyll", 1) or 1
        sst = r.get("sst_celsius", 29) or 29
        fp  = round(min(0.95, max(0.1, (chl / 4.0) * 0.55 + (1 - abs(sst - 29) / 5) * 0.45)), 3)
        r["fish_prob"] = fp
        r["species"]   = SPECIES[int(fp * len(SPECIES)) % len(SPECIES)]
        r["source"]    = "azure-sql"
    return rows


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/api/status")
def status():
    return {
        "azure_connected": USE_AZURE,
        "mode": "azure-sql" if USE_AZURE else "simulated",
    }
@app.get("/api/buoys")
def get_buoys():

    buoys = [_simulated_reading(b) for b in BUOYS]

    USE_AZURE_SQL = False   # True when using Azure again

    if USE_AZURE_SQL:
        try:
            with engine.begin() as conn:
                for buoy in buoys:
                    conn.execute(text("""
                        INSERT INTO buoy_data
                        (buoy_id, buoy_name, sst, salinity, wave_height,
                         chlorophyll, fish_probability, status)
                        VALUES
                        (:buoy_id, :buoy_name, :sst, :salinity, :wave_height,
                         :chlorophyll, :fish_probability, :status)
                    """), {
                        "buoy_id": buoy["buoy_id"],
                        "buoy_name": buoy["buoy_name"],
                        "sst": buoy["sst_celsius"],
                        "salinity": buoy["salinity_psu"],
                        "wave_height": buoy["wave_height_m"],
                        "chlorophyll": buoy["chlorophyll"],
                        "fish_probability": buoy["fish_prob"],
                        "status": buoy["status"]
                    })

        except Exception as e:
            print("SQL Insert Error:", e)

    return buoys

@app.get("/api/stats")
def get_stats():
    data = get_buoys()
    return {
        "avg_sst":  round(sum(r["sst_celsius"] for r in data) / len(data), 2),
        "avg_chl":  round(sum(r["chlorophyll"]  for r in data) / len(data), 3),
        "optimal":  sum(1 for r in data if r["zone_status"] == "OPTIMAL"),
        "alerts":   sum(1 for r in data if r["status"] != "LOW"),
        "buoys":    len(data),
        "source":   data[0]["source"] if data else "unknown",
        "updated":  datetime.now(timezone.utc).isoformat(),
    }

@app.get("/api/alerts")
def get_alerts():
    if USE_AZURE:
        rows = _sql_fetch("""
            SELECT TOP 30 zone_id, buoy_id, alert_type, sst_celsius,
                          lat, lon, message_en,
                          CONVERT(varchar, timestamp, 127) AS timestamp
            FROM fishing_zone_alerts
            WHERE CAST(timestamp AS DATE) = CAST(GETUTCDATE() AS DATE)
            ORDER BY timestamp DESC
        """)
        if rows:
            return rows
    buoys = get_buoys()
    return [
        {
            "zone_id":     f"Z{b['buoy_id']}",
            "buoy_id":     b["buoy_id"],
            "alert_type":  "SST_HIGH" if b["sst_celsius"] > 30.5 else "SST_LOW" if b["sst_celsius"] < 27.5 else "WEATHER",
            "sst_celsius": b["sst_celsius"],
            "lat":         b["lat"],
            "lon":         b["lon"],
            "message_en":  f"Alert at {b['buoy_name']}: SST {b['sst_celsius']}°C, wave {b['wave_height_m']}m",
            "timestamp":   b["timestamp"],
        }
        for b in buoys if b["status"] != "LOW"
    ]

@app.get("/api/zones")
def get_zones():
    buoys = get_buoys()
    zones = [
        {
            "zone_id":    f"Z{b['buoy_id']}",
            "zone_name":  f"{b['buoy_name']} Coastal Zone",
            "lat":        b["lat"],
            "lon":        b["lon"],
            "fish_prob":  b["fish_prob"],
            "sst":        b["sst_celsius"],
            "chlorophyll": b["chlorophyll"],
            "species":    b["species"],
            "status":     b["zone_status"],
        }
        for b in buoys
    ]
    return sorted(zones, key=lambda z: z["fish_prob"], reverse=True)

@app.get("/api/history")
def get_history():
    if USE_AZURE:
        rows = _sql_fetch("""
            SELECT FORMAT(timestamp, 'dd MMM') AS date,
                   buoy_name,
                   ROUND(AVG(sst_celsius), 2) AS sst
            FROM sensor_readings
            WHERE timestamp >= DATEADD(DAY, -30, GETUTCDATE())
            GROUP BY FORMAT(timestamp, 'dd MMM'), CAST(timestamp AS DATE), buoy_name
            ORDER BY CAST(timestamp AS DATE), buoy_name
        """)
        if rows:
            from collections import defaultdict
            by_date = defaultdict(dict)
            for r in rows:
                by_date[r["date"]][r["buoy_name"]] = r["sst"]
            return [{"date": d, **vals} for d, vals in by_date.items()]
    result = []
    for i in range(30):
        d   = datetime.now() - timedelta(days=29 - i)
        doy = d.timetuple().tm_yday
        row = {"date": d.strftime("%d %b")}
        for b in BUOYS[:5]:
            row[b["name"]] = _sst(b["lat"], doy)
        result.append(row)
    return result

@app.get("/api/violations")
def get_violations():
    if USE_AZURE:
        rows = _sql_fetch("""
            SELECT TOP 20 vessel_id, lat, lon, speed_knots,
                          CONVERT(varchar, timestamp, 127) AS timestamp,
                          zone_violation_flag
            FROM vessel_detections
            WHERE zone_violation_flag = 1
            ORDER BY timestamp DESC
        """)
        if rows:
            return rows
    zones = ["Vembanad Wetland MPA", "Gulf of Mannar Buffer", "Kochi Backwaters Reserve"]
    return [
        {
            "vessel_id":   f"KL-{random.randint(100,999)}-MM",
            "zone":        zones[i % 3],
            "severity":    "HIGH" if i < 2 else "MEDIUM",
            "speed_knots": round(3 + random.random() * 9, 1),
            "lat":         round(random.uniform(8.5, 12.5), 3),
            "lon":         round(random.uniform(74.9, 77.0), 3),
            "timestamp":   (datetime.now() - timedelta(hours=random.randint(0, 23))).isoformat(),
        }
        for i in range(5)
    ]
