"use client";

import { useLang } from "@/hooks/useLang";
import { LegalPage } from "@/components/share/LegalPage";

export default function TermsAndConditionsPage() {
  const { t } = useLang();
  const sections = t("legalPages.terms.sections");

  return (
    <LegalPage
      tag={t("legalPages.terms.tag")}
      title={t("legalPages.terms.title")}
      subtitle={t("legalPages.terms.subtitle")}
      sections={Array.isArray(sections) ? sections : []}
    />
  );
}
