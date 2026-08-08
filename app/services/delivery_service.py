import os
from typing import Dict, Any, Optional
import httpx
from supabase import Client

def _compute_google_route_distance(
    google_api_key: str,
    shop_lat: float,
    shop_lng: float,
    customer_address: str
) -> Optional[float]:
    """
    Calls Google Routes API (Compute Route Matrix v2) to get driving distance in kilometers.
    Returns distance in km or None if request fails.
    """
    url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": google_api_key,
        "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration,status"
    }
    payload = {
        "origins": [
            {
                "waypoint": {
                    "location": {
                        "latLng": {
                            "latitude": shop_lat,
                            "longitude": shop_lng
                        }
                    }
                }
            }
        ],
        "destinations": [
            {
                "waypoint": {
                    "address": customer_address
                }
            }
        ],
        "travelMode": "DRIVE"
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    distance_meters = data[0].get("distanceMeters")
                    if distance_meters is not None:
                        return round(distance_meters / 1000.0, 2)
    except Exception:
        pass
    return None


def calculate_delivery_charge(
    supabase: Client,
    customer_address: str,
    shop_lat: Optional[float] = None,
    shop_lng: Optional[float] = None,
    google_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculates delivery charge based on shop coordinates and customer delivery address.
    Attempts Google Routes API first. If unsuccessful or key missing, falls back to
    matching zone in `delivery_zones` table.

    Args:
        supabase (Client): Initialized Supabase client.
        customer_address (str): Delivery destination address.
        shop_lat (Optional[float]): Shop latitude (fetched from admin_settings if None).
        shop_lng (Optional[float]): Shop longitude (fetched from admin_settings if None).
        google_api_key (Optional[str]): Google Maps/Routes API key (fetched from env if None).

    Returns:
        Dict[str, Any]: Dictionary containing delivery_charge, distance_km, delivery_zone, and calculation_source.
    """
    if google_api_key is None:
        google_api_key = os.getenv("GOOGLE_MAPS_API_KEY", os.getenv("GOOGLE_ROUTES_API_KEY"))

    # Fetch shop coordinates from admin_settings if not provided
    if shop_lat is None or shop_lng is None:
        settings_res = (
            supabase.table("admin_settings")
            .select("shop_lat, shop_lng")
            .limit(1)
            .execute()
        )
        if settings_res.data and len(settings_res.data) > 0:
            shop_lat = float(settings_res.data[0].get("shop_lat") or 0.0)
            shop_lng = float(settings_res.data[0].get("shop_lng") or 0.0)

    distance_km: Optional[float] = None
    if google_api_key and shop_lat and shop_lng:
        distance_km = _compute_google_route_distance(
            google_api_key=google_api_key,
            shop_lat=shop_lat,
            shop_lng=shop_lng,
            customer_address=customer_address
        )

    # Query delivery zones from Supabase
    zones_res = (
        supabase.table("delivery_zones")
        .select("*")
        .eq("active", True)
        .order("max_distance_km", desc=False)
        .execute()
    )

    zones = zones_res.data or []

    # Case 1: Google Routes distance retrieved successfully
    if distance_km is not None and zones:
        for zone in zones:
            max_dist = zone.get("max_distance_km")
            if max_dist is None or distance_km <= float(max_dist):
                return {
                    "delivery_charge": float(zone["delivery_charge"]),
                    "distance_km": distance_km,
                    "delivery_zone": zone["zone_name"],
                    "source": "google_routes"
                }
        
        # If distance exceeds all max_distance_km bounds, return max zone charge or default
        last_zone = zones[-1]
        return {
            "delivery_charge": float(last_zone["delivery_charge"]),
            "distance_km": distance_km,
            "delivery_zone": last_zone["zone_name"],
            "source": "google_routes"
        }

    # Case 2: Fallback to default zone if distance API failed or no zones configured
    if zones:
        first_zone = zones[0]
        return {
            "delivery_charge": float(first_zone["delivery_charge"]),
            "distance_km": None,
            "delivery_zone": first_zone["zone_name"],
            "source": "fallback_zone"
        }

    # Ultimate default fallback if table is empty
    return {
        "delivery_charge": 30.0,
        "distance_km": None,
        "delivery_zone": "Standard Delivery",
        "source": "default_fallback"
    }
