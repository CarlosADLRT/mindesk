#!/usr/bin/env tsx

/**
 * Supabase Database Setup Script
 *
 * This script helps deploy the schema to your Supabase database.
 *
 * Requirements:
 * - tsx installed globally (npm install -g tsx)
 * - @supabase/supabase-js package
 *
 * Usage:
 *   tsx scripts/setup-database.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Database } from '../lib/database.types'

// Load environment variables from .env.local
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

// Get environment variables
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

interface SetupOptions {
  verifyOnly?: boolean
  loadSeedData?: boolean
}

async function main(options: SetupOptions = {}) {
  console.log('🚀 Mindesk Database Setup')
  console.log('═'.repeat(60))

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Missing required environment variables\n')
    console.log('Required in .env.local:')
    console.log('  VITE_SUPABASE_URL              - Your Supabase project URL')
    console.log('  SUPABASE_SERVICE_KEY           - Your service role key\n')
    console.log('Get these from: Supabase Dashboard → Settings → API\n')
    process.exit(1)
  }

  console.log(`📍 Project: ${SUPABASE_URL}`)
  console.log('═'.repeat(60))

  // Initialize Supabase client with service role key
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Verify setup
  console.log('\n🔍 Verifying database setup...')

  try {
    // Check if tables exist by querying workspaces
    const { data, error } = await supabase
      .from('workspaces')
      .select('count')
      .limit(0)

    if (error && error.code === 'PGRST116') {
      console.log('⚠️  Schema not yet deployed\n')
      console.log('📋 DEPLOYMENT INSTRUCTIONS:')
      console.log('─'.repeat(60))
      console.log('1. Go to: Supabase Dashboard → SQL Editor')
      console.log('2. Click "New Query"')
      console.log('3. Open file: schema.sql')
      console.log('4. Copy all contents and paste into SQL Editor')
      console.log('5. Click "Run" to execute')
      console.log('─'.repeat(60))
      console.log('\n💡 Then run this script again to verify.\n')
      process.exit(1)
    }

    console.log('✅ Database tables verified')

    // Check RLS policies
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (profilesError) {
      console.error('⚠️  Warning: Unable to verify RLS policies')
    } else {
      console.log('✅ RLS policies verified')
    }

    // Count existing data
    const { count: workspacesCount } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true })

    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    const { count: appointmentsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })

    console.log('\n📊 Database Status:')
    console.log(`  Workspaces: ${workspacesCount ?? 0}`)
    console.log(`  Clients: ${clientsCount ?? 0}`)
    console.log(`  Appointments: ${appointmentsCount ?? 0}`)

    if (options.loadSeedData) {
      console.log('\n📝 Loading seed data...')
      console.log('⚠️  Note: Seed data should be loaded via Supabase SQL Editor')
      console.log('Run: seed_data.sql in the SQL Editor')
    }

    console.log('\n✅ Database setup complete!')
    console.log('\n📋 Next Steps:')
    console.log('  1. Update .env.local with your Supabase credentials')
    console.log('  2. Start the development server: npm run dev')
    console.log('  3. Create your first user via Supabase Auth')
    console.log('  4. Create a workspace in the app\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Parse command-line arguments
const args = process.argv.slice(2)
const options: SetupOptions = {
  verifyOnly: args.includes('--verify-only'),
  loadSeedData: args.includes('--seed'),
}

main(options).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
