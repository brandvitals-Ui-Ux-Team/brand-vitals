import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The app is served at brandvitals.io/app/ and built into the site's dist/app.
export default defineConfig({
  base: "/app/",
  plugins: [react()],
  build: {
    outDir: "../../dist/app",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("lucide-react")) return "icons";
          return "vendor";
        }
      }
    }
  },
  server: { port: 5173 }
});
