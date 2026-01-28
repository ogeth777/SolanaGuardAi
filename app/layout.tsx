import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solana Guard AI - Token Security Scanner",
  description: "Protect yourself from rug pulls on Solana with AI-powered analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-900 text-white">
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
