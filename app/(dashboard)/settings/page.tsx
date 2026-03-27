'use client'

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, RefreshCw, Loader, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getWorkspaces, getWorkspacePricing, updateWorkspacePricing } from '@/lib/api/workspaces'
import { getClients, updateClient } from '@/lib/api/clients'
import { DEFAULT_PRICING, calculateRate, type WorkspacePricing } from '@/lib/pricing'
import { COP_CURRENCY } from '@/constants'

interface OutdatedClient {
  id: string
  first_name: string
  last_name: string
  care_modality: string | null
  session_type: string | null
  surcharge_schedule: boolean | null
  default_rate: number | null
  expected_rate: number
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pricing, setPricing] = useState<WorkspacePricing>(DEFAULT_PRICING)

  // Outdated clients
  const [outdatedClients, setOutdatedClients] = useState<OutdatedClient[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [updatingClients, setUpdatingClients] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const workspaces = await getWorkspaces()
      if (workspaces.length === 0) return
      const wsId = workspaces[0].id
      setWorkspaceId(wsId)

      const savedPricing = await getWorkspacePricing(wsId)
      if (savedPricing) {
        setPricing(savedPricing)
      }
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRateChange = (modality: string, sessionType: string, value: string) => {
    const numValue = parseInt(value.replace(/\D/g, ''), 10) || 0
    setPricing((prev) => ({
      ...prev,
      rate_matrix: {
        ...prev.rate_matrix,
        [modality]: {
          ...prev.rate_matrix[modality],
          [sessionType]: numValue,
        },
      },
    }))
    setSaved(false)
  }

  const handleSurchargeChange = (value: string) => {
    const numValue = parseInt(value.replace(/\D/g, ''), 10) || 0
    setPricing((prev) => ({ ...prev, surcharge_amount: numValue }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!workspaceId) return
    setSaving(true)
    setError(null)
    try {
      await updateWorkspacePricing(workspaceId, pricing)
      setSaved(true)
      // Refresh outdated clients list
      await loadOutdatedClients()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const loadOutdatedClients = async () => {
    if (!workspaceId) return
    setLoadingClients(true)
    try {
      const clients = await getClients(workspaceId)
      const outdated: OutdatedClient[] = []

      for (const client of clients) {
        if (!client.care_modality || !client.session_type) continue
        const expectedRate = calculateRate(
          client.care_modality,
          client.session_type,
          client.surcharge_schedule || false,
          pricing
        )
        if (client.default_rate !== expectedRate) {
          outdated.push({
            id: client.id,
            first_name: client.first_name,
            last_name: client.last_name,
            care_modality: client.care_modality,
            session_type: client.session_type,
            surcharge_schedule: client.surcharge_schedule,
            default_rate: client.default_rate,
            expected_rate: expectedRate,
          })
        }
      }

      setOutdatedClients(outdated)
    } catch (err) {
      console.error('Error loading clients:', err)
    } finally {
      setLoadingClients(false)
    }
  }

  const updateSingleClient = async (client: OutdatedClient) => {
    try {
      await updateClient(client.id, { default_rate: client.expected_rate })
      setOutdatedClients((prev) => prev.filter((c) => c.id !== client.id))
    } catch (err) {
      alert('Error al actualizar cliente')
    }
  }

  const updateAllClients = async () => {
    if (!confirm(`¿Actualizar la tarifa de ${outdatedClients.length} cliente(s) a las tarifas actuales?`)) return
    setUpdatingClients(true)
    try {
      for (const client of outdatedClients) {
        await updateClient(client.id, { default_rate: client.expected_rate })
      }
      setOutdatedClients([])
    } catch (err) {
      alert('Error al actualizar clientes')
    } finally {
      setUpdatingClients(false)
    }
  }

  const modalities = [
    { key: 'virtual', label: 'Virtual' },
    { key: 'domiciliario', label: 'Domiciliario' },
    { key: 'presencial', label: 'Presencial' },
  ]

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-right font-medium"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración de Tarifas</h1>
        <p className="text-slate-500 mt-1">
          Ajusta las tarifas por modalidad. Los clientes existentes mantienen su tarifa hasta que los actualices manualmente.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Rate Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Matriz de Tarifas</h2>
        </div>
        <div className="p-6">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div></div>
            <div className="text-center text-sm font-bold text-slate-500 uppercase tracking-wider">Individual</div>
            <div className="text-center text-sm font-bold text-slate-500 uppercase tracking-wider">Pareja / Familia</div>
          </div>

          {/* Rows */}
          {modalities.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-3 gap-4 mb-4 items-center">
              <div className="text-sm font-semibold text-slate-700 capitalize">{label}</div>
              <div>
                <input
                  type="text"
                  value={pricing.rate_matrix[key]?.individual?.toLocaleString('es-CO') || '0'}
                  onChange={(e) => handleRateChange(key, 'individual', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={pricing.rate_matrix[key]?.pareja_familia?.toLocaleString('es-CO') || '0'}
                  onChange={(e) => handleRateChange(key, 'pareja_familia', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Surcharge */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Recargo por Horario</h2>
        <p className="text-sm text-slate-500 mb-4">
          Aplica para horarios: 12-1PM, 1-2PM, 6-7PM, 7-8PM
        </p>
        <div className="max-w-xs">
          <input
            type="text"
            value={pricing.surcharge_amount.toLocaleString('es-CO')}
            onChange={(e) => handleSurchargeChange(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primaryDark disabled:bg-primary/60 transition shadow-lg shadow-teal-900/10"
        >
          {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Guardando...' : 'Guardar Tarifas'}
        </button>
        {saved && (
          <span className="text-sm font-medium text-emerald-600">Tarifas guardadas correctamente</span>
        )}
      </div>

      {/* Outdated Clients Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Clientes con Tarifas Anteriores
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Clientes cuya tarifa no coincide con la tarifa actual para su modalidad
            </p>
          </div>
          <button
            onClick={loadOutdatedClients}
            disabled={loadingClients}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primaryDark transition"
          >
            <RefreshCw size={16} className={loadingClients ? 'animate-spin' : ''} />
            Verificar
          </button>
        </div>

        <div className="p-6">
          {loadingClients ? (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 text-primary animate-spin mx-auto" />
            </div>
          ) : outdatedClients.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">
                {outdatedClients.length === 0 && !loadingClients
                  ? 'Haz clic en "Verificar" para buscar clientes con tarifas desactualizadas.'
                  : 'Todos los clientes tienen tarifas actualizadas.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Bulk update button */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={updateAllClients}
                  disabled={updatingClients}
                  className="flex items-center gap-2 text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-100 transition"
                >
                  {updatingClients ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Actualizar Todos ({outdatedClients.length})
                </button>
              </div>

              {outdatedClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {client.care_modality} · {client.session_type?.replace('_', ' / ')}
                      {client.surcharge_schedule ? ' · Con recargo' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Actual</p>
                      <p className="text-sm font-medium text-slate-600 line-through">
                        {client.default_rate ? COP_CURRENCY.format(client.default_rate) : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Nueva</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {COP_CURRENCY.format(client.expected_rate)}
                      </p>
                    </div>
                    <button
                      onClick={() => updateSingleClient(client)}
                      className="text-xs font-semibold text-primary hover:text-primaryDark bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
