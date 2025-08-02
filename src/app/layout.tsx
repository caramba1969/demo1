import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "../components/TopNav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Satisfactory Factories Planner",
  description: "A modern factory planning tool for Satisfactory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-neutral-950 text-neutral-100 font-sans">
        <Providers>
          <div className="min-h-screen">
            <TopNav />
            <div className="flex min-h-[calc(100vh-3rem)]">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
