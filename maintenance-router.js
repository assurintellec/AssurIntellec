export default {
  async fetch(request, env) {
    const enabled =
      String(env.MAINTENANCE_MODE || "OFF")
        .trim()
        .toUpperCase() === "ON";

    // Normal operation: serve the existing website files.
    if (!enabled) {
      return env.ASSETS.fetch(request);
    }

    const url = new URL(request.url);

    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }

    // Use the maintenance.html file already in your repository.
    const page = await env.ASSETS.fetch(
      new URL("/maintenance.html", request.url)
    );

    const headers = new Headers(page.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set(
      "cache-control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    headers.set("retry-after", "3600");
    headers.set("x-robots-tag", "noindex, nofollow");

    return new Response(page.body, {
      status: 503,
      headers
    });
  }
};
