import { getCollection } from "astro:content";
import { guideText } from "../lib/guide-text";

export async function GET() {
  const guides = await getCollection("guides");
  return new Response(
    JSON.stringify(
      guides.map((guide) => ({
        id: guide.id,
        text: guideText(
          [
            guide.data.title,
            guide.data.description,
            guide.data.answer,
            guide.body || "",
          ].join(" "),
        ),
      })),
    ),
    { headers: { "Content-Type": "application/json; charset=utf-8" } },
  );
}
