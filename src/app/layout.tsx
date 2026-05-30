import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "shipd2r ERP / CRM Command Center",
  description: "Central distribution ERP/CRM with sales-app workflows and retailer WhatsApp intake"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
