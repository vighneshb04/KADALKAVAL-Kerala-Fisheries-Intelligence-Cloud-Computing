-- ================================================================
-- KADALKAVAL — Azure SQL Database Schema
-- Run this entire file in Azure Portal Query Editor:
-- portal.azure.com → SQL databases → kadalkaval-db → Query editor
-- ================================================================

-- TABLE 1: Raw sensor readings from IoT buoys (written by fn1)
CREATE TABLE sensor_readings (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    timestamp       DATETIME2 NOT NULL,
    buoy_id         NVARCHAR(10) NOT NULL,
    buoy_name       NVARCHAR(50),
    lat             FLOAT,
    lon             FLOAT,
    sst_celsius     FLOAT,
    salinity_psu    FLOAT,
    wave_height_m   FLOAT,
    wind_speed_kmh  FLOAT,
    chlorophyll     FLOAT
);

CREATE INDEX idx_sensor_buoy_ts ON sensor_readings (buoy_id, timestamp DESC);
CREATE INDEX idx_sensor_ts      ON sensor_readings (timestamp DESC);


-- TABLE 2: All alerts (SST anomalies, weather, vessel violations, zone scores)
--          Written by fn1, fn2, fn3, fn4
CREATE TABLE fishing_zone_alerts (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    timestamp           DATETIME2 NOT NULL,
    zone_id             NVARCHAR(100),
    buoy_id             NVARCHAR(20),
    alert_type          NVARCHAR(50),
    sst_celsius         FLOAT,
    lat                 FLOAT,
    lon                 FLOAT,
    message_en          NVARCHAR(500),
    message_ml          NVARCHAR(500),
    recommended_action  NVARCHAR(100)
);

CREATE INDEX idx_alerts_ts   ON fishing_zone_alerts (timestamp DESC);
CREATE INDEX idx_alerts_type ON fishing_zone_alerts (alert_type);


-- TABLE 3: AIS vessel positions (written by fn3)
CREATE TABLE vessel_detections (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    timestamp           DATETIME2 NOT NULL,
    vessel_id           NVARCHAR(50),
    lat                 FLOAT,
    lon                 FLOAT,
    speed_knots         FLOAT,
    zone_violation_flag BIT DEFAULT 0
);

CREATE INDEX idx_vessel_ts        ON vessel_detections (timestamp DESC);
CREATE INDEX idx_vessel_violation ON vessel_detections (zone_violation_flag, timestamp DESC);


-- ================================================================
-- ANALYTICAL QUERIES
-- ================================================================

-- Query 1: SST Anomaly Report (last 30 days)
SELECT
    buoy_name,
    CAST(timestamp AS DATE)             AS date,
    ROUND(AVG(sst_celsius), 2)          AS avg_sst,
    ROUND(AVG(sst_celsius) - 29.0, 2)  AS deviation,
    CASE
        WHEN AVG(sst_celsius) > 30.5 THEN 'HIGH_ANOMALY'
        WHEN AVG(sst_celsius) < 27.5 THEN 'LOW_ANOMALY'
        ELSE 'NORMAL'
    END AS status
FROM sensor_readings
WHERE timestamp >= DATEADD(DAY, -30, GETUTCDATE())
GROUP BY buoy_name, CAST(timestamp AS DATE)
ORDER BY date DESC, deviation DESC;


-- Query 2: Best Fishing Zones (last 7 days)
SELECT
    buoy_name,
    ROUND(AVG(sst_celsius), 2)   AS avg_sst,
    ROUND(AVG(chlorophyll), 3)   AS avg_chlorophyll,
    CASE
        WHEN AVG(chlorophyll) > 2.0 AND AVG(sst_celsius) BETWEEN 27.5 AND 30.5 THEN 'OPTIMAL'
        WHEN AVG(chlorophyll) > 1.0 THEN 'MODERATE'
        ELSE 'AVOID'
    END AS zone_status,
    COUNT(*) AS readings
FROM sensor_readings
WHERE timestamp >= DATEADD(DAY, -7, GETUTCDATE())
GROUP BY buoy_name
ORDER BY avg_chlorophyll DESC;


-- Query 3: Vessel Violation Summary (last 30 days)
SELECT
    zone_id,
    COUNT(*)       AS violation_count,
    MIN(timestamp) AS first_seen,
    MAX(timestamp) AS last_seen
FROM fishing_zone_alerts
WHERE alert_type = 'VESSEL_VIOLATION'
  AND timestamp >= DATEADD(DAY, -30, GETUTCDATE())
GROUP BY zone_id
ORDER BY violation_count DESC;


-- Query 4: Alert Frequency by Type (last 7 days)
SELECT
    alert_type,
    COUNT(*)                AS total,
    COUNT(DISTINCT zone_id) AS zones_affected
FROM fishing_zone_alerts
WHERE timestamp >= DATEADD(DAY, -7, GETUTCDATE())
GROUP BY alert_type
ORDER BY total DESC;


-- Query 5: 30-Day SST Trend (weekly)
SELECT
    buoy_name,
    DATEADD(WEEK, DATEDIFF(WEEK, 0, timestamp), 0) AS week_start,
    ROUND(AVG(sst_celsius), 2)                      AS weekly_avg_sst,
    ROUND(STDEV(sst_celsius), 3)                    AS variability
FROM sensor_readings
WHERE timestamp >= DATEADD(DAY, -90, GETUTCDATE())
GROUP BY buoy_name, DATEADD(WEEK, DATEDIFF(WEEK, 0, timestamp), 0)
ORDER BY week_start DESC, buoy_name;
