import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from '../../components/Header'
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
  Globe,
  Printer,
  X
} from 'lucide-react'

export const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const adminEmail = user?.email || ''

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<any | null>(null)

  const printPackageLabel = (order: any) => {
    setSelectedPrintOrder(order)
  }

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
      setMsg({ type: 'success', text: `Order ${orderId} status changed to ${newStatus}.` })
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
      setMsg({ type: 'success', text: `Order ${orderId} payment status updated to ${newPaymentStatus}.` })
      await loadOrders()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update payment status.' })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-red-800" />
              <span>Orders Management Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Manage incoming web & WhatsApp orders, status progression, and thermal label generation
            </p>
          </div>

          <nav className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => navigate('/admin/rates')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Rates
            </button>
            <button
              onClick={() => navigate('/admin/orders')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold bg-red-800 text-white shadow-2xs"
            >
              Orders Dashboard
            </button>
            <button
              onClick={() => navigate('/admin/delivery-zones')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Delivery Zones
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Settings
            </button>
            <button
              onClick={loadOrders}
              className="ml-2 p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </nav>
        </div>

        {/* Global Alert Notification */}
        {msg && (
          <div
            className={`mb-6 p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              msg.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800 font-medium'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
            }`}
          >
            {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Filters Bar */}
        <div className="pro-card p-4 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Delivery Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pro-input text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Order Source Channel</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full pro-input text-xs"
            >
              <option value="">All Channels (Web + WhatsApp)</option>
              <option value="website">Website</option>
              <option value="whatsapp">WhatsApp Bot</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Order Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pro-input text-xs"
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
            <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full pro-input text-xs"
            >
              <option value="">All Methods</option>
              <option value="online">Online Payment</option>
              <option value="cod">Cash on Delivery (COD)</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="pro-card p-8 text-center">
            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs text-slate-500 font-bold">Loading orders dataset...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="pro-card p-12 text-center text-slate-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <h3 className="text-base font-extrabold text-slate-800 mb-1">No Orders Found</h3>
            <p className="text-xs text-slate-500">No orders match your selected filter criteria.</p>
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
                  className="pro-card p-5 sm:p-6 transition-all hover:border-red-800/30"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-xl shrink-0">
                        {meatEmoji}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm capitalize flex items-center gap-2">
                          <span>{order.meat_type}</span>
                          <span className="text-xs font-semibold text-slate-500">({order.quantity_kg} kg)</span>
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">ID: {order.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isWhatsapp
                            ? 'badge-fresh'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isWhatsapp ? <MessageSquare className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        <span className="capitalize">{order.source}</span>
                      </span>

                      <span className="badge-gold px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {order.order_status}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPaid
                            ? 'badge-fresh'
                            : isCodPending
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'badge-crimson'
                        }`}
                      >
                        {isPaid ? 'Paid' : isCodPending ? 'COD Pending' : 'Pending Online'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs text-slate-600 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-red-800 shrink-0" />
                      <span>Date: <strong className="text-slate-900">{order.delivery_date}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-red-800 shrink-0" />
                      <span>Slot: <strong className="text-slate-900">{order.delivery_time_slot}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-red-800 shrink-0" />
                      <span>Cutting: <strong className="text-slate-900 capitalize">{order.cutting_type}</strong></span>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="pt-2 pb-3 text-xs text-slate-500 flex items-start gap-2 border-b border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>
                  )}

                  <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-700">
                      Total Amount: <span className="text-red-800 text-sm font-extrabold">₹{order.grand_total}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {order.order_status === 'confirmed' && (
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, 'preparing')}
                          className="py-1.5 px-3 rounded-lg bg-amber-500 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                        >
                          Mark Preparing
                        </button>
                      )}

                      {order.order_status === 'preparing' && (
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, 'out_for_delivery')}
                          className="py-1.5 px-3 rounded-lg bg-blue-600 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                        >
                          Mark Out for Delivery
                        </button>
                      )}

                      {order.order_status === 'out_for_delivery' && (
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, 'delivered')}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                        >
                          Mark Delivered
                        </button>
                      )}

                      {isCodPending && (
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handlePaymentStatusChange(order.id, 'paid')}
                          className="py-1.5 px-3 rounded-lg bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          Mark COD Paid
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => printPackageLabel(order)}
                        className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title="Print package thermal sticker label"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Sticker Label</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Printable Package Label Modal */}
      {selectedPrintOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-300 relative">
            <button
              onClick={() => setSelectedPrintOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center border-b pb-3 mb-3">
              <h3 className="text-base font-extrabold tracking-tight text-red-800 uppercase">FRESH MEAT EXPRESS</h3>
              <p className="text-[10px] font-bold text-slate-500">PACKAGE THERMAL PRINT STICKER</p>
            </div>

            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between border-b pb-1">
                <span className="font-semibold text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedPrintOrder.id}</span>
              </div>

              <div className="flex justify-between border-b pb-1">
                <span className="font-semibold text-slate-500">Meat Item:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {selectedPrintOrder.meat_type} ({selectedPrintOrder.quantity_kg} kg)
                </span>
              </div>

              <div className="flex justify-between border-b pb-1">
                <span className="font-semibold text-slate-500">Cutting Style:</span>
                <span className="font-bold text-slate-900 capitalize">{selectedPrintOrder.cutting_type}</span>
              </div>

              <div className="flex justify-between border-b pb-1">
                <span className="font-semibold text-slate-500">Date/Slot:</span>
                <span className="font-semibold text-slate-900">
                  {selectedPrintOrder.delivery_date} ({selectedPrintOrder.delivery_time_slot})
                </span>
              </div>

              {selectedPrintOrder.delivery_address && (
                <div className="border-b pb-1">
                  <span className="font-semibold text-slate-500 block">Address:</span>
                  <span className="font-medium text-slate-800">{selectedPrintOrder.delivery_address}</span>
                </div>
              )}

              <div className="flex justify-between pt-1 font-extrabold text-xs text-red-800">
                <span>Amount:</span>
                <span>₹{selectedPrintOrder.grand_total} ({selectedPrintOrder.payment_status.toUpperCase()})</span>
              </div>
            </div>

            <div className="text-center pt-2 border-t">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=ORDER:${selectedPrintOrder.id}`}
                alt="Order QR Code"
                className="w-24 h-24 mx-auto mb-2 border p-1 rounded-lg"
              />
              <span className="text-[10px] font-mono text-slate-500">SCAN TO VERIFY ORDER DETAILS</span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedPrintOrder(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl btn-primary text-xs font-bold shadow-xs cursor-pointer"
              >
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
