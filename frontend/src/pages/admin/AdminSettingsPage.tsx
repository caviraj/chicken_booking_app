import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from '../../components/Header'
import { fetchAdminSettings, saveAdminSettings } from '../../api/adminApi'
import type { AdminSettings } from '../../api/adminApi'
import { Settings as SettingsIcon, Tag, Save, AlertCircle, CheckCircle2, MapPin, Clock, ShieldAlert } from 'lucide-react'


export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth()

  const [settings, setSettings] = useState<AdminSettings>({
    cod_enabled: true,
    order_cutoff_time: '20:00',
    daily_stock_limit_kg: 100.0,
    shop_lat: 13.0827,
    shop_lng: 80.2707,
    delivery_enabled_days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    cleaning_day: false
  })

  const [loading, setLoading] = useState<boolean>(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const allDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  useEffect(() => {
    fetchAdminSettings().then((data) => {
      if (data) {
        setSettings(data)
      }
    })
  }, [])

  const handleToggleDay = (day: string) => {
    setSettings((prev) => {
      const currentDays = prev.delivery_enabled_days || []
      const updated = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day]
      return { ...prev, delivery_enabled_days: updated }
    })
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const adminEmail = user?.email || 'admin@meatshop.com'

    try {
      await saveAdminSettings(adminEmail, settings)
      setSuccessMsg('Admin settings saved successfully!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save admin settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-amber-400" />
              <span>Admin Operational Settings</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Manage store cutoff rules, stock limits, and location coordinates</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/rates"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 flex items-center gap-1.5 transition-all"
            >
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Rates Page</span>
            </Link>
            <Link
              to="/admin/settings"
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              Settings Page
            </Link>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Section 1: Store Rules & Cutoff */}
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Operational Rules & Cutoff Times</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Order Cutoff Time */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Daily Order Cutoff Time (24h format)
                </label>
                <input
                  type="time"
                  required
                  value={settings.order_cutoff_time || '20:00'}
                  onChange={(e) => setSettings({ ...settings, order_cutoff_time: e.target.value })}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Same-day orders placed after this time will be disabled.
                </span>
              </div>

              {/* Daily Stock Limit (kg) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Daily Stock Limit (kg per meat type)
                </label>
                <input
                  type="number"
                  step="5"
                  value={settings.daily_stock_limit_kg || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      daily_stock_limit_kg: e.target.value ? parseFloat(e.target.value) : null
                    })
                  }
                  placeholder="e.g. 100"
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Leave blank or set to null for unlimited stock capacity.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Payment & Operational Toggles */}
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Payment & Maintenance Controls</span>
            </h3>

            <div className="space-y-6">
              {/* COD Enabled Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">Enable Cash on Delivery (COD)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Allow customers to choose COD at checkout</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.cod_enabled}
                    onChange={(e) => setSettings({ ...settings, cod_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Cleaning Day Toggle (Placeholder/Disabled per prompt requirements) */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 opacity-60">
                <div>
                  <h4 className="font-bold text-slate-400 text-sm flex items-center gap-2">
                    <span>Cleaning Day (Shop Maintenance)</span>
                    <span className="text-[10px] uppercase font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      Placeholder (UI Only)
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Placeholder toggle — booking-block logic will be connected in future updates.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input
                    type="checkbox"
                    disabled
                    checked={false}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800/50 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-600 after:rounded-full after:h-5 after:w-5"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Enabled Days & Shop Coordinates */}
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <span>Location Coordinates & Operating Days</span>
            </h3>

            <div className="space-y-6">
              {/* Delivery Days Multi-select */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Delivery Enabled Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {allDays.map((day) => {
                    const isSelected = settings.delivery_enabled_days?.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/10'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Shop Latitude (shop_lat)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.shop_lat ?? ''}
                    onChange={(e) => setSettings({ ...settings, shop_lat: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="13.0827"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Shop Longitude (shop_lng)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={settings.shop_lng ?? ''}
                    onChange={(e) => setSettings({ ...settings, shop_lng: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="80.2707"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Settings...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <p>Fresh Meat Booking System — Phase 5 Admin Settings</p>
      </footer>
    </div>
  )
}
