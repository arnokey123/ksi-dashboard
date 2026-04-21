import type { Metadata } from "next";
import "./globals.css"; // <--- THIS IS THE MOST IMPORTANT LINE

export const metadata: Metadata = {
  title: "KSI",
  description: "Kenya Sector Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">{children}</body>
    </html>
  );
}
