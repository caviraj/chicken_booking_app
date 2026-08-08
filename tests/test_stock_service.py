from datetime import date
from unittest.mock import MagicMock
import pytest

from app.services.stock_service import get_booked_stock_kg, check_stock_limit

def test_get_booked_stock_kg():
    """Test calculation of total booked quantity in kg."""
    mock_supabase = MagicMock()
    
    mock_res = MagicMock()
    mock_res.data = [
        {"quantity_kg": 2.5, "order_status": "confirmed"},
        {"quantity_kg": 1.0, "order_status": "confirmed"},
        {"quantity_kg": 0.5, "order_status": "pending"}
    ]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.neq.return_value = mock_table
    mock_table.execute.return_value = mock_res

    booked = get_booked_stock_kg(mock_supabase, "chicken", date(2026, 8, 8))
    assert booked == 4.0


def test_check_stock_limit_within_limit():
    """Test stock limit check when request is within daily limit."""
    mock_supabase = MagicMock()

    # Mock get_booked_stock_kg query result
    mock_orders_res = MagicMock()
    mock_orders_res.data = [{"quantity_kg": 30.0}]

    # Mock admin_settings limit result
    mock_settings_res = MagicMock()
    mock_settings_res.data = [{"daily_stock_limit_kg": 50.0}]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.neq.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.execute.side_effect = [mock_orders_res, mock_settings_res]

    result = check_stock_limit(mock_supabase, "chicken", date(2026, 8, 8), requested_kg=15.0)

    assert result["available"] is True
    assert result["booked_kg"] == 30.0
    assert result["requested_kg"] == 15.0
    assert result["limit_kg"] == 50.0
    assert result["remaining_kg"] == 20.0


def test_check_stock_limit_exceeded():
    """Test stock limit check when request exceeds daily limit."""
    mock_supabase = MagicMock()

    mock_orders_res = MagicMock()
    mock_orders_res.data = [{"quantity_kg": 45.0}]

    mock_settings_res = MagicMock()
    mock_settings_res.data = [{"daily_stock_limit_kg": 50.0}]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.neq.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.execute.side_effect = [mock_orders_res, mock_settings_res]

    result = check_stock_limit(mock_supabase, "chicken", date(2026, 8, 8), requested_kg=10.0)

    assert result["available"] is False
    assert result["booked_kg"] == 45.0
    assert result["remaining_kg"] == 5.0


def test_check_stock_limit_no_limit_configured():
    """Test stock limit check when no daily_stock_limit_kg is set in admin settings."""
    mock_supabase = MagicMock()

    mock_orders_res = MagicMock()
    mock_orders_res.data = [{"quantity_kg": 100.0}]

    mock_settings_res = MagicMock()
    mock_settings_res.data = [{"daily_stock_limit_kg": None}]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.neq.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.execute.side_effect = [mock_orders_res, mock_settings_res]

    result = check_stock_limit(mock_supabase, "mutton", date(2026, 8, 8), requested_kg=25.0)

    assert result["available"] is True
    assert result["limit_kg"] is None
    assert result["remaining_kg"] is None
