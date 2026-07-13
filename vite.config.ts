import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("/react/") || id.includes("/react-dom/")) return "react";
            return undefined;
          },
        },
      },
    },
  },
});
