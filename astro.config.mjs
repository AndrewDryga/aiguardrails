import { defineConfig } from "astro/config";
export default defineConfig({
  site: "https://aiguardrails.dev",
  output: "static",
  trailingSlash: "always",
  markdown: { shikiConfig: { theme: "github-light", wrap: true } },
});
