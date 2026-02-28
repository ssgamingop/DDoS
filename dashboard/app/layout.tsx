import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flood Risk Dashboard",
  description: "UI MVP for climate risk and flood analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
