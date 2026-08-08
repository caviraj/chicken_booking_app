import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { Languages, LogOut, ShoppingBag, User } from 'lucide-react'

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, customer, signOut, updateLanguage } = useAuth()

  const currentLang = i18n.language || 'en'

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ta' : 'en'
    updateLanguage(nextLang)
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <ShoppingBag className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">
            {t('header.title')}
          </h1>
          <span className="text-xs text-slate-400 block -mt-0.5">
            Quality Meats & Swift Delivery
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Admin Link */}
        <a
          href="/admin/rates"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/20 transition-all"
        >
          <span>Admin Panel</span>
        </a>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700/60 transition-all duration-200"
          title="Toggle Language"
        >
          <Languages className="w-4 h-4 text-orange-400" />
          <span>{currentLang === 'en' ? 'தமிழ்' : 'English'}</span>
        </button>


        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-orange-400" />
              <span>{customer?.full_name || user.email?.split('@')[0]}</span>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium border border-rose-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('header.signOut')}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
