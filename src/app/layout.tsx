import type { Metadata } from "next";
import { Geist, Geist_Mono, Audiowide, Bebas_Neue, Oswald, Anton, Rajdhani, Orbitron, Inter, Exo_2, Kanit, Prompt } from "next/font/google";
import "./globals.css";
import { getData } from "@/lib/store";
import { stripSensitiveData } from "@/lib/public-data";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";
import ChatWidget from "@/components/ChatWidget";
import SocialFloat from "@/components/SocialFloat";
import { DataProvider } from "@/components/DataContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const audiowide = Audiowide({ subsets: ["latin"], weight: ["400"] });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: ["400"] });
const oswald = Oswald({ subsets: ["latin"], weight: ["400", "600", "700"] });
const anton = Anton({ subsets: ["latin"], weight: ["400"] });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["400", "600", "700"] });
const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"] });
const exo2 = Exo_2({ subsets: ["latin"], weight: ["400", "600", "700"] });
const kanit = Kanit({ subsets: ["latin"], weight: ["400", "600", "700"] });
const prompt = Prompt({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const MARQUEE_FONT_MAP: Record<string, { style: { fontFamily: string } }> = {
  Audiowide: audiowide,
  "Bebas Neue": bebasNeue,
  Oswald: oswald,
  Anton: anton,
  Rajdhani: rajdhani,
  Orbitron: orbitron,
  Inter: inter,
  "Exo 2": exo2,
  Kanit: kanit,
  Prompt: prompt,
};

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
            <SocialFloat />
            <ChatWidget />
          </ThemeProvider>
        </DataProvider>
      </body>
    </html>
  );
}
