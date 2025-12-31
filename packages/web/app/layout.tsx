import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider, ThemeToggle } from "@/components/ThemeProvider";
import { AuthHeader } from "@/components/AuthHeader";

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
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            Kendo Translation
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Dashboard
              </Link>
              <Link href="/articles" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Articles
              </Link>
              <Link href="/videos" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Videos
              </Link>
              <Link href="/terminology" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Terminology
              </Link>
              <Link href="/translate" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Translate
              </Link>
              <Link href="/bookmarks" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Bookmarks
              </Link>
            </div>
            <ThemeToggle />
            <AuthHeader />
          </div>
        </div>
        {/* Mobile Navigation */}
        <div className="md:hidden flex gap-4 mt-3 overflow-x-auto pb-2">
          <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            Dashboard
          </Link>
          <Link href="/articles" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            Articles
          </Link>
          <Link href="/videos" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            Videos
          </Link>
          <Link href="/terminology" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            Terms
          </Link>
          <Link href="/translate" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            Translate
          </Link>
          <Link href="/bookmarks" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            Bookmarks
          </Link>
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <ThemeProvider defaultTheme="system">
          <Header />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
