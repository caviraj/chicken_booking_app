import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Header } from '../components/Header'
import { fetchCustomerOrders, cancelCustomerOrder } from '../api/bookingApi'
import {
  ShoppingBag,
  Clock,
  Calendar,
  MapPin,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Truck,
  Plus
} from 'lucide-react'

export const OrderHistoryPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { customer, user } = useAuth()

  const [orders, setOrders] = useState<any[]>([])
  const [tab, setTab] = useState<'all' | 'active' | 'past' | 'cancelled'>('all')
  const [loading, setLoading] = useState<boolean>(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const customerId = customer?.id || user?.id || ''

  const loadOrders = async () => {
    if (!customerId) return
    setLoading(true)
    setMsg(null)
    try {
      const data = await fetchCustomerOrders(customerId)
      setOrders(data)
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Failed to load order history.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [customerId])

  const canCancelOrder = (order: any): boolean => {
    if (order.order_status === 'cancelled' || order.order_status === 'delivered' || order.order_status === 'completed') {
      return false
    }

    const todayStr = new Date().toISOString().split('T')[0]
    const delivDate = order.delivery_date

    if (delivDate > todayStr) {
      return true
    }

    if (delivDate === todayStr) {
      const now = new Date()
      const cutoffHour = 20
      if (now.getHours() < cutoffHour) {
        return true
      }
    }

    return false
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!customerId) return
    setCancellingId(orderId)
    setMsg(null)

    try {
      await cancelCustomerOrder(orderId, customerId)
      setMsg({ type: 'success', text: t('orders.orderCancelled') || 'Order cancelled successfully.' })
      await loadOrders()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to cancel order.' })
    } finally {
      setCancellingId(null)
    }
  }

  const filteredOrders = orders.filter((o) => {
    const status = (o.order_status || '').toLowerCase()
    if (tab === 'active') {
      return status === 'confirmed' || status === 'pending' || status === 'processing'
    }
    if (tab === 'past') {
      return status === 'delivered' || status === 'completed'
    }
    if (tab === 'cancelled') {
      return status === 'cancelled'
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-red-800" />
              <span>{t('orders.title') || 'My Meat Orders'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">{t('orders.subtitle') || 'Track live status or cancel orders before cutoff time'}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/booking')}
              className="py-2 px-4 rounded-xl btn-primary text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </button>
            <button
              onClick={loadOrders}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {msg && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs flex items-center gap-3 animate-in fade-in ${
              msg.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="grid grid-cols-4 p-1 bg-slate-200 rounded-2xl text-xs font-bold text-slate-700 mb-8">
          <button
            onClick={() => setTab('all')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${tab === 'all' ? 'bg-red-800 text-white shadow-xs' : 'hover:text-slate-900'}`}
          >
            {t('orders.allTab') || 'All'} ({orders.length})
          </button>
          <button
            onClick={() => setTab('active')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${tab === 'active' ? 'bg-red-800 text-white shadow-xs' : 'hover:text-slate-900'}`}
          >
            {t('orders.activeTab') || 'Active'}
          </button>
          <button
            onClick={() => setTab('past')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${tab === 'past' ? 'bg-red-800 text-white shadow-xs' : 'hover:text-slate-900'}`}
          >
            {t('orders.pastTab') || 'Past'}
          </button>
          <button
            onClick={() => setTab('cancelled')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${tab === 'cancelled' ? 'bg-red-800 text-white shadow-xs' : 'hover:text-slate-900'}`}
          >
            {t('orders.cancelledTab') || 'Cancelled'}
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="pro-card p-8 text-center">
            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs text-slate-500 font-bold">Fetching your order history...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="pro-card p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-extrabold text-slate-800 mb-1">{t('orders.noOrders') || 'No orders found'}</h3>
            <p className="text-xs text-slate-500 mb-6">Select your fresh meat items and place an order.</p>
            <button
              onClick={() => navigate('/booking')}
              className="py-2.5 px-5 rounded-xl btn-primary text-xs font-bold shadow-xs cursor-pointer"
            >
              Start Booking
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isCancelled = order.order_status === 'cancelled'
              const isPaid = order.payment_status === 'paid'
              const isCodPending = order.payment_status === 'cod_pending'
              const canCancel = canCancelOrder(order)

              const meatEmoji = order.meat_type === 'mutton' ? '🐐' : order.meat_type === 'duck' ? '🦆' : '🐔'

              return (
                <div
                  key={order.id}
                  className={`pro-card p-5 sm:p-6 transition-all border ${
                    isCancelled ? 'opacity-70 bg-slate-50' : 'hover:border-red-800/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl shrink-0">
                        {meatEmoji}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base capitalize flex items-center gap-2">
                          <span>{order.meat_type}</span>
                          <span className="text-xs font-semibold text-slate-500">({order.quantity_kg} kg)</span>
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">ID: {order.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCancelled
                            ? 'badge-crimson'
                            : order.order_status === 'delivered'
                            ? 'badge-fresh'
                            : 'badge-gold'
                        }`}
                      >
                        {order.order_status}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPaid
                            ? 'badge-fresh'
                            : isCodPending
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'badge-gold'
                        }`}
                      >
                        {isPaid ? 'Paid' : isCodPending ? 'COD Pending' : 'Pending Online'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 text-xs text-slate-600 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-800 shrink-0" />
                      <span>Date: <strong className="text-slate-900">{order.delivery_date}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-800 shrink-0" />
                      <span>Slot: <strong className="text-slate-900">{order.delivery_time_slot}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-red-800 shrink-0" />
                      <span>Cutting: <strong className="text-slate-900 capitalize">{order.cutting_type}</strong></span>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="pt-3 pb-3 text-xs text-slate-500 flex items-start gap-2 border-b border-slate-100">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>
                  )}

                  <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-slate-900">
                      Total: <span className="text-red-800">₹{order.grand_total}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isPaid && order.payment_method === 'online' && !isCancelled && (
                        <a
                          href={order.razorpay_payment_link || `/order-confirmation/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3.5 rounded-xl bg-red-800 hover:bg-red-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>Pay ₹{order.grand_total}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {canCancel && (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          className="py-2 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 font-bold text-xs border border-red-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p className="font-medium">FreshMeat Express Customer Order Portal</p>
      </footer>
    </div>
  )
}
