import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  build: {
    // Increase chunk size warning limit (default is 500 KB)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-table': ['@tanstack/react-virtual'],
          'vendor-utils': ['date-fns', 'uuid'],
          'vendor-supabase': ['@supabase/supabase-js']
        },
      },
    },
  },
})
// Trigger Restart - Restoration attempt 8 (Dark Mode V4)
