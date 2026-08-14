import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { Languages, LogOut, ShoppingBag, User, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, customer, signOut, updateLanguage } = useAuth()
  const location = useLocation()

  const currentLang = i18n.language || 'en'

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ta' : 'en'
    updateLanguage(nextLang)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-4 lg:px-8 py-3 flex items-center justify-between transition-all">
      {/* Brand logo & Title */}
      <Link to="/booking" className="flex items-center gap-3 group">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-800 to-red-600 flex items-center justify-center shadow-md shadow-red-800/20 group-hover:scale-105 transition-transform duration-200">
          <ShoppingBag className="w-6 h-6 text-white font-bold" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight group-hover:text-red-800 transition-colors">
              {t('header.title') || 'FreshMeat Express'}
            </h1>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Sparkles className="w-2.5 h-2.5" /> 100% Fresh
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium block -mt-0.5">
            Fresh & Hygienically Cut Daily
          </span>
        </div>
      </Link>

      {/* Right controls & Navigation */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Customer Nav items */}
        {user && (
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/booking"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/booking')
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-red-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Book Meat</span>
            </Link>

            <Link
              to="/orders"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/orders')
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-red-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('header.myOrders') || 'My Orders'}</span>
            </Link>
          </nav>
        )}

        {/* Admin Link */}
        <Link
          to="/admin/rates"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200/80 transition-all shadow-2xs"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Admin Portal</span>
        </Link>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          title="Toggle Language"
        >
          <Languages className="w-3.5 h-3.5 text-red-700" />
          <span>{currentLang === 'en' ? 'தமிழ்' : 'English'}</span>
        </button>

        {/* User Info & Logout */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold">
              <User className="w-3.5 h-3.5 text-red-800" />
              <span>{customer?.full_name || user.email?.split('@')[0]}</span>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold border border-red-200/60 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('header.signOut') || 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-1.5 rounded-lg bg-red-800 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-xs"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  )
}
