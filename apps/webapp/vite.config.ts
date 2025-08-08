import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { skRoutesPlugin } from "skroutes/plugin";
import Icons from "unplugin-icons/vite";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig(({ mode }): ViteUserConfig => {
  return {
    server: {
      allowedHosts: true as const,
    },
    plugins: [
      tailwindcss(),
      sveltekit(),
      skRoutesPlugin({
        imports: [],
        errorURL: "/",
      }),
      Icons({
        compiler: "svelte",
      }),
      SvelteKitPWA({
        mode: mode === "development" ? "development" : "production",
        manifest: {
          short_name: "Totallator",
          name: "Totallator v3",
          start_url: "/",
          scope: "/",
          display: "standalone",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          icons: [
            {
              src: "pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        devOptions: {
          enabled: true,
          suppressWarnings: process.env.SUPPRESS_WARNING === "true",
          type: "module",
          navigateFallback: "/",
        },
      }),
    ],
    optimizeDeps: {
      exclude: ["@node-rs/argon2", "@node-rs/bcrypt"],
    },
    test: {
      include: ["src/**/*.{test,spec}.{js,ts}"],
      maxConcurrency: 1,
      maxWorkers: 1,
      testTimeout: 10000,
      pool: "forks",
      poolOptions: { forks: { singleFork: true } },
    },
  };
});
