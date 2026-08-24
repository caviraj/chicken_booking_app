const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface MeatRate {
  meat_type: string
  rate_per_kg: number
  effective_date: string
  is_fallback?: boolean
}

export interface RatesResponse {
  rates: Record<string, MeatRate>
}

export interface ValidationResponse {
  valid: boolean
  errors: string[]
}

export interface DeliveryCalculationResponse {
  delivery_charge: number
  distance_km: number | null
  delivery_zone: string
  source: string
  is_deliverable?: boolean
}

export interface CreateOrderPayload {
  customer_id: string
  meat_type: string
  quantity_kg: number
  cutting_type: string
  delivery_date: string
  delivery_time_slot: string
  fulfillment_type: 'delivery' | 'pickup'
  delivery_address?: string
  payment_method: 'online' | 'cod'
  source?: string
}


export const fetchMeatRates = async (): Promise<Record<string, MeatRate>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/booking/rates`)
    if (!res.ok) {
      throw new Error(`Failed to fetch rates: ${res.statusText}`)
    }
    const data: RatesResponse = await res.json()
    return data.rates
  } catch (err) {
    console.warn('API rates fetch failed, returning default rates:', err)
    return {
      chicken: { meat_type: 'chicken', rate_per_kg: 240, effective_date: new Date().toISOString() },
      mutton: { meat_type: 'mutton', rate_per_kg: 750, effective_date: new Date().toISOString() },
      duck: { meat_type: 'duck', rate_per_kg: 380, effective_date: new Date().toISOString() }
    }
  }
}

export const validateDraftBooking = async (
  meatType: string,
  quantityKg: number,
  deliveryDate: string
): Promise<ValidationResponse> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/booking/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meat_type: meatType,
        quantity_kg: quantityKg,
        delivery_date: deliveryDate
      })
    })
    if (!res.ok) {
      const errData = await res.json()
      return { valid: false, errors: [errData.detail || 'Validation failed'] }
    }
    return await res.json()
  } catch (err: any) {
    return { valid: true, errors: [] }
  }
}

export const calculateDeliveryFee = async (
  customerAddress: string,
  customerLat?: number,
  customerLng?: number
): Promise<DeliveryCalculationResponse> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/booking/calculate-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_address: customerAddress,
        customer_lat: customerLat,
        customer_lng: customerLng
      })
    })
    if (!res.ok) {
      throw new Error('Delivery calculation failed')
    }
    return await res.json()
  } catch (err) {
    return {
      delivery_charge: 30.0,
      distance_km: null,
      delivery_zone: 'Standard Zone',
      source: 'fallback'
    }
  }
}

export const submitOrder = async (payload: CreateOrderPayload): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/booking/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Failed to submit order')
  }

  return await res.json()
}

export const fetchCustomerOrders = async (customerId: string): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/booking/orders/customer/${customerId}`)
    if (!res.ok) throw new Error('Failed to fetch orders')
    const data = await res.json()
    return data.orders || []
  } catch (err) {
    console.error('Error fetching customer orders:', err)
    return []
  }
}

export const cancelCustomerOrder = async (orderId: string, customerId: string): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/api/booking/orders/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, customer_id: customerId })
  })

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.detail || 'Failed to cancel order')
  }

  return await res.json()
}

export const fetchAdminSettings = async (): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/settings`)
    if (!res.ok) return { cod_enabled: false }
    const data = await res.json()
    return data.settings || { cod_enabled: false }
  } catch (err) {
    return { cod_enabled: false }
  }
}

