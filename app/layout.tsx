import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kantor Attendance Dashboard",
  description: "RFID attendance dashboard with admin and employee access."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
