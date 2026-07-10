import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
});
