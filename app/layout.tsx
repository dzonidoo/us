import type { Metadata, Viewport } from "next";
import { Bodoni_Moda } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "us",
  description: "Na današnji dan",
  robots: { index: false, follow: false },
  // Opened from the home screen, it runs full screen without Safari's bars.
  appleWebApp: {
    capable: true,
    title: "us",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf3f1" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1620" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr" className={`${bodoni.variable} h-full antialiased`}>
      <body className="font-sans">
        <div className="relative mx-auto h-dvh w-full max-w-md overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
