import { getCollection } from "astro:content";
import { site } from "../site";
export async function GET() {
  const guides = (await getCollection("guides")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  return new Response(
    `# ${site.name}\n\n> ${site.description}\n\nPractical guides with source documents, worked examples and downloadable worksheets. Each guide includes its review date.\n\n## Guides\n${guides.map((g) => `- [${g.data.title}](${site.origin}/text/${g.id}.md): ${g.data.description}`).join("\n")}\n\n## Tools and resources\n- [Recommended tools directory](${site.origin}/directory/): Recommendations by job, capabilities, limitations and documentation.\n- [${site.toolLabel}](${site.origin}/tools/${site.tool}/)\n- [Worksheets and examples](${site.origin}/resources/)\n\n## About\n- [Editorial policy](${site.origin}/about/)\n`,
    { headers: { "Content-Type": "text/plain" } },
  );
}
