import React from 'react';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "GeoAlert — Safety-first crisis alerts",
  description: "Real-time emergency alert platform with offline support",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Global ARIA live region for dynamic announcements */}
        <div
          id="alert-announcer"
          aria-live="polite"
          aria-atomic={false}
          aria-relevant="additions text"
          className="sr-only"
        />
        {children}
      </body>
    </html>
  );
}
