import type { Metadata } from "next";
import { UploadContextProvider } from "@/lib/upload-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clause Radar — Grounded Indian Employment Agreement Review",
  description:
    "Analyze Indian employment agreements with grounded clause citations, missing protection audits, and risk reviews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-paper text-ink font-sans antialiased">
        <UploadContextProvider>{children}</UploadContextProvider>
      </body>
    </html>
  );
}
