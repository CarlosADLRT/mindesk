/**
 * StatusControl Component
 * UI for viewing and updating appointment status with transition validation
 */

'use client'

import { useState } from 'react'
import { Check, X, AlertCircle, Loader } from 'lucide-react'
import {
  type AppointmentStatus,
  getAllowedTransitions,
  isTerminalStatus,
  getStatusLabel,
  getStatusColor,
} from '@/lib/status-transitions'

interface StatusControlProps {
  appointmentId: string
  currentStatus: AppointmentStatus
  isUpdating?: boolean
  disabled?: boolean
  onStatusChange: (
    newStatus: AppointmentStatus,
    metadata?: { cancellationReason?: string }
  ) => Promise<void>
}

export function StatusControl({
  appointmentId,
  currentStatus,
  isUpdating = false,
  disabled = false,
  onStatusChange,
}: StatusControlProps) {
  const [showCancelReason, setShowCancelReason] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const allowedNextStatuses = getAllowedTransitions(currentStatus)
  const isTerminal = isTerminalStatus(currentStatus)
  const statusColors = getStatusColor(currentStatus)

  const handleStatusClick = async (newStatus: AppointmentStatus) => {
    if (disabled || isUpdating) return

    setLocalError(null)

    // If canceling, show reason input
    if (newStatus === 'canceled') {
      setShowCancelReason(true)
      return
    }

    try {
      await onStatusChange(newStatus)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al actualizar estado')
    }
  }

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      setLocalError('Por favor ingrese un motivo de cancelación')
      return
    }

    try {
      await onStatusChange('canceled', { cancellationReason: cancelReason })
      setShowCancelReason(false)
      setCancelReason('')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al cancelar sesión')
    }
  }

  if (showCancelReason) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-700">
            Motivo de cancelación
          </label>
          <button
            onClick={() => {
              setShowCancelReason(false)
              setCancelReason('')
              setLocalError(null)
            }}
            className="text-gray-400 hover:text-gray-600"
            disabled={isUpdating}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Ej: Cliente solicitó reagendar, emergencia personal, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none text-sm"
          rows={3}
          disabled={isUpdating}
        />
        {localError && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{localError}</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCancelReason(false)
              setCancelReason('')
              setLocalError(null)
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
            disabled={isUpdating}
          >
            Volver
          </button>
          <button
            onClick={handleCancelConfirm}
            disabled={isUpdating || !cancelReason.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition font-medium text-sm flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Confirmar Cancelación'
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        Estado de la Sesión
      </label>

      {/* Current Status Display */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border rounded-lg ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
      >
        <Check className="w-5 h-5" />
        <span className="font-semibold">{getStatusLabel(currentStatus)}</span>
        {isTerminal && (
          <span className="ml-auto text-xs opacity-75">(Estado final)</span>
        )}
      </div>

      {/* Transition Buttons */}
      {!isTerminal && allowedNextStatuses.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Cambiar estado a:</p>
          <div className="flex flex-wrap gap-2">
            {allowedNextStatuses.map((status) => {
              const colors = getStatusColor(status)
              return (
                <button
                  key={status}
                  onClick={() => handleStatusClick(status)}
                  disabled={disabled || isUpdating}
                  className={`px-4 py-2 border rounded-lg font-medium text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${colors.bg} ${colors.text} ${colors.border} hover:shadow-md`}
                >
                  {isUpdating ? (
                    <Loader className="w-4 h-4 animate-spin inline" />
                  ) : (
                    getStatusLabel(status)
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Error Display */}
      {localError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      {/* Help Text for Terminal States */}
      {isTerminal && (
        <p className="text-sm text-gray-500 italic">
          Este estado no puede ser modificado. Si necesitas hacer cambios, contacta al administrador.
        </p>
      )}
    </div>
  )
}
