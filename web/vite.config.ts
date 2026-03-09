import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [preact(), wasm()],
  base: "/wasm-icm-calculator/",
  build: {
    target: "esnext",
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
});
