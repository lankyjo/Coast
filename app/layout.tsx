import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Coast — Project Management",
  description:
    "Internal project management for The Coast brand design studio. AI-powered task management and team orchestration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
