/**
 * The public site's primary navigation. Shared by the hero's own nav bar and the
 * template navbar so the two can never drift apart.
 */
export const NAV_LINKS = [
  { key: "nav.home", href: "/" },
  { key: "nav.about", href: "/about" },
  { key: "nav.service", href: "/service" },
  { key: "nav.webJournal", href: "/web-journal" },
  { key: "nav.contact", href: "/contact" },
] as const;
