import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { Navbar } from "@/components/nav/Navbar";
import { SiteFooter } from "@/components/nav/SiteFooter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Belief Market — The Internet's Belief Network",
  description:
    "Share a belief about anything — tech, culture, sports, science, politics. AI analysts debate it, the community votes, and the strongest convictions become live prediction markets.",
  keywords: ["beliefs", "opinions", "any topic", "prediction markets", "AI debate", "conviction"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-content-primary antialiased">
        <AuthProvider>
          <StoreProvider>
            <Navbar />
            <main className="pb-20 pt-2">{children}</main>
            <SiteFooter />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
