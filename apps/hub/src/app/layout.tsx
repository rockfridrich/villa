import type { Metadata, Viewport } from "next";
import { Providers } from "@/providers";
import { BuildVersion } from "@/components/BuildVersion";
import { VillaLayoutShell } from "@/components/VillaLayoutShell";
import "./globals.css";
import "@villa/ui/glass.css";

export const metadata: Metadata = {
  title: "Villa",
  description: "Your identity. No passwords.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover", // Enable full viewport on devices with notches
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-50 text-ink">
        <Providers>
          <VillaLayoutShell>{children}</VillaLayoutShell>
          <BuildVersion />
        </Providers>
      </body>
    </html>
  );
}
