import type { Metadata } from "next";
import { Providers } from "../providers";

export const metadata: Metadata = {
  title: "Sign In - Satisfactory Factories",
  description: "Sign in to your Satisfactory Factories account",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}
