import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

function shouldTraceDesktopV3DevServer() {
  return [
    process.env.AIGCFOX_DESKTOP_V3_STARTUP_BACKEND_PROBE,
    process.env.VITE_DESKTOP_V3_RENDERER_BOOT_PROBE,
  ].some((value) => typeof value === "string" && value.trim().length > 0);
}

function createDesktopV3RendererBootLogLine(requestUrl: string) {
  const parsedUrl = new URL(requestUrl, "http://127.0.0.1");
  const route = parsedUrl.searchParams.get("route")?.trim() || "#/";
  const runtime = parsedUrl.searchParams.get("runtime")?.trim() || "-";
  const stage = parsedUrl.searchParams.get("stage")?.trim() || "unknown";
  return `desktop-v3.renderer.boot stage=${stage} route=${route} runtime=${runtime}`;
}

function createDesktopV3BootProbeIndexHtmlPlugin(): Plugin {
  return {
    name: "desktop-v3-boot-probe-index-html",
    transformIndexHtml(html) {
      return html.replaceAll(
        "__DESKTOP_V3_RENDERER_BOOT_PROBE__",
        process.env.VITE_DESKTOP_V3_RENDERER_BOOT_PROBE?.trim() || "",
      );
    },
  };
}

function createDesktopV3DevRequestTracePlugin(): Plugin {
  return {
    name: "desktop-v3-dev-request-trace",
    apply: "serve",
    configureServer(server) {
      if (!shouldTraceDesktopV3DevServer()) {
        return;
      }

      server.middlewares.use((request, _response, next) => {
        const requestUrl = request.url ?? "-";

        if (requestUrl.startsWith("/__desktop_v3_boot")) {
          console.log(createDesktopV3RendererBootLogLine(requestUrl));
          _response.statusCode = 204;
          _response.end();
          return;
        }

        console.log(
          `desktop-v3.dev.request method=${request.method ?? "GET"} url=${requestUrl}`,
        );
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    createDesktopV3BootProbeIndexHtmlPlugin(),
    createDesktopV3DevRequestTracePlugin(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 31420,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 31421,
    strictPort: true,
  },
});
