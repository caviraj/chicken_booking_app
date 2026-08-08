import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchAdminOrders,
  updateOrderStatus,
  updateOrderPaymentStatus
} from '../../api/adminApi'
import {
  ShoppingBag,
  RefreshCw,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  Package,
  AlertCircle,
  MessageSquare,
  Globe
} from 'lucide-react'


export const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const adminEmail = user?.email || ''

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  // Filter States
  const [filterDate, setFilterDate] = useState<string>('')
  const [filterSource, setFilterSource] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPayment, setFilterPayment] = useState<string>('')

  const loadOrders = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const data = await fetchAdminOrders({
        delivery_date: filterDate || undefined,
        source: filterSource || undefined,
        order_status: filterStatus || undefined,
        payment_method: filterPayment || undefined
      })
      setOrders(data)
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Failed to load admin orders.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [filterDate, filterSource, filterStatus, filterPayment])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!adminEmail) return
    setUpdatingId(orderId)
    setMsg(null)
    try {
      await updateOrderStatus(orderId, adminEmail, newStatus)
      setMsg({ type: 'success', text: `Order ${orderId} updated to ${newStatus}.` })
      await loadOrders()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update order status.' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: string) => {
    if (!adminEmail) return
    setUpdatingId(orderId)
    setMsg(null)
    try {
      await updateOrderPaymentStatus(orderId, adminEmail, newPaymentStatus)
      setMsg({ type: 'success', text: `Order ${orderId} payment status marked as ${newPaymentStatus}.` })
      await loadOrders()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update payment status.' })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-extrabold text-slate-100 text-lg tracking-tight">Admin Dashboard</h1>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/rates')}
              className="py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              Rates
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              Settings
            </button>
            <button
              onClick={() => navigate('/admin/orders')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 transition-all"
            >
              Orders
            </button>
            <button
              onClick={() => navigate('/admin/delivery-zones')}
              className="py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              Delivery Zones
            </button>
            <button
              onClick={() => signOut()}
              className="ml-3 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-amber-400" />
              <span>Orders Management</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              View and manage orders from both Website and WhatsApp sources
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Global Alert Notification */}
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

        {/* Filters Bar */}
        <div className="glass-card rounded-2xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Delivery Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Source</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Sources</option>
              <option value="website">Website</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Order Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Methods</option>
              <option value="online">Online Payment</option>
              <option value="cod">Cash on Delivery (COD)</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs text-slate-400 font-medium">Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-700" />
            <h3 className="text-base font-bold text-slate-300 mb-1">No Orders Found</h3>
            <p className="text-xs text-slate-500">No orders match the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isWhatsapp = order.source === 'whatsapp'
              const isPaid = order.payment_status === 'paid'
              const isCodPending = order.payment_status === 'cod_pending'

              const meatEmoji = order.meat_type === 'mutton' ? '🐐' : order.meat_type === 'duck' ? '🦆' : '🐔'

              return (
                <div
                  key={order.id}
                  className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                        {meatEmoji}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-100 text-sm capitalize flex items-center gap-2">
                          <span>{order.meat_type}</span>
                          <span className="text-xs font-normal text-slate-400">({order.quantity_kg} kg)</span>
                        </h3>
                        <span className="text-[11px] font-mono text-slate-500">ID: {order.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Source Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 ${
                          isWhatsapp
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {isWhatsapp ? <MessageSquare className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        <span className="capitalize">{order.source}</span>
                      </span>

                      {/* Status Badge */}
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {order.order_status}
                      </span>

                      {/* Payment Status Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
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

                  {/* Body Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs text-slate-300 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Date: <strong className="text-slate-100">{order.delivery_date}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Slot: <strong className="text-slate-100">{order.delivery_time_slot}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Cutting: <strong className="text-slate-100 capitalize">{order.cutting_type}</strong></span>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="pt-2 pb-3 text-xs text-slate-400 flex items-start gap-2 border-b border-slate-800/80">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-200">
                      Total Amount: <span className="text-amber-400 text-sm">₹{order.grand_total}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Advance Order Status Buttons */}
                      {order.order_status === 'confirmed' && (
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, 'preparing')}
                          className="py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold text-xs transition-all"
                        >
                          Mark Preparing
                        </button>
                      )}

                      {order.order_status === 'preparing' && (
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, 'out_for_delivery')}
                          className="py-1.5 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold text-xs transition-all"
                        >
                          Mark Out for Delivery
                        </button>
                      )}

                      {order.order_status === 'out_for_delivery' && (
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, 'delivered')}
                          className="py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-xs transition-all"
                        >
                          Mark Delivered
                        </button>
                      )}

                      {/* Mark COD Paid Button */}
                      {isCodPending && (
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handlePaymentStatusChange(order.id, 'paid')}
                          className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all"
                        >
                          Mark COD Paid
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
    </div>
  )
}
