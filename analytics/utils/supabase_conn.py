"""
analytics/utils/supabase_conn.py
---------------------------------
Python Supabase client configuration and helper utilities.
Loads credentials from environment variables or .env file.
"""

import os
import pandas as pd
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env if present (for local development)
load_dotenv()

_client: Optional[Client] = None


def get_client() -> Client:
    """Return a singleton Supabase client. Reads SUPABASE_URL and SUPABASE_KEY
    from environment variables (set via .env or cloud secrets)."""
    global _client
    if _client is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_KEY", "")  # anon key or service-role key
        if not url or not key:
            raise EnvironmentError(
                "SUPABASE_URL and SUPABASE_KEY must be set as environment variables. "
                "Create a .env file in the analytics/ directory."
            )
        _client = create_client(url, key)
    return _client


# ──────────────────────────────────────────────────────────────────────────────
# Sensor Data Helpers
# ──────────────────────────────────────────────────────────────────────────────

def fetch_sensor_data(
    sensor_type: Optional[str] = None,
    limit: int = 500,
    order_asc: bool = False,
) -> pd.DataFrame:
    """Fetch sensor telemetry from Supabase and return as a DataFrame.

    Args:
        sensor_type: Filter by type ('flood', 'pressure', 'gas', 'flow').
                     If None, returns all types.
        limit:       Maximum number of rows to return.
        order_asc:   If True, oldest records first; default is newest first.

    Returns:
        pd.DataFrame with columns: id, sensor_id, sensor_type, value, unit,
        timestamp, location_id
    """
    sb = get_client()
    query = (
        sb.table("sensor_data")
        .select("*")
        .order("timestamp", desc=not order_asc)
        .limit(limit)
    )
    if sensor_type:
        query = query.eq("sensor_type", sensor_type)

    response = query.execute()
    if response.data:
        df = pd.DataFrame(response.data)
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        return df
    return pd.DataFrame(
        columns=["id", "sensor_id", "sensor_type", "value", "unit", "timestamp", "location_id"]
    )


def insert_sensor_reading(
    sensor_id: str,
    sensor_type: str,
    value: float,
    unit: str,
    location_id: str = "",
) -> Dict[str, Any]:
    """Insert a single sensor reading. Used for simulation / demo data injection."""
    sb = get_client()
    payload = {
        "sensor_id": sensor_id,
        "sensor_type": sensor_type,
        "value": value,
        "unit": unit,
        "location_id": location_id,
    }
    response = sb.table("sensor_data").insert(payload).execute()
    return response.data[0] if response.data else {}


# ──────────────────────────────────────────────────────────────────────────────
# Pipe Inventory Helpers
# ──────────────────────────────────────────────────────────────────────────────

def fetch_pipe_inventory(limit: int = 200) -> pd.DataFrame:
    """Fetch the pipe asset registry."""
    sb = get_client()
    response = sb.table("pipe_inventory").select("*").limit(limit).execute()
    if response.data:
        df = pd.DataFrame(response.data)
        df["install_date"] = pd.to_datetime(df["install_date"], errors="coerce")
        df["last_inspection"] = pd.to_datetime(df["last_inspection"], errors="coerce")
        return df
    return pd.DataFrame()


# ──────────────────────────────────────────────────────────────────────────────
# Complaints Helpers
# ──────────────────────────────────────────────────────────────────────────────

def fetch_complaints(status: Optional[str] = None, limit: int = 100) -> pd.DataFrame:
    """Fetch citizen complaints, optionally filtered by status."""
    sb = get_client()
    query = (
        sb.table("complaints")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
    )
    if status:
        query = query.eq("status", status)
    response = query.execute()
    if response.data:
        return pd.DataFrame(response.data)
    return pd.DataFrame()


# ──────────────────────────────────────────────────────────────────────────────
# Uploaded Files Helper
# ──────────────────────────────────────────────────────────────────────────────

def fetch_uploaded_files(limit: int = 50) -> pd.DataFrame:
    """Fetch upload metadata for the inspection images table."""
    sb = get_client()
    response = (
        sb.table("uploaded_files")
        .select("*")
        .order("uploaded_at", desc=True)
        .limit(limit)
        .execute()
    )
    return pd.DataFrame(response.data) if response.data else pd.DataFrame()
