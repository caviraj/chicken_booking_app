import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { Languages, LogOut, ShoppingBag, User, Sparkles, Settings, LayoutDashboard } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, customer, signOut, updateLanguage } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentLang = i18n.language || 'en'

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ta' : 'en'
    updateLanguage(nextLang)
  }

  const isActive = (path: string) => location.pathname === path

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
              <Sparkles className="w-2.5 h-2.5" /> {t('header.freshBadge') || '100% Fresh'}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium block -mt-0.5">
            {t('header.subtitle') || 'Fresh & Hygienically Cut Daily'}
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
              <span>{t('header.bookNow') || 'Book Meat'}</span>
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

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          title="Toggle Language"
        >
          <Languages className="w-3.5 h-3.5 text-red-700" />
          <span>{currentLang === 'en' ? 'தமிழ்' : 'English'}</span>
        </button>

        {/* User Info & Settings Gear Dropdown */}
        {user ? (
          <div className="relative border-l border-slate-200 pl-2 sm:pl-3" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-red-800 border border-slate-200/80 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={t('header.settings') || 'Settings'}
            >
              <Settings className={`w-4 h-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-90 text-red-800' : ''}`} />
            </button>

            {/* Dropdown Menu Popup */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Profile header inside menu */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-slate-900 truncate">
                        {customer?.full_name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="py-1">
                  <Link
                    to="/booking"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-red-800 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-red-800" />
                    <span>{t('header.bookNow') || 'Book Meat'}</span>
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-red-800 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-red-800" />
                    <span>{t('header.myOrders') || 'My Orders'}</span>
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-red-800 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-red-800" />
                    <span>{t('header.dashboard') || 'Dashboard'}</span>
                  </Link>
                </div>

                {/* Sign Out Button */}
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      signOut()
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('header.signOut') || 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-1.5 rounded-lg bg-red-800 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-xs"
          >
            {t('auth.signInTab') || 'Sign In'}
          </Link>
        )}
      </div>
    </header>
  )
}

