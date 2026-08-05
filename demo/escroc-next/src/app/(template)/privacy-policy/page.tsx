"use client";

import { useLang } from "@/hooks/useLang";
import { LegalPage } from "@/components/share/LegalPage";

export default function PrivacyPolicyPage() {
  const { t } = useLang();
  const sections = t("legalPages.privacy.sections");

  return (
    <LegalPage
      tag={t("legalPages.privacy.tag")}
      title={t("legalPages.privacy.title")}
      subtitle={t("legalPages.privacy.subtitle")}
      sections={Array.isArray(sections) ? sections : []}
    />
  );
}
