import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Header } from '../components/Header'
import {
  fetchMeatRates,
  validateDraftBooking,
  calculateDeliveryFee,
  submitOrder
} from '../api/bookingApi'
import type { MeatRate } from '../api/bookingApi'

import {
  ShoppingBag,
  Calendar,
  Clock,
  Scissors,
  Truck,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  MapPin,
  Ban,
  Sparkles
} from 'lucide-react'

export const BookingPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { customer, user } = useAuth()

  // Booking step (1 to 9)
  const [step, setStep] = useState<number>(1)

  // Data states
  const [rates, setRates] = useState<Record<string, MeatRate>>({})
  const [selectedMeat, setSelectedMeat] = useState<string>('chicken')
  const [quantityKg, setQuantityKg] = useState<number>(1.0)
  const [customQty, setCustomQty] = useState<string>('')
  
  // Dates
  const todayStr = new Date().toISOString().split('T')[0]
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const [deliveryDate, setDeliveryDate] = useState<string>(todayStr)

  // Time Slot
  const [timeSlot, setTimeSlot] = useState<string>('6:00 AM - 7:00 AM')

  // Cutting Type
  const [cuttingType, setCuttingType] = useState<string>('sirasa')

  // Fulfillment
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery')
  const [deliveryAddress, setDeliveryAddress] = useState<string>('')
  const [deliveryCharge, setDeliveryCharge] = useState<number>(30.0)
  const [deliveryZone, setDeliveryZone] = useState<string>('Standard Zone')

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online')

  // UI state
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [validationWarning, setValidationWarning] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<any>(null)

  // Available Time Slots
  const timeSlots = [
    '5:00 AM - 6:00 AM',
    '6:00 AM - 7:00 AM',
    '7:00 AM - 8:00 AM',
    '8:00 AM - 9:00 AM'
  ]

  // Cutting options
  const cuttingOptions = [
    { id: 'sirasa', labelKey: 'booking.sirasa', icon: '🔪' },
    { id: 'perusa', labelKey: 'booking.perusa', icon: '🥩' },
    { id: 'legPiece', labelKey: 'booking.legPiece', icon: '🍗' },
    { id: 'whole', labelKey: 'booking.whole', icon: '🍗' }
  ]

  useEffect(() => {
    // Fetch rates on mount
    fetchMeatRates().then((res) => {
      setRates(res)
    })
  }, [])

  // Live calculation of item subtotal
  const currentRatePerKg = rates[selectedMeat]?.rate_per_kg || (selectedMeat === 'mutton' ? 750 : selectedMeat === 'duck' ? 380 : 240)
  const effectiveQty = customQty ? parseFloat(customQty) || quantityKg : quantityKg
  const itemTotal = roundNumber(currentRatePerKg * effectiveQty)
  const finalDeliveryCharge = fulfillmentType === 'pickup' ? 0.0 : deliveryCharge
  const grandTotal = roundNumber(itemTotal + finalDeliveryCharge)

  function roundNumber(num: number) {
    return Math.round(num * 100) / 100
  }

  // Handle Date change and validate cutoff/stock
  const handleDateChange = async (dateVal: string) => {
    setDeliveryDate(dateVal)
    setErrorMsg(null)
    setValidationWarning(null)

    const val = await validateDraftBooking(selectedMeat, effectiveQty, dateVal)
    if (!val.valid) {
      setValidationWarning(val.errors.join('; '))
    }
  }

  // Handle Calculate Delivery Fee
  const handleCalculateDelivery = async () => {
    if (!deliveryAddress.trim()) {
      setErrorMsg('Please enter a delivery address.')
      return
    }
    setLoading(true)
    setErrorMsg(null)

    const res = await calculateDeliveryFee(deliveryAddress)
    setDeliveryCharge(res.delivery_charge)
    setDeliveryZone(res.delivery_zone)
    setLoading(false)
  }

  // Handle Final Order Submission
  const handleConfirmOrder = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const payload = {
        customer_id: customer?.id || user?.id || 'guest-customer-id',
        meat_type: selectedMeat,
        quantity_kg: effectiveQty,
        cutting_type: cuttingType,
        delivery_date: deliveryDate,
        delivery_time_slot: timeSlot,
        fulfillment_type: fulfillmentType,
        delivery_address: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
        payment_method: paymentMethod,
        source: 'website'
      }

      const res = await submitOrder(payload)
      setCreatedOrder(res.order || res)
      setStep(9) // Step 9: Order Confirmation
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to confirm order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Step Progress Bar */}
        {step < 9 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
              <span className="text-orange-400 font-bold">{t('booking.title')}</span>
              <span>{t('booking.step', { current: step, total: 8 })}</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(step / 8) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: MEAT TYPE ================= */}
        {step === 1 && (
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-slate-100 mb-2 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-orange-400" />
              <span>{t('booking.step1Title')}</span>
            </h2>
            <p className="text-sm text-slate-400 mb-6">Choose your preferred fresh meat option.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Chicken */}
              <div
                onClick={() => setSelectedMeat('chicken')}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
                  selectedMeat === 'chicken'
                    ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-3xl mb-2">🐔</div>
                <h3 className="font-bold text-slate-100 text-base">{t('booking.chicken')}</h3>
                <p className="text-xs text-slate-400 mt-1">{t('booking.chickenDesc')}</p>
                <div className="mt-4 pt-3 border-t border-slate-800/80 font-semibold text-sm text-orange-400">
                  {t('booking.perKg', { rate: rates['chicken']?.rate_per_kg || 240 })}
                </div>
              </div>

              {/* Mutton */}
              <div
                onClick={() => setSelectedMeat('mutton')}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
                  selectedMeat === 'mutton'
                    ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-3xl mb-2">🐐</div>
                <h3 className="font-bold text-slate-100 text-base">{t('booking.mutton')}</h3>
                <p className="text-xs text-slate-400 mt-1">{t('booking.muttonDesc')}</p>
                <div className="mt-4 pt-3 border-t border-slate-800/80 font-semibold text-sm text-orange-400">
                  {t('booking.perKg', { rate: rates['mutton']?.rate_per_kg || 750 })}
                </div>
              </div>

              {/* Duck (Vaathu) */}
              <div
                onClick={() => setSelectedMeat('duck')}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
                  selectedMeat === 'duck'
                    ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-3xl mb-2">🦆</div>
                <h3 className="font-bold text-slate-100 text-base">{t('booking.duck')}</h3>
                <p className="text-xs text-slate-400 mt-1">{t('booking.duckDesc')}</p>
                <div className="mt-4 pt-3 border-t border-slate-800/80 font-semibold text-sm text-orange-400">
                  {t('booking.perKg', { rate: rates['duck']?.rate_per_kg || 380 })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: QUANTITY ================= */}
        {step === 2 && (
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-slate-100 mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-400" />
              <span>{t('booking.step2Title')}</span>
            </h2>
            <p className="text-sm text-slate-400 mb-6">Select preset weight or enter manual quantity.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
              {[0.25, 0.5, 1.0, 2.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setQuantityKg(preset)
                    setCustomQty('')
                  }}
                  className={`py-3.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                    !customQty && quantityKg === preset
                      ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                      : 'bg-slate-900/60 text-slate-200 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {preset} kg
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Manual Quantity Entry (kg)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                placeholder={t('booking.customQtyPlaceholder')}
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 3: DELIVERY DATE ================= */}
        {step === 3 && (
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-slate-100 mb-2 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-orange-400" />
              <span>{t('booking.step3Title')}</span>
            </h2>
            <p className="text-sm text-slate-400 mb-6">Choose your preferred delivery date.</p>

            {validationWarning && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationWarning}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => handleDateChange(todayStr)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  deliveryDate === todayStr
                    ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs text-orange-400 font-semibold mb-1">{t('booking.today')}</div>
                <div className="text-base font-bold text-slate-100">{todayStr}</div>
              </button>

              <button
                type="button"
                onClick={() => handleDateChange(tomorrowStr)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  deliveryDate === tomorrowStr
                    ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs text-orange-400 font-semibold mb-1">{t('booking.tomorrow')}</div>
                <div className="text-base font-bold text-slate-100">{tomorrowStr}</div>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: TIME SLOT ================= */}
        {step === 4 && (
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-slate-100 mb-2 flex items-center gap-2">
              <Clock className="w-6 h-6 text-orange-400" />
              <span>{t('booking.step4Title')}</span>
            </h2>
            <p className="text-sm text-slate-400 mb-6">Select your preferred early morning time slot.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlot(slot)}
                  className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    timeSlot === slot
                      ? 'bg-orange-500/15 border-orange-500 text-white font-semibold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{slot}</span>
                  {timeSlot === slot && <CheckCircle className="w-4 h-4 text-orange-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 5: CUTTING TYPE ================= */}
        {step === 5 && (
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-slate-100 mb-2 flex items-center gap-2">
              <Scissors className="w-6 h-6 text-orange-400" />
              <span>{t('booking.step5Title')}</span>
            </h2>
            <p className="text-sm text-slate-400 mb-6">Specify how you would like your meat cut.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {cuttingOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCuttingType(item.id)}
                  className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    cuttingType === item.id
                      ? 'bg-orange-500/15 border-orange-500 text-white font-semibold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{t(item.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 6: FULFILLMENT ================= */}
        {step === 6 && (
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-slate-100 mb-2 flex items-center gap-2">
              <Truck className="w-6 h-6 text-orange-400" />
              <span>{t('booking.step6Title')}</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  fulfillmentType === 'delivery'
                    ? 'bg-orange-500/15 border-orange-500 text-white font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Truck className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                <span>{t('booking.delivery')}</span>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  fulfillmentType === 'pickup'
                    ? 'bg-orange-500/15 border-orange-500 text-white font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                <span>{t('booking.pickup')}</span>
              </button>
            </div>

            {fulfillmentType === 'delivery' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t('booking.deliveryAddressLabel')}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <textarea
                      rows={3}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder={t('booking.deliveryAddressPlaceholder')}
                      className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-sm"
                    ></textarea>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCalculateDelivery}
                  disabled={loading || !deliveryAddress.trim()}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
                >
                  {t('booking.calculateFee')}
                </button>

                {deliveryCharge > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
                    <span>Delivery Charge ({deliveryZone}):</span>
                    <span className="font-bold text-orange-400">₹{deliveryCharge}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 7: ORDER SUMMARY ================= */}
        {step === 7 && (
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-slate-100 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-orange-400" />
              <span>{t('booking.step7Title')}</span>
            </h2>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm mb-6">
              <div className="flex justify-between text-slate-300">
                <span>Meat Type:</span>
                <span className="font-semibold text-slate-100 capitalize">{selectedMeat}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Quantity:</span>
                <span className="font-semibold text-slate-100">{effectiveQty} kg</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Rate per kg:</span>
                <span className="font-semibold text-slate-100">₹{currentRatePerKg}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Delivery Date & Slot:</span>
                <span className="font-semibold text-slate-100">{deliveryDate} ({timeSlot})</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Cutting Preference:</span>
                <span className="font-semibold text-slate-100 capitalize">{cuttingType}</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between text-slate-300">
                <span>{t('booking.itemTotal')}:</span>
                <span className="font-semibold text-slate-100">₹{itemTotal}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>{t('booking.deliveryFee')}:</span>
                <span className="font-semibold text-slate-100">
                  {fulfillmentType === 'pickup' ? t('booking.freePickup') : `₹${finalDeliveryCharge}`}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between text-lg font-bold text-orange-400">
                <span>{t('booking.grandTotal')}:</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 8: PAYMENT METHOD ================= */}
        {step === 8 && (
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-slate-100 mb-2 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-orange-400" />
              <span>{t('booking.step8Title')}</span>
            </h2>
            <p className="text-sm text-slate-400 mb-6">Choose your preferred payment method.</p>

            <div className="space-y-4 mb-6">
              {/* Online Payment (Active) */}
              <div
                onClick={() => setPaymentMethod('online')}
                className={`cursor-pointer p-4 rounded-2xl border flex items-start gap-4 transition-all ${
                  paymentMethod === 'online'
                    ? 'bg-orange-500/15 border-orange-500'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-base">{t('booking.onlinePayment')}</h4>
                  <p className="text-xs text-slate-400 mt-1">{t('booking.onlinePaymentDesc')}</p>
                </div>
              </div>

              {/* Cash on Delivery (Held / Disabled per directive) */}
              <div className="opacity-50 p-4 rounded-2xl border border-slate-800 bg-slate-900/30 flex items-start gap-4 cursor-not-allowed">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 text-base flex items-center gap-2">
                    <span>{t('booking.cod')}</span>
                    <span className="text-[10px] uppercase tracking-wider bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-semibold">
                      Temporarily Unavailable
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{t('booking.codHeld')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 9: ORDER CONFIRMATION SUCCESS ================= */}
        {step === 9 && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-100 mb-2">
              {t('booking.step9Title')}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {t('booking.deliveryScheduledFor', { date: deliveryDate, slot: timeSlot })}
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-md mx-auto text-left space-y-2 text-xs text-slate-300 mb-6">
              <div className="flex justify-between">
                <span>{t('booking.orderId')}:</span>
                <span className="font-mono font-bold text-orange-400">{createdOrder?.id || 'ORD-9876'}</span>
              </div>
              <div className="flex justify-between">
                <span>Meat & Quantity:</span>
                <span className="font-semibold text-slate-200 capitalize">{selectedMeat} ({effectiveQty} kg)</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-slate-100 text-sm">₹{grandTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-semibold text-amber-400 uppercase">Pending Online Payment</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="py-3.5 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all"
            >
              {t('booking.goDashboard')}
            </button>
          </div>
        )}

        {/* Bottom Navigation Controls (Steps 1 to 8) */}
        {step < 9 && (
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800 flex items-center gap-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('booking.back')}</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 8 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all"
              >
                <span>{t('booking.next')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={loading}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? t('auth.loading') : t('booking.confirmOrder')}
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <p>Fresh Meat Booking System — Phase 4 Booking Page</p>
      </footer>
    </div>
  )
}
