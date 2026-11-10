import { readFile, readdir, writeFile } from "node:fs/promises";
import config from "../astro.config.mjs";

// Static exports stay readable; their HTML guides own the search canonical.
const base = await readFile("public/_headers", "utf8");
const exports = (await readdir("dist/text"))
  .filter((file) => file.endsWith(".md"))
  .sort();
const rules = exports.map((file) =>
  `/text/${file}\n  Link: <${config.site}/guides/${file.slice(0, -3)}/>; rel="canonical"`,
);
await writeFile("dist/_headers", `${base.trimEnd()}\n\n# Canonical HTML sources for Markdown exports.\n${rules.join("\n\n")}\n`);
console.log(`Generated canonical headers for ${exports.length} Markdown guides.`);
