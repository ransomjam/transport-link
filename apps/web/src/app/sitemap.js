const SITE_URL = "https://www.transport-link.com";

// Generates /sitemap.xml for the public marketing and tracking routes.
export default function sitemap() {
  const lastModified = new Date();

  const routes = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/services", changeFrequency: "weekly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/track", changeFrequency: "weekly", priority: 0.8 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.6 }
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority
  }));
}
