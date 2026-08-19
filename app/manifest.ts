import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Knowledge Reading Workspace",
    short_name: "Knowledge",
    description: "A private reading and knowledge workspace.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f7f8f6",
    theme_color: "#4f67ff",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
