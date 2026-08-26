const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export interface MeatRatePayload {
  admin_email: string
  meat_type: string
  rate_per_kg: number
  effective_date?: string
}

export interface RateHistoryItem {
  id: string
  meat_type: string
  rate_per_kg: number
  effective_date: string
  created_at?: string
  created_by?: string
}

export interface AdminSettings {
  id?: string
  order_cutoff_time: string
  daily_stock_limit_kg: number
  shop_latitude: number
  shop_longitude: number
  shop_lat?: number | null
  shop_lng?: number | null
  is_cleaning_day: boolean
  cleaning_day?: boolean
  cod_enabled?: boolean
  delivery_enabled_days?: string[]
  updated_at?: string
}



export interface AdminSettingsPayload {
  admin_email: string
  order_cutoff_time: string
  daily_stock_limit_kg: number
  shop_latitude: number
  shop_longitude: number
  is_cleaning_day: boolean
}

export interface DeliveryZonePayload {
  admin_email: string
  zone_name: string
  max_distance_km: number
  delivery_charge: number
  is_active: boolean
}

export const verifyAdminEmail = async (email: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    if (!res.ok) return false
    const data = await res.json()
    return !!data.is_admin
  } catch (err) {
    console.error('Error verifying admin:', err)
    return false
  }
}

// Export alias for backward compatibility
export const verifyAdminUser = verifyAdminEmail

export const fetchRatesHistory = async (meatType?: string): Promise<RateHistoryItem[]> => {
  try {
    const url = meatType
      ? `${API_BASE_URL}/api/admin/rates?meat_type=${meatType}`
      : `${API_BASE_URL}/api/admin/rates`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch rates history')
    const data = await res.json()
    return data.rates || []
  } catch (err) {
    console.error('Error fetching rates history:', err)
    return []
  }
}

export const fetchAdminRateHistory = fetchRatesHistory

export const updateMeatRate = async (
  adminEmail: string,
  meatType: string,
  ratePerKg: number,
  effectiveDate?: string
): Promise<any> => {
  const payload: MeatRatePayload = {
    admin_email: adminEmail,
    meat_type: meatType,
    rate_per_kg: ratePerKg,
    effective_date: effectiveDate
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/rates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.detail || 'Failed to update meat rate')
  }

  return await res.json()
}

export const fetchAdminSettings = async (): Promise<AdminSettings> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/settings`)
    if (!res.ok) throw new Error('Failed to fetch admin settings')
    const data = await res.json()
    return data.settings || {}
  } catch (err) {
    console.error('Error fetching admin settings:', err)
    return {
      order_cutoff_time: '20:00',
      daily_stock_limit_kg: 100,
      shop_latitude: 11.063737820050445,
      shop_longitude: 77.79459634396372,
      is_cleaning_day: false
    }
  }
}

export const updateAdminSettings = async (payload: AdminSettingsPayload): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.detail || 'Failed to update admin settings')
  }

  return await res.json()
}

export const saveAdminSettings = updateAdminSettings

// --- Phase 11: Orders Management API Helpers ---

export const fetchAdminOrders = async (filters?: {
  delivery_date?: string
  source?: string
  order_status?: string
  payment_method?: string
}): Promise<any[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.delivery_date) queryParams.append('delivery_date', filters.delivery_date)
    if (filters?.source) queryParams.append('source', filters.source)
    if (filters?.order_status) queryParams.append('order_status', filters.order_status)
    if (filters?.payment_method) queryParams.append('payment_method', filters.payment_method)

    const res = await fetch(`${API_BASE_URL}/api/admin/orders?${queryParams.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch admin orders')
    const data = await res.json()
    return data.orders || []
  } catch (err) {
    console.error('Error fetching admin orders:', err)
    return []
  }
}

export const updateOrderStatus = async (
  orderId: string,
  adminEmail: string,
  newStatus: string
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_email: adminEmail, order_status: newStatus })
  })

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.detail || 'Failed to update order status')
  }

  return await res.json()
}

export const updateOrderPaymentStatus = async (
  orderId: string,
  adminEmail: string,
  newPaymentStatus: string
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/payment-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_email: adminEmail, payment_status: newPaymentStatus })
  })

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.detail || 'Failed to update payment status')
  }

  return await res.json()
}

// --- Phase 11: Delivery Zones API Helpers ---

export const fetchAdminDeliveryZones = async (): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/delivery-zones`)
    if (!res.ok) throw new Error('Failed to fetch delivery zones')
    const data = await res.json()
    return data.zones || []
  } catch (err) {
    console.error('Error fetching delivery zones:', err)
    return []
  }
}

export const createDeliveryZone = async (payload: DeliveryZonePayload): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/admin/delivery-zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.detail || 'Failed to create delivery zone')
  }

  return await res.json()
}

export const updateDeliveryZone = async (
  zoneId: string,
  payload: DeliveryZonePayload
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/admin/delivery-zones/${zoneId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.detail || 'Failed to update delivery zone')
  }

  return await res.json()
}

export const deleteDeliveryZone = async (zoneId: string, adminEmail: string): Promise<any> => {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/delivery-zones/${zoneId}?admin_email=${encodeURIComponent(adminEmail)}`,
    { method: 'DELETE' }
  )

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.detail || 'Failed to delete delivery zone')
  }

  return await res.json()
}
