import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { fontBody, fontDisplay } from '@/src/lib/fonts';
import { ThemeProvider } from '@/components/PenyediaTema';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PERUMDA Tirtawening Kota Bandung',
    template: '%s | PERUMDA Tirtawening',
  },
  description:
    'Sistem Enterprise Baca Meter (Cater), Pelanggan, dan Penagihan PERUMDA Tirtawening Kota Bandung.',
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
            __html: `try{var w=localStorage.getItem("elysia-sidebar-width");if(w){var n=parseInt(w,10);if(n>=256&&n<=420){document.documentElement.style.setProperty("--sidebar-width",n+"px");}else{document.documentElement.style.setProperty("--sidebar-width","256px");localStorage.setItem("elysia-sidebar-width","256");}}else{document.documentElement.style.setProperty("--sidebar-width","256px");}}catch(e){}`,
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
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
