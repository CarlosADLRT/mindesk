#!/bin/bash

# Mindesk Schema Deployment Helper
# This script helps you deploy the schema to Supabase

echo "🚀 Mindesk Database Schema Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Project: iwruifqzipgkzckrmekk"
echo "URL: https://iwruifqzipgkzckrmekk.supabase.co"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 DEPLOYMENT STEPS:"
echo ""
echo "1. Opening Supabase SQL Editor in your browser..."
echo "   URL: https://app.supabase.com/project/iwruifqzipgkzckrmekk/sql"
echo ""
echo "2. In the SQL Editor:"
echo "   • Click 'New Query' (top right)"
echo "   • Copy the contents of schema.sql (1,286 lines)"
echo "   • Paste into the editor"
echo "   • Click 'Run' (or press Cmd+Enter / Ctrl+Enter)"
echo "   • Wait ~30 seconds for completion"
echo ""
echo "3. You should see: 'Success. No rows returned'"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📄 Schema file location: $(pwd)/schema.sql"
echo "📊 Lines to copy: 1,286"
echo ""

# Ask if they want to open the browser
read -p "Would you like to open the Supabase SQL Editor now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Opening browser..."
    open "https://app.supabase.com/project/iwruifqzipgkzckrmekk/sql" 2>/dev/null || \
    xdg-open "https://app.supabase.com/project/iwruifqzipgkzckrmekk/sql" 2>/dev/null || \
    echo "Please manually open: https://app.supabase.com/project/iwruifqzipgkzckrmekk/sql"
fi

echo ""
echo "After deploying, run: npm run db:verify"
echo ""
