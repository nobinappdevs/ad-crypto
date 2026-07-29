import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "../style/globals.css";
import { ThemeProvider } from "@/hooks/useTheme";
import { LangProvider } from "@/hooks/useLang";
import { QueryProvider } from "@/providers/QueryProvider";

const jost = Jost({ variable: "--font-jost", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AdCrypto — Multi-currency crypto wallet",
  description:
    "Manage multiple cryptocurrency wallets, buy and sell crypto, and stay protected with KYC, 2FA and real-time alerts.",
};

// Runs before paint -> no light/dark flash on first load.
const themeScript = `(function(){try{var t=localStorage.getItem('adcrypto_theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <LangProvider>
            <QueryProvider>{children}</QueryProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
