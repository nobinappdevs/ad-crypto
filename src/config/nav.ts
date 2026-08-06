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
 * Which nav link the current path belongs to. One rule, shared by the desktop row
 * and the mobile sheet, so the two can never disagree about where you are.
 *
 * `/` is matched exactly — as a prefix it is a prefix of every route, so Home
 * would stay lit on every page. Everything else claims its subtree, which is what
 * keeps "Web Journal" marked while you are reading an article at
 * `/web-journal/details`.
 *
 * The trailing slash in the prefix test is load-bearing: a bare
 * `startsWith("/service")` would also light up on a future `/services-pricing`.
 */
export const isNavActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
