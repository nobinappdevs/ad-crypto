import { Outfit } from "next/font/google";
import "../style/globals.css";
import { ThemeProvider } from "@/hooks/useTheme";
import { LangProvider } from "@/hooks/useLang";
import { QueryProvider } from "@/providers/QueryProvider";
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata = {
  title: "Escroc — Money Transfer with Escrow",
  description: "Secure escrow-based money transfer platform.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('escroc_theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <LangProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
