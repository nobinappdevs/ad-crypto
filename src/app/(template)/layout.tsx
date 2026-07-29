import type { ReactNode } from "react";
import { TemplateNavbar } from "@/components/share/TemplateNavbar";
import { Footer } from "@/components/share/Footer";

export default function TemplateLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TemplateNavbar />
      {children}
      <Footer />
    </>
  );
}
