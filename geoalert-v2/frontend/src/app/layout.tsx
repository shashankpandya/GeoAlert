import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppNav } from '@/components/AppNav';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'GeoAlert — Safety-first crisis alerts', template: '%s | GeoAlert' },
  description: 'Real-time emergency alert platform with offline support, official source verification, and WCAG 2.2 AA accessibility.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f6fa' },
    { media: '(prefers-color-scheme: dark)',  color: '#0d1117' },
  ],
};

// Blocking script — runs before React, prevents theme flash
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('ga-theme');
      var dark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    } catch(e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/* Blocking theme script prevents flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <div id="alert-announcer" aria-live="polite" aria-atomic={false}
               aria-relevant="additions text" className="sr-only" />
          <AppNav />
          <main id="main-content">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
