import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRACE | Every Missing Person Deserves to Be Found",
  description:
    "TRACE connects families, volunteers, and authorized case officers to support missing-person reporting and recovery.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
