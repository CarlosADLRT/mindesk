/**
 * Edit Client Modal Component
 * Form for editing existing client information
 */

import { useState, FormEvent, useMemo } from 'react'
import { X } from 'lucide-react'
import { updateClient } from '../lib/api/clients'
import { calculateRate } from '../lib/pricing'
import { COP_CURRENCY } from '../constants'
import type { Client } from '../lib/supabase'

interface EditClientModalProps {
  client: Client
  onClose: () => void
  onSuccess: () => void
}

export function EditClientModal({ client, onClose, onSuccess }: EditClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    first_name: client.first_name || '',
    last_name: client.last_name || '',
    date_of_birth: client.date_of_birth || '',
    marital_status: client.marital_status || '',
    nationality: client.nationality || 'Colombiana',
    city: client.city || '',
    previous_diagnosis: client.previous_diagnosis || '',
    pharmacological_treatment: client.pharmacological_treatment || '',
    initial_consultation_reason: client.initial_consultation_reason || '',
    previous_psychology_assistance: client.previous_psychology_assistance || '',
    session_frequency: client.session_frequency || '',
    patient_status: client.patient_status || '',
    care_modality: client.care_modality || 'presencial',
    session_type: client.session_type || 'individual',
    surcharge_schedule: client.surcharge_schedule || false,
  })

  const computedRate = useMemo(
    () => calculateRate(formData.care_modality, formData.session_type, formData.surcharge_schedule),
    [formData.care_modality, formData.session_type, formData.surcharge_schedule]
  )

  const computedAge = useMemo(() => {
    if (!formData.date_of_birth) return null
    const birth = new Date(formData.date_of_birth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }, [formData.date_of_birth])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await updateClient(client.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth || null,
        marital_status: formData.marital_status || null,
        nationality: formData.nationality || null,
        city: formData.city || null,
        previous_diagnosis: formData.previous_diagnosis || null,
        pharmacological_treatment: formData.pharmacological_treatment || null,
        initial_consultation_reason: formData.initial_consultation_reason || null,
        previous_psychology_assistance: formData.previous_psychology_assistance || null,
        session_frequency: formData.session_frequency || null,
        patient_status: formData.patient_status || null,
        care_modality: formData.care_modality || null,
        session_type: formData.session_type || null,
        surcharge_schedule: formData.surcharge_schedule,
        default_rate: computedRate,
      })

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
  const labelClass = "block text-sm font-medium text-gray-700 mb-2"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">Editar Cliente</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Datos del Paciente */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Datos del Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="María"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="González"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Edad
                </label>
                <div className={`${inputClass} bg-gray-50 text-gray-700`}>
                  {computedAge !== null ? `${computedAge} años` : '—'}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Estado Civil
                </label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Seleccionar...</option>
                  <option value="soltero">Soltero/a</option>
                  <option value="casado">Casado/a</option>
                  <option value="union_libre">Unión Libre</option>
                  <option value="divorciado">Divorciado/a</option>
                  <option value="viudo">Viudo/a</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Nacionalidad
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Colombiana"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Residencia
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Bogotá"
                />
              </div>
            </div>
          </div>

          {/* Información Clínica */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información Clínica
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Diagnóstico Previo
                </label>
                <textarea
                  name="previous_diagnosis"
                  value={formData.previous_diagnosis}
                  onChange={handleChange}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder="Diagnósticos previos del paciente..."
                />
              </div>

              <div>
                <label className={labelClass}>
                  Tratamiento Farmacológico
                </label>
                <textarea
                  name="pharmacological_treatment"
                  value={formData.pharmacological_treatment}
                  onChange={handleChange}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder="Medicamentos actuales o previos..."
                />
              </div>

              <div>
                <label className={labelClass}>
                  Motivo de Consulta Inicial
                </label>
                <textarea
                  name="initial_consultation_reason"
                  value={formData.initial_consultation_reason}
                  onChange={handleChange}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder="Razón principal de la consulta..."
                />
              </div>

              <div>
                <label className={labelClass}>
                  Asistencia Previa por Psicología
                </label>
                <textarea
                  name="previous_psychology_assistance"
                  value={formData.previous_psychology_assistance}
                  onChange={handleChange}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder="Detalles de atención psicológica previa..."
                />
              </div>
            </div>
          </div>

          {/* Modalidad y Tarifa */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Modalidad y Tarifa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Regularidad de la Sesión
                </label>
                <select
                  name="session_frequency"
                  value={formData.session_frequency}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Seleccionar...</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Estado del Paciente
                </label>
                <select
                  name="patient_status"
                  value={formData.patient_status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Seleccionar...</option>
                  <option value="activo">Activo</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="remision_parcial">Remisión Parcial</option>
                  <option value="remision_total">Remisión Total</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Modalidad de Atención
                </label>
                <select
                  name="care_modality"
                  value={formData.care_modality}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="virtual">Virtual</option>
                  <option value="domiciliario">Domiciliario</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Tipo de Sesión
                </label>
                <select
                  name="session_type"
                  value={formData.session_type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="individual">Individual</option>
                  <option value="pareja_familia">Pareja / Familia</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="surcharge_schedule"
                    checked={formData.surcharge_schedule}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">
                    Horario con recargo adicional ($15.000) — 12-1PM, 1-2PM, 6-7PM, 7-8PM
                  </span>
                </label>
              </div>

              <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Tarifa calculada</p>
                <p className="text-2xl font-bold text-gray-900">
                  {COP_CURRENCY.format(computedRate)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryDark disabled:bg-primary/60 transition font-medium"
            >
              {loading ? 'Guardando...' : 'Actualizar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
