import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import { ConvexClientProvider } from "@/components/ConvexProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "StatStage",
  description: "Create story-first sports data visuals from your own datasets.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  const app = <ConvexClientProvider>{children}</ConvexClientProvider>;

  return (
    <html lang="en">
      <body>{hasClerkKeys ? <ClerkProvider>{app}</ClerkProvider> : app}</body>
    </html>
  );
}
