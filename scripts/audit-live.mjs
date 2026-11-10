import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parseHTML } from "linkedom";
import config from "../astro.config.mjs";

// Run after deployment against the same dist output that passed local verification.
const root = path.resolve("dist");
const origin = config.site;
const project = JSON.parse(await readFile("package.json", "utf8")).name;
const hash = (text) => createHash("sha256").update(text).digest("hex");
async function walk(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? walk(path.join(dir, entry.name))
          : [path.join(dir, entry.name)],
      ),
    )
  ).flat();
}
const request = (url, options = {}) =>
  fetch(url, { signal: AbortSignal.timeout(20000), ...options });
const files = await walk(root);
const html = files.filter(
  (file) => file.endsWith(".html") && !file.endsWith("/404.html"),
);
const content = files.filter(
  (file) =>
    (/\.(md|csv|json)$/.test(file) && path.basename(file) !== "_routes.json") ||
    ["robots.txt", "sitemap.xml", "llms.txt"].includes(path.basename(file)),
);
const checks = [];
for (const list of [html, content]) {
  for (let offset = 0; offset < list.length; offset += 6) {
    const batch = await Promise.all(
      list.slice(offset, offset + 6).map(async (file) => {
        const route =
          "/" +
          path
            .relative(root, file)
            .replaceAll(path.sep, "/")
            .replace(/index\.html$/, "");
        const response = await request(origin + route);
        assert.equal(response.status, 200, route);
        const actual = await response.text();
        const expected = await readFile(file, "utf8");
        assert.equal(
          hash(actual),
          hash(expected),
          `${route}: served content differs from the verified build; inspect CDN transformations or deployment freshness`,
        );
        if (file.endsWith(".html")) {
          assert.ok(
            !response.headers.get("x-robots-tag")?.includes("noindex"),
            route + " must remain indexable",
          );
          const document = parseHTML(actual).document;
          assert.equal(
            document
              .querySelector('link[rel="canonical"]')
              .getAttribute("href"),
            origin + route,
          );
          assert.ok(
            !document
              .querySelector('meta[name="robots"]')
              .getAttribute("content")
              .includes("noindex"),
          );
          if (route.startsWith("/guides/"))
            assert.ok(
              response.headers.get("cache-control")?.includes("no-transform"),
              route + ": preserve source examples for crawlers",
            );
        }
        return {
          route,
          status: response.status,
          sha256: hash(actual),
          matches_local_build: true,
        };
      }),
    );
    checks.push(...batch);
  }
}
const missing = await request(
  origin + "/verification-this-page-does-not-exist/",
);
assert.equal(missing.status, 404);
assert.ok((await missing.text()).includes("noindex"));
// Deleted assets can survive a deployment in the custom-domain cache.
// Check the former public URLs as well as files that still exist in dist.
for (const route of ["/tools-we-build", "/tools-we-build/"]) {
  const response = await request(origin + route, { redirect: "manual" });
  assert.equal(
    response.status,
    410,
    route + ": retired content must stay gone",
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.ok(response.headers.get("x-robots-tag")?.includes("noindex"));
  assert.ok((await response.text()).startsWith("This page has been removed."));
}
for (const asset of ["social.svg", "social.png"]) {
  const response = await request(origin + "/" + asset);
  assert.equal(response.status, 200);
  assert.ok(
    Buffer.from(await response.arrayBuffer()).equals(
      await readFile(path.join(root, asset)),
    ),
    asset + ": stale social image",
  );
}
const alias = await request(`https://${project}.pages.dev/`);
assert.equal(alias.status, 200);
assert.ok(alias.headers.get("x-robots-tag")?.includes("noindex"));
const www = await request(
  origin.replace("https://", "https://www.") + "/guides/?source=verification",
  { redirect: "manual" },
);
assert.equal(www.status, 301);
assert.equal(
  www.headers.get("location"),
  origin + "/guides/?source=verification",
);
const search = await request(origin + "/search-index.json");
assert.equal(search.status, 200);
assert.ok(search.headers.get("x-robots-tag")?.includes("noindex"));
const robots = await (await request(origin + "/robots.txt")).text();
assert.match(robots, /Allow: \//);
assert.ok(robots.includes(origin + "/sitemap.xml"));
const report = {
  origin,
  html_pages: html.length,
  content_files: content.length,
  exact_build_matches: checks.length,
  checks,
  real_404: true,
  retired_routes_gone: true,
  social_images_match: true,
  www_redirect: true,
  alias_noindex: true,
  search_index_noindex: true,
};
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/live-audit.json", JSON.stringify(report, null, 2));
console.log(
  `PASS: ${html.length} live HTML pages and ${content.length} text/data files exactly match dist; canonical URLs, indexability, no-transform, real 404, retired-route 410, social images, www redirect and alias/search noindex verified.`,
);
