"""
KADALKAVAL — Buoy Simulator (Azure Edition)
============================================
Fetches REAL weather data from Open-Meteo (free, no API key)
Fetches REAL SST data from NASA ERDDAP (free, no API key)
Falls back to formula if APIs are down.

Publishes readings to Azure Event Hubs (Component 1).

Local test (no Azure):
  python simulator.py --local --interval 5

With Azure:
  python simulator.py --interval 300

Install deps:
  pip install requests azure-eventhub
"""
import argparse, json, math, random, time, requests
from datetime import datetime, timezone

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


# ── Real weather from Open-Meteo (free, no API key) ───────────────────────────
def fetch_real_weather(lat, lon):
    try:
        url = (
            f"https://marine-api.open-meteo.com/v1/marine"
            f"?latitude={lat}&longitude={lon}"
            f"&current=wave_height,wind_speed_10m"
            f"&wind_speed_unit=kmh"
        )
        resp    = requests.get(url, timeout=8)
        resp.raise_for_status()
        current = resp.json().get("current", {})
        wind    = current.get("wind_speed_10m")
        wave    = current.get("wave_height")
        if wind is not None and wave is not None:
            return {"wind_speed_kmh": round(float(wind), 1), "wave_height_m": round(float(wave), 2)}
    except Exception as e:
        print(f"  [weather API] failed for ({lat},{lon}): {e}")
    return None


# ── Real SST from NASA ERDDAP (free, no API key) ──────────────────────────────
def fetch_real_sst(lat, lon):
    try:
        url = (
            "https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.json"
            f"?analysed_sst[(last)][0][({lat:.4f}:1:{lat:.4f})][({lon:.4f}:1:{lon:.4f})]"
        )
        resp = requests.get(url, timeout=12)
        resp.raise_for_status()
        rows = resp.json().get("table", {}).get("rows", [])
        if rows and rows[0] and rows[0][-1] is not None:
            return round(float(rows[0][-1]) - 273.15, 2)
    except Exception as e:
        print(f"  [SST API] failed for ({lat},{lon}): {e}")
    return None


# ── Formula fallbacks ─────────────────────────────────────────────────────────
def formula_sst(lat):
    now = datetime.now(timezone.utc)
    doy = now.timetuple().tm_yday
    return round(
        (29.2 - (lat - 9.0) * 0.28)
        + 1.6 * math.sin(2 * math.pi * (doy - 55) / 365)
        + random.uniform(-0.4, 0.4),
        2,
    )

def formula_weather(lat):
    mon = 6 <= datetime.now().month <= 9
    return {
        "wind_speed_kmh": round(random.uniform(18 if mon else 4,  48 if mon else 26), 1),
        "wave_height_m":  round(random.uniform(1.4 if mon else 0.3, 4.8 if mon else 2.0), 2),
    }

def formula_chlorophyll():
    mon = 6 <= datetime.now().month <= 9
    return round(random.uniform(1.2 if mon else 0.4, 4.0 if mon else 2.8), 3)

def formula_salinity():
    mon = 6 <= datetime.now().month <= 9
    return round(random.uniform(31.5 if mon else 34.0, 34.0 if mon else 36.5), 2)


# ── Build one buoy reading ─────────────────────────────────────────────────────
def make_reading(b, use_real_api=True):
    now = datetime.now(timezone.utc)

    sst = fetch_real_sst(b["lat"], b["lon"]) if use_real_api else None
    sst_source = "NASA-ERDDAP" if sst is not None else "simulated"
    if sst is None:
        sst = formula_sst(b["lat"])

    weather = fetch_real_weather(b["lat"], b["lon"]) if use_real_api else None
    wx_source = "Open-Meteo" if weather is not None else "simulated"
    if weather is None:
        weather = formula_weather(b["lat"])

    return {
        "buoy_id":        b["id"],
        "buoy_name":      b["name"],
        "timestamp":      now.isoformat(),
        "lat":            b["lat"],
        "lon":            b["lon"],
        "sst_celsius":    sst,
        "salinity_psu":   formula_salinity(),
        "wave_height_m":  weather["wave_height_m"],
        "wind_speed_kmh": weather["wind_speed_kmh"],
        "chlorophyll":    formula_chlorophyll(),
        "sst_source":     sst_source,
        "weather_source": wx_source,
    }


# ── Publish helpers ────────────────────────────────────────────────────────────
def publish_local(readings):
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] {len(readings)} buoy readings:")
    for r in readings:
        flag = "⚠" if r["sst_celsius"] > 30.5 or r["sst_celsius"] < 27.5 else " "
        print(
            f"  {flag} {r['buoy_id']} {r['buoy_name']:12} "
            f"SST={r['sst_celsius']}°C [{r['sst_source']}]  "
            f"wave={r['wave_height_m']}m  wind={r['wind_speed_kmh']}km/h [{r['weather_source']}]  "
            f"chl={r['chlorophyll']}"
        )

def publish_azure(readings, connection_str, eventhub_name):
    """
    Publishes each buoy reading as a JSON event to Azure Event Hubs.
    Azure Functions (fn1) is triggered by Event Hub and writes to Azure SQL.
    """
    from azure.eventhub import EventHubProducerClient, EventData
    producer = EventHubProducerClient.from_connection_string(
        conn_str=connection_str,
        eventhub_name=eventhub_name,
    )
    with producer:
        batch = producer.create_batch()
        for r in readings:
            batch.add(EventData(json.dumps(r)))
        producer.send_batch(batch)
        print(f"  [{datetime.now().strftime('%H:%M:%S')}] Published {len(readings)} readings to Event Hub '{eventhub_name}'")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--local",       action="store_true", help="Print only, do not publish to Azure")
    parser.add_argument("--simulated",   action="store_true", help="Skip real APIs, use formulas only")
    parser.add_argument("--conn-str",    default="", help="Azure Event Hubs connection string")
    parser.add_argument("--eventhub",    default="kadalkaval-sensor-data", help="Event Hub name")
    parser.add_argument("--interval",    type=int, default=300, help="Seconds between publishes")
    args = parser.parse_args()

    use_real = not args.simulated
    mode     = "LOCAL" if args.local else "AZURE EVENT HUBS"
    data_src = "REAL APIs (Open-Meteo + NASA ERDDAP)" if use_real else "SIMULATED (formula)"
    print(f"KADALKAVAL Buoy Simulator — Mode: {mode}, Data: {data_src}, Interval: {args.interval}s")
    print("Press Ctrl+C to stop\n")

    # Read connection string from env if not passed as arg
    import os
    conn_str = args.conn_str or os.getenv("AZURE_EVENTHUB_CONNECTION_STRING", "")

    try:
        while True:
            readings = [make_reading(b, use_real_api=use_real) for b in BUOYS]
            if args.local:
                publish_local(readings)
            else:
                if not conn_str:
                    print("ERROR: Set --conn-str or AZURE_EVENTHUB_CONNECTION_STRING env var")
                    return
                publish_azure(readings, conn_str, args.eventhub)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")

if __name__ == "__main__":
    main()
