import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { LeafletMapPicker } from '../components/LeafletMapPicker'
import { 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ExternalLink,
  ChevronRight,
  Flame,
  Zap,
  Maximize2
} from 'lucide-react'

export const AboutUsPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isTamil = i18n.language === 'ta'

  // Main shop coordinates
  const shopLat = 11.063737820050445
  const shopLng = 77.79459634396372

  // 3D Cutting Animation State
  const [activeCut, setActiveCut] = useState<'sirasa' | 'perusa' | 'leg_piece' | 'whole'>('sirasa')
  const [isCutting, setIsCutting] = useState<boolean>(false)
  const [cutCompleted, setCutCompleted] = useState<boolean>(false)

  // Map state for Store Focus
  const [mapFocusKey, setMapFocusKey] = useState<number>(0)

  const handleTrigger3DCut = (cutType: 'sirasa' | 'perusa' | 'leg_piece' | 'whole') => {
    setActiveCut(cutType)
    setIsCutting(true)
    setCutCompleted(false)

    setTimeout(() => {
      setIsCutting(false)
      setCutCompleted(true)
    }, 900)
  }

  const handleFocusStoreOnMap = () => {
    setMapFocusKey(prev => prev + 1)
  }

  const cutStyles = {
    sirasa: {
      titleEn: 'Sirasa (Small Curry Cut)',
      titleTa: 'சிரசா (சிறிய கறி துண்டுகள்)',
      descEn: 'Precision 15mm - 20mm bite-sized pieces for curry gravies & fry.',
      descTa: 'குழம்பு மற்றும் வறுவலுக்கு ஏற்ற 15மிமீ-20மிமீ சிறிய கறி துண்டுகள்.',
      icon: '🔪',
      badgeEn: 'Small Cut',
      badgeTa: 'சிறிய கட்',
      piecesCount: 16
    },
    perusa: {
      titleEn: 'Perusa (Large Biryani Cut)',
      titleTa: 'பெரிசா (பெரிய பிரியாணி துண்டுகள்)',
      descEn: 'Bold 45mm - 60mm chunky cuts crafted for Biryani feasts.',
      descTa: 'பிரியாணி மற்றும் விருந்து சமையலுக்கு ஏற்ற 45மிமீ-60மிமீ பெரிய துண்டுகள்.',
      icon: '🍖',
      badgeEn: 'Large Cut',
      badgeTa: 'பெரிய கட்',
      piecesCount: 8
    },
    leg_piece: {
      titleEn: 'Leg Piece & Thigh Cut',
      titleTa: 'தொடை மற்றும் லெக் பீஸ்',
      descEn: 'Full drumsticks and cleaned thighs prepped for pan roast & tandoor.',
      descTa: 'வறுவல் மற்றும் கிரில் சமையலுக்கு ஏற்ற சுத்தம் செய்யப்பட்ட லெக் பீஸ்.',
      icon: '🍗',
      badgeEn: 'Leg Roast',
      badgeTa: 'லெக் பீஸ்',
      piecesCount: 4
    },
    whole: {
      titleEn: 'Whole Dressed Bird',
      titleTa: 'முழு கோழி / கறி',
      descEn: 'Full skinless dressed bird, 100% washed & prepped without cuts.',
      descTa: 'தோல் மற்றும் இறக்கைகள் நீக்கப்பட்டு சுத்தம் செய்யப்பட்ட முழு கறி.',
      icon: '🐔',
      badgeEn: 'Whole Uncut',
      badgeTa: 'முழு கறி',
      piecesCount: 1
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-800 selection:text-white overflow-x-hidden">
      <Header />

      {/* Hero Section with Glassmorphism & 3D Lighting */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Ambient Glowing Lasers & Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-800/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Text Column */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/80 text-red-400 text-xs font-black border border-red-800/40 backdrop-blur-md shadow-lg">
              <Sparkles className="w-4 h-4 text-red-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>{isTamil ? 'UI/UX PRO MAX • 3D கறி கைவினைத்திறன்' : 'UI/UX PRO MAX • 3D BUTCHER CRAFTSMANSHIP'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              {isTamil ? (
                <>
                  பாரம்பரிய <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-amber-400 to-red-400">3D வெட்டும் முறை</span> & தூய்மையான சுகாதாரம்
                </>
              ) : (
                <>
                  Precision <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-amber-400 to-red-400">3D Butcher Slicing</span> & Fresh Hygiene
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {isTamil
                ? 'எங்கள் கடையில் தினமும் நேரடியாக பண்ணைகளில் இருந்து பெறப்படும் கறி 100% தூய்மையான முறையில் உங்கள் கண்முன்னே துல்லியமாக வெட்டப்படுகிறது.'
                : 'Experience real-time 3D precision butcher slicing. Every order is sourced farm-fresh daily, temperature-controlled, and hand-cut right before delivery.'}
            </p>

            {/* Quick Action Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-md mx-auto lg:mx-0">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl text-left transition-transform hover:-translate-y-1 duration-200">
                <Flame className="w-5 h-5 text-red-500 mb-1" />
                <h4 className="text-xs font-extrabold text-white">{isTamil ? '100% பிரஷ்' : 'Farm Fresh'}</h4>
                <p className="text-[10px] text-slate-400">{isTamil ? '0% பதப்படுத்திகள்' : '0% Preservatives'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl text-left transition-transform hover:-translate-y-1 duration-200">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1" />
                <h4 className="text-xs font-extrabold text-white">{isTamil ? '100% சுகாதாரம்' : 'Clean & Safe'}</h4>
                <p className="text-[10px] text-slate-400">{isTamil ? 'முழுமையாக கழுவியது' : 'Triple Washed'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl text-left transition-transform hover:-translate-y-1 duration-200">
                <Zap className="w-5 h-5 text-amber-400 mb-1" />
                <h4 className="text-xs font-extrabold text-white">{isTamil ? 'வேக டெலிவரி' : 'Rapid Delivery'}</h4>
                <p className="text-[10px] text-slate-400">{isTamil ? 'வீட்டு வாசலில்' : 'To Doorstep'}</p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                to="/booking"
                className="py-4 px-8 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-red-950/60 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <span>{isTamil ? 'இப்போதே கறி முன்பதிவு செய்ய' : 'Book Fresh Meat Now'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right 3D Interactive Butcher Cutting Visual Studio */}
          <div className="relative flex items-center justify-center">
            <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-2xl shadow-2xl space-y-6 relative overflow-hidden group">
              {/* Laser Cutting Beam Overlay */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-300 to-red-500 shadow-[0_0_20px_#ef4444] transition-all duration-700 ${
                  isCutting ? 'top-full opacity-100 scale-105' : 'opacity-0'
                }`}
              ></div>

              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-950 text-red-400 border border-red-800/40 flex items-center justify-center text-2xl shadow-inner">
                    🔪
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">
                      {isTamil ? '3D நேரடி வெட்டும் அனிமேஷன்' : '3D Live Butcher Slicing Studio'}
                    </h3>
                    <span className="text-[11px] text-amber-400 font-medium">
                      {isTamil ? 'பட்டனை அழுத்தி நேரலையில் பார்க்கவும்' : 'Click a cut style to simulate 3D slice'}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-red-950/80 text-red-300 text-[10px] font-black border border-red-800/50">
                  REAL-TIME 3D
                </span>
              </div>

              {/* 3D Visual Slice Display Canvas */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden min-h-[220px] flex flex-col items-center justify-center space-y-4">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>

                {/* 3D Animated Cleaver Knife */}
                <div
                  className={`text-6xl transition-all duration-500 transform ${
                    isCutting
                      ? 'translate-y-8 rotate-45 scale-125 filter drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]'
                      : 'translate-y-0 -rotate-12 hover:scale-110'
                  }`}
                >
                  🔪
                </div>

                {/* Target Meat Block with 3D Split Animation */}
                <div className="relative">
                  <div
                    className={`text-5xl transition-all duration-500 transform ${
                      isCutting
                        ? 'scale-90 filter brightness-125'
                        : cutCompleted
                        ? 'scale-105 text-emerald-400'
                        : ''
                    }`}
                  >
                    {cutStyles[activeCut].icon}
                  </div>

                  {/* Splitting Sparks / Cut Line */}
                  {isCutting && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-1 bg-red-500 animate-ping shadow-[0_0_15px_#ef4444]"></div>
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="pt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                      isCutting
                        ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                        : cutCompleted
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {isCutting
                      ? (isTamil ? '⚡ துல்லியமாக வெட்டப்படுகிறது...' : '⚡ Slicing with 3D Precision...')
                      : cutCompleted
                      ? (isTamil ? '✅ வெட்டி தயார் செய்யப்பட்டது!' : '✅ 3D Cut Preparation Complete!')
                      : (isTamil ? 'வெட்டுவதற்கு தயார்' : 'Ready to Cut')}
                  </span>
                </div>
              </div>

              {/* Cut Selector Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(cutStyles) as Array<keyof typeof cutStyles>).map((key) => {
                  const item = cutStyles[key]
                  const isActive = activeCut === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTrigger3DCut(key)}
                      className={`p-3 rounded-xl border text-xs font-extrabold text-left transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-red-950/80 border-red-600 text-white shadow-md shadow-red-950/50'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span>{isTamil ? item.badgeTa : item.badgeEn}</span>
                      </span>
                      {isActive && <CheckCircle2 className="w-4 h-4 text-red-400" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cutting Style Details Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 border-t border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isTamil ? '4 விதமான கறி வெட்டும் முறைகள்' : 'Our 4 Master Cutting Styles'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {isTamil
                ? 'உங்கள் சமையல் தேவைக்கேற்ப கறி எவ்வாறு வெட்டப்பட வேண்டும் என்பதைத் தேர்ந்தெடுக்கலாம்.'
                : 'Select how our master butchers cut your meat to match your exact recipe requirement.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Object.keys(cutStyles) as Array<keyof typeof cutStyles>).map((key) => {
              const item = cutStyles[key]
              const isSelected = activeCut === key
              return (
                <div
                  key={key}
                  onClick={() => handleTrigger3DCut(key)}
                  className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer relative group ${
                    isSelected
                      ? 'bg-slate-950 border-red-600 shadow-xl shadow-red-950/40 -translate-y-2'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:-translate-y-1'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-extrabold text-white mb-1.5">
                    {isTamil ? item.titleTa : item.titleEn}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 font-medium">
                    {isTamil ? item.descTa : item.descEn}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <span className="text-[11px] font-mono text-amber-400 font-bold">
                      {item.piecesCount} {isTamil ? 'துண்டுகள்' : 'pieces / kg'}
                    </span>
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>{isTamil ? '3D வெட்டு' : 'Simulate 3D'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Shop Location & Satellite Map Section with Store Focus */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950 relative">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-red-400 uppercase tracking-wider mb-1">
                <MapPin className="w-4 h-4 text-red-500 animate-bounce" />
                <span>{isTamil ? 'முதன்மை கடை வரைபடம்' : 'MAIN SHOP LOCATION'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isTamil ? 'எங்கள் கடை இருப்பிடம் (Satellite Map Focus)' : 'Store Location & Directions'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFocusStoreOnMap}
                className="py-2.5 px-4 rounded-xl bg-red-800 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span>{isTamil ? 'கடை வரைபடத்தை பெரிதாக்கு' : 'Focus Store Location'}</span>
              </button>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${shopLat},${shopLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Left 2 Cols: High Res Satellite Map */}
            <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 p-2 relative">
              <div className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden relative">
                <LeafletMapPicker
                  key={mapFocusKey}
                  initialLat={shopLat}
                  initialLng={shopLng}
                  onLocationSelect={() => {}}
                />
              </div>
            </div>

            {/* Right Col: Shop Details & Address Box Placeholder */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-950 text-red-500 border border-red-800/40 flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white mb-1">
                    {isTamil ? 'பிரஷ்மீட் முதன்மை விற்பனையகம்' : 'FreshMeat Store Main Outlet'}
                  </h3>
                  <p className="text-xs text-amber-400 font-mono font-bold">
                    GPS: {shopLat.toFixed(6)}, {shopLng.toFixed(6)}
                  </p>
                </div>

                {/* Address Box Placeholder */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <strong className="block text-white font-bold">{isTamil ? 'கடை முகவரி:' : 'Store Address:'}</strong>
                  <p className="text-slate-400 leading-relaxed font-medium">
                    {isTamil
                      ? 'பிரஷ்மீட் ஸ்டோர், முதன்மை சாலை. (கடை பெயர் மற்றும் முகவரி விரைவில் வெளியிடப்படும்).'
                      : '[Store Name & Address Placeholder - Ready for store details update]'}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{isTamil ? 'நேரம்: காலை 6:00 - இரவு 8:00' : 'Hours: 6:00 AM - 8:00 PM'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isTamil ? 'வீட்டு டெலிவரி வசதி உண்டு' : 'Doorstep Delivery Available'}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/booking"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-extrabold text-xs shadow-md text-center block transition-all"
              >
                {isTamil ? 'கறி முன்பதிவு செய்ய' : 'Book Meat From Store'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-800 bg-slate-950">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>FreshMeat Store • {isTamil ? 'தினமும் புதிய மற்றும் சுகாதாரமான முறையில் வெட்டப்படுகிறது' : 'Hygienically Cut & Delivered Daily'}</span>
        </p>
      </footer>
    </div>
  )
}
