const SITE_URL = "https://www.transport-link.com";

// Generates /robots.txt — allows all crawlers (including Googlebot) to index the
// public site, keeps the admin area out of search results, and points to the
// sitemap.
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/"]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
