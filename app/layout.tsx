import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { KeyboardAwareness } from "@/components/ui/keyboard-awareness";

export const metadata: Metadata = {
  title: "The Coast: Project Management",
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
      <body className="min-h-screen">
        <KeyboardAwareness />
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
