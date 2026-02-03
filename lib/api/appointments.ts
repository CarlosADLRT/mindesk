/**
 * Appointment API Functions
 * CRUD operations for appointments and sessions
 */

import { supabase } from '../supabase'
import type { TablesInsert, TablesUpdate } from '../supabase'

/**
 * Create a new appointment
 */
export async function createAppointment(
  data: Omit<TablesInsert<'appointments'>, 'created_by'>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    // @ts-ignore - Supabase generated types issue with insert
    .insert({
      ...data,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return appointment
}

/**
 * Get upcoming appointments for a workspace or provider
 */
export async function getUpcomingAppointments(
  workspaceId: string,
  providerId?: string
) {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      client:clients (
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      provider:profiles!appointments_provider_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'scheduled')
    .is('deleted_at', null)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })

  if (providerId) {
    query = query.eq('provider_id', providerId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

/**
 * Get appointments for a date range
 */
export async function getAppointmentsByDateRange(
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  providerId?: string
) {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      client:clients (
        id,
        first_name,
        last_name,
        phone
      ),
      session_notes (
        id
      )
    `)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true })

  if (providerId) {
    query = query.eq('provider_id', providerId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

/**
 * Get a single appointment by ID
 */
export async function getAppointment(appointmentId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients (*),
      provider:profiles!appointments_provider_id_fkey (*),
      session_notes (*),
      package_purchase:package_purchases (
        id,
        sessions_remaining
      )
    `)
    .eq('id', appointmentId)
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Update an appointment
 */
export async function updateAppointment(
  appointmentId: string,
  updates: TablesUpdate<'appointments'>
) {
  const { data, error } = await supabase
    .from('appointments')
    // @ts-ignore - Supabase generated types issue with update
    .update(updates)
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  reason?: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('appointments')
    // @ts-ignore - Supabase generated types issue with update
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      canceled_by: user.id,
      cancellation_reason: reason,
    })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Mark appointment as completed
 */
export async function completeAppointment(appointmentId: string) {
  const { data, error } = await supabase
    .from('appointments')
    // @ts-ignore - Supabase generated types issue with update
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Mark appointment as no-show
 */
export async function markAsNoShow(appointmentId: string) {
  const { data, error } = await supabase
    .from('appointments')
    // @ts-ignore - Supabase generated types issue with update
    .update({
      status: 'no_show',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Reschedule appointment (cancel old + create new)
 */
export async function rescheduleAppointment(
  appointmentId: string,
  newStartTime: Date,
  newEndTime: Date
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get original appointment data
  // @ts-ignore - Supabase generated types issue with select
  const { data: original, error: fetchError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single()

  if (fetchError || !original) {
    throw fetchError || new Error('Appointment not found')
  }

  // Cancel the original appointment
  const { error: cancelError } = await supabase
    .from('appointments')
    // @ts-ignore - Supabase generated types issue with update
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      canceled_by: user.id,
      cancellation_reason: 'Reagendada',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)

  if (cancelError) {
    throw cancelError
  }

  // Cast original to any to avoid type issues with Supabase generated types
  const orig = original as any
  const appointmentData = {
    workspace_id: orig.workspace_id,
    client_id: orig.client_id,
    provider_id: orig.provider_id,
    start_time: newStartTime.toISOString(),
    end_time: newEndTime.toISOString(),
    timezone: orig.timezone,
    title: orig.title,
    description: orig.description,
    location: orig.location,
    package_purchase_id: orig.package_purchase_id,
    is_billable: orig.is_billable,
    status: 'scheduled' as const,
    created_by: user.id,
  }

  // Create new appointment with the new times
  const { data: newAppointment, error: createError } = await supabase
    .from('appointments')
    // @ts-ignore - Supabase generated types issue with insert
    .insert(appointmentData)
    .select()
    .single()

  if (createError) {
    throw createError
  }

  return newAppointment
}

/**
 * Get pending appointments (scheduled or no_show) excluding today
 */
export async function getPendingAppointments(workspaceId: string) {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients (
        id,
        first_name,
        last_name,
        phone,
        email
      )
    `)
    .eq('workspace_id', workspaceId)
    .in('status', ['scheduled'])
    .is('deleted_at', null)
    .or(`start_time.lt.${startOfDay},start_time.gte.${endOfDay}`)
    .order('start_time', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

/**
 * Check if a time slot is available for a provider
 */
export async function checkTimeSlotAvailability(
  providerId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
) {
  // @ts-ignore - Supabase generated types issue with rpc
  const { data, error } = await supabase.rpc('is_time_slot_available', {
    provider_uuid: providerId,
    slot_start: startTime.toISOString(),
    slot_end: endTime.toISOString(),
    exclude_appointment_id: excludeAppointmentId,
  })

  if (error) {
    throw error
  }

  return data as boolean
}

/**
 * Create or update session notes
 */
export async function saveSessionNote(
  appointmentId: string,
  data: Omit<TablesInsert<'session_notes'>, 'appointment_id' | 'provider_id'>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if note already exists
  const { data: existing } = await supabase
    .from('session_notes')
    .select('id')
    .eq('appointment_id', appointmentId)
    .single()

  if (existing) {
    // Update existing note
    const { data: updated, error } = await supabase
      .from('session_notes')
      // @ts-ignore - Supabase generated types issue with update
      .update(data)
      .eq('appointment_id', appointmentId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return updated
  } else {
    // Create new note
    const { data: created, error } = await supabase
      .from('session_notes')
      // @ts-ignore - Supabase generated types issue with insert
      .insert({
        ...data,
        appointment_id: appointmentId,
        provider_id: user.id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return created
  }
}

/**
 * Get session notes for a client
 */
export async function getClientSessionNotes(clientId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('session_notes')
    .select(`
      *,
      appointment:appointments (
        start_time,
        end_time
      )
    `)
    .eq('client_id', clientId)
    .eq('provider_id', user.id) // Only provider can see their notes
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}
