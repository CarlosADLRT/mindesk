/**
 * useSessionMutations Hook
 * Handles create/update/delete operations for appointments
 */

'use client'

import { useState } from 'react'
import {
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from '@/lib/api/appointments'
import type { TablesInsert, TablesUpdate } from '@/lib/supabase'

interface UseSessionMutationsProps {
  workspaceId: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useSessionMutations({
  workspaceId,
  onSuccess,
  onError,
}: UseSessionMutationsProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const createSession = async (data: Omit<TablesInsert<'appointments'>, 'created_by'>) => {
    setIsCreating(true)
    try {
      const appointment = await createAppointment(data)
      onSuccess?.()
      return appointment
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create appointment')
      onError?.(err)
      throw err
    } finally {
      setIsCreating(false)
    }
  }

  const updateSession = async (data: { id: string } & TablesUpdate<'appointments'>) => {
    setIsUpdating(true)
    try {
      const { id, ...updates } = data
      const appointment = await updateAppointment(id, updates)
      onSuccess?.()
      return appointment
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update appointment')
      onError?.(err)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteSession = async (id: string, reason?: string) => {
    setIsDeleting(true)
    try {
      await cancelAppointment(id, reason || 'Cancelada por el usuario')
      onSuccess?.()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to cancel appointment')
      onError?.(err)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    createSession,
    updateSession,
    deleteSession,
    isCreating,
    isUpdating,
    isDeleting,
  }
}
