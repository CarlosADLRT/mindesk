/**
 * Agenda View Component
 * Custom agenda view with calendar sidebar and time-slot schedule
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, Video, Building2, Coffee, Plus } from 'lucide-react'
import { useCalendarData } from '@/hooks/useCalendarData'
import { useSessionMutations } from '@/hooks/useSessionMutations'
import { useAuth } from '@/contexts/AuthContext'
import { SessionSheet } from './SessionSheet'
import type { Tables } from '@/lib/database.types'

type Appointment = Tables<'appointments'> & {
  client: {
    id: string
    first_name: string
    last_name: string
    phone: string | null
  } | null
}

interface AgendaViewProps {
  workspaceId: string
}

type ViewType = 'day' | 'week' | 'month'

export function AgendaView({ workspaceId }: AgendaViewProps) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [viewType, setViewType] = useState<ViewType>('day')
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [prefilledData, setPrefilledData] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(dayjs())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch appointments for the selected date
  const startDate = selectedDate.startOf('day').toDate()
  const endDate = selectedDate.endOf('day').toDate()

  const { events, isLoading, refetch } = useCalendarData({
    workspaceId,
    startDate,
    endDate,
  })

  const { createSession, updateSession, deleteSession } = useSessionMutations({
    workspaceId,
    onSuccess: () => refetch(),
  })

  // Filter appointments for selected date
  const dayAppointments = useMemo(() => {
    return events.filter((apt: Appointment) => {
      const aptDate = dayjs(apt.start_time)
      return aptDate.isSame(selectedDate, 'day')
    })
  }, [events, selectedDate])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = currentMonth.startOf('month').startOf('week')
    const end = currentMonth.endOf('month').endOf('week')
    const days = []
    let day = start
    while (day.isBefore(end) || day.isSame(end, 'day')) {
      days.push(day)
      day = day.add(1, 'day')
    }
    return days
  }, [currentMonth])

  // Generate time slots (8 AM to 8 PM)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(dayjs().hour(hour).minute(0).second(0))
    }
    return slots
  }, [])

  // Get session status display
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-500' }
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-700', borderColor: 'border-green-500' }
      case 'canceled':
        return { label: 'Canceled', color: 'bg-red-100 text-red-700', borderColor: 'border-red-500' }
      case 'no_show':
        return { label: 'No Show', color: 'bg-amber-100 text-amber-700', borderColor: 'border-amber-500' }
      default:
        return { label: 'Pending', color: 'bg-orange-100 text-orange-700', borderColor: 'border-orange-500' }
    }
  }

  // Check if appointment is virtual
  const isVirtual = (location: string | null) => {
    if (!location) return false
    return location.toLowerCase().includes('virtual') || location.toLowerCase().includes('online')
  }

  // Get appointment position and height
  const getAppointmentStyle = (apt: Appointment) => {
    const start = dayjs(apt.start_time)
    const end = dayjs(apt.end_time)
    const startMinutes = start.hour() * 60 + start.minute()
    const endMinutes = end.hour() * 60 + end.minute()
    const duration = endMinutes - startMinutes
    
    // Position from 8 AM (480 minutes)
    const top = ((startMinutes - 480) / 60) * 80 // 80px per hour
    const height = (duration / 60) * 80

    return {
      top: `${top}px`,
      height: `${height}px`,
    }
  }

  // Get current time position
  const getCurrentTimePosition = () => {
    if (!currentTime.isSame(selectedDate, 'day')) return null
    
    const minutes = currentTime.hour() * 60 + currentTime.minute()
    const top = ((minutes - 480) / 60) * 80 // 80px per hour from 8 AM
    
    return {
      top: `${top}px`,
    }
  }

  const handleNewSession = () => {
    const start = selectedDate.hour(9).minute(0).toDate()
    const end = selectedDate.hour(9).minute(50).toDate()
    setPrefilledData({ start, end })
    setSheetMode('create')
  }

  const handleAppointmentClick = (apt: Appointment) => {
    setSelectedEvent({
      id: apt.id,
      start: apt.start_time,
      end: apt.end_time,
      extendedProps: {
        clientId: apt.client_id,
        status: apt.status,
        title: apt.title,
        location: apt.location,
        description: apt.description,
      },
    })
    setSheetMode('edit')
  }

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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => prev.add(direction === 'next' ? 1 : -1, 'month'))
  }

  const goToToday = () => {
    const today = dayjs()
    setSelectedDate(today)
    setCurrentMonth(today)
  }

  const formatDateHeader = () => {
    return selectedDate.format('dddd, MMMM D')
  }

  const currentTimePosition = getCurrentTimePosition()

  return (
    <div className="h-full bg-white">
      {/* Main Content */}
      <div className="flex" style={{ height: '100%' }}>
        {/* Left Sidebar - Calendar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {currentMonth.format('MMMM YYYY')}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-200 rounded transition"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-200 rounded transition"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="mb-6">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div
                  key={idx}
                  className="text-center text-xs font-semibold text-gray-500 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const isSelected = day.isSame(selectedDate, 'day')
                const isToday = day.isSame(dayjs(), 'day')
                const isCurrentMonth = day.isSame(currentMonth, 'month')

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      aspect-square rounded-lg text-sm font-medium transition
                      ${isSelected
                        ? 'bg-blue-600 text-white'
                        : isToday
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : isCurrentMonth
                        ? 'text-gray-900 hover:bg-gray-200'
                        : 'text-gray-400 hover:bg-gray-100'
                      }
                    `}
                  >
                    {day.date()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as ViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => setViewType(view)}
                className={`
                  flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition
                  ${viewType === view
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                `}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel - Agenda */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-8">
            {/* Date Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {formatDateHeader()}
              </h1>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {dayAppointments.length} Sessions Scheduled
                </span>
              </div>
            </div>

            {/* Time Slots and Appointments */}
            <div className="relative">
              {/* Time slots */}
              <div className="relative">
                {timeSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex border-b border-gray-100"
                    style={{ minHeight: '80px' }}
                  >
                    <div className="w-24 text-sm text-gray-500 py-2">
                      {slot.format('hh:mm A')}
                    </div>
                    <div className="flex-1 relative">
                      {/* Appointment cards - render all appointments, positioned absolutely */}
                      {idx === 0 && dayAppointments.map((apt: Appointment) => {
                          const statusInfo = getStatusInfo(apt.status)
                          const virtual = isVirtual(apt.location)
                          const style = getAppointmentStyle(apt)
                          const clientName = apt.client
                            ? `${apt.client.first_name} ${apt.client.last_name}`
                            : 'Sin cliente'

                          return (
                            <div
                              key={apt.id}
                              onClick={() => handleAppointmentClick(apt)}
                              className={`
                                absolute left-0 right-4 rounded-lg shadow-sm cursor-pointer
                                hover:shadow-md transition-shadow
                                ${statusInfo.borderColor} border-l-4
                              `}
                              style={style}
                            >
                              <div className="p-3 bg-white rounded-lg h-full flex items-start gap-3">
                                <div
                                  className={`
                                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                    ${virtual ? 'bg-blue-100' : 'bg-purple-100'}
                                  `}
                                >
                                  {virtual ? (
                                    <Video size={16} className="text-blue-600" />
                                  ) : (
                                    <Building2 size={16} className="text-purple-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-gray-900 truncate">
                                        {clientName}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {dayjs(apt.start_time).format('hh:mm')} - {dayjs(apt.end_time).format('hh:mm')}
                                      </p>
                                    </div>
                                    <span
                                      className={`
                                        px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                                        ${statusInfo.color}
                                      `}
                                    >
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    {virtual ? 'Virtual Session' : 'In-person Session'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}

                      {/* Lunch Break (if needed - can be added as a special appointment) */}
                      {slot.hour() === 12 && slot.minute() === 0 && (
                        <div className="absolute left-0 right-4 top-0" style={{ height: '80px' }}>
                          <div className="p-3 bg-gray-50 rounded-lg h-full flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <Coffee size={16} className="text-gray-500" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Lunch Break</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Time Indicator */}
              {currentTimePosition && (
                <div
                  className="absolute left-24 right-4 z-30 pointer-events-none"
                  style={currentTimePosition}
                >
                  <div className="relative">
                    <div className="h-0.5 bg-red-500 w-full" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                      {currentTime.format('hh:mm A')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleNewSession}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition hover:scale-110 z-50"
      >
        <Plus size={24} />
      </button>

      {/* Session Sheet */}
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
