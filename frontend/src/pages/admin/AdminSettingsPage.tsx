import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchAdminSettings, updateAdminSettings, type AdminSettings } from '../../api/adminApi'
import { Settings, Clock, MapPin, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'


export const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [settings, setSettings] = useState<AdminSettings>({
    order_cutoff_time: '20:00',
    daily_stock_limit_kg: 100,
    shop_latitude: 13.0827,
    shop_longitude: 80.2707,
    is_cleaning_day: false
  })

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadSettings = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await fetchAdminSettings()
      if (data && Object.keys(data).length > 0) {
        setSettings((prev) => ({ ...prev, ...data }))
      }
    } catch (err: any) {
      setErrorMsg('Failed to load shop settings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const adminEmail = user?.email || 'admin@meatshop.com'

    try {
      await updateAdminSettings({
        admin_email: adminEmail,
        order_cutoff_time: settings.order_cutoff_time,
        daily_stock_limit_kg: Number(settings.daily_stock_limit_kg),
        shop_latitude: Number(settings.shop_latitude || 13.0827),
        shop_longitude: Number(settings.shop_longitude || 80.2707),
        is_cleaning_day: Boolean(settings.is_cleaning_day)
      })

      setSuccessMsg('Admin settings saved successfully!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save admin settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-extrabold text-slate-100 text-lg tracking-tight">Admin Dashboard</h1>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/rates')}
              className="py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              Rates
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 transition-all"
            >
              Settings
            </button>
            <button
              onClick={() => navigate('/admin/orders')}
              className="py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              Orders
            </button>
            <button
              onClick={() => navigate('/admin/delivery-zones')}
              className="py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              Delivery Zones
            </button>
            <button
              onClick={() => signOut()}
              className="ml-3 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-amber-400" />
              <span>Operational Settings</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Manage cutoff times, stock limits, and shop coordinates</p>
          </div>

          <button
            onClick={loadSettings}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs text-slate-400 font-medium">Loading operational settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cutoff & Stock Section */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Cutoff Rules & Stock Limits</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Daily Order Cutoff Time</label>
                  <input
                    type="time"
                    required
                    value={settings.order_cutoff_time}
                    onChange={(e) => setSettings({ ...settings, order_cutoff_time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Same-day orders closed after this time</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Daily Stock Limit (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={settings.daily_stock_limit_kg}
                    onChange={(e) => setSettings({ ...settings, daily_stock_limit_kg: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Maximum combined kg allowed per delivery date</p>
                </div>
              </div>
            </div>

            {/* Shop Coordinates Section */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Shop Location Coordinates</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shop Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={settings.shop_latitude}
                    onChange={(e) => setSettings({ ...settings, shop_latitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shop Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={settings.shop_longitude}
                    onChange={(e) => setSettings({ ...settings, shop_longitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                {saving ? 'Saving Settings...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
