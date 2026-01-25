#!/usr/bin/env tsx

/**
 * Test User Creation Helper
 * Opens Supabase Auth dashboard and provides instructions
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const PROJECT_REF = 'iwruifqzipgkzckrmekk'
const AUTH_URL = `https://app.supabase.com/project/${PROJECT_REF}/auth/users`

async function openBrowser(url: string): Promise<void> {
  try {
    await execAsync(`open "${url}"`)
  } catch {
    try {
      await execAsync(`xdg-open "${url}"`)
    } catch {
      console.log(`\n📱 Please manually open: ${url}`)
    }
  }
}

async function main() {
  console.log('👤 Create Test User for Mindesk')
  console.log('═'.repeat(60))
  console.log('')
  console.log('🌐 Opening Supabase Auth Dashboard...')
  console.log('')

  await openBrowser(AUTH_URL)

  console.log('📋 Follow these steps:')
  console.log('')
  console.log('1. Click "Add user" → "Create new user"')
  console.log('')
  console.log('2. Fill in:')
  console.log('   • Email: test@mindesk.app')
  console.log('   • Password: TestPassword123!')
  console.log('   • Auto Confirm User: ✅ YES (important!)')
  console.log('')
  console.log('3. Click "Create user"')
  console.log('')
  console.log('═'.repeat(60))
  console.log('')
  console.log('✨ What will happen:')
  console.log('   • User created in auth.users')
  console.log('   • Profile auto-created in profiles table (via trigger)')
  console.log('   • User can immediately sign in')
  console.log('')
  console.log('After creating the user, verify with:')
  console.log('   npm run db:test-auth')
  console.log('')
}

main().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
