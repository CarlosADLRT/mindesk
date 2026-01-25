/**
 * Calendar Shell Component
 * Main container with FullCalendar integration
 */

'use client'

import { useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayjs from 'dayjs'
import { Loader } from 'lucide-react'

// FullCalendar interaction types
type DateClickArg = any
type DateSelectArg = any
type EventClickArg = any
type EventDropArg = any
type EventResizeDoneArg = any

import { CALENDAR_CONFIG, getStatusColor } from '@/lib/calendar/config'
import { useCalendarView } from '@/hooks/useCalendarView'
import { useCalendarData } from '@/hooks/useCalendarData'
import { useSessionMutations } from '@/hooks/useSessionMutations'
import { useAuth } from '@/contexts/AuthContext'
import { CalendarHeader } from './CalendarHeader'
import { SessionSheet } from './SessionSheet'

interface CalendarShellProps {
  workspaceId: string
}

export function CalendarShell({ workspaceId }: CalendarShellProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const { user } = useAuth()

  // View state
  const {
    currentView,
    setView,
    currentDate,
    goToDate,
    goToToday,
    navigatePrev,
    navigateNext,
  } = useCalendarView(calendarRef)

  // Data fetching
  const startDate = currentDate.subtract(1, 'month').toDate()
  const endDate = currentDate.add(2, 'month').toDate()

  const { events, isLoading, refetch } = useCalendarData({
    workspaceId,
    startDate,
    endDate,
  })

  // Mutations
  const { createSession, updateSession, deleteSession } = useSessionMutations({
    workspaceId,
    onSuccess: () => refetch(),
  })

  // Sheet state
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [prefilledData, setPrefilledData] = useState<any>(null)

  // Handle manual session creation (from header button)
  const handleNewSession = () => {
    const start = dayjs().add(1, 'hour').startOf('hour').toDate()
    const end = dayjs(start).add(60, 'minutes').toDate()
    setPrefilledData({ start, end })
    setSheetMode('create')
  }

  // FullCalendar event handlers
  const handleDateClick = (info: DateClickArg) => {
    const start = info.date
    const end = dayjs(start).add(60, 'minutes').toDate()

    setPrefilledData({ start, end })
    setSheetMode('create')
  }

  const handleSelect = (info: DateSelectArg) => {
    setPrefilledData({
      start: info.start,
      end: info.end,
    })
    setSheetMode('create')

    // Clear selection
    const api = calendarRef.current?.getApi()
    api?.unselect()
  }

  const handleEventClick = (info: EventClickArg) => {
    setSelectedEvent(info.event)
    setSheetMode('edit')
  }

  const handleEventDrop = async (info: EventDropArg) => {
    const { event } = info

    try {
      await updateSession({
        id: event.id,
        start_time: event.start!.toISOString(),
        end_time: event.end!.toISOString(),
      })
    } catch (error) {
      info.revert()
      alert('Error al mover la sesión')
    }
  }

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const { event } = info

    try {
      await updateSession({
        id: event.id,
        end_time: event.end!.toISOString(),
      })
    } catch (error) {
      info.revert()
      alert('Error al cambiar la duración')
    }
  }

  // Transform appointments to FullCalendar events
  const calendarEvents = events.map((apt) => ({
    id: apt.id,
    title: apt.client
      ? `${apt.client.first_name} ${apt.client.last_name}`
      : 'Sin cliente',
    start: apt.start_time,
    end: apt.end_time,
    backgroundColor: getStatusColor(apt.status),
    borderColor: getStatusColor(apt.status),
    extendedProps: {
      clientId: apt.client_id,
      status: apt.status,
      title: apt.title,
      location: apt.location,
      description: apt.description,
    },
    classNames: [`session-${apt.status}`],
  }))

  const handleSave = async (data: any) => {
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

    if (sheetMode === 'create') {
      await createSession(payload)
    } else if (selectedEvent) {
      await updateSession({
        id: selectedEvent.id,
        ...payload,
      })
    }

    setSheetMode(null)
    setSelectedEvent(null)
    setPrefilledData(null)
  }

  const handleDelete = async () => {
    if (selectedEvent) {
      await deleteSession(selectedEvent.id)
      setSheetMode(null)
      setSelectedEvent(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom header */}
      <CalendarHeader
        currentDate={currentDate}
        currentView={currentView}
        onViewChange={setView}
        onToday={goToToday}
        onPrev={navigatePrev}
        onNext={navigateNext}
        onNewSession={handleNewSession}
      />

      {/* FullCalendar */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="calendar-container bg-white rounded-2xl shadow-sm p-4">
            <FullCalendar
              ref={calendarRef}
              {...CALENDAR_CONFIG}
              initialView={currentView}
              events={calendarEvents}
              dateClick={handleDateClick}
              select={handleSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
            />
          </div>
        )}
      </div>

      {/* Session editor sheet */}
      {sheetMode && (
        <SessionSheet
          mode={sheetMode}
          event={selectedEvent}
          prefilledData={prefilledData}
          workspaceId={workspaceId}
          onClose={() => {
            setSheetMode(null)
            setSelectedEvent(null)
            setPrefilledData(null)
          }}
          onSave={handleSave}
          onDelete={sheetMode === 'edit' ? handleDelete : undefined}
        />
      )}
    </div>
  )
}
