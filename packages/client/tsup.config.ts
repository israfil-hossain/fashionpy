import { defineConfig } from "tsup";

// `clean: true` in watch mode rm -rf's dist/ on every restart, which races
// with other packages' DTS builds that resolve `@mercurjs/client` types from
// this directory (turbo runs `dev` watchers concurrently with `^build`).
// Only clean on one-off builds.
const isWatch = process.argv.includes("--watch");

export default defineConfig({
  clean: !isWatch,
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
});
