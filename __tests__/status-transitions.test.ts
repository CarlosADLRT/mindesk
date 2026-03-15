/**
 * Status Transitions Test Suite
 * Tests for appointment status transition validation logic
 */

import {
  getAllowedTransitions,
  isValidTransition,
  isTerminalStatus,
  getStatusLabel,
  getStatusColor,
  type AppointmentStatus,
} from '../lib/status-transitions'

describe('Status Transitions', () => {
  describe('getAllowedTransitions', () => {
    it('should return all next states for scheduled', () => {
      const allowed = getAllowedTransitions('scheduled')
      expect(allowed).toEqual(['completed', 'canceled', 'no_show'])
      expect(allowed).toHaveLength(3)
    })

    it('should return empty array for completed (terminal)', () => {
      const allowed = getAllowedTransitions('completed')
      expect(allowed).toEqual([])
    })

    it('should return empty array for canceled (terminal)', () => {
      const allowed = getAllowedTransitions('canceled')
      expect(allowed).toEqual([])
    })

    it('should return empty array for no_show (terminal)', () => {
      const allowed = getAllowedTransitions('no_show')
      expect(allowed).toEqual([])
    })
  })

  describe('isValidTransition', () => {
    describe('from scheduled', () => {
      it('should allow scheduled → completed', () => {
        expect(isValidTransition('scheduled', 'completed')).toBe(true)
      })

      it('should allow scheduled → canceled', () => {
        expect(isValidTransition('scheduled', 'canceled')).toBe(true)
      })

      it('should allow scheduled → no_show', () => {
        expect(isValidTransition('scheduled', 'no_show')).toBe(true)
      })

      it('should allow scheduled → scheduled (no-op)', () => {
        expect(isValidTransition('scheduled', 'scheduled')).toBe(true)
      })
    })

    describe('from terminal states', () => {
      it('should reject completed → scheduled', () => {
        expect(isValidTransition('completed', 'scheduled')).toBe(false)
      })

      it('should reject completed → canceled', () => {
        expect(isValidTransition('completed', 'canceled')).toBe(false)
      })

      it('should reject completed → no_show', () => {
        expect(isValidTransition('completed', 'no_show')).toBe(false)
      })

      it('should allow completed → completed (no-op)', () => {
        expect(isValidTransition('completed', 'completed')).toBe(true)
      })

      it('should reject canceled → scheduled', () => {
        expect(isValidTransition('canceled', 'scheduled')).toBe(false)
      })

      it('should reject canceled → completed', () => {
        expect(isValidTransition('canceled', 'completed')).toBe(false)
      })

      it('should reject no_show → scheduled', () => {
        expect(isValidTransition('no_show', 'scheduled')).toBe(false)
      })

      it('should reject no_show → completed', () => {
        expect(isValidTransition('no_show', 'completed')).toBe(false)
      })
    })
  })

  describe('isTerminalStatus', () => {
    it('should return false for scheduled', () => {
      expect(isTerminalStatus('scheduled')).toBe(false)
    })

    it('should return true for completed', () => {
      expect(isTerminalStatus('completed')).toBe(true)
    })

    it('should return true for canceled', () => {
      expect(isTerminalStatus('canceled')).toBe(true)
    })

    it('should return true for no_show', () => {
      expect(isTerminalStatus('no_show')).toBe(true)
    })
  })

  describe('getStatusLabel', () => {
    it('should return correct Spanish labels', () => {
      expect(getStatusLabel('scheduled')).toBe('Programada')
      expect(getStatusLabel('completed')).toBe('Realizada')
      expect(getStatusLabel('canceled')).toBe('Cancelada')
      expect(getStatusLabel('no_show')).toBe('No Asistió')
    })
  })

  describe('getStatusColor', () => {
    it('should return color scheme for scheduled', () => {
      const colors = getStatusColor('scheduled')
      expect(colors.bg).toBe('bg-blue-50')
      expect(colors.text).toBe('text-blue-700')
      expect(colors.border).toBe('border-blue-200')
    })

    it('should return color scheme for completed', () => {
      const colors = getStatusColor('completed')
      expect(colors.bg).toBe('bg-green-50')
      expect(colors.text).toBe('text-green-700')
      expect(colors.border).toBe('border-green-200')
    })

    it('should return color scheme for canceled', () => {
      const colors = getStatusColor('canceled')
      expect(colors.bg).toBe('bg-red-50')
      expect(colors.text).toBe('text-red-700')
      expect(colors.border).toBe('border-red-200')
    })

    it('should return color scheme for no_show', () => {
      const colors = getStatusColor('no_show')
      expect(colors.bg).toBe('bg-amber-50')
      expect(colors.text).toBe('text-amber-700')
      expect(colors.border).toBe('border-amber-200')
    })
  })
})
