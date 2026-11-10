import { getCollection } from "astro:content";
import { site } from "../site";
export async function GET() {
  const guides = await getCollection("guides");
  const paths = [
    "/",
    "/guides/",
    "/resources/",
    "/about/",
    "/tools-we-build/",
    "/tools/" + site.tool + "/",
  ];
  const urls = [
    ...paths.map((path) => ({ path, date: undefined as string | undefined })),
    ...guides.map((g) => ({
      path: "/guides/" + g.id + "/",
      date: g.data.reviewedDate,
    })),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${site.origin}${u.path}</loc>${u.date ? `<lastmod>${u.date}</lastmod>` : ""}</url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
