import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AAGS ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="light">
      <body className="font-sans antialiased bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
