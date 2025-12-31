import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider, ThemeToggle } from "@/components/ThemeProvider";
import { AuthHeader } from "@/components/AuthHeader";
import { RoleBasedNavigation, MobileRoleBasedNavigation } from "@/components/RoleBasedNavigation";

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
            <RoleBasedNavigation />
            <ThemeToggle />
            <AuthHeader />
          </div>
        </div>
        {/* Mobile Navigation */}
        <MobileRoleBasedNavigation />
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
