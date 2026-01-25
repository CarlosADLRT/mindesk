/**
 * Workspace API Functions
 * CRUD operations for workspaces
 */

import { supabase } from '../supabase'
import type { TablesInsert, TablesUpdate } from '../supabase'

/**
 * Create a new workspace and add the current user as owner
 */
export async function createWorkspace(
  data: Omit<TablesInsert<'workspaces'>, 'created_by'>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Create workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    // @ts-ignore - Supabase generated types issue with insert
    .insert({
      ...data,
      created_by: user.id,
    })
    .select()
    .single() as any

  if (workspaceError || !workspace) {
    throw workspaceError || new Error('Failed to create workspace')
  }

  // Add user as owner in workspace_members
  const { error: memberError } = await supabase
    .from('workspace_members')
    // @ts-ignore - Supabase generated types issue with insert
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    throw memberError
  }

  return workspace
}

/**
 * Get all workspaces for the current user
 */
export async function getWorkspaces(): Promise<any[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner (
        role,
        is_active,
        joined_at
      )
    `)
    .eq('workspace_members.user_id', user.id)
    .eq('workspace_members.is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

/**
 * Get a single workspace by ID
 */
export async function getWorkspace(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members (
        id,
        user_id,
        role,
        is_active,
        joined_at,
        profiles (
          full_name,
          email,
          avatar_url
        )
      )
    `)
    .eq('id', workspaceId)
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Update a workspace
 */
export async function updateWorkspace(
  workspaceId: string,
  updates: TablesUpdate<'workspaces'>
) {
  const { data, error } = await supabase
    .from('workspaces')
    // @ts-ignore - Supabase generated types issue with update
    .update(updates)
    .eq('id', workspaceId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Soft delete a workspace
 */
export async function deleteWorkspace(workspaceId: string) {
  const { error } = await supabase
    .from('workspaces')
    // @ts-ignore - Supabase generated types issue with update
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', workspaceId)

  if (error) {
    throw error
  }
}

/**
 * Add a member to a workspace
 */
export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'provider' | 'assistant' = 'provider'
) {
  const { data, error } = await supabase
    .from('workspace_members')
    // @ts-ignore - Supabase generated types issue with insert
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      role,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Remove a member from a workspace
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
) {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

/**
 * Update a workspace member's role
 */
export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'provider' | 'assistant'
) {
  const { data, error } = await supabase
    .from('workspace_members')
    // @ts-ignore - Supabase generated types issue with update
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
