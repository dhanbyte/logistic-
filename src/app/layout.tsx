import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Shipwave Logistics", template: "%s | Shipwave Logistics" },
  description:
    "Next-generation Indian e-commerce shipping aggregator with multi-courier rate optimization, live AWB tracking, NDR workflows, and instant COD remittance.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Toaster richColors position="top-right" />
        {children}
      </body>
    </html>
  );
}
