"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useLang } from "@/hooks/useLang";
import { useReveal } from "@/hooks/useReveal";
import { useSubscribe } from "@/hooks/useWebsite";
import { Logo } from "./Logo";

const LAUNCH_YEAR = 2026;

/**
 * Column layout mirrors the design: one wide brand column, then four narrow link
 * columns. `href: "#"` marks a destination the site does not have a route for
 * yet — the label is from the design, so these are the ones to point somewhere
 * real as those pages land.
 */
const LINK_COLUMNS: { key: string; items: { key: string; href: string }[] }[] = [
  {
    key: "about",
    items: [
      { key: "partnership", href: "#" },
      { key: "terms", href: "#" },
      { key: "privacy", href: "#" },
    ],
  },
  {
    key: "product",
    items: [
      { key: "about", href: "/about" },
      { key: "features", href: "/service" },
      { key: "support", href: "/contact" },
    ],
  },
  {
    key: "resources",
    items: [
      { key: "career", href: "#" },
      { key: "blog", href: "/web-journal" },
      { key: "legal", href: "#" },
    ],
  },
  {
    key: "contact",
    items: [
      { key: "site", href: "/" },
      { key: "phone", href: "tel:+15646445965" },
      { key: "address", href: "#" },
    ],
  },
] as const;

const SOCIALS = [
  {
    key: "instagram",
    mark: (
      <>
        <rect
          x="3.6"
          y="3.6"
          width="16.8"
          height="16.8"
          rx="4.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16.8" cy="7.2" r="1.1" />
      </>
    ),
  },
  {
    key: "facebook",
    mark: (
      <path d="M14 8.6h2.4V5.8H14c-2 0-3.6 1.6-3.6 3.6v2H8.4v2.8h2v7h2.8v-7h2.2l.4-2.8h-2.6v-2c0-.5.4-.8.8-.8z" />
    ),
  },
  {
    key: "twitter",
    mark: (
      <path d="M21 6.4c-.7.3-1.4.5-2.2.6a3.5 3.5 0 00-6 3.2A9.9 9.9 0 013.6 5.6a3.5 3.5 0 001.1 4.7c-.6 0-1.2-.2-1.7-.5a3.5 3.5 0 002.8 3.5c-.6.2-1.2.2-1.8.1a3.5 3.5 0 003.3 2.4A9.9 9.9 0 013 17.9a13.9 13.9 0 007.5 2.2c5.4 0 8.6-4.5 8.4-9 .8-.6 1.5-1.3 2.1-2.2-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.9-2.2z" />
    ),
  },
  {
    key: "youtube",
    mark: (
      <>
        <rect
          x="2.8"
          y="5.4"
          width="18.4"
          height="13.2"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M10.4 9.4l4.8 2.6-4.8 2.6z" />
      </>
    ),
  },
] as const;

/** Internal routes go through `Link`; `#`, `tel:` and the like stay plain anchors. */
function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const className = "text-[13.5px]! transition-colors duration-[250ms]";

  if (href.startsWith("/")) {
    return (
      <Link href={href} data-suite-link className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} data-suite-link className={className}>
      {children}
    </a>
  );
}

