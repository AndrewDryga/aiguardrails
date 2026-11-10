import { readFile, readdir, stat, access } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
const root = path.resolve("dist");
const { default: config } = await import("../astro.config.mjs");
const expectedOrigin = config.site;
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory()
          ? walk(path.join(dir, e.name))
          : [path.join(dir, e.name)],
      ),
    )
  ).flat();
}
const files = await walk(root);
const html = files.filter((f) => f.endsWith(".html"));
const errors = [];
const titles = new Set();
const descriptions = new Set();
const canonicalPaths = [];
let articleCount = 0;
let linkCount = 0;
for (const file of html) {
  const source = await readFile(file, "utf8");
  const { document } = parseHTML(source);
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const pagePath = "/" + relative.replace(/index\.html$/, "");
  const is404 = relative === "404.html";
  const title = document.querySelector("title")?.textContent;
  const description = document
    .querySelector('meta[name="description"]')
    ?.getAttribute("content");
  const canonical = document
    .querySelector('link[rel="canonical"]')
    ?.getAttribute("href");
  const fail = (m) => errors.push(`${relative}: ${m}`);
  if (!title || titles.has(title)) fail("missing or duplicate title");
  titles.add(title);
  if (!description || descriptions.has(description))
    fail("missing or duplicate description");
  descriptions.add(description);
  if (document.querySelectorAll("h1").length !== 1)
    fail("expected exactly one h1");
  if (!canonical?.startsWith(expectedOrigin + "/"))
    fail("wrong canonical origin");
  if (!is404 && canonical !== expectedOrigin + pagePath)
    fail(`canonical does not match route: ${canonical} vs ${pagePath}`);
  if (!is404) canonicalPaths.push(pagePath);
  if (!document.querySelector("main")) fail("missing main landmark");
  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    try {
      const entity = JSON.parse(script.textContent);
      if (entity["@type"] === "Article") {
        articleCount++;
        if (!entity.author || !entity.dateModified)
          fail("incomplete Article metadata");
      }
    } catch {
      fail("invalid JSON-LD");
    }
  }
  for (const el of document.querySelectorAll(
    'a[href],img[src],link[rel="stylesheet"],script[src]',
  )) {
    const raw = el.getAttribute("href") || el.getAttribute("src");
    if (!raw || raw.startsWith("mailto:") || raw.startsWith("data:")) continue;
    const url = new URL(raw, expectedOrigin + pagePath);
    if (url.origin !== expectedOrigin) continue;
    linkCount++;
    let target = path.join(root, decodeURIComponent(url.pathname));
    try {
      if ((await stat(target)).isDirectory())
        target = path.join(target, "index.html");
      await access(target);
      if (url.hash && target.endsWith(".html")) {
        const targetDoc = parseHTML(await readFile(target, "utf8")).document;
        const id = decodeURIComponent(url.hash.slice(1));
        if (!targetDoc.getElementById(id)) fail(`missing fragment ${raw}`);
      }
    } catch {
      fail(`missing local target ${raw}`);
    }
  }
  if (pagePath.startsWith("/guides/") && pagePath !== "/guides/") {
    if (!document.querySelector(".prose")?.textContent?.trim())
      fail("guide body missing");
    if (!document.querySelector(".sources a")) fail("source documents missing");
  }
}
const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
assert.equal(
  new Set(locations).size,
  locations.length,
  "duplicate sitemap URL",
);
for (const page of canonicalPaths)
  if (!locations.includes(expectedOrigin + page))
    errors.push(`sitemap missing ${page}`);
for (const loc of locations)
  if (!canonicalPaths.includes(new URL(loc).pathname))
    errors.push(`sitemap includes unknown or excluded page ${loc}`);
assert.match(await readFile("dist/robots.txt", "utf8"), /Allow: \//);
await access("dist/social.png");
if (articleCount < 12)
  errors.push(
    `Expected the complete initial library, got ${articleCount} guides`,
  );
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `PASS: ${html.length} HTML pages, ${articleCount} articles, ${linkCount} local references, unique metadata, valid JSON-LD, exact sitemap coverage and downloadable resources.`,
);
