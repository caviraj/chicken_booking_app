from datetime import date
from unittest.mock import patch, MagicMock
import pytest

from app.services.stock_service import (
    get_booked_stock_kg,
    get_stock_limit_for_meat,
    check_stock_limit
)

def test_get_booked_stock_kg():
    """Test summing booked stock for a specific meat type and date."""
    mock_supabase = MagicMock()
    mock_res = MagicMock()
    mock_res.data = [
        {"quantity_kg": 2.5},
        {"quantity_kg": 3.0}
    ]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.neq.return_value = mock_table
    mock_table.execute.return_value = mock_res

    total_kg = get_booked_stock_kg(mock_supabase, "chicken", date(2026, 8, 8))
    assert total_kg == 5.5


def test_get_stock_limit_for_meat_default():
    """Test stock limit fallback for chicken, mutton, and duck."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.maybeSingle.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=None)
    mock_table.limit.return_value = mock_table

    assert get_stock_limit_for_meat(mock_supabase, "chicken", date(2026, 8, 8)) == 100.0
    assert get_stock_limit_for_meat(mock_supabase, "mutton", date(2026, 8, 8)) == 50.0
    assert get_stock_limit_for_meat(mock_supabase, "duck", date(2026, 8, 8)) == 30.0


@patch("app.services.stock_service.get_stock_limit_for_meat")
@patch("app.services.stock_service.get_booked_stock_kg")
def test_check_stock_limit_within_limit(mock_booked, mock_limit):
    """Test stock limit check when request is within daily limit."""
    mock_limit.return_value = 50.0
    mock_booked.return_value = 30.0

    mock_supabase = MagicMock()
    result = check_stock_limit(mock_supabase, "chicken", 15.0, date(2026, 8, 8))
    assert result["is_available"] is True
    assert result["available"] is True


@patch("app.services.stock_service.get_stock_limit_for_meat")
@patch("app.services.stock_service.get_booked_stock_kg")
def test_check_stock_limit_exceeded(mock_booked, mock_limit):
    """Test stock limit check when request exceeds daily limit."""
    mock_limit.return_value = 50.0
    mock_booked.return_value = 45.0

    mock_supabase = MagicMock()
    result = check_stock_limit(mock_supabase, "chicken", 10.0, date(2026, 8, 8))
    assert result["is_available"] is False
    assert result["available"] is False
