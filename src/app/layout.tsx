import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "shipd2r Command Center",
  description: "WhatsApp-native direct-to-retailer distribution command center"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
