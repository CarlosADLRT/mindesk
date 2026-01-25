'use client'

import React, { useMemo } from 'react'
import { Session, SessionStatus } from '../types'
import {
  FileText,
  UserPlus,
  Video,
  Phone,
  MessageCircle,
  MoreVertical,
  CalendarPlus
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

interface DashboardProps {
  sessions: (Session & { location?: string; title?: string })[]
  todaysSessions: (Session & { location?: string; title?: string })[]
  onNewClient?: () => void
  onNewSession?: () => void
}

export const DashboardView: React.FC<DashboardProps> = ({
  sessions,
  todaysSessions,
  onNewClient,
  onNewSession
}) => {
  const { profile } = useAuth()

  // Get user's first name
  const firstName = profile?.full_name?.split(' ')[0] || 'Usuario'

  // Get today's date formatted
  const today = dayjs()
  const formattedDate = today.format('dddd, D [de] MMMM')

  // Get next session (first upcoming session)
  const nextSession = useMemo(() => {
    const now = new Date()
    return todaysSessions
      .filter(s => new Date(s.date) > now && s.status === SessionStatus.SCHEDULED)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  }, [todaysSessions])

  // Calculate time until next session
  const getTimeUntilNextSession = (sessionDate: Date) => {
    const now = new Date()
    const diff = sessionDate.getTime() - now.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `EN ${hours} HORA${hours > 1 ? 'S' : ''}`
    } else if (minutes > 0) {
      return `EN ${minutes} MINUTO${minutes > 1 ? 'S' : ''}`
    }
    return 'AHORA'
  }

  // Get completed sessions count
  const completedCount = todaysSessions.filter(s => s.status === SessionStatus.COMPLETED).length
  const totalCount = todaysSessions.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Get session status badge info
  const getSessionStatusInfo = (session: Session) => {
    const now = new Date()
    const sessionDate = new Date(session.date)
    const isNext = nextSession?.id === session.id
    const isPast = sessionDate < now

    if (session.status === SessionStatus.COMPLETED) {
      return {
        label: 'COMPLETADO',
        bgColor: 'bg-green-500',
        textColor: 'text-white',
        barColor: 'bg-green-500'
      }
    } else if (isNext) {
      return {
        label: 'SIGUIENTE',
        bgColor: 'bg-blue-500',
        textColor: 'text-white',
        barColor: 'bg-blue-500'
      }
    } else {
      return {
        label: 'PENDIENTE',
        bgColor: 'bg-gray-200',
        textColor: 'text-gray-700',
        barColor: 'bg-gray-400'
      }
    }
  }

  // Determine session type and location
  const getSessionType = (session: Session & { location?: string; title?: string }) => {
    const location = session.location || ''
    const isVirtual = location.toLowerCase().includes('virtual') || 
                      location.toLowerCase().includes('zoom') ||
                      location.toLowerCase().includes('meet') ||
                      location === ''
    
    return {
      type: isVirtual ? 'Virtual' : 'Presencial',
      location: isVirtual ? (location || 'Zoom') : (location || 'Sala A')
    }
  }

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      {/* Greeting Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Buenos días, {firstName}
        </h1>
        <p className="text-gray-600 text-lg">
          Hoy es {formattedDate}. Tienes {totalCount} {totalCount === 1 ? 'sesión' : 'sesiones'} programada{totalCount !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={onNewSession}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <CalendarPlus className="w-5 h-5" />
          Nueva Sesión
        </button>
        <button
          onClick={onNewClient}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Paciente
        </button>
      </div>

      {/* Next Session Card */}
      {nextSession && (
        <div className="bg-blue-600 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Avatar */}
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {nextSession.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
              </div>

              {/* Session Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-white/90 text-sm font-medium">
                    {getTimeUntilNextSession(new Date(nextSession.date))} ({dayjs(nextSession.date).format('h:mm A')})
                  </span>
                </div>
                <h3 className="text-white text-xl font-bold mb-1">
                  Próxima sesión: {nextSession.patientName}
                </h3>
                <p className="text-white/80 text-sm">
                  {nextSession.title || 'Sesión Individual'} • Sesión 4 de 10
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-50 transition-colors">
                <Video className="w-4 h-4" />
                Comenzar Video
              </button>
              <button className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors">
                <Phone className="w-5 h-5 text-white" />
              </button>
              <button className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors">
                <MessageCircle className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Sessions Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Progress Indicator */}
            {totalCount > 0 && (
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(completionPercentage / 100) * 175.9} 175.9`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900">
                    {completedCount}/{totalCount}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col items-start">
              <h2 className="text-xl font-bold text-gray-900">Sesiones de hoy</h2>
              {totalCount > 0 && (
                <p className="text-xs text-gray-600">
                  Has completado el {completionPercentage}% de tu agenda de hoy
                </p>
              )}
            </div>
          </div>
          <button className="text-blue-600 font-semibold hover:text-blue-700 text-sm">
            Ver horario completo
          </button>
        </div>

        {/* Sessions List */}
        <div className="space-y-0">
          {todaysSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No hay sesiones programadas para hoy</p>
            </div>
          ) : (
            <>
              {todaysSessions.map((session, index) => {
                const statusInfo = getSessionStatusInfo(session)
                const sessionType = getSessionType(session as Session & { location?: string; title?: string })
                const sessionDate = new Date(session.date)

                return (
                  <div key={session.id}>
                    <div className="flex items-center gap-4 py-4 hover:bg-gray-50 transition-colors">
                      {/* Time */}
                      <div className="w-20 flex-shrink-0">
                        <span className="text-sm font-medium text-gray-700">
                          {dayjs(sessionDate).format('h:mm A')}
                        </span>
                      </div>

                      {/* Status Bar */}
                      <div className={`w-1 h-12 rounded-full ${statusInfo.barColor}`}></div>

                      {/* Session Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">
                          {session.patientName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {sessionType.type} • {sessionType.location}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {statusInfo.label}
                      </div>

                      {/* Options Menu */}
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    {index < todaysSessions.length - 1 && (
                      <div className="border-t border-gray-200"></div>
                    )}
                  </div>
                )
              })}
              <div className="text-center py-4 text-gray-400 text-sm">
                Fin de la agenda para hoy
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
