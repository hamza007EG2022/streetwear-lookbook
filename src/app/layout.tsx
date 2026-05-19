import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getData } from "@/lib/store";
import { stripSensitiveData } from "@/lib/public-data";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";
import ChatWidget from "@/components/ChatWidget";
import { DataProvider } from "@/components/DataContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TRIO-Fashion Streetwear",
  description: "Urban Luxury Streetwear Collection",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fullData = await getData();
  const publicData = stripSensitiveData(fullData);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <DataProvider data={publicData}>
          <ThemeProvider>
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatWidget />
          </ThemeProvider>
        </DataProvider>
      </body>
    </html>
  );
}
