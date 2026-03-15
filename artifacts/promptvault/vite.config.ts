import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;
const isBuild = process.argv.includes("build");

if (!isBuild && !rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = rawPort ? Number(rawPort) : 3000;

if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!isBuild && !basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

function cacheHeadersPlugin() {
  return {
    name: "cache-headers",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.match(/\/assets\/.+\.[a-f0-9]{8}\./)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
        next();
      });
    },
    configurePreviewServer(server: import("vite").PreviewServer) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.match(/\/assets\/.+\.[a-f0-9]{8,}\./)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (req.url === "/" || req.url === "/index.html" || !req.url?.includes(".")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    cacheHeadersPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-is/") || id.includes("node_modules/scheduler/")) {
            return "react-vendor";
          }
          if (id.includes("node_modules/@tanstack/")) {
            return "query-vendor";
          }
          if (id.includes("node_modules/framer-motion/")) {
            return "motion-vendor";
          }
          if (id.includes("node_modules/@radix-ui/")) {
            return "radix-vendor";
          }
          if (id.includes("node_modules/lucide-react/")) {
            return "icons-vendor";
          }
          if (id.includes("node_modules/wouter/")) {
            return "router-vendor";
          }
          if (id.includes("node_modules/zod/") || id.includes("node_modules/@hookform/") || id.includes("node_modules/react-hook-form/")) {
            return "form-vendor";
          }
        },
      },
    },
    cssCodeSplit: false,
    minify: "esbuild",
    sourcemap: false,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/sitemap.xml": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
