import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabaseClient'
import { CheckCircle2, Clock, ExternalLink, ShieldCheck, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react'

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="pro-card p-8 text-center">
            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs text-slate-500 font-bold">{t('orders.fetching') || 'Loading order receipt...'}</span>
          </div>
        ) : errorMsg ? (
          <div className="pro-card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-800 mx-auto mb-3" />
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Order Not Found</h2>
            <p className="text-xs text-slate-500 mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate('/booking')}
              className="py-2.5 px-5 rounded-xl btn-primary text-xs font-bold"
            >
              {t('orders.newBooking') || 'Back to Booking'}
            </button>
          </div>
        ) : (
          <div className="pro-card p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300">
            {/* Status Header Icon */}
            {order?.payment_status === 'paid' ? (
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>
            )}

            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
              {order?.payment_status === 'paid'
                ? (t('booking.paymentVerified') || 'Payment Verified!')
                : (t('booking.orderPlacedSuccessfully') || 'Order Placed Successfully')}
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              {t('booking.deliveryScheduledFor', { date: order?.delivery_date, slot: order?.delivery_time_slot }) ||
                `Delivery scheduled for ${order?.delivery_date} (${order?.delivery_time_slot})`}
            </p>

            {/* Order Info Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs text-slate-700 mb-6">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                <span className="text-slate-500">{t('booking.orderReference') || 'Order Reference:'}</span>
                <span className="font-mono font-extrabold text-red-800">{order?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('booking.meatItemWeight') || 'Meat Item & Weight:'}</span>
                <span className="font-bold text-slate-900 capitalize">
                  {t(`booking.${order?.meat_type}`) || order?.meat_type} ({order?.quantity_kg} {i18n.language === 'ta' ? 'கிலோ' : 'Kg'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('booking.cuttingPreparation') || 'Cutting Preparation:'}</span>
                <span className="font-bold text-slate-900 capitalize">
                  {t(`booking.${order?.cutting_type}`) || order?.cutting_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('booking.totalAmount') || 'Total Amount:'}</span>
                <span className="font-extrabold text-slate-900 text-sm">₹{order?.grand_total}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                <span className="text-slate-500">{t('booking.paymentStatus') || 'Payment Status:'}</span>
                <span
                  className={`font-bold uppercase text-[10px] px-2.5 py-1 rounded-full ${
                    order?.payment_status === 'paid'
                      ? 'badge-fresh'
                      : order?.payment_status === 'cod_pending'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'badge-gold'
                  }`}
                >
                  {order?.payment_status === 'paid'
                    ? (t('orders.paid') || 'Paid via Razorpay')
                    : order?.payment_status === 'cod_pending'
                    ? (t('orders.codPending') || 'Cash on Delivery')
                    : (t('orders.pendingOnline') || 'Pending Payment')}
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
                  className="w-full py-3 px-6 rounded-xl bg-red-800 hover:bg-red-600 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{t('booking.payNowRazorpay', { total: order?.grand_total }) || `Pay ₹${order?.grand_total} Now via Razorpay`}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fetchOrderDetails}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('booking.refreshStatus') || 'Refresh Status'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/orders')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{t('booking.viewAllOrders') || 'View All Orders'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured Razorpay Online Payment & Automated Webhook Processing</span>
        </p>
      </footer>
    </div>
  )
}
