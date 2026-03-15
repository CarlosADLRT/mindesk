/**
 * Appointment Status Transition Logic
 * Pure functions for validating and determining allowed status changes
 */

export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled' | 'no_show'

/**
 * Transition rules map
 */
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['completed', 'canceled', 'no_show'],
  completed: [], // Terminal state
  canceled: [], // Terminal state
  no_show: [], // Terminal state
}

/**
 * Get allowed next statuses for a given current status
 */
export function getAllowedTransitions(currentStatus: AppointmentStatus): AppointmentStatus[] {
  return TRANSITIONS[currentStatus] || []
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean {
  // Same status is always allowed (no-op)
  if (currentStatus === newStatus) {
    return true
  }

  return TRANSITIONS[currentStatus]?.includes(newStatus) ?? false
}

/**
 * Check if a status is terminal (cannot transition further)
 */
export function isTerminalStatus(status: AppointmentStatus): boolean {
  return TRANSITIONS[status].length === 0
}

/**
 * Get user-friendly label for status
 */
export function getStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    scheduled: 'Programada',
    completed: 'Realizada',
    canceled: 'Cancelada',
    no_show: 'No Asistió',
  }
  return labels[status]
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: AppointmentStatus): {
  bg: string
  text: string
  border: string
} {
  const colors: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
    scheduled: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    completed: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    },
    canceled: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    no_show: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
  }
  return colors[status]
}
