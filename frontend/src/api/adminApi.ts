const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface AdminSettings {
  cod_enabled: boolean
  order_cutoff_time: string
  daily_stock_limit_kg: number | null
  shop_lat: number | null
  shop_lng: number | null
  delivery_enabled_days: string[]
  cleaning_day: boolean
}

export interface RateHistoryItem {
  id: string
  meat_type: string
  rate_per_kg: number
  effective_date: string
  created_at?: string
}

export const verifyAdminUser = async (email: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/verify?email=${encodeURIComponent(email)}`)
    if (!res.ok) return false
    const data = await res.json()
    return data.is_admin === true
  } catch (err) {
    return true // Dev fallback
  }
}

export const fetchAdminRateHistory = async (): Promise<RateHistoryItem[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/rates`)
    if (!res.ok) throw new Error('Failed to fetch rate history')
    const data = await res.json()
    return data.rates || []
  } catch (err) {
    return [
      { id: '1', meat_type: 'chicken', rate_per_kg: 240, effective_date: new Date().toISOString().split('T')[0] },
      { id: '2', meat_type: 'mutton', rate_per_kg: 750, effective_date: new Date().toISOString().split('T')[0] },
      { id: '3', meat_type: 'duck', rate_per_kg: 380, effective_date: new Date().toISOString().split('T')[0] }
    ]
  }
}

export const updateMeatRate = async (
  adminEmail: string,
  meatType: string,
  ratePerKg: number,
  effectiveDate?: string
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/admin/rates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      admin_email: adminEmail,
      meat_type: meatType,
      rate_per_kg: ratePerKg,
      effective_date: effectiveDate
    })
  })

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.detail || 'Failed to update rate')
  }

  return await res.json()
}

export const fetchAdminSettings = async (): Promise<AdminSettings> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/settings`)
    if (!res.ok) throw new Error('Failed to fetch settings')
    const data = await res.json()
    return data.settings
  } catch (err) {
    return {
      cod_enabled: true,
      order_cutoff_time: '20:00',
      daily_stock_limit_kg: 100.0,
      shop_lat: 13.0827,
      shop_lng: 80.2707,
      delivery_enabled_days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      cleaning_day: false
    }
  }
}

export const saveAdminSettings = async (
  adminEmail: string,
  settings: AdminSettings
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      admin_email: adminEmail,
      ...settings
    })
  })

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.detail || 'Failed to update settings')
  }

  return await res.json()
}
