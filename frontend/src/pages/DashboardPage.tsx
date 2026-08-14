import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import { Header } from '../components/Header'
import { User, Mail, Phone, Globe, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, customer } = useAuth()

  const displayName = customer?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Valued Customer'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Welcome banner */}
        <div className="pro-card p-6 sm:p-8 mb-8 relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('dashboard.active') || 'Verified Account'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {t('dashboard.welcome', { name: displayName }) || `Welcome back, ${displayName}`}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Your account is active. Order daily fresh meat with custom cuts and morning delivery.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => navigate('/booking')}
                  className="py-2.5 px-5 rounded-xl bg-red-800 hover:bg-red-600 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t('dashboard.startBooking') || 'Start Booking Meat'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-red-800 text-white flex items-center justify-center shadow-lg shrink-0">
              <ShoppingBag className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Customer Profile Details Card */}
        <div className="pro-card p-6 sm:p-8">
          <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-red-800" />
            <span>{t('dashboard.profileInfo') || 'Customer Profile Details'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">{t('dashboard.email') || 'Email Address'}</span>
                <span className="text-xs font-bold text-slate-900">{customer?.email || user?.email || 'N/A'}</span>
              </div>
            </div>

            {/* Phone */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">{t('dashboard.phone') || 'Phone Number'}</span>
                <span className="text-xs font-bold text-slate-900">{customer?.phone_number || user?.phone || 'Not provided'}</span>
              </div>
            </div>

            {/* Preferred Language */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">{t('dashboard.preferredLanguage') || 'Language'}</span>
                <span className="text-xs font-bold text-slate-900">
                  {customer?.preferred_language === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
                </span>
              </div>
            </div>

            {/* Customer ID */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">Customer ID</span>
                <span className="text-xs font-mono font-bold text-slate-800 truncate max-w-[200px] block">
                  {customer?.id || 'Syncing...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p className="font-medium">FreshMeat Express • Customer Account Portal</p>
      </footer>
    </div>
  )
}
