/** Plain text for a local search index, built from the same public guide source. */
export function guideText(markdown: string) {
  return markdown
    .replace(/```[^\n]*\n([\s\S]*?)```/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/^[#>\s|*-]+/gm, " ")
    .replace(/[`*_~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function topicId(category: string) {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
}

export function readingMinutes(body: string, answer = "") {
  return Math.max(
    1,
    Math.ceil(guideText(answer + " " + body).split(/\s+/).length / 220),
  );
}
