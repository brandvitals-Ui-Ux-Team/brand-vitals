import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vitals Recruit is served at brandvitals.io/recruit/ and built into the site's dist/recruit.
// It shares the Vitals GO design system (apps/hq/src/styles.css) and a few pure helpers.
export default defineConfig({
  base: "/recruit/",
  plugins: [react()],
  build: {
    outDir: "../../dist/recruit",
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
  server: { port: 5175 }
});
