import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Villa Auth",
  description: "Villa Identity Authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream-50 antialiased">{children}</body>
    </html>
  );
}
