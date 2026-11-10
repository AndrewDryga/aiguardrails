import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { site } from "../../site";
export async function getStaticPaths() {
  return (await getCollection("guides")).map((guide) => ({
    params: { slug: guide.id },
    props: { guide },
  }));
}
export function GET({
  props,
}: {
  props: {
    guide: CollectionEntry<"guides">;
  };
}) {
  const g = props.guide;
  const body = (g.body || "").replace(
    /\]\(\/(?!\/)([^)\s]*)\)/g,
    `](${site.origin}/$1)`,
  );
  return new Response(
    `# ${g.data.title}\n\nCanonical: ${site.origin}/guides/${g.id}/\nBy Emisar. Reviewed ${g.data.reviewedDate}.\n\n${g.data.answer}\n\n${body}\n\n## Source documents\n${g.data.sources.map((s) => `- [${s.title}](${s.url})`).join("\n")}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
