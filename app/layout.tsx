import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ConvexClientProvider } from "@/components/ConvexProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "StatStage",
  description: "Create story-first sports data visuals from your own datasets.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
