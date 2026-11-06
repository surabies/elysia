import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fullstack Next.js + ElysiaJS + PostGIS + Better Auth',
  description:
    'Production-ready Fullstack starter with Next.js App Router, ElysiaJS, Drizzle ORM, PostGIS, Better Auth, and shadcn/ui',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans min-h-screen bg-background text-foreground antialiased flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-bold flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <span className="tracking-tight">Elysia + Next.js</span>
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium">
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Home
                </Link>
                <Link
                  href="/places"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  PostGIS Places
                </Link>
                <Link
                  href="/cater"
                  className="transition-colors hover:text-foreground/80 text-foreground/60 font-semibold"
                >
                  Baca Meter
                </Link>
                <Link
                  href="/dashboard"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="text-sm font-medium hover:text-foreground/80 text-foreground/60 px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          Built with Next.js App Router, ElysiaJS, Drizzle ORM, PostGIS, Better
          Auth & shadcn/ui.
        </footer>
      </body>
    </html>
  );
}
