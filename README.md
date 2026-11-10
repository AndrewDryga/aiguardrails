# AI Guardrails

An Astro static site for **https://aiguardrails.dev**, ready for GitHub Pages with a custom domain.

## Local work

Use Node 26. Run `npm ci`, then `npm run dev`. Run `npm run verify` before a commit; it checks Astro types, interactive decision logic, the production build, internal links, metadata, schema, sitemap coverage and downloadable content. `npm run preview` serves the production output.

## Content

Guides live in `src/content/guides/`. Their frontmatter owns titles, summaries, source links, related reading, keyword intent and review dates. The content schema validates these fields. Each guide is rendered as crawlable HTML and a downloadable Markdown file. Local, gitignored `research/` contains keyword evidence and page mapping. It is not committed or copied into the public site.

Technical statements need current primary sources. Keep instructions and examples useful without buying a product. Disclose related products through the shared footer and tools page. Read `ATTRIBUTION.md` for the requested Humanizer and Unslop references.

## GitHub Pages

1. Create a repository with this directory as its root and push `main`.
2. In Settings → Pages, choose GitHub Actions as the publishing source.
3. Set the custom domain to `aiguardrails.dev` in the Pages settings. A CNAME file alone does not configure a custom domain for an Actions deployment.
4. Configure DNS for the repository owner's GitHub Pages endpoint, using GitHub's current custom-domain instructions. Enable HTTPS after the certificate is ready.
5. The included workflow runs verification, uploads `dist/`, and deploys that same artifact. Pull requests get checks without deployment permissions.

The custom domain is served from `/`, so no repository-name `base` is configured. Test with the custom domain before promoting public links. `.dev` requires HTTPS in browsers.

Official setup references: [Astro](https://docs.astro.build/en/guides/deploy/github/) and [GitHub custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Search and measurement

The build emits canonical URLs, social previews, Article and breadcrumb schema, a sitemap and a permissive robots.txt for public material. The text index is a convenience for readers and agents, not a promised ranking factor. There are no analytics scripts or tracking cookies. Verify domains in Search Console/Bing after deployment; track qualified visits, tool use and product activation separately from rankings and AI citations.
