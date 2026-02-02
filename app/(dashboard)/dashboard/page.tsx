'use client'

import { useEffect, useState } from 'react'
import { DashboardView } from '@/components/DashboardView'
import { getWorkspaces } from '@/lib/api/workspaces'
import {
  getAppointmentsByDateRange,
  completeAppointment,
  markAsNoShow,
  cancelAppointment,
  rescheduleAppointment,
} from '@/lib/api/appointments'
import type { Session } from '@/types'
import { SessionStatus, PaymentStatus } from '@/types'
import { Loader } from 'lucide-react'
import { CreateClientModal } from '@/components/CreateClientModal'
import { SessionSheet } from '@/components/calendar/SessionSheet'
import { useSessionMutations } from '@/hooks/useSessionMutations'
import { useAuth } from '@/contexts/AuthContext'
import dayjs from 'dayjs'

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [todaysSessions, setTodaysSessions] = useState<(Session & { location?: string; title?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [showClientModal, setShowClientModal] = useState(false)
  const [showSessionSheet, setShowSessionSheet] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rescheduleSession, setRescheduleSession] = useState<(Session & { location?: string; title?: string }) | null>(null)
  const [cancelModal, setCancelModal] = useState<{ id: string; patientName: string } | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Session mutations
  const { createSession } = useSessionMutations({
    workspaceId,
    onSuccess: () => fetchDashboardData(),
  })

  // Handle new session save
  const handleSaveSession = async (data: any) => {
    if (!user) {
      alert('Usuario no autenticado')
      return
    }

    const payload = {
      workspace_id: workspaceId,
      client_id: data.client_id,
      provider_id: user.id,
      start_time: new Date(data.start_time).toISOString(),
      end_time: new Date(data.end_time).toISOString(),
      title: data.title,
      location: data.location,
      description: data.description,
      status: data.status as any,
    }

    await createSession(payload)
    setShowSessionSheet(false)
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const workspaces = await getWorkspaces()
      if (!workspaces.length) {
        setSessions([])
        setTodaysSessions([])
        return
      }

      const wsId = workspaces[0].id
      setWorkspaceId(wsId)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      const appointments = await getAppointmentsByDateRange(
        wsId,
        startDate,
        endDate
      )

      const mappedSessions: Session[] = appointments.map((apt: any) => {
        const start = new Date(apt.start_time)
        const end = new Date(apt.end_time)
        const durationMinutes = Math.max(
          30,
          Math.round((end.getTime() - start.getTime()) / (1000 * 60))
        )

        const statusMap: Record<string, SessionStatus> = {
          scheduled: SessionStatus.SCHEDULED,
          completed: SessionStatus.COMPLETED,
          canceled: SessionStatus.CANCELLED,
          no_show: SessionStatus.NO_SHOW,
        }

        return {
          id: apt.id,
          patientId: apt.client_id,
          patientName: apt.client
            ? `${apt.client.first_name} ${apt.client.last_name}`
            : 'Paciente',
          date: apt.start_time,
          durationMinutes,
          status: statusMap[apt.status] ?? SessionStatus.SCHEDULED,
          paymentStatus: apt.payment_status
            ? (apt.payment_status.toLowerCase() === 'paid'
                ? PaymentStatus.PAID
                : PaymentStatus.PENDING)
            : PaymentStatus.PENDING,
          price: apt.amount ?? 0,
          location: apt.location,
          title: apt.title,
        }
      })

      setSessions(mappedSessions)

      const today = new Date()
      const todaySessions = mappedSessions.filter((session) => {
        const sessionDate = new Date(session.date)
        return (
          sessionDate.getDate() === today.getDate() &&
          sessionDate.getMonth() === today.getMonth() &&
          sessionDate.getFullYear() === today.getFullYear()
        )
      })

      setTodaysSessions(todaySessions)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Action handlers
  const handleComplete = async (sessionId: string) => {
    setActionLoading(sessionId)
    try {
      await completeAppointment(sessionId)
      await fetchDashboardData()
    } catch (error) {
      console.error('Error completing session:', error)
      alert('Error al marcar como completada')
    } finally {
      setActionLoading(null)
    }
  }

  const handleNoShow = async (sessionId: string) => {
    setActionLoading(sessionId)
    try {
      await markAsNoShow(sessionId)
      await fetchDashboardData()
    } catch (error) {
      console.error('Error marking as no-show:', error)
      alert('Error al marcar como no asistió')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReschedule = (session: Session & { location?: string; title?: string }) => {
    setRescheduleSession(session)
  }

  const handleRescheduleSave = async (data: any) => {
    if (!rescheduleSession) return

    setActionLoading(rescheduleSession.id)
    try {
      await rescheduleAppointment(
        rescheduleSession.id,
        new Date(data.start_time),
        new Date(data.end_time)
      )
      await fetchDashboardData()
      setRescheduleSession(null)
    } catch (error) {
      console.error('Error rescheduling session:', error)
      alert('Error al reprogramar la sesión')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelRequest = (sessionId: string, patientName: string) => {
    setCancelModal({ id: sessionId, patientName })
  }

  const handleConfirmCancel = async (reason?: string) => {
    if (!cancelModal) return

    setActionLoading(cancelModal.id)
    try {
      await cancelAppointment(cancelModal.id, reason)
      await fetchDashboardData()
      setCancelModal(null)
    } catch (error) {
      console.error('Error canceling session:', error)
      alert('Error al cancelar la sesión')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <>
      <DashboardView
        sessions={sessions}
        todaysSessions={todaysSessions}
        onNewClient={() => setShowClientModal(true)}
        onNewSession={() => setShowSessionSheet(true)}
        onComplete={handleComplete}
        onNoShow={handleNoShow}
        onReschedule={handleReschedule}
        onCancel={handleCancelRequest}
        actionLoading={actionLoading}
      />

      {/* Client Modal */}
      {showClientModal && (
        <CreateClientModal
          workspaceId={workspaceId}
          onClose={() => setShowClientModal(false)}
          onSuccess={() => {
            setShowClientModal(false)
            fetchDashboardData()
          }}
        />
      )}

      {/* New Session Sheet */}
      {showSessionSheet && (
        <SessionSheet
          mode="create"
          prefilledData={{
            start: dayjs().add(1, 'hour').startOf('hour').toDate(),
            end: dayjs().add(2, 'hour').startOf('hour').toDate(),
          }}
          workspaceId={workspaceId}
          onClose={() => setShowSessionSheet(false)}
          onSave={handleSaveSession}
        />
      )}

      {/* Reschedule Session Sheet */}
      {rescheduleSession && (
        <SessionSheet
          mode="edit"
          isReschedule={true}
          event={{
            id: rescheduleSession.id,
            start: rescheduleSession.date,
            end: dayjs(rescheduleSession.date).add(rescheduleSession.durationMinutes, 'minute').toISOString(),
            extendedProps: {
              clientId: rescheduleSession.patientId,
              title: rescheduleSession.title || 'Sesión Individual',
              location: rescheduleSession.location || 'Consultorio',
            },
          }}
          workspaceId={workspaceId}
          onClose={() => setRescheduleSession(null)}
          onSave={handleRescheduleSave}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <CancelModal
          patientName={cancelModal.patientName}
          isLoading={actionLoading === cancelModal.id}
          onConfirm={handleConfirmCancel}
          onCancel={() => setCancelModal(null)}
        />
      )}
    </>
  )
}

/**
 * Cancel Confirmation Modal Component
 */
function CancelModal({
  patientName,
  isLoading,
  onConfirm,
  onCancel,
}: {
  patientName: string
  isLoading: boolean
  onConfirm: (reason?: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Cancelar sesión
        </h3>
        <p className="text-gray-600 mb-4">
          ¿Estás seguro de que deseas cancelar la sesión con{' '}
          <span className="font-medium text-gray-900">{patientName}</span>?
        </p>

        <div className="mb-6">
          <label
            htmlFor="cancel-reason"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Motivo de cancelación (opcional)
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Escribe el motivo de la cancelación..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition disabled:opacity-50"
          >
            Volver
          </button>
          <button
            onClick={() => onConfirm(reason || undefined)}
            disabled={isLoading}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cancelando...
              </>
            ) : (
              'Cancelar sesión'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
