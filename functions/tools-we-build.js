// Explicitly retire this URL before Pages can serve an old cached asset.
export function onRequest() {
  return new Response(
    "This page has been removed. Browse the guides at https://aiguardrails.dev/guides/\n",
    {
      status: 410,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
