# Workera - Setup Guide

This guide explains how to clone and set up the Workera application from scratch.

## Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) project (Free tier is sufficient)

## Quick Start (Terminal)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/YourUsername/Workera.git
    cd Workera
    ```

2.  **Run Setup Script**
    ```bash
    chmod +x setup.sh  # Make script executable (if needed)
    ./setup.sh
    ```
    - This will install dependencies (`npm install`).
    - It will create a `.env` file and prompt you for your Supabase credentials.

3.  **Setup Database (Supabase)**
    - Copy the contents of `scripts/setup_database_full.sql`.
    - Go to your Supabase Dashboard -> **SQL Editor**.
    - New Query -> Paste the content -> Click **Run**.
    - This creates all necessary tables, policies, and triggers.

4.  **Start Development Server**
    ```bash
    npm run dev
    ```

## Manual Setup

If you prefer manual setup:
1.  `npm install`
2.  Copy `.env.example` to `.env` and fill in your Supabase variables.
3.  Run the SQL script in Supabase.
4.  `npm run dev`

## Deployment

To deploy to Vercel/Netlify:
1.  Connect your Git repository.
2.  Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the deployment settings.
3.  Deploy!
