/**
 * Client API Functions
 * CRUD operations for clients/patients
 */

import { supabase } from '../supabase'
import type { TablesInsert, TablesUpdate } from '../supabase'

/**
 * Create a new client
 */
export async function createClient(
  data: Omit<TablesInsert<'clients'>, 'created_by'>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: client, error } = await supabase
    .from('clients')
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

  return client
}

/**
 * Get all clients for a workspace
 */
export async function getClients(workspaceId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

/**
 * Get a single client by ID with stats
 */
export async function getClient(clientId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      appointments (
        id,
        start_time,
        status
      ),
      package_purchases (
        id,
        sessions_remaining,
        expires_at
      )
    `)
    .eq('id', clientId)
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Update a client
 */
export async function updateClient(
  clientId: string,
  updates: TablesUpdate<'clients'>
) {
  const { data, error } = await supabase
    .from('clients')
    // @ts-ignore - Supabase generated types issue with update
    .update(updates)
    .eq('id', clientId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Soft delete a client
 */
export async function deleteClient(clientId: string) {
  const { error } = await supabase
    .from('clients')
    // @ts-ignore - Supabase generated types issue with update
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', clientId)

  if (error) {
    throw error
  }
}

/**
 * Search clients by name, email, or phone
 */
export async function searchClients(workspaceId: string, query: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('last_name', { ascending: true })
    .limit(20)

  if (error) {
    throw error
  }

  return data
}
