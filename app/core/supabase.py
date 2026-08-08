import os
from typing import Optional
from supabase import create_client, Client

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """
    Returns a initialized Supabase client instance using environment variables.
    Environment variables needed:
    - SUPABASE_URL
    - SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
    """
    global _supabase_client
    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL", "")
        supabase_key = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set.")
        _supabase_client = create_client(supabase_url, supabase_key)
    return _supabase_client
