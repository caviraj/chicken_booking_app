import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import { Header } from '../components/Header'
import { User, Mail, Phone, Globe, ShieldCheck, ShoppingBag } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, customer } = useAuth()


  const displayName = customer?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Valued Customer'

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Welcome banner */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('dashboard.active')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                {t('dashboard.welcome', { name: displayName })}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Your account is active. Click below to start booking fresh meat.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/booking')}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all hover:scale-105"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t('dashboard.startBooking')}</span>
                </button>
              </div>
            </div>


            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <ShoppingBag className="w-7 h-7 text-slate-950" />
            </div>
          </div>
        </div>

        {/* Customer Profile Details Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-400" />
            <span>{t('dashboard.profileInfo')}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">{t('dashboard.email')}</span>
                <span className="text-sm font-semibold text-slate-200">{customer?.email || user?.email || 'N/A'}</span>
              </div>
            </div>

            {/* Phone */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">{t('dashboard.phone')}</span>
                <span className="text-sm font-semibold text-slate-200">{customer?.phone_number || user?.phone || 'Not provided'}</span>
              </div>
            </div>

            {/* Preferred Language */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">{t('dashboard.preferredLanguage')}</span>
                <span className="text-sm font-semibold text-slate-200">
                  {customer?.preferred_language === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
                </span>
              </div>
            </div>

            {/* Customer ID */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Customer Database ID</span>
                <span className="text-xs font-mono font-medium text-slate-300 truncate max-w-[200px] block">
                  {customer?.id || 'Syncing...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <p>Fresh Meat Booking & Delivery System — Phase 3 Auth Dashboard</p>
      </footer>
    </div>
  )
}
