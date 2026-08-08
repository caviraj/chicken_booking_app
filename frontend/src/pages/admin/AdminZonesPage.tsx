import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchAdminDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  type DeliveryZonePayload
} from '../../api/adminApi'

import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react'

export const AdminZonesPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const adminEmail = user?.email || ''

  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  // Form & Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingZone, setEditingZone] = useState<any | null>(null)

  const [zoneName, setZoneName] = useState<string>('')
  const [maxDistance, setMaxDistance] = useState<string>('')
  const [deliveryCharge, setDeliveryCharge] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(true)

  const loadZones = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const data = await fetchAdminDeliveryZones()
      setZones(data)
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Failed to load delivery zones.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadZones()
  }, [])

  const openCreateModal = () => {
    setEditingZone(null)
    setZoneName('')
    setMaxDistance('')
    setDeliveryCharge('')
    setIsActive(true)
    setIsModalOpen(true)
  }

  const openEditModal = (zone: any) => {
    setEditingZone(zone)
    setZoneName(zone.zone_name)
    setMaxDistance(zone.max_distance_km.toString())
    setDeliveryCharge(zone.delivery_charge.toString())
    setIsActive(zone.is_active)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminEmail) return
    setSaving(true)
    setMsg(null)

    try {
      const payload: DeliveryZonePayload = {
        admin_email: adminEmail,
        zone_name: zoneName.trim(),
        max_distance_km: parseFloat(maxDistance),
        delivery_charge: parseFloat(deliveryCharge),
        is_active: isActive
      }

      if (editingZone) {
        await updateDeliveryZone(editingZone.id, payload)
        setMsg({ type: 'success', text: `Delivery zone updated successfully.` })
      } else {
        await createDeliveryZone(payload)
        setMsg({ type: 'success', text: `New delivery zone created successfully.` })
      }

      setIsModalOpen(false)
      await loadZones()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save delivery zone.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (zoneId: string) => {
    if (!adminEmail || !window.confirm('Are you sure you want to delete this delivery zone?')) return
    setMsg(null)
    try {
      await deleteDeliveryZone(zoneId, adminEmail)
      setMsg({ type: 'success', text: 'Delivery zone deleted.' })
      await loadZones()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to delete delivery zone.' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Truck className="w-5 h-5 text-white" />
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
              className="py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
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
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 transition-all"
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
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-400" />
              <span>Delivery Zones CRUD</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure distance bands and delivery charge fallbacks
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Zone</span>
            </button>
            <button
              onClick={loadZones}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {msg && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs flex items-center gap-3 animate-in fade-in ${
              msg.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Delivery Zones Table */}
        {loading ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs text-slate-400 font-medium">Loading delivery zones...</span>
          </div>
        ) : zones.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-slate-400">
            <Truck className="w-12 h-12 mx-auto mb-3 text-slate-700" />
            <h3 className="text-base font-bold text-slate-300 mb-1">No Delivery Zones Configured</h3>
            <p className="text-xs text-slate-500 mb-4">Add delivery zones to enable distance-based fee fallbacks.</p>
            <button
              onClick={openCreateModal}
              className="py-2 px-4 rounded-xl bg-amber-500 text-white font-bold text-xs"
            >
              Add First Zone
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Zone Name</th>
                  <th className="py-3.5 px-4">Max Distance (km)</th>
                  <th className="py-3.5 px-4">Delivery Charge</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100">{zone.zone_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{zone.max_distance_km} km</td>
                    <td className="py-3.5 px-4 font-bold text-amber-400">₹{zone.delivery_charge}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          zone.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(zone)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                        title="Edit Zone"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                        title="Delete Zone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add / Edit Delivery Zone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 sm:p-8 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 mb-1">
              {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Specify max distance limit and fallback charge
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zone A (0-5 km)"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="5.0"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Delivery Charge (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="30"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <label htmlFor="isActive" className="text-slate-300 font-semibold cursor-pointer">
                  Zone Active
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/20"
                >
                  {saving ? 'Saving...' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
