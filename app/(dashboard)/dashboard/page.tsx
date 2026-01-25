'use client'

import { useEffect, useState } from 'react'
import { DashboardView } from '@/components/DashboardView'
import { getWorkspaces } from '@/lib/api/workspaces'
import { getAppointmentsByDateRange } from '@/lib/api/appointments'
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
  const [todaysSessions, setTodaysSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [showClientModal, setShowClientModal] = useState(false)
  const [showSessionSheet, setShowSessionSheet] = useState(false)
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
    </>
  )
}
