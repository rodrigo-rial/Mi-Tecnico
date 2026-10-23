import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  // Docker Desktop no siempre propaga eventos de archivos desde Windows.
  server: { watch: { usePolling: true, interval: 500 } },
  plugins: [react(), tailwindcss()],
})