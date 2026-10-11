import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vitals Crew is served at brandvitals.io/crew/ and built into the site's dist/crew.
// It shares the Vitals GO design system (apps/hq/src/styles.css) and a few pure helpers.
export default defineConfig({
  base: "/crew/",
  plugins: [react()],
  build: {
    outDir: "../../dist/crew",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("lucide-react")) return "icons";
          return "vendor";
        }
      }
    }
  },
  server: { port: 5174 }
});
