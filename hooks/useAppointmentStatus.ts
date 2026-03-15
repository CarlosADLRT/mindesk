/**
 * useAppointmentStatus Hook
 * Handles optimistic status updates with rollback on error
 */

'use client'

import { useState } from 'react'
import { updateAppointmentStatus } from '@/lib/api/appointments'
import type { AppointmentStatus } from '@/lib/status-transitions'

interface UseAppointmentStatusProps {
  appointmentId: string
  initialStatus: AppointmentStatus
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useAppointmentStatus({
  appointmentId,
  initialStatus,
  onSuccess,
  onError,
}: UseAppointmentStatusProps) {
  const [currentStatus, setCurrentStatus] = useState<AppointmentStatus>(initialStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateStatus = async (
    newStatus: AppointmentStatus,
    metadata?: { cancellationReason?: string }
  ) => {
    const previousStatus = currentStatus

    try {
      setIsUpdating(true)
      setError(null)

      // Optimistic update
      setCurrentStatus(newStatus)

      // Call API
      await updateAppointmentStatus(appointmentId, newStatus, metadata)

      // Success callback (e.g., refresh calendar)
      onSuccess?.()
    } catch (err) {
      // Rollback optimistic update
      setCurrentStatus(previousStatus)

      const error = err instanceof Error ? err : new Error('Failed to update status')
      setError(error)
      onError?.(error)

      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  return {
    currentStatus,
    isUpdating,
    error,
    updateStatus,
  }
}
