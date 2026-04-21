import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Raise the warning threshold slightly so the console stays clean after
    // splitting; individual chunks should stay well below 500 kB.
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // React runtime — tiny, always needed, cache forever.
          "vendor-react": ["react", "react-dom", "react-router-dom"],

          // Tanstack Query — data-fetching layer shared by all pages.
          "vendor-query": ["@tanstack/react-query"],

          // Supabase client — auth + DB, shared by all pages.
          "vendor-supabase": ["@supabase/supabase-js"],

          // Radix UI primitives — large but shared across many components.
          "vendor-radix": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
          ],

          // Date utilities — used on many pages but not tiny.
          "vendor-date": ["date-fns"],

          // PDF export — only needed when user clicks "Export PDF"; keep it
          // separate so it doesn't block the initial load.
          "vendor-pdf": ["jspdf", "jspdf-autotable"],

          // Lucide icons — large icon set, separate chunk.
          "vendor-icons": ["lucide-react"],

          // Recharts — only used by chart components, lazy-loaded.
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
});
