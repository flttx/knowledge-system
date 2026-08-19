import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";

import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getRequestLocale } from "@/lib/i18n/server";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7f5",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: {
    default: "Knowledge · Reading workspace",
    template: "%s · Knowledge",
  },
  description: "A private, reading-first knowledge workspace.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  return (
    <html
      lang={locale}
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {/*
          Editorial Workspace contract — content pages lead, utility chrome recedes;
          warm neutral surfaces, one muted accent, compact rows, and purpose-built
          widths keep reading and writing calm without dashboard framing.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
