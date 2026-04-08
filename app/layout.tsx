import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Magic ETL",
  description: "ETL tools for Melee.gg",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
