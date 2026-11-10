# AI Guardrails

An Astro static site for **https://aiguardrails.dev**, hosted on Cloudflare Pages with a custom domain.

## Local work

Use Node 26. Run `npm ci`, then `npm run dev`. Run `npm run verify` before a commit; it checks Astro types, interactive decision logic, the production build, internal links, metadata, schema, sitemap coverage and downloadable content. `npm run preview` serves the production output.

## Content

Guides live in `src/content/guides/`. Their frontmatter owns titles, descriptions, a self-contained `answer`, topic categories, source links, related reading, keyword intent and review dates. The content schema validates these fields. Each guide is rendered as crawlable HTML and a downloadable Markdown file. The opening answer appears once in each format; Markdown links retain their absolute source URLs. Every guide needs contextual links and a matching topic in the library. The build audit checks full-library coverage, incoming links, contents anchors and export fidelity. Local, gitignored `research/` contains keyword evidence and page mapping. It is not committed or copied into the public site.

Technical statements need current primary sources. Keep instructions and examples useful without buying a product. Disclose related products through the shared footer and tools page. Read `ATTRIBUTION.md` for the requested Humanizer and Unslop references.

## Cloudflare Pages

Source repository: `AndrewDryga/aiguardrails`. Cloudflare Pages builds from `main`; GitHub Actions runs the same verification without deployment credentials.

Project settings:

- Framework preset: Astro
- Production branch: `main`
- Build command: `npm run verify`
- Build output directory: `dist`
- Root directory: repository root
- Node version: pinned in `.nvmrc`

Connect the GitHub repository through Cloudflare Pages and attach `aiguardrails.dev` under Custom domains in the same account as its DNS zone. Cloudflare creates the DNS record and provisions HTTPS. Attach `www.aiguardrails.dev` too and redirect it to the canonical apex domain. Production deploys publish the `dist` output only after every check in the build command passes. Branch previews keep the production canonical URLs and Cloudflare's preview `noindex` header.

No server adapter, runtime secrets, database or Pages Functions are needed. The canonical domain is served from `/`. The host-specific rules in `public/_headers` keep `pages.dev` aliases and previews out of search results while leaving the canonical domains indexable. Verify live HTTPS, canonical URLs, real 404 responses, redirects and tool downloads after deployment.

Official references: [Astro on Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/), [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/) and [Node version selection](https://developers.cloudflare.com/pages/configuration/build-image/).

## Search and measurement

The build emits canonical URLs, social previews, Article and breadcrumb schema, a sitemap and a permissive robots.txt for public material. The library fetches a static full-text search index when a reader starts searching, with a titles-and-summaries fallback if that request fails. Topic groups and all guide links are present in the HTML without JavaScript. The search JSON is marked noindex; guide pages remain indexable.

The text index is a convenience for readers and agents, not a promised ranking factor. There are no analytics scripts or tracking cookies. Verify domains in Search Console/Bing after deployment; track qualified visits, tool use and product activation separately from rankings and AI citations.
