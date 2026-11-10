import { getCollection } from "astro:content";
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
    guide: {
      id: string;
      body?: string;
      data: {
        title: string;
        reviewedDate: string;
        sources: { title: string; url: string }[];
      };
    };
  };
}) {
  const g = props.guide;
  return new Response(
    `# ${g.data.title}\n\nCanonical: ${site.origin}/guides/${g.id}/\nBy Emisar. Reviewed ${g.data.reviewedDate}.\n\n${g.body}\n\n## Source documents\n${g.data.sources.map((s) => `- [${s.title}](${s.url})`).join("\n")}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
