import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handleApi } from './lib/meta-api.js';
import { handleMcp } from './lib/mcp-server.js';

export default defineConfig(({ mode }) => ({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), {
    name: 'greenpoint-local-api',
    configureServer(server) {
      const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
      server.middlewares.use('/api', (req, res) => {
        req.url = `/api${req.url}`;
        const handler = new URL(req.url, 'http://localhost').pathname === '/api/mcp' ? handleMcp : handleApi;
        handler(req, res, env);
      });
    },
  }],
}));
