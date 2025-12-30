import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kendo Translation",
  description: "Translate and read Kendo resources from Japanese to English",
};

function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🥋 Kendo Translation
          </Link>
          <div className="flex gap-6">
            <Link href="/articles" className="text-gray-600 hover:text-gray-900">
              Articles
            </Link>
            <Link href="/videos" className="text-gray-600 hover:text-gray-900">
              Videos
            </Link>
            <Link href="/terminology" className="text-gray-600 hover:text-gray-900">
              Terminology
            </Link>
            <Link href="/translate" className="text-gray-600 hover:text-gray-900">
              Translate
            </Link>
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Login
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
