/**
 * Session Sheet Component
 * Bottom sheet for creating/editing appointments
 */

'use client'

import { useState, useEffect, FormEvent } from 'react'
import { X } from 'lucide-react'
import dayjs from 'dayjs'
import { getClients } from '@/lib/api/clients'
import { StatusControl } from './StatusControl'
import { useAppointmentStatus } from '@/hooks/useAppointmentStatus'
import type { Client } from '@/lib/supabase'
import type { AppointmentStatus } from '@/lib/status-transitions'

interface SessionSheetProps {
  mode: 'create' | 'edit'
  event?: any
  prefilledData?: { start: Date; end: Date }
  workspaceId: string
  isReschedule?: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  onDelete?: () => Promise<void>
  onStatusUpdate?: () => void // Callback to refresh calendar after status change
}

export function SessionSheet({
  mode,
  event,
  prefilledData,
  workspaceId,
  isReschedule = false,
  onClose,
  onSave,
  onDelete,
  onStatusUpdate,
}: SessionSheetProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_id: event?.extendedProps?.clientId || '',
    start_time: '',
    end_time: '',
    title: event?.extendedProps?.title || 'Sesión Individual',
    location: event?.extendedProps?.location || 'Consultorio',
    description: event?.extendedProps?.description || '',
    status: event?.extendedProps?.status || 'scheduled',
  })

  // Hook for status updates (only in edit mode)
  const appointmentStatus = mode === 'edit' && event?.id
    ? useAppointmentStatus({
        appointmentId: event.id,
        initialStatus: (event?.extendedProps?.status || 'scheduled') as AppointmentStatus,
        onSuccess: () => {
          // Refresh calendar after status change
          onStatusUpdate?.()
        },
        onError: (error) => {
          alert(`Error al actualizar estado: ${error.message}`)
        },
      })
    : null

  useEffect(() => {
    loadClients()

    // Set initial times
    if (prefilledData) {
      setFormData((prev) => ({
        ...prev,
        start_time: dayjs(prefilledData.start).format('YYYY-MM-DDTHH:mm'),
        end_time: dayjs(prefilledData.end).format('YYYY-MM-DDTHH:mm'),
      }))
    } else if (event) {
      setFormData((prev) => ({
        ...prev,
        start_time: dayjs(event.start).format('YYYY-MM-DDTHH:mm'),
        end_time: dayjs(event.end).format('YYYY-MM-DDTHH:mm'),
      }))
    }
  }, [])

  const loadClients = async () => {
    try {
      const fetchedClients = await getClients(workspaceId)
      setClients(fetchedClients)
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm('¿Estás seguro de que deseas cancelar esta sesión?')) return

    setLoading(true)
    try {
      await onDelete()
    } catch (error) {
      console.error('Error deleting:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isReschedule
                ? 'Reprogramar Sesión'
                : mode === 'create'
                ? 'Nueva Sesión'
                : 'Editar Sesión'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Reschedule notice */}
          {isReschedule && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Selecciona la nueva fecha y hora para esta cita. La cita original será cancelada automáticamente.
              </p>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            {/* Client selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.client_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, client_id: e.target.value }))
                }
                required
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Inicio
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, start_time: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fin
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, end_time: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Type & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option>Sesión Individual</option>
                  <option>Sesión de Pareja</option>
                  <option>Sesión Familiar</option>
                  <option>Evaluación Inicial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ubicación
                </label>
                <select
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option>Consultorio</option>
                  <option>Virtual</option>
                  <option>Domicilio</option>
                </select>
              </div>
            </div>

            {/* Status Control (only in edit mode) */}
            {mode === 'edit' && event?.id && appointmentStatus && (
              <StatusControl
                appointmentId={event.id}
                currentStatus={appointmentStatus.currentStatus}
                isUpdating={appointmentStatus.isUpdating}
                disabled={loading}
                onStatusChange={appointmentStatus.updateStatus}
              />
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-200 active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primaryDark active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              {loading
                ? isReschedule
                  ? 'Reprogramando...'
                  : 'Guardando...'
                : isReschedule
                ? 'Reprogramar'
                : 'Guardar'}
            </button>
          </div>

          {/* Delete button (if editing) */}
          {mode === 'edit' && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-full px-6 py-3 mt-3 text-red-600 font-semibold text-base hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar Sesión
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
