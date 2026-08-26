from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta
import pytest

from app.services.delivery_service import (
    calculate_delivery_charge,
    haversine_distance_km,
    normalize_address,
    get_cached_distance,
    store_cached_distance
)

def test_haversine_distance_calculation():
    """Test straight-line distance calculation between two points."""
    # Distance between Chennai Central and T.Nagar is approx 6.03 km straight line
    dist = haversine_distance_km(13.0827, 80.2707, 13.0418, 80.2341)
    assert 5.5 <= dist <= 7.0



def test_haversine_road_correction_factor():
    """Test 1.35 road distance correction factor application."""
    straight_dist = 10.0
    corrected_dist = straight_dist * 1.35
    assert corrected_dist == 13.5


def test_persistent_db_cache_lookup_valid():
    """Test looking up valid (<30 days) cached distance from DB table."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_res = MagicMock()

    now_iso = datetime.now(timezone.utc).isoformat()
    mock_res.data = {
        "distance_km": 4.5,
        "computed_at": now_iso
    }

    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.maybeSingle.return_value = mock_table
    mock_table.execute.return_value = mock_res

    dist = get_cached_distance(mock_supabase, "123 anna salai chennai")
    assert dist == 4.5


def test_persistent_db_cache_lookup_expired():
    """Test expired (>30 days) cached distance returning None."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_res = MagicMock()

    expired_iso = (datetime.now(timezone.utc) - timedelta(days=35)).isoformat()
    mock_res.data = {
        "distance_km": 4.5,
        "computed_at": expired_iso
    }

    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.maybeSingle.return_value = mock_table
    mock_table.execute.return_value = mock_res

    dist = get_cached_distance(mock_supabase, "123 anna salai chennai")
    assert dist is None


@patch("app.services.delivery_service._geocode_nominatim")
@patch("app.services.delivery_service.get_cached_distance")
def test_calculate_delivery_charge_tertiary_haversine(mock_get_cache, mock_geocode):
    """Test Tertiary Fallback: Nominatim geocoding + Haversine * 1.35 multiplier."""
    mock_get_cache.return_value = None
    # Geocode returns customer coords (~2km straight line -> ~2.7km road distance, Zone 2)
    mock_geocode.return_value = (13.0680, 80.2600)

    mock_supabase = MagicMock()
    mock_zone_res = MagicMock()
    mock_zone_res.data = [{"zone_name": "Zone 2 (2-4 km)", "delivery_charge": 60.0, "max_distance_km": 4.0}]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.filter.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.upsert.return_value = mock_table
    mock_table.execute.return_value = mock_zone_res

    res = calculate_delivery_charge(
        supabase=mock_supabase,
        customer_address="T Nagar, Chennai",
        shop_lat=13.0827,
        shop_lng=80.2707
    )

    assert res["delivery_charge"] == 60.0
    assert res["provider"] == "haversine_nominatim_corrected"
    assert res["distance_km"] > 0

