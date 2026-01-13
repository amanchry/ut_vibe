export default function manifest() {
  return {
    name: "UT Vibe",
    short_name: "UT Vibe",
    description:
      "UT Vibe — a real-time, map-based campus feed for spontaneous events, gatherings, and moments around you.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icons/manifest-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/manifest-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
