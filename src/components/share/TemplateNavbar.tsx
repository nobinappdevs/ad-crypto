"use client";

import { Navbar } from "./Navbar";

/**
 * Kept as a thin wrapper so the template layout has one nav entry point. Every
 * public page uses the banner's nav bar — there is no separate variant.
 */
export function TemplateNavbar() {
  return <Navbar />;
}
