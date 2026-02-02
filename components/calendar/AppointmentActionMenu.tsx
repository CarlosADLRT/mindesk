/**
 * Appointment Action Menu Component
 * Dropdown menu with quick actions for appointments
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  MoreVertical,
  CheckCircle,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react'

interface AppointmentActionMenuProps {
  appointmentId: string
  status: string
  onComplete: () => void
  onNoShow: () => void
  onReschedule: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function AppointmentActionMenu({
  appointmentId,
  status,
  onComplete,
  onNoShow,
  onReschedule,
  onCancel,
  isLoading = false,
}: AppointmentActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Only mount portal on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  const handleToggle = (e: React.MouseEvent) => {
    console.log('🔵 handleToggle called, current isOpen:', isOpen)
    console.log('🔵 status:', status)
    e.preventDefault()
    e.stopPropagation()

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 192 // w-48

      // Calculate position, ensuring menu stays within viewport
      let left = rect.right - menuWidth
      if (left < 8) left = 8
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8
      }

      const newPos = {
        top: rect.bottom + 4,
        left,
      }
      console.log('🔵 Setting menu position:', newPos)
      setMenuPosition(newPos)
    }

    console.log('🔵 Setting isOpen to:', !isOpen)
    setIsOpen(!isOpen)
  }

  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(false)
    action()
  }

  // Status checks
  const isScheduled = status === 'scheduled'
  const isCompleted = status === 'completed'
  const isCanceled = status === 'canceled'
  const isNoShow = status === 'no_show'

  // Don't show menu for canceled appointments
  if (isCanceled) {
    console.log('🔴 Menu hidden - status is canceled')
    return null
  }

  console.log('🟢 Rendering AppointmentActionMenu, isOpen:', isOpen, 'mounted:', mounted, 'status:', status)

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed w-48 bg-white rounded-lg shadow-2xl border border-gray-200 py-1"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        zIndex: 99999,
      }}
      role="menu"
      aria-orientation="vertical"
      onClick={(e) => e.stopPropagation()}
    >
      {isScheduled && (
        <>
          <button
            onClick={handleAction(onComplete)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            role="menuitem"
          >
            <CheckCircle size={16} className="text-green-600" />
            <span>Marcar completada</span>
          </button>

          <button
            onClick={handleAction(onNoShow)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            role="menuitem"
          >
            <AlertCircle size={16} className="text-amber-600" />
            <span>No asistió</span>
          </button>

          <button
            onClick={handleAction(onReschedule)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            role="menuitem"
          >
            <Calendar size={16} className="text-blue-600" />
            <span>Reprogramar</span>
          </button>

          <div className="my-1 border-t border-gray-100" />

          <button
            onClick={handleAction(onCancel)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
            role="menuitem"
          >
            <X size={16} />
            <span>Cancelar cita</span>
          </button>
        </>
      )}

      {isCompleted && (
        <button
          onClick={handleAction(onReschedule)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
          role="menuitem"
        >
          <Calendar size={16} className="text-blue-600" />
          <span>Agendar nueva cita</span>
        </button>
      )}

      {isNoShow && (
        <>
          <button
            onClick={handleAction(onComplete)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            role="menuitem"
          >
            <CheckCircle size={16} className="text-green-600" />
            <span>Marcar completada</span>
          </button>

          <button
            onClick={handleAction(onReschedule)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            role="menuitem"
          >
            <Calendar size={16} className="text-blue-600" />
            <span>Reprogramar</span>
          </button>
        </>
      )}
    </div>
  )

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={isLoading}
        type="button"
        className={`
          p-2 rounded-full transition-colors
          ${isOpen ? 'bg-gray-300' : 'bg-gray-100 hover:bg-gray-200'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label="Opciones de cita"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical size={18} className="text-gray-700" />
      </button>

      {isOpen && mounted && createPortal(menuContent, document.body)}
    </div>
  )
}
