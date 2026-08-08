import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabaseClient'
import { CheckCircle2, Clock, ExternalLink, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react'

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()


  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchOrderDetails = async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) {
        throw new Error(error.message)
      }
      setOrder(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'Order not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetails()

    // Poll status every 5 seconds if payment is pending
    const interval = setInterval(() => {
      if (orderId) {
        supabase
          .from('orders')
          .select('payment_status, razorpay_payment_id')
          .eq('id', orderId)
          .single()
          .then(({ data }) => {
            if (data) {
              setOrder((prev: any) => (prev ? { ...prev, ...data } : data))
            }
          })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [orderId])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-sm text-slate-400 font-medium">Loading order details...</span>
          </div>
        ) : errorMsg ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-100 mb-2">Order Not Found</h2>
            <p className="text-xs text-slate-400 mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate('/booking')}
              className="py-2.5 px-5 rounded-xl bg-orange-500 text-white font-bold text-xs"
            >
              Back to Booking
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300">
            {/* Status Header Icon */}
            {order?.payment_status === 'paid' ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>
            )}

            <h2 className="text-2xl font-extrabold text-slate-100 mb-2">
              {order?.payment_status === 'paid' ? 'Payment Verified!' : 'Order Placed Successfully'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Delivery scheduled for <span className="font-semibold text-slate-200">{order?.delivery_date}</span> during{' '}
              <span className="font-semibold text-slate-200">{order?.delivery_time_slot}</span>
            </p>

            {/* Order Info Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-2.5 text-xs text-slate-300 mb-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span>Order Reference ID:</span>
                <span className="font-mono font-bold text-orange-400">{order?.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Meat & Quantity:</span>
                <span className="font-semibold text-slate-200 capitalize">{order?.meat_type} ({order?.quantity_kg} kg)</span>
              </div>
              <div className="flex justify-between">
                <span>Cutting Preference:</span>
                <span className="font-semibold text-slate-200 capitalize">{order?.cutting_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-slate-100 text-sm">₹{order?.grand_total}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span>Payment Status:</span>
                <span
                  className={`font-semibold uppercase text-xs px-2.5 py-0.5 rounded-md ${
                    order?.payment_status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : order?.payment_status === 'cod_pending'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {order?.payment_status === 'paid'
                    ? 'Paid'
                    : order?.payment_status === 'cod_pending'
                    ? 'COD Pending'
                    : 'Pending Online Payment'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {order?.payment_status !== 'paid' && order?.payment_method === 'online' && (
                <a
                  href={order?.razorpay_payment_link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Pay ₹{order?.grand_total} via Razorpay</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fetchOrderDetails}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 flex items-center justify-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <span>Secured Razorpay Online Payment & Instant Webhook Synchronization</span>
        </p>
      </footer>
    </div>
  )
}
