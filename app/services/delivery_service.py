import os
import math
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import httpx
from supabase import Client

# Nominatim rate-limiting state
_last_nominatim_request_time = 0.0

def normalize_address(address: str) -> str:
    """Normalizes address string for consistent DB cache key lookups."""
    return " ".join(address.lower().strip().split())


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes straight-line distance in km using the Haversine formula.
    """
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_cached_distance(supabase: Client, norm_address: str) -> Optional[float]:
    """
    Looks up address in address_distance_cache table with a 30-day TTL.
    Returns cached distance_km if found and valid (<30 days old), else None.
    """
    try:
        res = (
            supabase.table("address_distance_cache")
            .select("distance_km, computed_at")
            .eq("address_normalized", norm_address)
            .maybeSingle()
            .execute()
        )

        if res.data and "distance_km" in res.data and "computed_at" in res.data:
            computed_str = res.data["computed_at"]
            # Parse computed_at datetime
            if computed_str.endswith("Z"):
                computed_dt = datetime.fromisoformat(computed_str.replace("Z", "+00:00"))
            else:
                computed_dt = datetime.fromisoformat(computed_str)

            # 30 days TTL check
            cutoff_dt = datetime.now(timezone.utc) - timedelta(days=30)
            if computed_dt.tzinfo is None:
                computed_dt = computed_dt.replace(tzinfo=timezone.utc)

            if computed_dt >= cutoff_dt:
                return float(res.data["distance_km"])
    except Exception:
        pass
    return None


def store_cached_distance(supabase: Client, norm_address: str, distance_km: float):
    """Stores computed distance in address_distance_cache table."""
    try:
        supabase.table("address_distance_cache").upsert({
            "address_normalized": norm_address,
            "distance_km": round(distance_km, 2),
            "computed_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception:
        pass


def _try_google_routes_api(
    shop_lat: float, shop_lng: float, customer_address: str
) -> Optional[float]:
    """Tier 1: Google Routes API (Compute Route Matrix) for real road distance."""
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
    if not api_key:
        return None

    url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration"
    }
    payload = {
        "origins": [{"waypoint": {"location": {"latLng": {"latitude": shop_lat, "longitude": shop_lng}}}}],
        "destinations": [{"waypoint": {"address": customer_address}}]
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            res = client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                if data and len(data) > 0 and "distanceMeters" in data[0]:
                    dist_meters = data[0]["distanceMeters"]
                    return round(dist_meters / 1000.0, 2)
    except Exception:
        pass
    return None


def _try_openrouteservice_api(
    shop_lat: float, shop_lng: float, cust_lat: float, cust_lng: float
) -> Optional[float]:
    """Tier 2: OpenRouteService Matrix API for free-tier real road distance."""
    api_key = os.getenv("OPENROUTESERVICE_API_KEY", "")
    if not api_key:
        return None

    url = "https://api.openrouteservice.org/v2/matrix/driving-car"
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "locations": [
            [shop_lng, shop_lat],
            [cust_lng, cust_lat]
        ],
        "metrics": ["distance"]
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            res = client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                distances = data.get("distances", [])
                if len(distances) >= 2 and len(distances[0]) >= 2:
                    dist_m = distances[0][1]
                    if dist_m is not None:
                        return round(dist_m / 1000.0, 2)
    except Exception:
        pass
    return None


def _geocode_nominatim(address: str) -> Optional[tuple[float, float]]:
    """
    Geocodes address string to (lat, lng) using Nominatim OSM.
    Enforces Nominatim policy: 1 request/second rate-limit + custom User-Agent.
    """
    global _last_nominatim_request_time
    now = time.time()
    elapsed = now - _last_nominatim_request_time
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)
    _last_nominatim_request_time = time.time()

    url = "https://nominatim.openstreetmap.org/search"
    headers = {
        "User-Agent": "FreshMeatBookingApp/1.0 (contact@meatshop.com)"
    }
    params = {
        "q": address,
        "format": "json",
        "limit": 1
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            res = client.get(url, params=params, headers=headers)
            if res.status_code == 200:
                data = res.json()
                if data and len(data) > 0:
                    return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass
    return None


def calculate_delivery_charge(
    supabase: Client,
    customer_address: str,
    shop_lat: Optional[float] = None,
    shop_lng: Optional[float] = None,
    customer_lat: Optional[float] = None,
    customer_lng: Optional[float] = None
) -> Dict[str, Any]:
    """
    Calculates delivery fee using exact GPS coordinates if provided, or fallback geocoding chain:
    1. Direct GPS coordinates (if customer_lat & customer_lng provided)
    2. Primary: Google Routes API (real road distance)
    3. Secondary: OpenRouteService Matrix API (free-tier road distance)
    4. Tertiary: Nominatim Geocoding + Haversine * 1.35 road correction factor
    5. Final Fallback: Database delivery_zones band
    
    Caches computed distance in address_distance_cache DB table with 30-day TTL.
    """
    norm_address = normalize_address(customer_address)

    # Fetch shop coordinates if not provided
    if shop_lat is None or shop_lng is None:
        try:
            settings_res = supabase.table("admin_settings").select("shop_latitude, shop_longitude").limit(1).execute()
            if settings_res.data and len(settings_res.data) > 0:
                shop_lat = float(settings_res.data[0].get("shop_latitude") or 11.063738)
                shop_lng = float(settings_res.data[0].get("shop_longitude") or 77.794596)
            else:
                shop_lat, shop_lng = 11.063738, 77.794596
        except Exception:
            shop_lat, shop_lng = 11.063738, 77.794596

    computed_dist: Optional[float] = None
    provider_used = ""

    # Direct GPS distance if exact coordinates are passed
    if customer_lat is not None and customer_lng is not None:
        ors_dist = _try_openrouteservice_api(shop_lat, shop_lng, customer_lat, customer_lng)
        if ors_dist is not None:
            computed_dist = ors_dist
            provider_used = "openrouteservice_gps"
        else:
            straight_km = haversine_distance_km(shop_lat, shop_lng, customer_lat, customer_lng)
            computed_dist = round(straight_km * 1.35, 2)
            provider_used = "haversine_gps_exact"

    # 0. Persistent DB Cache Lookup (30-day TTL)
    if computed_dist is None:
        cached_dist = get_cached_distance(supabase, norm_address)
        if cached_dist is not None:
            zone_info = _find_delivery_zone_for_distance(supabase, cached_dist)
            return {
                "delivery_charge": zone_info["delivery_charge"],
                "delivery_zone": zone_info["zone_name"],
                "distance_km": cached_dist,
                "is_cached": True,
                "provider": "persistent_db_cache"
            }

    # Tier 1: Google Routes API
    computed_dist = _try_google_routes_api(shop_lat, shop_lng, customer_address)
    if computed_dist is not None:
        provider_used = "google_routes_api"

    # Tier 2 & 3: Geocode customer address for OpenRouteService or Haversine fallback
    if computed_dist is None:
        cust_coords = _geocode_nominatim(customer_address)
        if cust_coords:
            c_lat, c_lng = cust_coords

            # Tier 2: OpenRouteService Matrix API
            computed_dist = _try_openrouteservice_api(shop_lat, shop_lng, c_lat, c_lng)
            if computed_dist is not None:
                provider_used = "openrouteservice_api"

            # Tier 3: Nominatim + Haversine * 1.35 Road Correction Factor
            if computed_dist is None:
                straight_line_km = haversine_distance_km(shop_lat, shop_lng, c_lat, c_lng)
                computed_dist = round(straight_line_km * 1.35, 2) # 1.35 road correction factor
                provider_used = "haversine_nominatim_corrected"

    # Tier 4: Final Fallback (If all geocoding/routes fail)
    if computed_dist is None:
        zone_info = _find_delivery_zone_fallback(supabase)
        return {
            "delivery_charge": zone_info["delivery_charge"],
            "delivery_zone": zone_info["zone_name"],
            "distance_km": zone_info["max_distance_km"],
            "is_fallback": True,
            "provider": "delivery_zones_fallback"
        }

    # Store in DB Cache for repeat customer lookup
    store_cached_distance(supabase, norm_address, computed_dist)

    # Match computed distance against delivery_zones table
    zone_info = _find_delivery_zone_for_distance(supabase, computed_dist)
    is_deliverable = computed_dist <= 5.0

    return {
        "delivery_charge": zone_info["delivery_charge"] if is_deliverable else 0.0,
        "delivery_zone": zone_info["zone_name"],
        "distance_km": computed_dist,
        "is_deliverable": is_deliverable,
        "error_message": None if is_deliverable else "Delivery available only within 5 km from shop. Please choose Store Pickup.",
        "is_fallback": False,
        "provider": provider_used
    }


def _find_delivery_zone_for_distance(supabase: Client, distance_km: float) -> Dict[str, Any]:
    """Finds the matching delivery zone band for a computed distance from Kolanthapalayam shop (Strict 5 km limit)."""
    # Strict Distance Band Rules relative to Kolanthapalayam shop:
    # 0-2 km  -> ₹30
    # 2-4 km  -> ₹60
    # 4-5 km  -> ₹80
    # >5 km   -> Out of Zone
    if distance_km <= 2.0:
        return {
            "zone_name": "Zone 1 (0-2 km)",
            "delivery_charge": 30.0,
            "max_distance_km": 2.0,
            "is_deliverable": True
        }
    elif distance_km <= 4.0:
        return {
            "zone_name": "Zone 2 (2-4 km)",
            "delivery_charge": 60.0,
            "max_distance_km": 4.0,
            "is_deliverable": True
        }
    elif distance_km <= 5.0:
        return {
            "zone_name": "Zone 3 (4-5 km)",
            "delivery_charge": 80.0,
            "max_distance_km": 5.0,
            "is_deliverable": True
        }
    else:
        return {
            "zone_name": f"Out of Delivery Range ({round(distance_km, 1)} km)",
            "delivery_charge": 0.0,
            "max_distance_km": distance_km,
            "is_deliverable": False
        }


def _find_delivery_zone_fallback(supabase: Client) -> Dict[str, Any]:
    """Returns default delivery zone band when external APIs are unreachable."""
    try:
        res = (
            supabase.table("delivery_zones")
            .select("*")
            .filter("is_active", "eq", True)
            .order("max_distance_km", desc=False)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception:
        pass

    return {
        "zone_name": "Standard Zone (0-5 km)",
        "delivery_charge": 30.0,
        "max_distance_km": 5.0
    }
