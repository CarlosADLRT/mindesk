#!/usr/bin/env tsx

/**
 * Schema Deployment Helper
 * Assists with deploying the database schema to Supabase
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const PROJECT_REF = 'iwruifqzipgkzckrmekk'
const SQL_EDITOR_URL = `https://app.supabase.com/project/${PROJECT_REF}/sql`

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try macOS
    await execAsync(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`)
    return true
  } catch {
    try {
      // Try Linux
      await execAsync(`echo "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard`)
      return true
    } catch {
      return false
    }
  }
}

async function openBrowser(url: string): Promise<void> {
  try {
    // Try macOS
    await execAsync(`open "${url}"`)
  } catch {
    try {
      // Try Linux
      await execAsync(`xdg-open "${url}"`)
    } catch {
      console.log(`\n📱 Please manually open: ${url}`)
    }
  }
}

async function main() {
  console.log('🚀 Mindesk Database Schema Deployment')
  console.log('═'.repeat(60))
  console.log('')
  console.log(`📍 Project: ${PROJECT_REF}`)
  console.log(`🔗 URL: https://${PROJECT_REF}.supabase.co`)
  console.log('')
  console.log('═'.repeat(60))
  console.log('')

  // Read schema file
  const schemaPath = join(process.cwd(), 'schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')
  const lineCount = schema.split('\n').length

  console.log('📄 Schema Details:')
  console.log(`  • File: schema.sql`)
  console.log(`  • Lines: ${lineCount.toLocaleString()}`)
  console.log(`  • Size: ${(schema.length / 1024).toFixed(1)} KB`)
  console.log('')

  // Try to copy to clipboard
  console.log('📋 Copying schema to clipboard...')
  const copied = await copyToClipboard(schema)

  if (copied) {
    console.log('✅ Schema copied to clipboard!')
    console.log('')
    console.log('📝 Next Steps:')
    console.log('  1. SQL Editor will open in your browser')
    console.log('  2. Click "New Query"')
    console.log('  3. Press Cmd+V (or Ctrl+V) to paste')
    console.log('  4. Click "Run" (or press Cmd+Enter / Ctrl+Enter)')
    console.log('  5. Wait ~30 seconds for completion')
    console.log('')
  } else {
    console.log('⚠️  Could not copy to clipboard automatically')
    console.log('')
    console.log('📝 Manual Steps:')
    console.log('  1. Open schema.sql in your editor')
    console.log('  2. Select all (Cmd+A / Ctrl+A)')
    console.log('  3. Copy (Cmd+C / Ctrl+C)')
    console.log('  4. In the SQL Editor that will open:')
    console.log('     • Click "New Query"')
    console.log('     • Paste the schema')
    console.log('     • Click "Run"')
    console.log('')
  }

  // Open browser
  console.log('🌐 Opening Supabase SQL Editor...')
  await openBrowser(SQL_EDITOR_URL)

  console.log('')
  console.log('═'.repeat(60))
  console.log('')
  console.log('✅ Expected Result: "Success. No rows returned"')
  console.log('')
  console.log('After deployment completes, verify with:')
  console.log('  npm run db:verify')
  console.log('')
}

main().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
