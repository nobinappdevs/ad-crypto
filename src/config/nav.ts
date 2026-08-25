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

/**
 * Which nav link the current path belongs to. One rule for the desktop row and the
 * mobile sheet, so they cannot disagree.
 *
 * `/` is matched exactly — as a prefix it matches every route. Everything else claims
 * its subtree, which keeps "Web Journal" lit at `/web-journal/details`. The trailing
 * slash in the prefix test is load-bearing: a bare `startsWith("/service")` would
 * also light up on a future `/services-pricing`.
 */
export const isNavActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
