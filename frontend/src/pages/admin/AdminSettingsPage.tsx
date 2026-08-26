import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchAdminSettings, updateAdminSettings, type AdminSettings } from '../../api/adminApi'
import { Header } from '../../components/Header'
import { Settings, Clock, MapPin, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

export const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [settings, setSettings] = useState<AdminSettings>({
    order_cutoff_time: '20:00',
    daily_stock_limit_kg: 100,
    shop_latitude: 11.063737820050445,
    shop_longitude: 77.79459634396372,
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
        shop_latitude: Number(settings.shop_latitude || 11.063737820050445),
        shop_longitude: Number(settings.shop_longitude || 77.79459634396372),
        is_cleaning_day: Boolean(settings.is_cleaning_day)
      })

      setSuccessMsg('Operational settings saved successfully!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save admin settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-red-800" />
              <span>Operational Settings</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure daily order cutoff times, stock thresholds, and shop coordinates</p>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigate('/admin/rates')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Rates
            </button>
            <button
              onClick={() => navigate('/admin/orders')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Orders
            </button>
            <button
              onClick={() => navigate('/admin/delivery-zones')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Zones
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold bg-red-800 text-white shadow-2xs"
            >
              Settings
            </button>
            <button
              onClick={loadSettings}
              className="ml-2 p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </nav>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="pro-card p-8 text-center">
            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs text-slate-500 font-bold">Loading operational parameters...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cutoff & Stock Section */}
            <div className="pro-card p-6">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-800" />
                <span>Daily Cutoff Rules & Stock Controls</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Daily Order Cutoff Time</label>
                  <input
                    type="time"
                    required
                    value={settings.order_cutoff_time}
                    onChange={(e) => setSettings({ ...settings, order_cutoff_time: e.target.value })}
                    className="w-full pro-input text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Order cancellations and same-day bookings restricted after cutoff</p>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Daily Stock Limit (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={settings.daily_stock_limit_kg}
                    onChange={(e) => setSettings({ ...settings, daily_stock_limit_kg: Number(e.target.value) })}
                    className="w-full pro-input text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Maximum stock capacity per delivery day</p>
                </div>
              </div>
            </div>

            {/* Shop Coordinates Section */}
            <div className="pro-card p-6">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-800" />
                <span>Shop Geolocation Coordinates</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Shop Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={settings.shop_latitude}
                    onChange={(e) => setSettings({ ...settings, shop_latitude: Number(e.target.value) })}
                    className="w-full pro-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Shop Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={settings.shop_longitude}
                    onChange={(e) => setSettings({ ...settings, shop_longitude: Number(e.target.value) })}
                    className="w-full pro-input text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-8 rounded-xl btn-primary text-xs font-bold shadow-xs cursor-pointer"
              >
                {saving ? 'Saving Settings...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p className="font-medium">FreshMeat Express • Operations Settings Console</p>
      </footer>
    </div>
  )
}
