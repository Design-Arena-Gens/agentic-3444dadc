import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowthPulse Assistant",
  description: "Friendly Hinglish marketing guide for fast lead qualification"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
