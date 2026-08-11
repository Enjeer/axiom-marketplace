import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    environments: {
      ssr: {
        build: {
          rollupOptions: {
            output: {
              manualChunks(id) {
                if (/@tanstack[\\/]start-(client|server)-core/.test(id)) {
                  return "tanstack-start-core";
                }
              },
            },
          },
        },
      },
    },
  },
});
