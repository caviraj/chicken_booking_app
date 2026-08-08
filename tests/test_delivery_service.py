from unittest.mock import MagicMock, patch
import pytest

from app.services.delivery_service import calculate_delivery_charge

@patch("app.services.delivery_service._compute_google_route_distance")
def test_calculate_delivery_charge_google_success(mock_google_dist):
    """Test delivery charge calculation when Google Routes returns distance."""
    mock_supabase = MagicMock()

    # Google routes returns 4.5 km
    mock_google_dist.return_value = 4.5

    # Mock delivery_zones
    mock_zones_res = MagicMock()
    mock_zones_res.data = [
        {"zone_name": "Inner City", "max_distance_km": 3.0, "delivery_charge": 25.0, "active": True},
        {"zone_name": "Suburbs", "max_distance_km": 10.0, "delivery_charge": 50.0, "active": True}
    ]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.execute.return_value = mock_zones_res

    res = calculate_delivery_charge(
        supabase=mock_supabase,
        customer_address="Anna Nagar, Chennai",
        shop_lat=13.0827,
        shop_lng=80.2707,
        google_api_key="fake-key"
    )

    assert res["delivery_charge"] == 50.0
    assert res["distance_km"] == 4.5
    assert res["delivery_zone"] == "Suburbs"
    assert res["source"] == "google_routes"


@patch("app.services.delivery_service._compute_google_route_distance")
def test_calculate_delivery_charge_fallback(mock_google_dist):
    """Test falling back to default delivery zone when Google Routes API is unavailable."""
    mock_supabase = MagicMock()

    # Google routes fails / returns None
    mock_google_dist.return_value = None

    mock_zones_res = MagicMock()
    mock_zones_res.data = [
        {"zone_name": "Standard Delivery", "max_distance_km": 5.0, "delivery_charge": 35.0, "active": True}
    ]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.execute.return_value = mock_zones_res

    res = calculate_delivery_charge(
        supabase=mock_supabase,
        customer_address="Unknown Address",
        shop_lat=13.0827,
        shop_lng=80.2707,
        google_api_key=None
    )

    assert res["delivery_charge"] == 35.0
    assert res["distance_km"] is None
    assert res["delivery_zone"] == "Standard Delivery"
    assert res["source"] == "fallback_zone"

