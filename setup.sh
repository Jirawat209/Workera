#!/bin/bash

# Workera Setup Script
# Usage: ./setup.sh

echo "🚀 Starting Workera Setup..."

# 1. Install Dependencies
echo "📦 Installing dependencies..."
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# 2. Setup Environment Variables
if [ ! -f ".env" ]; then
    echo "⚙️ Setting up .env file..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env created from .env.example"
    else
        echo "⚠️ .env.example not found. Creating a blank .env..."
        touch .env
    fi
    
    echo ""
    echo "🔑 Please enter your Supabase credentials (press Enter to skip if adding manually later):"
    read -p "Supabase URL: " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_KEY
    
    if [ ! -z "$SUPABASE_URL" ]; then
        # Replace empty values if they exist, or append if missing
        if grep -q "VITE_SUPABASE_URL=" .env; then
            sed -i '' "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|" .env
        else
            echo "VITE_SUPABASE_URL=$SUPABASE_URL" >> .env
        fi
    fi
    
    if [ ! -z "$SUPABASE_KEY" ]; then
        if grep -q "VITE_SUPABASE_ANON_KEY=" .env; then
            sed -i '' "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY|" .env
        else
            echo "VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY" >> .env
        fi
    fi
else
    echo "✅ .env file already exists."
fi

# 3. Database Reminders
echo ""
echo "🗄️ Database Setup:"
echo "   Go to your Supabase Dashboard -> SQL Editor"
echo "   Copy and run the contents of 'scripts/setup_database_full.sql'"
echo ""

echo "✅ Setup Complete!"
echo "   Run 'npm run dev' to start the application."
