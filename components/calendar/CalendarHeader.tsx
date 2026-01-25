/**
 * Calendar Header Component
 * Sticky header with navigation and view switcher
 */

'use client'

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/es'
import type { CalendarView } from '@/hooks/useCalendarView'

dayjs.locale('es')

interface CalendarHeaderProps {
  currentDate: Dayjs
  currentView: CalendarView
  onViewChange: (view: CalendarView) => void
  onToday: () => void
  onPrev: () => void
  onNext: () => void
  onNewSession?: () => void
}

export function CalendarHeader({
  currentDate,
  currentView,
  onViewChange,
  onToday,
  onPrev,
  onNext,
  onNewSession,
}: CalendarHeaderProps) {
  const getDateLabel = () => {
    if (currentView === 'dayGridMonth') {
      return currentDate.format('MMMM YYYY')
    } else if (currentView === 'timeGridWeek') {
      const start = currentDate.startOf('week')
      const end = currentDate.endOf('week')
      if (start.month() === end.month()) {
        return `${start.format('D')} - ${end.format('D')} ${start.format('MMMM YYYY')}`
      }
      return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`
    } else {
      return currentDate.format('dddd, D [de] MMMM YYYY')
    }
  }

  const viewButtons: { view: CalendarView; label: string }[] = [
    { view: 'dayGridMonth', label: 'Mes' },
    { view: 'timeGridWeek', label: 'Semana' },
    { view: 'timeGridDay', label: 'Día' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Top row: Today + Date + Nav */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-semibold text-primary bg-secondary rounded-lg active:scale-95 transition-transform hover:bg-secondary"
        >
          Hoy
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-bold text-gray-900 min-w-[200px] sm:min-w-[280px] text-center capitalize">
            {getDateLabel()}
          </h2>

          <button
            onClick={onNext}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {onNewSession && (
          <button
            onClick={onNewSession}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Sesión</span>
          </button>
        )}
      </div>

      {/* Bottom row: View switcher (segmented control) */}
      <div className="flex p-1.5 mx-4 mb-3 bg-gray-100 rounded-xl">
        {viewButtons.map(({ view, label }) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              currentView === view
                ? 'text-white bg-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  )
}
