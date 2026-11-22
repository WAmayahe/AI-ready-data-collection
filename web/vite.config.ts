import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": "http://localhost:8080",
      "/rooms": "http://localhost:8080",
      "/devices": "http://localhost:8080",
      "/videos": "http://localhost:8080",
    },
  },
});
