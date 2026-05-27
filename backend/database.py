import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

connection_string = (
    "mssql+pyodbc://azureadmin:NewStrongPassword123!@"
    "kadalkaval-sqlserver8472.database.windows.net:1433/"
    "kadalkavaldb"
    "?driver=ODBC+Driver+18+for+SQL+Server"
    "&Encrypt=yes"
    "&TrustServerCertificate=no"
)

engine = create_engine(connection_string)

def test_connection():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("Azure SQL Connected:", result.scalar())