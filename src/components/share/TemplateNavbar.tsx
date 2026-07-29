"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

/**
 * The home page's hero scene renders its own nav as part of the design, so the
 * shared navbar would double up there. Every other public page keeps it.
 */
export function TemplateNavbar() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <Navbar />;
}
