/**
 * Create Appointment Modal Component
 * Form for scheduling new appointments/sessions
 */

import { useState, FormEvent } from 'react'
import { X, Calendar, Clock } from 'lucide-react'
import { createAppointment } from '../lib/api/appointments'
import type { Client } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface CreateAppointmentModalProps {
  workspaceId: string
  client: Client
  onClose: () => void
  onSuccess: () => void
}

export function CreateAppointmentModal({
  workspaceId,
  client,
  onClose,
  onSuccess
}: CreateAppointmentModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientName = `${client.first_name} ${client.last_name}`

  // Default to today at next available hour
  const getDefaultDateTime = () => {
    const now = new Date()
    now.setMinutes(0, 0, 0)
    now.setHours(now.getHours() + 1)
    return now
  }

  const defaultStart = getDefaultDateTime()
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000) // +1 hour

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const [formData, setFormData] = useState({
    start_time: formatDateTimeLocal(defaultStart),
    duration: '60', // minutes
    title: 'Sesión Individual',
    location: 'Consultorio',
    description: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Calculate end time based on start time + duration
      const startTime = new Date(formData.start_time)
      const endTime = new Date(startTime.getTime() + parseInt(formData.duration) * 60 * 1000)

      await createAppointment({
        workspace_id: workspaceId,
        client_id: client.id,
        provider_id: user.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        title: formData.title || null,
        location: formData.location || null,
        description: formData.description || null,
        status: 'scheduled',
      })

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating appointment:', err)
      setError(err instanceof Error ? err.message : 'Error al crear la cita')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Programar Sesión</h2>
            <p className="text-sm text-gray-600 mt-1">Cliente: {clientName}</p>
          </div>
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

          {/* Date and Time */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              Fecha y Hora
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora de Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (minutos) <span className="text-red-500">*</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="90">90 minutos</option>
                  <option value="120">120 minutos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              Detalles de la Sesión
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Sesión
                </label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="Sesión Individual">Sesión Individual</option>
                  <option value="Sesión de Pareja">Sesión de Pareja</option>
                  <option value="Sesión Familiar">Sesión Familiar</option>
                  <option value="Evaluación Inicial">Evaluación Inicial</option>
                  <option value="Sesión de Seguimiento">Sesión de Seguimiento</option>
                  <option value="Terapia Grupal">Terapia Grupal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="Consultorio">Consultorio</option>
                  <option value="Virtual">Virtual (Videollamada)</option>
                  <option value="Domicilio">Domicilio del Cliente</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              placeholder="Motivo de consulta, preparación especial, etc..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Esta descripción es solo para programación. Las notas clínicas se agregan después de la sesión.
            </p>
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
              {loading ? 'Programando...' : 'Programar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
