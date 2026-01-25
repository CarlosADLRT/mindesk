/**
 * FullCalendar Configuration
 * Mobile-first calendar settings for healthcare scheduling
 */

import type { CalendarOptions } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export const CALENDAR_CONFIG: Partial<CalendarOptions> = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

  // CRITICAL: Mobile-first settings
  height: 'auto',
  contentHeight: 'auto',
  handleWindowResize: true,
  windowResizeDelay: 100,

  // Locale & timezone (Colombia)
  locale: 'es',
  timeZone: 'America/Bogota',
  firstDay: 1, // Monday

  // Header: FALSE (we build custom Tailwind header)
  headerToolbar: false,

  // Initial view
  initialView: 'timeGridWeek',

  // Time settings
  slotMinTime: '07:00:00',
  slotMaxTime: '21:00:00',
  slotDuration: '00:15:00', // 15-min granularity
  slotLabelInterval: '01:00', // Show hour labels only
  scrollTime: '08:00:00', // Scroll to 8 AM

  // Touch interaction (CRITICAL for mobile)
  selectable: true,
  selectMirror: true,
  selectMinDistance: 10,
  longPressDelay: 500,
  eventLongPressDelay: 500,
  selectLongPressDelay: 500,

  // Event interaction
  editable: true,
  eventStartEditable: true,
  eventDurationEditable: true,
  eventResizableFromStart: false, // Only resize from end (simpler on mobile)
  dragRevertDuration: 300,
  dragScroll: true,

  // Snap behavior
  snapDuration: '00:15:00',

  // Day view settings
  dayMaxEvents: true,
  moreLinkClick: 'day',

  // Week view
  allDaySlot: false, // Sessions are always timed
  nowIndicator: true,

  // Event rendering
  eventDisplay: 'block',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    meridiem: false,
  },

  // Business hours
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    startTime: '08:00',
    endTime: '20:00',
  },

  // Views configuration
  views: {
    dayGridMonth: {
      dayMaxEvents: 3,
      displayEventTime: false,
    },
    timeGridWeek: {
      dayHeaderFormat: { weekday: 'short', day: 'numeric' },
      slotLabelFormat: { hour: 'numeric', minute: '2-digit' },
    },
    timeGridDay: {
      dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric' },
    },
  },
}

export function getAdaptiveConfig(isMobile: boolean): Partial<CalendarOptions> {
  if (isMobile) {
    return {
      slotLabelInterval: '02:00',
      eventMinHeight: 44, // Apple HIG touch target
      dayMaxEvents: 2,
      views: {
        timeGridWeek: {
          dayHeaderFormat: { weekday: 'narrow' },
        },
      },
    }
  }

  return {
    eventMinHeight: 24,
    dayMaxEvents: 5,
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: '#3b82f6', // blue-500
    completed: '#10b981', // emerald-500
    canceled: '#ef4444', // red-500
    no_show: '#f59e0b', // amber-500
  }
  return colors[status] || colors.scheduled
}
