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
  Sparkles,
  Check,
  ShieldCheck,
  Store
} from 'lucide-react'

export const BookingPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { customer, user } = useAuth()

  // Booking step (1 to 8)
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

  // Time Slots
  const timeSlots = [
    '5:00 AM - 6:00 AM',
    '6:00 AM - 7:00 AM',
    '7:00 AM - 8:00 AM',
    '8:00 AM - 9:00 AM'
  ]

  // Cutting options
  const cuttingOptions = [
    { id: 'sirasa', labelKey: 'booking.sirasa', desc: 'Small curry cut pieces', icon: '🔪' },
    { id: 'perusa', labelKey: 'booking.perusa', desc: 'Large biryani cut pieces', icon: '🥩' },
    { id: 'legPiece', labelKey: 'booking.legPiece', desc: 'Full leg & thigh pieces', icon: '🍗' },
    { id: 'whole', labelKey: 'booking.whole', desc: 'Full dressed bird clean cut', icon: '🍗' }
  ]

  useEffect(() => {
    fetchMeatRates().then((res) => {
      setRates(res)
    })
  }, [])

  // Calculation
  const currentRatePerKg = rates[selectedMeat]?.rate_per_kg || (selectedMeat === 'mutton' ? 750 : selectedMeat === 'duck' ? 380 : 240)
  const effectiveQty = customQty ? parseFloat(customQty) || quantityKg : quantityKg
  const itemTotal = roundNumber(currentRatePerKg * effectiveQty)
  const finalDeliveryCharge = fulfillmentType === 'pickup' ? 0.0 : deliveryCharge
  const grandTotal = roundNumber(itemTotal + finalDeliveryCharge)

  function roundNumber(num: number) {
    return Math.round(num * 100) / 100
  }

  const handleDateChange = async (dateVal: string) => {
    setDeliveryDate(dateVal)
    setErrorMsg(null)
    setValidationWarning(null)

    const val = await validateDraftBooking(selectedMeat, effectiveQty, dateVal)
    if (!val.valid) {
      setValidationWarning(val.errors.join('; '))
    }
  }

  const handleCalculateDelivery = async () => {
    if (!deliveryAddress.trim()) {
      setErrorMsg('Please enter your full delivery address.')
      return
    }
    setLoading(true)
    setErrorMsg(null)

    const res = await calculateDeliveryFee(deliveryAddress)
    setDeliveryCharge(res.delivery_charge)
    setDeliveryZone(res.delivery_zone)
    setLoading(false)
  }

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
      const newOrder = res.order || res
      if (newOrder && newOrder.id) {
        navigate(`/order-confirmation/${newOrder.id}`)
      } else {
        navigate('/orders')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Wizard Progress Indicator */}
        <div className="mb-6 pro-card p-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="text-red-800 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Fresh Meat Booking Wizard</span>
            </span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">
              Step {step} of 7
            </span>
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-800 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Wizard Step Box */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: Meat Selection */}
            {step === 1 && (
              <div className="pro-card p-6 sm:p-8">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-red-800" />
                    <span>Select Meat Type</span>
                  </h2>
                  <span className="badge-fresh px-2.5 py-1 rounded-full text-[11px] font-bold">
                    Daily Fresh Stock
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-6">Select your premium farm fresh meat category.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Chicken */}
                  <div
                    onClick={() => setSelectedMeat('chicken')}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
                      selectedMeat === 'chicken'
                        ? 'border-red-800 bg-red-50/50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-4xl mb-3">🐓</div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-base">{t('booking.chicken') || 'Chicken'}</h3>
                      {selectedMeat === 'chicken' && <CheckCircle className="w-4 h-4 text-red-800" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Farm fresh country chicken</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 font-extrabold text-sm text-red-800">
                      ₹{rates['chicken']?.rate_per_kg || 240} / kg
                    </div>
                  </div>

                  {/* Mutton */}
                  <div
                    onClick={() => setSelectedMeat('mutton')}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
                      selectedMeat === 'mutton'
                        ? 'border-red-800 bg-red-50/50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-4xl mb-3">🐐</div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-base">{t('booking.mutton') || 'Mutton'}</h3>
                      {selectedMeat === 'mutton' && <CheckCircle className="w-4 h-4 text-red-800" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Tender fresh goat meat</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 font-extrabold text-sm text-red-800">
                      ₹{rates['mutton']?.rate_per_kg || 750} / kg
                    </div>
                  </div>

                  {/* Duck */}
                  <div
                    onClick={() => setSelectedMeat('duck')}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
                      selectedMeat === 'duck'
                        ? 'border-red-800 bg-red-50/50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-4xl mb-3">🦆</div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-base">{t('booking.duck') || 'Duck (Vaathu)'}</h3>
                      {selectedMeat === 'duck' && <CheckCircle className="w-4 h-4 text-red-800" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Organic village duck meat</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 font-extrabold text-sm text-red-800">
                      ₹{rates['duck']?.rate_per_kg || 380} / kg
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Quantity & Custom weight */}
            {step === 2 && (
              <div className="pro-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-800" />
                  <span>Choose Quantity (kg)</span>
                </h2>
                <p className="text-xs text-slate-500 mb-6">Select from standard presets or input custom weight.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[0.5, 1.0, 2.0, 5.0].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setQuantityKg(preset)
                        setCustomQty('')
                      }}
                      className={`py-3 px-4 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                        !customQty && quantityKg === preset
                          ? 'border-red-800 bg-red-800 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {preset} kg
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Custom Weight Entry (in kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.25"
                    placeholder="e.g. 1.5"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    className="w-full pro-input text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Minimum order: 0.25 kg</p>
                </div>
              </div>
            )}

            {/* STEP 3: Cutting Style */}
            {step === 3 && (
              <div className="pro-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-red-800" />
                  <span>Cutting Style & Preparation</span>
                </h2>
                <p className="text-xs text-slate-500 mb-6">Choose how our expert butchers should cut your meat.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cuttingOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCuttingType(item.id)}
                      className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                        cuttingType === item.id
                          ? 'border-red-800 bg-red-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900 text-sm">{t(item.labelKey) || item.id}</h4>
                          {cuttingType === item.id && <Check className="w-4 h-4 text-red-800" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Date Selection */}
            {step === 4 && (
              <div className="pro-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-800" />
                  <span>Select Delivery Date</span>
                </h2>
                <p className="text-xs text-slate-500 mb-6">Choose date for freshly processed meat delivery.</p>

                {validationWarning && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationWarning}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleDateChange(todayStr)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      deliveryDate === todayStr
                        ? 'border-red-800 bg-red-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="badge-fresh px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 inline-block">
                      Same Day Delivery
                    </span>
                    <div className="text-base font-extrabold text-slate-900">Today</div>
                    <div className="text-xs text-slate-500 mt-1">{todayStr}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDateChange(tomorrowStr)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      deliveryDate === tomorrowStr
                        ? 'border-red-800 bg-red-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="badge-gold px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 inline-block">
                      Pre-order Early
                    </span>
                    <div className="text-base font-extrabold text-slate-900">Tomorrow</div>
                    <div className="text-xs text-slate-500 mt-1">{tomorrowStr}</div>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Time Slot */}
            {step === 5 && (
              <div className="pro-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-800" />
                  <span>Morning Time Slot</span>
                </h2>
                <p className="text-xs text-slate-500 mb-6">Select your preferred early morning delivery slot.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                        timeSlot === slot
                          ? 'border-red-800 bg-red-50/60 font-bold text-slate-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">{slot}</span>
                      {timeSlot === slot && <CheckCircle className="w-4 h-4 text-red-800" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: Fulfillment & Address */}
            {step === 6 && (
              <div className="pro-card p-6 sm:p-8 space-y-6">
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-red-800" />
                  <span>Fulfillment & Address</span>
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('delivery')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      fulfillmentType === 'delivery'
                        ? 'border-red-800 bg-red-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm mb-1">
                      <Truck className="w-4 h-4 text-red-800" /> Home Delivery
                    </div>
                    <p className="text-[11px] text-slate-500">Delivered right to your doorstep</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType('pickup')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      fulfillmentType === 'pickup'
                        ? 'border-red-800 bg-red-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm mb-1">
                      <Store className="w-4 h-4 text-red-800" /> Shop Pickup
                    </div>
                    <p className="text-[11px] text-slate-500">Free pickup from our store counter</p>
                  </button>
                </div>

                {fulfillmentType === 'delivery' && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-700">Delivery Address</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <textarea
                        rows={3}
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter full street address, landmark, and pin code"
                        className="w-full pro-input pl-9 text-xs"
                      ></textarea>
                    </div>

                    <button
                      type="button"
                      onClick={handleCalculateDelivery}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      {loading ? 'Calculating Fee...' : 'Calculate Delivery Fee'}
                    </button>

                    {deliveryZone && (
                      <div className="p-3 bg-slate-100 rounded-xl text-xs flex justify-between items-center text-slate-700 font-semibold">
                        <span>Delivery Zone: {deliveryZone}</span>
                        <span className="text-red-800 font-extrabold">₹{deliveryCharge}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 7: Payment & Checkout */}
            {step === 7 && (
              <div className="pro-card p-6 sm:p-8 space-y-6">
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-800" />
                  <span>Payment Method</span>
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      paymentMethod === 'online'
                        ? 'border-red-800 bg-red-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm mb-1">
                      <CreditCard className="w-4 h-4 text-red-800" /> Razorpay Online
                    </div>
                    <p className="text-[11px] text-slate-500">UPI, Credit/Debit Cards, NetBanking</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      paymentMethod === 'cod'
                        ? 'border-red-800 bg-red-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm mb-1">
                      💵 Cash on Delivery
                    </div>
                    <p className="text-[11px] text-slate-500">Pay cash when meat is delivered</p>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Meat Item ({selectedMeat.toUpperCase()} - {effectiveQty} kg)</span>
                    <span className="font-bold text-slate-900">₹{itemTotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge ({fulfillmentType})</span>
                    <span className="font-bold text-slate-900">₹{finalDeliveryCharge}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 text-sm font-extrabold">
                    <span>Grand Total</span>
                    <span className="text-red-800 text-base">₹{grandTotal}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl btn-primary text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{loading ? 'Processing Order...' : `Confirm & Place Order (₹${grandTotal})`}</span>
                </button>
              </div>
            )}

            {/* Stepper Buttons Controls */}
            <div className="flex items-center justify-between pt-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : <div></div>}

              {step < 7 && (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Sidebar Live Order Summary */}
          <div className="space-y-6">
            <div className="pro-card p-6 sticky top-24 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="badge-fresh px-2 py-0.5 rounded-full text-[10px] font-bold">Live Estimate</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Selected Meat:</span>
                  <span className="font-bold text-slate-900 capitalize">{selectedMeat}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Quantity:</span>
                  <span className="font-bold text-slate-900">{effectiveQty} kg</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Cutting Style:</span>
                  <span className="font-bold text-slate-900 capitalize">{cuttingType}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Delivery Date:</span>
                  <span className="font-bold text-slate-900">{deliveryDate}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Time Slot:</span>
                  <span className="font-bold text-slate-900">{timeSlot}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{itemTotal}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee:</span>
                  <span className="font-bold text-slate-900">₹{finalDeliveryCharge}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-slate-900">
                  <span className="font-extrabold text-sm">Estimated Total</span>
                  <span className="text-xl font-extrabold text-red-800">₹{grandTotal}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white mt-12">
        <p className="font-medium">FreshMeat Express • Guaranteed Fresh & Hygienically Cut Daily</p>
      </footer>
    </div>
  )
}
