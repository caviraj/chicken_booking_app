import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Header } from '../components/Header'
import { MapboxGLMapPicker } from '../components/MapboxGLMapPicker'
import {
  fetchMeatRates,
  validateDraftBooking,
  calculateDeliveryFee,
  submitOrder,
  fetchAdminSettings
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
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { customer, user } = useAuth()

  // Booking step (1 to 7)
  const [step, setStep] = useState<number>(1)

  // Data states
  const [rates, setRates] = useState<Record<string, MeatRate>>({})
  const [codEnabled, setCodEnabled] = useState<boolean>(false)
  const [selectedMeat, setSelectedMeat] = useState<string>('chicken')
  const [quantityKg, setQuantityKg] = useState<number>(1.0)
  const [customQty, setCustomQty] = useState<string>('')
  
  // Dates (Minimum delivery date is ALWAYS Tomorrow - Same day delivery is disabled)
  const tomorrowObj = new Date(Date.now() + 86400000)
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0]
  const [deliveryDate, setDeliveryDate] = useState<string>(tomorrowStr)

  // Generate next 5 future date options starting from tomorrow
  const futureDates = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(Date.now() + (1 + offset) * 86400000)
    const dateIso = d.toISOString().split('T')[0]
    const dayName = offset === 0 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    return { dateIso, dayName, isTomorrow: offset === 0 }
  })

  // Time Slot
  const [timeSlot, setTimeSlot] = useState<string>('6:00 AM - 7:00 AM')

  // Cutting Type
  const [cuttingType, setCuttingType] = useState<string>('sirasa')

  // Fulfillment
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery')
  const [deliveryAddress, setDeliveryAddress] = useState<string>('')
  const [deliveryCharge, setDeliveryCharge] = useState<number>(30.0)
  const [deliveryZone, setDeliveryZone] = useState<string>('Standard Zone')
  const [customerLat, setCustomerLat] = useState<number | undefined>(undefined)
  const [customerLng, setCustomerLng] = useState<number | undefined>(undefined)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)

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
    { id: 'sirasa', labelKey: 'booking.sirasa', descKey: 'booking.sirasaDesc', icon: '🔪' },
    { id: 'perusa', labelKey: 'booking.perusa', descKey: 'booking.perusaDesc', icon: '🥩' },
    { id: 'legPiece', labelKey: 'booking.legPiece', descKey: 'booking.legPieceDesc', icon: '🍗' },
    { id: 'whole', labelKey: 'booking.whole', descKey: 'booking.wholeDesc', icon: '🍗' }
  ]

  useEffect(() => {
    fetchMeatRates().then((res) => {
      setRates(res)
    })
    fetchAdminSettings().then((s) => {
      setCodEnabled(s?.cod_enabled || false)
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

  const handleCalculateDeliveryWithAddress = async (addr: string, lat?: number, lng?: number) => {
    if (!addr.trim()) return
    setLoading(true)
    setErrorMsg(null)
    const res = await calculateDeliveryFee(addr, lat, lng)
    setDeliveryCharge(res.delivery_charge)
    setDeliveryZone(res.delivery_zone)
    if (res.distance_km != null) {
      setDistanceKm(res.distance_km)
    }

    if (res.is_deliverable === false || (res.distance_km != null && res.distance_km > 5.0)) {
      setErrorMsg(`🚫 Delivery is available ONLY within 5 km from our Kolanthapalayam shop. Your location is ${res.distance_km?.toFixed(1)} km away. Please select Store Pickup to place order.`)
    }

    setLoading(false)
  }

  const handleCalculateDelivery = async () => {
    if (!deliveryAddress.trim()) {
      setErrorMsg(t('booking.addressRequiredError') || 'Please enter or pick your delivery address.')
      return
    }
    await handleCalculateDeliveryWithAddress(deliveryAddress, customerLat, customerLng)
  }

  const handleNextStep = () => {
    // Step 6 Validation: Block next step if delivery address is empty or > 5 km
    if (step === 6 && fulfillmentType === 'delivery') {
      if (!deliveryAddress.trim()) {
        setErrorMsg(t('booking.addressRequiredError') || 'Delivery address is required to proceed to payment. Please enter address or click on the map.')
        return
      }
      if (distanceKm !== null && distanceKm > 5.0) {
        setErrorMsg(`🚫 Delivery is restricted within 5 km from our Kolanthapalayam shop (${distanceKm} km detected). Please switch to Store Pickup to proceed.`)
        return
      }
    }

    setErrorMsg(null)
    setStep(step + 1)
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
        payment_method: codEnabled ? paymentMethod : 'online',
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
              <span>{t('booking.wizardTitle') || 'Fresh Meat Booking Wizard'}</span>
            </span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">
              {t('booking.step', { current: step, total: 7 }) || `Step ${step} of 7`}
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
                    <span>{t('booking.step1Title') || 'Select Meat Type'}</span>
                  </h2>
                  <span className="badge-fresh px-2.5 py-1 rounded-full text-[11px] font-bold">
                    {t('booking.dailyStock') || 'Daily Fresh Stock'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-6">{t('booking.step1Subtitle') || 'Select your premium farm fresh meat category.'}</p>

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
                    <p className="text-[11px] text-slate-500 mt-1">{t('booking.chickenDesc') || 'Farm fresh country chicken'}</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 font-extrabold text-sm text-red-800">
                      ₹{rates['chicken']?.rate_per_kg || 240} / {i18n.language === 'ta' ? 'கிலோ' : 'kg'}
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
                    <p className="text-[11px] text-slate-500 mt-1">{t('booking.muttonDesc') || 'Tender fresh goat meat'}</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 font-extrabold text-sm text-red-800">
                      ₹{rates['mutton']?.rate_per_kg || 750} / {i18n.language === 'ta' ? 'கிலோ' : 'kg'}
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
                      <h3 className="font-extrabold text-slate-900 text-base">{t('booking.duck') || 'Duck'}</h3>
                      {selectedMeat === 'duck' && <CheckCircle className="w-4 h-4 text-red-800" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{t('booking.duckDesc') || 'Organic village duck meat'}</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 font-extrabold text-sm text-red-800">
                      ₹{rates['duck']?.rate_per_kg || 380} / {i18n.language === 'ta' ? 'கிலோ' : 'kg'}
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
                  <span>{t('booking.step2Title') || 'Choose Quantity (kg)'}</span>
                </h2>
                <p className="text-xs text-slate-500 mb-6">{t('booking.step2Subtitle') || 'Select from standard presets or input custom weight.'}</p>

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
                      {preset} {i18n.language === 'ta' ? 'கிலோ' : 'kg'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('booking.customQtyLabel') || 'Custom Weight Entry (in kg)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.25"
                    placeholder={t('booking.customQtyPlaceholder') || 'e.g. 1.5'}
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    className="w-full pro-input text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">{t('booking.minQtyNotice') || 'Minimum order: 0.25 kg'}</p>
                </div>
              </div>
            )}

            {/* STEP 3: Cutting Style */}
            {step === 3 && (
              <div className="pro-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-red-800" />
                  <span>{t('booking.step5Title') || 'Cutting Style & Preparation'}</span>
                </h2>
                <p className="text-xs text-slate-500 mb-6">{t('booking.step5Subtitle') || 'Choose how our expert butchers should cut your meat.'}</p>

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
                        <p className="text-xs text-slate-500 mt-0.5">{t(item.descKey) || ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Date Selection (Multi-Day Future Booking starting from Tomorrow) */}
            {step === 4 && (
              <div className="pro-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-800" />
                  <span>{t('booking.step3Title') || 'Select Delivery Date'}</span>
                </h2>
                <p className="text-xs text-slate-500 mb-4">{t('booking.step3Subtitle') || 'Choose delivery date (Minimum: Tomorrow. Pre-orders for future dates accepted).'}</p>

                <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{t('booking.nextDayNotice') || 'Same-day delivery is unavailable. Orders start from Tomorrow onwards.'}</span>
                </div>

                {validationWarning && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationWarning}</span>
                  </div>
                )}

                {/* Quick Date Chips (Tomorrow & Next 4 Days) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {futureDates.map((item) => (
                    <button
                      key={item.dateIso}
                      type="button"
                      onClick={() => handleDateChange(item.dateIso)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        deliveryDate === item.dateIso
                          ? 'border-red-800 bg-red-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold mb-1.5 inline-block ${item.isTomorrow ? 'badge-fresh' : 'badge-gold'}`}>
                        {item.isTomorrow ? (t('booking.tomorrow') || 'Tomorrow') : 'Pre-Order'}
                      </span>
                      <div className="text-sm font-extrabold text-slate-900">{item.dayName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.dateIso}</div>
                    </button>
                  ))}
                </div>

                {/* Specific Custom Future Date Picker */}
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('booking.selectFutureDate') || 'Or Pick Specific Future Date'}
                  </label>
                  <input
                    type="date"
                    min={tomorrowStr}
                    value={deliveryDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full pro-input text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: Time Slot */}
            {step === 5 && (
              <div className="pro-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-800" />
                  <span>{t('booking.step4Title') || 'Morning Time Slot'}</span>
                </h2>
                <p className="text-xs text-slate-500 mb-6">{t('booking.step4Subtitle') || 'Select your preferred early morning delivery slot.'}</p>

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

            {/* STEP 6: Fulfillment & Address with Leaflet Map */}
            {step === 6 && (
              <div className="pro-card p-6 sm:p-8 space-y-6">
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-red-800" />
                  <span>{t('booking.step6Title') || 'Fulfillment & Address'}</span>
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
                      <Truck className="w-4 h-4 text-red-800" /> {t('booking.delivery') || 'Home Delivery'}
                    </div>
                    <p className="text-[11px] text-slate-500">{t('booking.deliveryDesc') || 'Delivered right to your doorstep'}</p>
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
                      <Store className="w-4 h-4 text-red-800" /> {t('booking.pickup') || 'Shop Pickup'}
                    </div>
                    <p className="text-[11px] text-slate-500">{t('booking.pickupDesc') || 'Free pickup from our store counter'}</p>
                  </button>
                </div>

                {fulfillmentType === 'delivery' && (
                  <div className="space-y-4 pt-2">
                    {/* Interactive High-Accuracy Map Component */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <MapboxGLMapPicker
                        onLocationSelect={(addr, lat, lng) => {
                          setDeliveryAddress(addr)
                          setCustomerLat(lat)
                          setCustomerLng(lng)
                          handleCalculateDeliveryWithAddress(addr, lat, lng)
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">{t('booking.deliveryAddressLabel') || 'Delivery Address'}</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <textarea
                          rows={3}
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder={t('booking.deliveryAddressPlaceholder') || 'Enter full street address, landmark, and pin code'}
                          className="w-full pro-input pl-9 text-xs"
                        ></textarea>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCalculateDelivery}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      {loading ? (t('booking.calculatingFee') || 'Calculating Fee...') : (t('booking.calculateFee') || 'Calculate Delivery Charge')}
                    </button>

                    {deliveryZone && (
                      <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl text-xs flex justify-between items-center text-slate-800 font-bold">
                        <div className="flex flex-col">
                          <span>{t('booking.deliveryZone') || 'Delivery Zone'}: <span className="text-red-900">{deliveryZone}</span></span>
                          {distanceKm !== null && (
                            <span className="text-[11px] text-slate-500 font-normal">Distance: {distanceKm} km from shop</span>
                          )}
                        </div>
                        <span className="text-red-800 text-sm font-black">₹{deliveryCharge}</span>
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
                  <span>{t('booking.step8Title') || 'Payment Method'}</span>
                </h2>

                <div className={`grid gap-4 ${codEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Razorpay Online Payment */}
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
                      <CreditCard className="w-4 h-4 text-red-800" /> {t('booking.onlinePayment') || 'Razorpay Online'}
                    </div>
                    <p className="text-[11px] text-slate-500">{t('booking.onlinePaymentDesc') || 'UPI, Credit/Debit Cards, NetBanking'}</p>
                  </button>

                  {/* Cash on Delivery option ONLY rendered if enabled by admin */}
                  {codEnabled && (
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
                        💵 {t('booking.cod') || 'Cash on Delivery'}
                      </div>
                      <p className="text-[11px] text-slate-500">{t('booking.codDesc') || 'Pay cash when meat is delivered'}</p>
                    </button>
                  )}
                </div>

                {!codEnabled && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                    {t('booking.codDisabledNotice') || 'Cash on Delivery is currently disabled by store admin. Online payment via Razorpay is enabled.'}
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>{t('booking.meatItem') || 'Meat Item'} ({t(`booking.${selectedMeat}`) || selectedMeat} - {effectiveQty} {i18n.language === 'ta' ? 'கிலோ' : 'kg'})</span>
                    <span className="font-bold text-slate-900">₹{itemTotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t('booking.deliveryFee') || 'Delivery Charge'} ({fulfillmentType === 'pickup' ? (t('booking.pickup') || 'Pickup') : (t('booking.delivery') || 'Delivery')})</span>
                    <span className="font-bold text-slate-900">₹{finalDeliveryCharge}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 text-sm font-extrabold">
                    <span>{t('booking.grandTotal') || 'Grand Total'}</span>
                    <span className="text-red-800 text-base">₹{grandTotal}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl btn-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>{loading ? (t('booking.processingOrder') || 'Processing Order...') : (t('booking.confirmOrderBtn', { total: grandTotal }) || `Confirm Order (₹${grandTotal})`)}</span>
                  </button>

                  <a
                    href={`https://wa.me/919876543210?text=${encodeURIComponent(
                      `🥩 *NEW MEAT ORDER — Kolanthapalayam FreshMeat*\n` +
                      `--------------------------------------\n` +
                      `• *Item*: ${selectedMeat.toUpperCase()}\n` +
                      `• *Quantity*: ${effectiveQty} kg\n` +
                      `• *Cutting*: ${cuttingType}\n` +
                      `• *Delivery Date*: ${deliveryDate}\n` +
                      `• *Time Slot*: ${timeSlot}\n` +
                      `• *Type*: ${fulfillmentType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}\n` +
                      (fulfillmentType === 'delivery' ? `• *Address*: ${deliveryAddress}\n` : '') +
                      `--------------------------------------\n` +
                      `💰 *Total Amount*: ₹${grandTotal} (Meat ₹${itemTotal} + Delivery ₹${fulfillmentType === 'delivery' ? deliveryCharge : 0})\n` +
                      `--------------------------------------\n` +
                      `Please confirm my order!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <span>📱 Order via WhatsApp</span>
                  </a>
                </div>
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
                  <span>{t('booking.back') || 'Back'}</span>
                </button>
              ) : <div></div>}

              {step < 7 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>{t('booking.next') || 'Next Step'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Sidebar Live Reactive Order Summary */}
          <div className="space-y-6">
            <div className="pro-card p-6 sticky top-24 space-y-4 border-2 border-red-800/20 shadow-lg">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-red-800" />
                  <span>{t('booking.summaryTitle') || 'Order Summary'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{t('booking.liveEstimate') || 'Live Estimate'}</span>
                </span>
              </h3>

              {/* Dynamic Live Item Calculation */}
              <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 text-xs space-y-1">
                <div className="text-[11px] text-slate-500 font-semibold flex justify-between">
                  <span>{t(`booking.${selectedMeat}`) || selectedMeat} ({t('booking.perKg', { rate: currentRatePerKg }) || `₹${currentRatePerKg}/kg`})</span>
                  <span className="font-bold text-red-800">× {effectiveQty} {i18n.language === 'ta' ? 'கிலோ' : 'kg'}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-red-100/60 text-slate-900 font-extrabold">
                  <span>Meat Subtotal:</span>
                  <span className="text-sm text-red-800">₹{itemTotal}</span>
                </div>
              </div>

              {/* Step-by-Step Live Summary Breakdown */}
              <div className="space-y-3 text-xs">
                
                {/* Meat Type */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>{t('booking.summaryMeat') || 'Selected Meat'}:</span>
                  </span>
                  <span className="font-bold text-slate-900 capitalize">{t(`booking.${selectedMeat}`) || selectedMeat}</span>
                </div>

                {/* Quantity */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>{t('booking.summaryQty') || 'Quantity'}:</span>
                  </span>
                  <span className="font-bold text-slate-900">{effectiveQty} {i18n.language === 'ta' ? 'கிலோ' : 'kg'}</span>
                </div>

                {/* Cutting Style */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                      {step >= 3 ? '✓' : '3'}
                    </span>
                    <span>{t('booking.summaryCut') || 'Cutting Style'}:</span>
                  </span>
                  <span className={`font-bold ${step >= 3 ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                    {t(`booking.${cuttingType}`) || cuttingType}
                  </span>
                </div>

                {/* Delivery Date */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                      {step >= 4 ? '✓' : '4'}
                    </span>
                    <span>{t('booking.summaryDate') || 'Delivery Date'}:</span>
                  </span>
                  <span className={`font-bold ${step >= 4 ? 'text-slate-900' : 'text-slate-400'}`}>
                    {deliveryDate === tomorrowStr ? (t('booking.tomorrow') || 'Tomorrow') : deliveryDate}
                  </span>
                </div>

                {/* Time Slot */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                      {step >= 5 ? '✓' : '5'}
                    </span>
                    <span>{t('booking.summarySlot') || 'Time Slot'}:</span>
                  </span>
                  <span className={`font-bold ${step >= 5 ? 'text-slate-900' : 'text-slate-400'}`}>{timeSlot}</span>
                </div>

                {/* Fulfillment / Delivery Fee */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 6 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                      {step >= 6 ? '✓' : '6'}
                    </span>
                    <span>{t('booking.summaryDeliveryFee') || 'Delivery Fee'}:</span>
                  </span>
                  <span className="font-bold text-slate-900">
                    {fulfillmentType === 'pickup' ? (t('booking.freePickup') || 'FREE') : `₹${finalDeliveryCharge}`}
                  </span>
                </div>

                {/* Total Calculation */}
                <div className="pt-3 mt-2 border-t-2 border-slate-200 flex justify-between items-center text-slate-900">
                  <div>
                    <span className="font-extrabold text-sm block">{t('booking.summaryTotal') || 'Estimated Total'}</span>
                    <span className="text-[10px] text-slate-500">{fulfillmentType === 'pickup' ? 'Store Pickup (No Fee)' : `Includes ₹${finalDeliveryCharge} delivery`}</span>
                  </div>
                  <span className="text-2xl font-black text-red-800 tracking-tight">₹{grandTotal}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white mt-12">
        <p className="font-medium">{t('footer.tagline') || 'FreshMeat Express • Guaranteed Fresh & Hygienically Cut Daily'}</p>
      </footer>
    </div>
  )
}


