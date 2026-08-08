import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from '../../components/Header'
import { fetchAdminRateHistory, updateMeatRate } from '../../api/adminApi'
import type { RateHistoryItem } from '../../api/adminApi'

import { Tag, Save, History, Settings as SettingsIcon, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

export const AdminRatesPage: React.FC = () => {
  const { user } = useAuth()

  // Form states for today's rates
  const [chickenRate, setChickenRate] = useState<string>('240')
  const [muttonRate, setMuttonRate] = useState<string>('750')
  const [duckRate, setDuckRate] = useState<string>('380')
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0])

  // Data history state
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

      setSuccessMsg('Rates updated successfully!')
      await loadRateHistory()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update meat rates')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              <Tag className="w-6 h-6 text-amber-400" />
              <span>Admin Management — Daily Rates</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Configure per-kg prices for Chicken, Mutton, and Duck</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/rates"
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              Rates Page
            </Link>
            <Link
              to="/admin/settings"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 flex items-center gap-1.5 transition-all"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings Page</span>
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

        {/* Rate Setting Form */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 mb-8">
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Save className="w-5 h-5 text-amber-400" />
            <span>Set Today's Rates</span>
          </h3>

          <form onSubmit={handleUpdateRates} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Effective Date</label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">🐔 Chicken Rate (₹/kg)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={chickenRate}
                  onChange={(e) => setChickenRate(e.target.value)}
                  placeholder="240"
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">🐐 Mutton Rate (₹/kg)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={muttonRate}
                  onChange={(e) => setMuttonRate(e.target.value)}
                  placeholder="750"
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">🦆 Duck Rate (₹/kg)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={duckRate}
                  onChange={(e) => setDuckRate(e.target.value)}
                  placeholder="380"
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving Rates...' : 'Save & Publish Rates'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Rate History Table */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>Rate History Table</span>
            </h3>

            <button
              onClick={loadRateHistory}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Meat Type</th>
                  <th className="py-3 px-4">Rate per kg</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.length > 0 ? (
                  history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-200">{row.effective_date}</td>
                      <td className="py-3 px-4 font-semibold capitalize text-amber-400">{row.meat_type}</td>
                      <td className="py-3 px-4 font-bold text-slate-100">₹{row.rate_per_kg}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                      No historical rate records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <p>Fresh Meat Booking System — Phase 5 Admin Rates</p>
      </footer>
    </div>
  )
}
