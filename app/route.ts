import homeHtml from "../public/index.html?raw";

// Preserve the authored HTML and all of its existing relative asset URLs.
export function GET() {
  return new Response(homeHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