export function Footer() {
  const { t } = useLang();
  const footerRef = useRef<HTMLElement>(null);
  useReveal(footerRef);

  const [email, setEmail] = useState("");
  const subscribe = useSubscribe(t("footer.newsletter.success"));

  return (
    <footer
      ref={footerRef}
      className="relative pt-10 pb-11 lg:px-14"
      // Flat: see --suite-bg-flat. The gradient put a white core near this box's
      // own top-right, which showed as a bright patch right at the seam with
      // whatever section precedes the footer.
      style={{ background: "var(--suite-bg-flat)" }}
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-0">
        {/* ---------------- Newsletter ---------------- */}
        <div
          data-reveal
          className="flex flex-col items-center gap-6 pt-10 pb-14 text-center sm:gap-[26px] sm:pb-16"
        >
          <h2
            className="text-[clamp(34px,10vw,86px)]! leading-none! font-medium! tracking-[0.02em]"
            style={{ color: "var(--suite-fg)" }}
          >
            {t("footer.newsletter.title")}
          </h2>
          <p
            className="max-w-[560px] text-[14.5px]! leading-[1.7]!"
            style={{ color: "var(--suite-card-muted)" }}
          >
            {t("footer.newsletter.text")}
          </p>

          {/* A real form so Enter submits and the browser validates the address,
              posting to `POST /website/subscribe`. The field is cleared only once
              the server has accepted it — clearing on failure would take the
              address away from someone who then has to retype it. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const address = email.trim();
              if (!address || subscribe.isPending) return;
              subscribe.mutate(address, { onSuccess: () => setEmail("") });
            }}
            className="flex w-full max-w-[400px] items-center gap-4 border-b pb-3"
            style={{ borderColor: "var(--suite-card-br)" }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={subscribe.isPending}
              data-suite-input
              placeholder={t("footer.newsletter.placeholder")}
              aria-label={t("footer.newsletter.placeholder")}
              className="min-w-0 flex-1 border-none bg-transparent py-1 text-[14px] outline-none disabled:opacity-60"
              style={{ color: "var(--suite-fg)" }}
            />
            <button
              type="submit"
              disabled={subscribe.isPending}
              data-suite-send
              title={t("footer.newsletter.submit")}
              aria-label={t("footer.newsletter.submit")}
              className="grid! shrink-0 cursor-pointer place-items-center border-none bg-transparent p-1 transition-[transform,color] duration-[280ms] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>

        <div aria-hidden className="h-px" style={{ background: "var(--suite-card-br)" }} />

        {/* ---------------- Link columns ---------------- */}
        <div className="grid grid-cols-2 gap-10 pt-12 pb-10 sm:grid-cols-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.75fr))] lg:pt-[66px] lg:pb-[54px]">
          <div
            data-reveal
            className="col-span-2 flex flex-col gap-5 sm:col-span-4 lg:col-span-1"
          >
            <Link href="/" className="w-fit">
              <Logo className="max-w-36 lg:max-w-36 xl:max-w-40" />
            </Link>
            <p
              className="max-w-[230px] text-[13.5px]! leading-[1.65]!"
              style={{ color: "var(--suite-card-muted)" }}
            >
              {t("footer.about")}
            </p>
            <div className="mt-1.5 flex gap-[18px]">
              {SOCIALS.map((social) => (
                <a
                  key={social.key}
                  href="#"
                  data-suite-social
                  aria-label={t(`footer.socials.${social.key}`)}
                  className="grid! transition-[color,transform] duration-[250ms]"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    {social.mark}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {LINK_COLUMNS.map((column, i) => (
            <div
              key={column.key}
              data-reveal
              className="flex flex-col gap-[18px]"
              style={{ "--reveal-delay": `${80 + i * 70}ms` } as CSSProperties}
            >
              <span
                className="text-[15px]! font-semibold! tracking-[0.01em]"
                style={{ color: "var(--suite-fg)" }}
              >
                {t(`footer.columns.${column.key}.title`)}
              </span>
              <div className="flex flex-col gap-3.5">
                {column.items.map((item) => (
                  <FooterLink key={item.key} href={item.href}>
                    {t(`footer.columns.${column.key}.items.${item.key}`)}
                  </FooterLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ---------------- Bottom bar ---------------- */}
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-5">
          <span className="text-[12.5px]!" style={{ color: "var(--suite-card-muted)" }}>
            &copy; {LAUNCH_YEAR} {t("footer.brandInline")}. {t("footer.rights")}
          </span>
          {/* `#top` with no matching element is defined to scroll to the top of the
              document, and `html` already has smooth scrolling. */}
          <a
            href="#top"
            data-suite-toplink
            className="text-[12.5px]! font-semibold! tracking-[0.06em] transition-colors duration-[250ms]"
          >
            {t("footer.backToTop")}
          </a>
        </div>
      </div>
    </footer>
  );
}
