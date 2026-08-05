"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Mail, Phone } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import logo from "../../../public/assets/navbar/logo.webp";

const NAV_LINKS = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "features", href: "/features" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
];

const LEGAL_LINKS = [
  { labelKey: "footer.legalFaq", href: "/faq" },
  { labelKey: "footer.legalPrivacy", href: "/privacy-policy" },
  { labelKey: "footer.legalRefund", href: "/refund-policy" },
  { labelKey: "footer.legalTerms", href: "/terms-and-conditions" },
];

// lucide-react v1.x ships no brand icons, so socials stay as inline SVG paths.
// Hrefs are the platform home pages until real Escroc profile URLs exist.
const SOCIALS = [
  { label: "X / Twitter", href: "https://x.com", path: "M18 2h3l-7 8 8 12h-6l-5-7-5 7H2l8-9L2 2h6l4 6 6-6z" },
  { label: "LinkedIn", href: "https://linkedin.com", path: "M4.98 3.5A2.5 2.5 0 1 0 5 8.5 2.5 2.5 0 0 0 4.98 3.5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3 0-2.95-1.8-2.95s-2.07 1.4-2.07 2.85V21h-4z" },
  { label: "GitHub", href: "https://github.com", path: "M12 2a10 10 0 0 0-3.16 19.5c.5.08.66-.22.66-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85l-.01 2.75c0 .27.16.57.67.48A10 10 0 0 0 12 2z" },
  { label: "Facebook", href: "https://facebook.com", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
];

const CONTACTS = [
  { label: "support@escroc.com", href: "mailto:support@escroc.com", Icon: Mail },
  { label: "+1 (800) 555-0199",  href: "tel:+18005550199",          Icon: Phone },
];

const TRUST = [
  { label: "256-bit SSL", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { label: "PCI DSS", icon: "M2 7h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 7l0-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1M6 15h4" },
  { label: "GDPR Ready", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" },
];

function FooterColumn({ title, children }) {
  return (
    <div>
      <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-heading">{title}</p>
      <nav className="flex flex-col gap-3">{children}</nav>
    </div>
  );
}

function FooterLink({ href, newTab = false, children }: { href: string; newTab?: boolean; children: ReactNode }) {
  const cls = "group flex w-fit items-center gap-2 text-sm text-muted transition-colors hover:text-primary";
  const underline = <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />;

  // Internal routes navigate client-side; `newTab` (legal/policy pages) opens
  // a fresh tab instead of leaving the current page.
  if (href.startsWith("/") && !newTab) {
    return (
      <Link href={href} className={cls}>
        {underline}
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} className={cls}>
      {underline}
      {children}
    </a>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    setEmail("");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 w-full max-w-xs">
      <div className="flex items-center gap-2 rounded-full border border-border bg-bg backdrop-blur-2xl p-1 pl-4 transition-colors focus-within:border-primary/60">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-white transition-all hover:opacity-90"
        >
          <ArrowRight size={16} strokeWidth={2.4} aria-hidden />
        </button>
      </div>
      {done ? (
        <p className="mt-2 flex items-center gap-1.5 pl-1 text-xs font-semibold text-emerald-600">
          <Check size={13} strokeWidth={3} aria-hidden />
          Thanks! Check your inbox to confirm.
        </p>
      ) : (
        <p className="mt-2 pl-1 text-xs text-muted">Join our newsletter. No spam, ever.</p>
      )}
    </form>
  );
}

export function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface">
      {/* Primary gradient hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent"
      />

      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-20%] -z-10 h-md w-md -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]"
      />

      {/* Main content grid */}
      <Container className="relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">

        {/* ── Brand column ── */}
        <div className="md:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center">
            <Image src={logo} alt={t("brand.name")} width={1583} height={468} className="h-auto w-36" />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
            {t("footer.tagline")}
          </p>

          {/* Newsletter */}
          {/* <Newsletter /> */}

          {/* Social links — open the platform in a new tab until real Escroc
              profile URLs are wired in (see SOCIALS above). */}
          <div className="mt-6 flex gap-2.5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary hover:text-white"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* ── Navigation ── */}
        <FooterColumn title={t("footer.navigation")}>
          {NAV_LINKS.map(({ key, href }) => (
            <FooterLink key={key} href={href}>
              {t(`nav.${key}`)}
            </FooterLink>
          ))}
        </FooterColumn>

        {/* ── Legal — opens in a new tab so reading policy text doesn't lose
              the visitor's place on the current page ── */}
        <FooterColumn title={t("footer.legal")}>
          {LEGAL_LINKS.map(({ labelKey, href }) => (
            <FooterLink key={href} href={href} newTab>{t(labelKey)}</FooterLink>
          ))}
        </FooterColumn>

        {/* ── Contact ── */}
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-heading">{t("footer.contact")}</p>
          <ul className="flex flex-col gap-3">
            {CONTACTS.map((c) => (
              <li key={c.label}>
                <a href={c.href} className="group flex items-center gap-3 text-sm text-muted transition-colors hover:text-primary">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <c.Icon size={15} strokeWidth={2} aria-hidden />
                  </span>
                  {c.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Status badge */}

        </div>

      </Container>


      {/* Giant watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-5 flex translate-y-1/3 select-none justify-center overflow-hidden"
      >
        <span
          className="whitespace-nowrap font-black leading-none tracking-tighter text-[120px] sm:text-[180px] lg:text-[260px]"
          style={{ color: "rgba(var(--heading), 0.03)" }}
        >
          {t("brand.name").toUpperCase()}
        </span>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-border">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-sm text-muted">
            © {year}{" "}
            <span className="inline font-semibold text-heading">{t("brand.name")}</span>.
            {" "}{t("footer.rights")}
          </p>
          <div className="flex items-center gap-5">
            <p className="text-sm text-muted">{t("footer.madeBy")}</p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
