import type { Metadata } from "next";
import { FrontierAuthProvider } from "@/components/frontierguard/auth-provider";
import { FrontierGuardProvider } from "@/components/frontierguard/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veridex FrontierGuard Network | Enterprise Control Plane",
  description: "The control plane for autonomous agents. Authorize with passkeys, enforce policy bounds, and collect durable Filecoin-backed evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased">
        <FrontierAuthProvider>
          <FrontierGuardProvider>{children}</FrontierGuardProvider>
        </FrontierAuthProvider>
      </body>
    </html>
  );
}
