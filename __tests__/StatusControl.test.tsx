/**
 * StatusControl Component Test Suite
 * Tests for status update UI behavior
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StatusControl } from '../components/calendar/StatusControl'

describe('StatusControl Component', () => {
  const mockOnStatusChange = jest.fn()
  const defaultProps = {
    appointmentId: 'test-id',
    currentStatus: 'scheduled' as const,
    onStatusChange: mockOnStatusChange,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should display current status', () => {
      render(<StatusControl {...defaultProps} />)
      expect(screen.getByText('Programada')).toBeInTheDocument()
    })

    it('should show allowed transitions for scheduled status', () => {
      render(<StatusControl {...defaultProps} />)
      expect(screen.getByText('Realizada')).toBeInTheDocument()
      expect(screen.getByText('Cancelada')).toBeInTheDocument()
      expect(screen.getByText('No Asistió')).toBeInTheDocument()
    })

    it('should not show transition buttons for terminal status', () => {
      render(<StatusControl {...defaultProps} currentStatus="completed" />)
      expect(screen.queryByText('Programada')).not.toBeInTheDocument()
      expect(screen.queryByText('Cancelada')).not.toBeInTheDocument()
      expect(screen.getByText('(Estado final)')).toBeInTheDocument()
    })

    it('should show help text for terminal states', () => {
      render(<StatusControl {...defaultProps} currentStatus="completed" />)
      expect(
        screen.getByText(/Este estado no puede ser modificado/i)
      ).toBeInTheDocument()
    })
  })

  describe('Status Transitions', () => {
    it('should call onStatusChange when clicking completed button', async () => {
      mockOnStatusChange.mockResolvedValue(undefined)
      render(<StatusControl {...defaultProps} />)

      const completedButton = screen.getByText('Realizada')
      fireEvent.click(completedButton)

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith('completed', undefined)
      })
    })

    it('should call onStatusChange when clicking no_show button', async () => {
      mockOnStatusChange.mockResolvedValue(undefined)
      render(<StatusControl {...defaultProps} />)

      const noShowButton = screen.getByText('No Asistió')
      fireEvent.click(noShowButton)

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith('no_show', undefined)
      })
    })

    it('should show cancelation reason input when clicking canceled', () => {
      render(<StatusControl {...defaultProps} />)

      const cancelButton = screen.getByText('Cancelada')
      fireEvent.click(cancelButton)

      expect(screen.getByPlaceholderText(/Cliente solicitó/i)).toBeInTheDocument()
      expect(screen.getByText('Confirmar Cancelación')).toBeInTheDocument()
    })

    it('should require cancellation reason', async () => {
      render(<StatusControl {...defaultProps} />)

      const cancelButton = screen.getByText('Cancelada')
      fireEvent.click(cancelButton)

      const confirmButton = screen.getByText('Confirmar Cancelación')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(
          screen.getByText(/Por favor ingrese un motivo/i)
        ).toBeInTheDocument()
      })
      expect(mockOnStatusChange).not.toHaveBeenCalled()
    })

    it('should submit cancellation with reason', async () => {
      mockOnStatusChange.mockResolvedValue(undefined)
      render(<StatusControl {...defaultProps} />)

      const cancelButton = screen.getByText('Cancelada')
      fireEvent.click(cancelButton)

      const reasonInput = screen.getByPlaceholderText(/Cliente solicitó/i)
      fireEvent.change(reasonInput, { target: { value: 'Emergencia' } })

      const confirmButton = screen.getByText('Confirmar Cancelación')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith('canceled', {
          cancellationReason: 'Emergencia',
        })
      })
    })

    it('should allow canceling the cancellation form', () => {
      render(<StatusControl {...defaultProps} />)

      const cancelButton = screen.getByText('Cancelada')
      fireEvent.click(cancelButton)

      expect(screen.getByText('Confirmar Cancelación')).toBeInTheDocument()

      const backButton = screen.getByText('Volver')
      fireEvent.click(backButton)

      expect(screen.queryByText('Confirmar Cancelación')).not.toBeInTheDocument()
      expect(screen.getByText('Cancelada')).toBeInTheDocument()
    })
  })

  describe('Loading and Disabled States', () => {
    it('should disable buttons when isUpdating is true', () => {
      render(<StatusControl {...defaultProps} isUpdating={true} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        if (button.textContent?.includes('Realizada')) {
          expect(button).toBeDisabled()
        }
      })
    })

    it('should disable buttons when disabled prop is true', () => {
      render(<StatusControl {...defaultProps} disabled={true} />)

      const completedButton = screen.getByText('Realizada')
      fireEvent.click(completedButton)

      expect(mockOnStatusChange).not.toHaveBeenCalled()
    })

    it('should show loading state during update', () => {
      render(<StatusControl {...defaultProps} isUpdating={true} />)
      // Loader icon should be present in the button
      const buttons = screen.getAllByRole('button')
      const hasLoader = buttons.some((btn) => btn.querySelector('svg.animate-spin'))
      expect(hasLoader).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should display error message on failed status change', async () => {
      const error = new Error('Network error')
      mockOnStatusChange.mockRejectedValue(error)

      render(<StatusControl {...defaultProps} />)

      const completedButton = screen.getByText('Realizada')
      fireEvent.click(completedButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should clear error when attempting new transition', async () => {
      const error = new Error('First error')
      mockOnStatusChange
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined)

      render(<StatusControl {...defaultProps} />)

      const completedButton = screen.getByText('Realizada')
      fireEvent.click(completedButton)

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument()
      })

      const noShowButton = screen.getByText('No Asistió')
      fireEvent.click(noShowButton)

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument()
      })
    })
  })
})
