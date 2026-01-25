/**
 * useCalendarData Hook
 * Fetches appointments for calendar display
 */

'use client'

import { useState, useEffect } from 'react'
import { getAppointmentsByDateRange } from '@/lib/api/appointments'

interface UseCalendarDataProps {
  workspaceId: string
  startDate: Date
  endDate: Date
  enabled?: boolean
}

export function useCalendarData({
  workspaceId,
  startDate,
  endDate,
  enabled = true,
}: UseCalendarDataProps) {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    if (!enabled || !workspaceId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const appointments = await getAppointmentsByDateRange(
        workspaceId,
        startDate,
        endDate
      )
      setEvents(appointments)
    } catch (err) {
      console.error('Error fetching calendar data:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch appointments'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [workspaceId, startDate.toISOString(), endDate.toISOString(), enabled])

  return {
    events,
    isLoading,
    error,
    refetch: fetchData,
  }
}
