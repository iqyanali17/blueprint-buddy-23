import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
  host: "0.0.0.0",
  port: 8080,
  allowedHosts: [
    "meditalk-ai-powered-healthcare-assistant-ht77.onrender.com",
    "localhost",
    "127.0.0.1"
  ],
},
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
