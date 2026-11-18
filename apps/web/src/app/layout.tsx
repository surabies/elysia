import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { fontBody, fontDisplay } from '@/lib/fonts';
import { ThemeProvider } from '@/components/PenyediaTema';
import { Toaster } from '@/components/ui/sonner';
import { LandingShell } from '@/components/layout/LandingShell';
import { PwaProvider } from '@/components/pwa/PwaProvider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PERUMDA Tirtawening Kota Bandung',
    template: '%s | PERUMDA Tirtawening',
  },
  description:
    'Sistem Enterprise Baca Meter (Cater), Pelanggan, dan Penagihan PERUMDA Tirtawening Kota Bandung.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tirtawening',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${GeistSans.variable} ${GeistMono.variable} ${fontBody.variable} ${fontDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=document.cookie.match(/(?:^|; )sidebar_width=(\\d+)/);var w=m?m[1]:localStorage.getItem("elysia-sidebar-width");if(w){var n=parseInt(w,10);if(n>=256&&n<=420){document.documentElement.style.setProperty("--sidebar-width",n+"px");}else{document.documentElement.style.setProperty("--sidebar-width","256px");}}else{document.documentElement.style.setProperty("--sidebar-width","256px");}}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PwaProvider>
            <LandingShell>{children}</LandingShell>
          </PwaProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
