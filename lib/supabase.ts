/**
 * Supabase Client Configuration
 * Handles authentication and database operations
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Next.js environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

// Create Supabase client with TypeScript types
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Export types for use in components
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// Helper type for inserting records
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

// Helper type for updating records
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Commonly used types
export type Profile = Tables<'profiles'>
export type Workspace = Tables<'workspaces'>
export type WorkspaceMember = Tables<'workspace_members'>
export type Client = Tables<'clients'>
export type Appointment = Tables<'appointments'>
export type SessionNote = Tables<'session_notes'>
export type Package = Tables<'packages'>
export type PackagePurchase = Tables<'package_purchases'>
export type Invoice = Tables<'invoices'>
export type InvoiceItem = Tables<'invoice_items'>
export type Payment = Tables<'payments'>
export type Reminder = Tables<'reminders'>

// Auth helpers
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting current user:', error)
    return null
  }

  return user
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error getting profile:', error)
    return null
  }

  return data
}

export async function getUserWorkspaces(userId: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner (
        role,
        is_active
      )
    `)
    .eq('workspace_members.user_id', userId)
    .eq('workspace_members.is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting workspaces:', error)
    return []
  }

  return data
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Error signing in:', error)
    return { user: null, error }
  }

  return { user: data.user, error: null }
}

// Sign up with email and password
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    console.error('Error signing up:', error)
    return { user: null, error }
  }

  return { user: data.user, error: null }
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
    return { error }
  }

  return { error: null }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}
