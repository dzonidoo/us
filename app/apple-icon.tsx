import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

// Home screen icon, rendered once at build time.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #f3a5b5, #d46f8a 60%, #b9618f)",
          color: "#fff",
          fontSize: 96,
          fontStyle: "italic",
          fontFamily: "serif",
          letterSpacing: -4,
          paddingBottom: 14,
        }}
      >
        us
      </div>
    ),
    size,
  );
}
