import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from '../../components/Header'
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
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react'

export const AdminZonesPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6 text-red-800" />
              <span>Delivery Distance Fee Zones</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure distance thresholds (km) and delivery fee structures</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={openCreateModal}
              className="py-2 px-4 rounded-xl btn-primary text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Zone</span>
            </button>
            
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
                className="py-1.5 px-3 rounded-lg text-xs font-bold bg-red-800 text-white shadow-2xs"
              >
                Zones
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Settings
              </button>
            </nav>
          </div>
        </div>

        {/* Global Alert Notification */}
        {msg && (
          <div
            className={`mb-6 p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              msg.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800 font-medium'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
            }`}
          >
            {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Delivery Zones Table */}
        {loading ? (
          <div className="pro-card p-8 text-center">
            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs text-slate-500 font-bold">Loading delivery distance zones...</span>
          </div>
        ) : zones.length === 0 ? (
          <div className="pro-card p-12 text-center text-slate-500">
            <Truck className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <h3 className="text-base font-extrabold text-slate-800 mb-1">No Delivery Zones Configured</h3>
            <p className="text-xs text-slate-500 mb-4">Add distance zones to handle fallback delivery fee calculation.</p>
            <button
              onClick={openCreateModal}
              className="py-2 px-4 rounded-xl btn-primary text-xs font-bold shadow-xs cursor-pointer"
            >
              Add First Zone
            </button>
          </div>
        ) : (
          <div className="pro-card overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Zone Name</th>
                  <th className="py-3.5 px-4">Max Distance (km)</th>
                  <th className="py-3.5 px-4">Delivery Charge</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">{zone.zone_name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{zone.max_distance_km} km</td>
                    <td className="py-3.5 px-4 font-extrabold text-red-800">₹{zone.delivery_charge}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          zone.is_active
                            ? 'badge-fresh'
                            : 'badge-crimson'
                        }`}
                      >
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(zone)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                        title="Edit Zone"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 max-w-md w-full rounded-2xl p-6 sm:p-8 relative shadow-2xl border border-slate-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Define distance radius limit and fee structure
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zone A (0-5 km)"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full pro-input text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Max Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="5.0"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  className="w-full pro-input text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Delivery Fee (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="30"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="w-full pro-input text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded accent-red-800 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-slate-800 font-bold cursor-pointer">
                  Zone Active Status
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl btn-primary text-xs font-bold shadow-xs cursor-pointer"
                >
                  {saving ? 'Saving Zone...' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
