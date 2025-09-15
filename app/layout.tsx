import { Inter } from "next/font/google";

import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AAGS ",
};


const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="light">
      <body className={`${fontSans.variable} font-sans antialiased bg-white text-neutral-900`}>
        {children}
      </body>
    </html>
  );
}
