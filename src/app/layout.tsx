import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FieldOps Command Center",
  description: "WhatsApp-native distribution command center for Tier 2 and Tier 3 markets"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
