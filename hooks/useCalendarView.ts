/**
 * useCalendarView Hook
 * Manages calendar view state (month/week/day) and navigation
 */

'use client'

import { useState, useCallback, RefObject } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import type FullCalendar from '@fullcalendar/react'

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

export function useCalendarView(calendarRef: RefObject<FullCalendar>) {
  const [currentView, setCurrentView] = useState<CalendarView>('timeGridWeek')
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs())

  const changeView = useCallback(
    (view: CalendarView) => {
      const calendar = calendarRef.current?.getApi()
      if (calendar) {
        calendar.changeView(view)
        setCurrentView(view)
      }
    },
    [calendarRef]
  )

  const goToDate = useCallback(
    (date: Date | Dayjs) => {
      const calendar = calendarRef.current?.getApi()
      if (calendar) {
        const jsDate = dayjs.isDayjs(date) ? date.toDate() : date
        calendar.gotoDate(jsDate)
        setCurrentDate(dayjs(jsDate))
      }
    },
    [calendarRef]
  )

  const goToToday = useCallback(() => {
    const calendar = calendarRef.current?.getApi()
    if (calendar) {
      calendar.today()
      setCurrentDate(dayjs())
    }
  }, [calendarRef])

  const navigatePrev = useCallback(() => {
    const calendar = calendarRef.current?.getApi()
    if (calendar) {
      calendar.prev()
      setCurrentDate(dayjs(calendar.getDate()))
    }
  }, [calendarRef])

  const navigateNext = useCallback(() => {
    const calendar = calendarRef.current?.getApi()
    if (calendar) {
      calendar.next()
      setCurrentDate(dayjs(calendar.getDate()))
    }
  }, [calendarRef])

  return {
    currentView,
    currentDate,
    setView: changeView,
    goToDate,
    goToToday,
    navigatePrev,
    navigateNext,
  }
}
