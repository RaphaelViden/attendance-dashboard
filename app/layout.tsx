import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TAPPRESENSI RFID Fullstack",
  description: "Admin dashboard RFID attendance 4-tap with shift rules and device endpoint."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
