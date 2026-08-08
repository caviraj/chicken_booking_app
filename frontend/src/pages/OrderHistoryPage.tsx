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
  Truck
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

  // Check if an order is eligible for cancellation (before cutoff time)
  const canCancelOrder = (order: any): boolean => {
    if (order.order_status === 'cancelled' || order.order_status === 'delivered' || order.order_status === 'completed') {
      return false
    }

    const todayStr = new Date().toISOString().split('T')[0]
    const delivDate = order.delivery_date

    // Future dates can be cancelled
    if (delivDate > todayStr) {
      return true
    }

    // Today's dates can be cancelled before cutoff (e.g. 20:00)
    if (delivDate === todayStr) {
      const now = new Date()
      const cutoffHour = 20 // 20:00 cutoff
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
      setMsg({ type: 'success', text: t('orders.orderCancelled') })
      await loadOrders()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to cancel order.' })
    } fontally: {
      setCancellingId(null)
    }
  }

  // Filtered orders list
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
    return true // 'all'
  })

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-orange-400" />
              <span>{t('orders.title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t('orders.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/booking')}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
            >
              + New Booking
            </button>
            <button
              onClick={loadOrders}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
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
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="grid grid-cols-4 p-1 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs font-semibold text-slate-400 mb-8">
          <button
            onClick={() => setTab('all')}
            className={`py-2.5 rounded-xl transition-all ${tab === 'all' ? 'bg-orange-500 text-white shadow-md' : 'hover:text-slate-200'}`}
          >
            {t('orders.allTab')} ({orders.length})
          </button>
          <button
            onClick={() => setTab('active')}
            className={`py-2.5 rounded-xl transition-all ${tab === 'active' ? 'bg-orange-500 text-white shadow-md' : 'hover:text-slate-200'}`}
          >
            {t('orders.activeTab')}
          </button>
          <button
            onClick={() => setTab('past')}
            className={`py-2.5 rounded-xl transition-all ${tab === 'past' ? 'bg-orange-500 text-white shadow-md' : 'hover:text-slate-200'}`}
          >
            {t('orders.pastTab')}
          </button>
          <button
            onClick={() => setTab('cancelled')}
            className={`py-2.5 rounded-xl transition-all ${tab === 'cancelled' ? 'bg-orange-500 text-white shadow-md' : 'hover:text-slate-200'}`}
          >
            {t('orders.cancelledTab')}
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs text-slate-400 font-medium">Loading your orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300 mb-1">{t('orders.noOrders')}</h3>
            <p className="text-xs text-slate-500 mb-6">Explore our fresh meat options and place your order today.</p>
            <button
              onClick={() => navigate('/booking')}
              className="py-2.5 px-5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20"
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
                  className={`glass-card rounded-2xl p-5 sm:p-6 transition-all duration-200 border ${
                    isCancelled ? 'border-rose-500/20 opacity-75' : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shrink-0">
                        {meatEmoji}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-100 text-base capitalize flex items-center gap-2">
                          <span>{order.meat_type}</span>
                          <span className="text-xs font-normal text-slate-400">({order.quantity_kg} kg)</span>
                        </h3>
                        <span className="text-[11px] font-mono text-slate-500">ID: {order.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Order Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isCancelled
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : order.order_status === 'delivered'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        }`}
                      >
                        {order.order_status}
                      </span>

                      {/* Payment Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isCodPending
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {isPaid ? 'Paid' : isCodPending ? 'COD Pending' : 'Pending Online'}
                      </span>
                    </div>
                  </div>

                  {/* Order Details Body */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 text-xs text-slate-300 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>Delivery: <strong className="text-slate-100">{order.delivery_date}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>Slot: <strong className="text-slate-100">{order.delivery_time_slot}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>Cutting: <strong className="text-slate-100 capitalize">{order.cutting_type}</strong></span>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="pt-3 pb-3 text-xs text-slate-400 flex items-start gap-2 border-b border-slate-800/80">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-sm font-bold text-slate-100">
                      Grand Total: <span className="text-orange-400">₹{order.grand_total}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Pay via Razorpay button if online pending */}
                      {!isPaid && order.payment_method === 'online' && !isCancelled && (
                        <a
                          href={order.razorpay_payment_link || `/order-confirmation/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                        >
                          <span>{t('orders.payNow', { amount: order.grand_total })}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Pre-cutoff Cancel Order Button */}
                      {canCancel && (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          className="py-2 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                          title={t('orders.cancelNotice')}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{cancellingId === order.id ? t('orders.cancelling') : t('orders.cancelOrder')}</span>
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

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <p>Fresh Meat Booking System — Phase 7 Customer Order History</p>
      </footer>
    </div>
  )
}
