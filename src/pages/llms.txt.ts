import { getCollection } from "astro:content";
import { site } from "../site";
export async function GET() {
  const guides = (await getCollection("guides")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  return new Response(
    `# ${site.name}\n\n> ${site.description}\n\nPublished by the team behind Emisar. These educational examples do not certify a system as safe or compliant.\n\n## Guides\n${guides.map((g) => `- [${g.data.title}](${site.origin}/text/${g.id}.md): ${g.data.description}`).join("\n")}\n\n## About\n- [Ownership and editorial policy](${site.origin}/about/)\n- [Tools we build](${site.origin}/tools-we-build/)\n`,
    { headers: { "Content-Type": "text/plain" } },
  );
}
