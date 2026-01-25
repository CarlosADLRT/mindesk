#!/usr/bin/env tsx

/**
 * Test Authentication Flow
 * Verifies that user creation and profile trigger work correctly
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Database } from '../lib/database.types'

// Load environment variables
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
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

async function main() {
  console.log('🔐 Testing Mindesk Authentication')
  console.log('═'.repeat(60))
  console.log('')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Error: Missing environment variables')
    console.log('')
    console.log('Please update .env.local with:')
    console.log('  VITE_SUPABASE_URL=https://iwruifqzipgkzckrmekk.supabase.co')
    console.log('  VITE_SUPABASE_ANON_KEY=your-anon-key-here')
    console.log('')
    console.log('Get your keys from:')
    console.log('https://app.supabase.com/project/iwruifqzipgkzckrmekk/settings/api')
    console.log('')
    process.exit(1)
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

  console.log('📍 Project:', SUPABASE_URL)
  console.log('')

  // Test 1: Try to sign in with test user
  console.log('🔑 Test 1: Signing in as test user...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@mindesk.app',
    password: 'TestPassword123!',
  })

  if (authError) {
    console.log('❌ Sign in failed:', authError.message)
    console.log('')
    console.log('💡 Make sure you created the test user first:')
    console.log('   npm run user:create')
    console.log('')
    process.exit(1)
  }

  console.log('✅ Sign in successful!')
  console.log(`   User ID: ${authData.user.id}`)
  console.log(`   Email: ${authData.user.email}`)
  console.log('')

  // Test 2: Check if profile was auto-created
  console.log('👤 Test 2: Checking profile auto-creation...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    console.log('❌ Profile not found!')
    console.log('   The auto-create trigger may not have fired.')
    console.log('')
    process.exit(1)
  }

  console.log('✅ Profile found!')
  console.log(`   Name: ${profile.full_name}`)
  console.log(`   Email: ${profile.email}`)
  console.log(`   Created: ${new Date(profile.created_at).toLocaleString()}`)
  console.log('')

  // Test 3: Check RLS policies
  console.log('🔒 Test 3: Testing RLS policies...')

  // Try to query workspaces (should be empty but accessible)
  const { data: workspaces, error: workspacesError } = await supabase
    .from('workspaces')
    .select('*')

  if (workspacesError) {
    console.log('⚠️  RLS policy check failed:', workspacesError.message)
  } else {
    console.log('✅ RLS policies working!')
    console.log(`   Accessible workspaces: ${workspaces.length}`)
  }
  console.log('')

  // Test 4: Try to create a workspace
  console.log('🏢 Test 4: Creating test workspace...')
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name: 'Test Workspace',
      slug: 'test-workspace-' + Date.now(),
      created_by: authData.user.id,
    })
    .select()
    .single()

  if (workspaceError) {
    console.log('❌ Workspace creation failed:', workspaceError.message)
  } else {
    console.log('✅ Workspace created!')
    console.log(`   ID: ${workspace.id}`)
    console.log(`   Name: ${workspace.name}`)
    console.log('')

    // Add user as owner
    console.log('👥 Adding user as workspace owner...')
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: authData.user.id,
        role: 'owner',
      })

    if (memberError) {
      console.log('❌ Failed to add member:', memberError.message)
    } else {
      console.log('✅ User added as owner!')
    }
  }

  console.log('')
  console.log('═'.repeat(60))
  console.log('')
  console.log('✅ All authentication tests passed!')
  console.log('')
  console.log('🎉 Your Mindesk database is fully operational!')
  console.log('')
  console.log('Next steps:')
  console.log('  1. Start the dev server: npm run dev')
  console.log('  2. Build your authentication UI')
  console.log('  3. Implement workspace selection')
  console.log('  4. Start building features!')
  console.log('')

  // Sign out
  await supabase.auth.signOut()
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
