import { site } from "../site";
export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain" } },
  );
}
