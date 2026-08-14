import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from '../../components/Header'
import { fetchAdminRateHistory, updateMeatRate } from '../../api/adminApi'
import type { RateHistoryItem } from '../../api/adminApi'

import { Tag, Save, History, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

export const AdminRatesPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [chickenRate, setChickenRate] = useState<string>('240')
  const [muttonRate, setMuttonRate] = useState<string>('750')
  const [duckRate, setDuckRate] = useState<string>('380')
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0])

  const [history, setHistory] = useState<RateHistoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadRateHistory = async () => {
    setLoading(true)
    try {
      const data = await fetchAdminRateHistory()
      setHistory(data)
    } catch (err: any) {
      setErrorMsg('Failed to load rate history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRateHistory()
  }, [])

  const handleUpdateRates = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const adminEmail = user?.email || 'admin@meatshop.com'

    try {
      if (chickenRate) {
        await updateMeatRate(adminEmail, 'chicken', parseFloat(chickenRate), effectiveDate)
      }
      if (muttonRate) {
        await updateMeatRate(adminEmail, 'mutton', parseFloat(muttonRate), effectiveDate)
      }
      if (duckRate) {
        await updateMeatRate(adminEmail, 'duck', parseFloat(duckRate), effectiveDate)
      }

      setSuccessMsg('Meat rates published successfully!')
      await loadRateHistory()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update meat rates')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Tag className="w-6 h-6 text-red-800" />
              <span>Admin Rates Manager</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure live per-kg meat prices and audit rate changes</p>
          </div>

          <nav className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => navigate('/admin/rates')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold bg-red-800 text-white shadow-2xs"
            >
              Rates
            </button>
            <button
              onClick={() => navigate('/admin/orders')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Orders Dashboard
            </button>
            <button
              onClick={() => navigate('/admin/delivery-zones')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Delivery Zones
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Settings
            </button>
            <button
              onClick={() => signOut()}
              className="ml-2 py-1.5 px-3 rounded-lg text-xs font-bold bg-red-50 text-red-800 hover:bg-red-100 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </nav>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Rate Setting Form */}
        <div className="pro-card p-6 sm:p-8 mb-8">
          <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <Save className="w-5 h-5 text-red-800" />
            <span>Set Today's Rates</span>
          </h3>

          <form onSubmit={handleUpdateRates} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Effective Date</label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full pro-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">🐔 Chicken Rate (₹/kg)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={chickenRate}
                  onChange={(e) => setChickenRate(e.target.value)}
                  placeholder="240"
                  className="w-full pro-input text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">🐐 Mutton Rate (₹/kg)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={muttonRate}
                  onChange={(e) => setMuttonRate(e.target.value)}
                  placeholder="750"
                  className="w-full pro-input text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">🦆 Duck Rate (₹/kg)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={duckRate}
                  onChange={(e) => setDuckRate(e.target.value)}
                  placeholder="380"
                  className="w-full pro-input text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 rounded-xl btn-primary text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving Rates...' : 'Save & Publish Rates'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Rate History Table */}
        <div className="pro-card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-red-800" />
              <span>Historical Rate Audit Trail</span>
            </h3>

            <button
              onClick={loadRateHistory}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Meat Type</th>
                  <th className="py-3 px-4">Rate per kg</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {history.length > 0 ? (
                  history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.effective_date}</td>
                      <td className="py-3 px-4 font-bold capitalize text-red-800">{row.meat_type}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">₹{row.rate_per_kg}</td>
                      <td className="py-3 px-4">
                        <span className="badge-fresh px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Published
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                      No historical rate audit records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p className="font-medium">FreshMeat Express Operations • Admin Rates Console</p>
      </footer>
    </div>
  )
}
