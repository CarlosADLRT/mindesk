#!/usr/bin/env tsx

/**
 * Fix Test User - Create Profile and Workspace
 * Manually creates profile and workspace for test@mindesk.app
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Database } from '../lib/database.types'

function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')
    content.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=')
        if (key && value) {
          process.env[key.trim()] = value.trim()
        }
      }
    })
  }
}

loadEnvFile()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

async function main() {
  console.log('🔧 Fixing Test User Setup')
  console.log('═'.repeat(60))
  console.log('')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }

  // Create admin client (service role)
  const adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Create regular client to sign in
  const anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

  console.log('🔑 Signing in as test@mindesk.app...')
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email: 'test@mindesk.app',
    password: 'TestPassword123!',
  })

  if (authError || !authData.user) {
    console.error('❌ Cannot sign in:', authError?.message)
    console.log('\n💡 Make sure the user exists in Supabase Auth')
    console.log('   Create it at: https://app.supabase.com/project/iwruifqzipgkzckrmekk/auth/users')
    process.exit(1)
  }

  const userId = authData.user.id
  const userEmail = authData.user.email!

  console.log(`✅ User ID: ${userId}`)
  console.log(`✅ Email: ${userEmail}`)
  console.log('')

  // Step 1: Check/Create Profile
  console.log('👤 Checking profile...')
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (existingProfile) {
    console.log('✅ Profile already exists')
    console.log(`   Name: ${existingProfile.full_name}`)
  } else {
    console.log('📝 Creating profile...')
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        email: userEmail,
        full_name: authData.user.user_metadata?.full_name || 'Test User',
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message)
      process.exit(1)
    }

    console.log('✅ Profile created!')
    console.log(`   Name: ${profile.full_name}`)
  }

  console.log('')

  // Step 2: Check/Create Workspace
  console.log('🏢 Checking workspace...')
  const { data: existingWorkspaces } = await adminClient
    .from('workspace_members')
    .select('workspace_id, workspaces(*)')
    .eq('user_id', userId)

  if (existingWorkspaces && existingWorkspaces.length > 0) {
    console.log('✅ Workspace already exists')
    console.log(`   Name: ${(existingWorkspaces[0] as any).workspaces.name}`)
    console.log(`   ID: ${existingWorkspaces[0].workspace_id}`)
  } else {
    console.log('📝 Creating workspace...')

    // Create workspace
    const { data: workspace, error: workspaceError } = await adminClient
      .from('workspaces')
      .insert({
        name: 'Mi Consultorio',
        slug: 'mi-consultorio-' + Date.now(),
        created_by: userId,
      })
      .select()
      .single()

    if (workspaceError) {
      console.error('❌ Error creating workspace:', workspaceError.message)
      process.exit(1)
    }

    console.log('✅ Workspace created!')
    console.log(`   Name: ${workspace.name}`)
    console.log(`   ID: ${workspace.id}`)

    // Add user as owner
    console.log('📝 Adding user as workspace owner...')
    const { error: memberError } = await adminClient
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner',
      })

    if (memberError) {
      console.error('❌ Error adding member:', memberError.message)
      process.exit(1)
    }

    console.log('✅ User added as owner!')
  }

  console.log('')
  console.log('═'.repeat(60))
  console.log('')
  console.log('🎉 Test user setup complete!')
  console.log('')
  console.log('You can now:')
  console.log('  1. npm run dev')
  console.log('  2. Login with: test@mindesk.app / TestPassword123!')
  console.log('  3. Start adding clients!')
  console.log('')

  await anonClient.auth.signOut()
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
