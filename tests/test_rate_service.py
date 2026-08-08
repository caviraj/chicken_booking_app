from datetime import date
from unittest.mock import MagicMock
import pytest

from app.services.rate_service import get_today_rate

def test_get_today_rate_exact_match():
    """Test fetching rate when exact match for target date exists."""
    mock_supabase = MagicMock()
    
    # Mock exact match response
    mock_exact_res = MagicMock()
    mock_exact_res.data = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "meat_type": "chicken",
            "rate_per_kg": "240.00",
            "effective_date": "2026-08-08"
        }
    ]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = mock_exact_res

    target_d = date(2026, 8, 8)
    rate = get_today_rate(mock_supabase, "chicken", target_d)

    assert rate is not None
    assert rate["meat_type"] == "chicken"
    assert rate["rate_per_kg"] == 240.0
    assert rate["effective_date"] == "2026-08-08"


def test_get_today_rate_fallback_to_past():
    """Test falling back to recent past rate when today's rate is not explicitly set."""
    mock_supabase = MagicMock()
    
    # First query (exact match) returns empty
    mock_empty_res = MagicMock()
    mock_empty_res.data = []

    # Second query (fallback past rate) returns past record
    mock_fallback_res = MagicMock()
    mock_fallback_res.data = [
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "meat_type": "mutton",
            "rate_per_kg": "750.00",
            "effective_date": "2026-08-05"
        }
    ]

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.lte.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.limit.return_value = mock_table
    
    # Execute returns empty first, then fallback
    mock_table.execute.side_effect = [mock_empty_res, mock_fallback_res]

    target_d = date(2026, 8, 8)
    rate = get_today_rate(mock_supabase, "mutton", target_d)

    assert rate is not None
    assert rate["meat_type"] == "mutton"
    assert rate["rate_per_kg"] == 750.0
    assert rate["effective_date"] == "2026-08-05"


def test_get_today_rate_no_rates_exist():
    """Test returning None when no rates exist for meat type."""
    mock_supabase = MagicMock()
    
    mock_empty_res = MagicMock()
    mock_empty_res.data = []

    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.lte.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.execute.return_value = mock_empty_res

    target_d = date(2026, 8, 8)
    rate = get_today_rate(mock_supabase, "duck", target_d)

    assert rate is None
