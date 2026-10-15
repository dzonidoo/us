import type { MetadataRoute } from "next";
import { asset } from "@/lib/base-path";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "us",
    short_name: "us",
    description: "Na današnji dan",
    start_url: asset("/"),
    display: "standalone",
    background_color: "#fdf3f1",
    theme_color: "#fdf3f1",
    icons: [{ src: asset("/apple-icon"), sizes: "180x180", type: "image/png" }],
  };
}
