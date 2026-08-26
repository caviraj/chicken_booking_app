import React from 'react'
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
  Zap
} from 'lucide-react'

export const AboutUsPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isTamil = i18n.language === 'ta'

  // Main shop origin coordinates
  const shopLat = 11.063737820050445
  const shopLng = 77.79459634396372

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-red-800 selection:text-white overflow-x-hidden">
      <Header />

      {/* Hero Section with 3D Animated Visuals */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-800/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Text Column */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/80 text-red-400 text-xs font-bold border border-red-800/40 backdrop-blur-md shadow-inner">
              <Sparkles className="w-4 h-4 text-red-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{isTamil ? 'பாரம்பரிய கறி கைவினைத்திறன்' : 'Traditional Master Butcher Craftsmanship'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              {isTamil ? (
                <>
                  தினமும் <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-amber-400 to-red-400">100% பிரஷ் கறி</span> சுகாதாரமான முறையில் வெட்டப்படுகிறது
                </>
              ) : (
                <>
                  Master Butchery Meets <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-amber-400 to-red-400">Uncompromising Hygiene</span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {isTamil
                ? 'எங்கள் கடையில் தினமும் நேரடியாக பண்ணைகளில் இருந்து பெறப்படும் ஆடு, கோழி மற்றும் வாத்து கறி உங்கள் விருப்பமான முறையில் சுடச்சுட வெட்டி வீட்டு வாசலுக்கே விநியோகிக்கப்படுகிறது.'
                : 'Experience traditional butcher mastery enhanced by modern temperature-controlled hygiene standards. We source directly from local ethical farms and hand-cut every order right before delivery.'}
            </p>

            {/* Quick Action Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-md text-left transition-transform hover:-translate-y-1 duration-200">
                <Flame className="w-5 h-5 text-red-500 mb-1" />
                <h4 className="text-xs font-extrabold text-white">{isTamil ? 'தினமும் பிரஷ்' : 'Daily Fresh'}</h4>
                <p className="text-[10px] text-slate-400">{isTamil ? '0% பதப்படுத்திகள்' : '0% Preservatives'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-md text-left transition-transform hover:-translate-y-1 duration-200">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1" />
                <h4 className="text-xs font-extrabold text-white">{isTamil ? 'சுகாதார நிச்சயம்' : '100% Hygienic'}</h4>
                <p className="text-[10px] text-slate-400">{isTamil ? 'தூய்மையான முறை' : 'Triple Cleaned'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-md text-left transition-transform hover:-translate-y-1 duration-200 col-span-2 sm:col-span-1">
                <Zap className="w-5 h-5 text-amber-400 mb-1" />
                <h4 className="text-xs font-extrabold text-white">{isTamil ? 'வேகமான டெலிவரி' : 'Express Delivery'}</h4>
                <p className="text-[10px] text-slate-400">{isTamil ? 'வீட்டு வாசலில்' : 'To Doorstep'}</p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                to="/booking"
                className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-extrabold text-sm shadow-lg shadow-red-900/40 flex items-center gap-2 transition-all hover:scale-105"
              >
                <span>{isTamil ? 'இப்போதே கறி முன்பதிவு செய்ய' : 'Book Fresh Meat Now'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right 3D Visual Animation Container */}
          <div className="relative flex items-center justify-center">
            {/* Animated Floating 3D Butcher Card */}
            <div className="w-full max-w-md p-6 rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700/80 backdrop-blur-xl shadow-2xl space-y-5 transform hover:rotate-1 hover:scale-102 transition-all duration-300">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-700/50 flex items-center justify-center text-2xl shadow-inner animate-bounce" style={{ animationDuration: '3s' }}>
                    🔪
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">
                      {isTamil ? 'கைவினை வெட்டும் முறை' : 'Precision Butcher Slicing'}
                    </h3>
                    <span className="text-[11px] text-amber-400 font-medium">
                      {isTamil ? 'உங்களுக்கு பிடித்த வடிவம்' : 'Tailored To Your Recipe'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-900/40 text-red-300 text-[10px] font-bold border border-red-700/30">
                  Master Butchery
                </span>
              </div>

              {/* Slicing Animation Demo Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-red-700/20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                  <span>{isTamil ? 'வெட்டும் துல்லியம்' : 'Cut Thickness & Accuracy'}</span>
                  <span className="text-emerald-400 font-mono">100% Cleaned</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-600 to-amber-400 h-full rounded-full w-full animate-pulse"></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isTamil
                    ? 'சமையலுக்கு ஏற்ற சிறிய கறி துண்டுகள் (சிரசா) மற்றும் பிரியாணிக்கு ஏற்ற பெரிய துண்டுகள் (பெரிசா) துல்லியமாக வெட்டப்படுகின்றன.'
                    : 'Custom cut sizing tailored for curries, biryani, roast, and leg fries.'}
                </p>
              </div>

              {/* Quality Guarantee Ribbon */}
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-xs text-emerald-200">
                  <strong className="block text-white font-extrabold">{isTamil ? '100% தர உத்திரவாதம்' : 'Guaranteed Farm Fresh'}</strong>
                  <span>{isTamil ? 'எந்தவொரு இரசாயனமும் பயன்படுத்தப்படவில்லை' : 'No artificial preservatives or freezing'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 4 Master Cutting Styles Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950 relative">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isTamil ? 'சிறப்பு வெட்டும் முறைகள்' : 'Master Cutting Styles'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {isTamil
                ? 'உங்கள் சமையல் விருப்பத்திற்கேற்ப கறி எவ்வாறு வெட்டப்பட வேண்டும் என்பதைத் தேர்ந்தெடுக்கலாம்.'
                : 'Select how our master butchers cut your meat to match your exact recipe requirement.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cut Style 1: Sirasa */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-red-600/60 transition-all duration-300 group hover:-translate-y-2 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-red-950 text-red-400 border border-red-800/40 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🔪
              </div>
              <h3 className="text-lg font-extrabold text-white mb-1">
                {isTamil ? 'சிரசா (சிறிய துண்டுகள்)' : 'Sirasa (Small Curry Cut)'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {isTamil
                  ? 'குழம்பு மற்றும் வறுவலுக்கு ஏற்ற சிறிய அளவிலான கறி துண்டுகள்.'
                  : 'Bite-sized precision pieces perfect for traditional gravy curries & fry.'}
              </p>
              <span className="inline-block text-[11px] font-bold text-red-400 bg-red-950/60 px-2.5 py-1 rounded-full border border-red-800/30">
                {isTamil ? 'சமையலுக்கு சிறந்தது' : 'Best For Curry'}
              </span>
            </div>

            {/* Cut Style 2: Perusa */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-600/60 transition-all duration-300 group hover:-translate-y-2 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-amber-950 text-amber-400 border border-amber-800/40 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🍖
              </div>
              <h3 className="text-lg font-extrabold text-white mb-1">
                {isTamil ? 'பெரிசா (பெரிய துண்டுகள்)' : 'Perusa (Large Biryani Cut)'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {isTamil
                  ? 'பிரியாணி மற்றும் விருந்து சமையலுக்கு ஏற்ற பெரிய கறி துண்டுகள்.'
                  : 'Juicy large chunky pieces crafted specifically for Biryani feasts.'}
              </p>
              <span className="inline-block text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/30">
                {isTamil ? 'பிரியாணிக்கு சிறந்தது' : 'Best For Biryani'}
              </span>
            </div>

            {/* Cut Style 3: Leg Piece */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-600/60 transition-all duration-300 group hover:-translate-y-2 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🍗
              </div>
              <h3 className="text-lg font-extrabold text-white mb-1">
                {isTamil ? 'தொடை & லெக் பீஸ்' : 'Leg Piece & Thigh Cut'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {isTamil
                  ? 'முழுமையாக சுத்தம் செய்யப்பட்ட தொடை மற்றும் லெக் துண்டுகள்.'
                  : 'Cleanly prepped whole drumstick and thigh portions ideal for roasting.'}
              </p>
              <span className="inline-block text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/30">
                {isTamil ? 'வறுவலுக்கு சிறந்தது' : 'Best For Fry & Grill'}
              </span>
            </div>

            {/* Cut Style 4: Whole Cleaned */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-600/60 transition-all duration-300 group hover:-translate-y-2 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-blue-950 text-blue-400 border border-blue-800/40 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🐔
              </div>
              <h3 className="text-lg font-extrabold text-white mb-1">
                {isTamil ? 'முழு கோழி / கறி' : 'Whole Dressed Bird'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {isTamil
                  ? 'தோல் மற்றும் இறக்கைகள் நீக்கப்பட்டு முழுமையாக சுத்தம் செய்யப்பட்டது.'
                  : 'Full dressed bird cleaned thoroughly for custom home butchering.'}
              </p>
              <span className="inline-block text-[11px] font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-800/30">
                {isTamil ? 'முழு கறி' : 'Whole Cleaned'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Shop Location & Satellite Map Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 relative">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-red-400 uppercase tracking-wider mb-1">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>{isTamil ? 'எங்கள் நேரடி கடை இருப்பிடம்' : 'Visit Our Main Shop'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isTamil ? 'கடை வரைபடம் மற்றும் முகவரி' : 'Store Location & Directions'}
              </h2>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${shopLat},${shopLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span>{isTamil ? 'Google Maps-ல் பார்க்க' : 'Open in Google Maps'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Left 2 Cols: High Res Satellite Map */}
            <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 p-2 relative">
              <div className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden">
                <LeafletMapPicker
                  initialLat={shopLat}
                  initialLng={shopLng}
                  onLocationSelect={() => {}}
                />
              </div>
            </div>

            {/* Right Col: Shop Address & Details Card */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-950 text-red-500 border border-red-800/40 flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white mb-1">
                    {isTamil ? 'பிரஷ்மீட் முதன்மை விற்பனையகம்' : 'FreshMeat Main Store'}
                  </h3>
                  <p className="text-xs text-amber-400 font-mono font-bold">
                    GPS: {shopLat.toFixed(6)}, {shopLng.toFixed(6)}
                  </p>
                </div>

                {/* Address Box */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <strong className="block text-white font-bold">{isTamil ? 'கடை முகவரி:' : 'Shop Address:'}</strong>
                  <p className="text-slate-400 leading-relaxed font-medium">
                    {isTamil
                      ? 'பிரஷ்மீட் ஸ்டோர், முதன்மை சாலை, (முகவரி விரைவில் புதுப்பிக்கப்படும்).'
                      : 'FreshMeat Store Main Outlet, Main Road. [Shop address placeholder ready for text update]'}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{isTamil ? 'வேலை நேரம்: காலை 6:00 - இரவு 8:00' : 'Operating Hours: 6:00 AM - 8:00 PM'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isTamil ? 'வீட்டு டெலிவரி வசதி உண்டு' : 'Doorstep Delivery Available'}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/booking"
                className="w-full py-3 px-4 rounded-xl bg-red-800 hover:bg-red-700 text-white font-extrabold text-xs shadow-md text-center block transition-all"
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
