from sqlalchemy import text
from database import engine

queries = [

"""
CREATE TABLE buoy_data (
    id INT PRIMARY KEY IDENTITY(1,1),
    buoy_id VARCHAR(50),
    buoy_name VARCHAR(100),
    sst FLOAT,
    salinity FLOAT,
    wave_height FLOAT,
    chlorophyll FLOAT,
    fish_probability FLOAT,
    status VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE()
)
""",

"""
CREATE TABLE alerts (
    id INT PRIMARY KEY IDENTITY(1,1),
    alert_type VARCHAR(100),
    message VARCHAR(500),
    severity VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE()
)
""",

"""
CREATE TABLE vessel_violations (
    id INT PRIMARY KEY IDENTITY(1,1),
    vessel_id VARCHAR(100),
    zone_name VARCHAR(100),
    latitude FLOAT,
    longitude FLOAT,
    created_at DATETIME DEFAULT GETDATE()
)
""",

"""
CREATE TABLE fish_zones (
    id INT PRIMARY KEY IDENTITY(1,1),
    zone_name VARCHAR(100),
    latitude FLOAT,
    longitude FLOAT,
    probability FLOAT,
    created_at DATETIME DEFAULT GETDATE()
)
"""
]

with engine.begin() as conn:
    for q in queries:
        conn.execute(text(q))

print("All tables created successfully.")