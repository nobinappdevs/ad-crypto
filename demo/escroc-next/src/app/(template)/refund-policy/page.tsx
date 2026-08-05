"use client";

import { useLang } from "@/hooks/useLang";
import { LegalPage } from "@/components/share/LegalPage";

export default function RefundPolicyPage() {
  const { t } = useLang();
  const sections = t("legalPages.refund.sections");

  return (
    <LegalPage
      tag={t("legalPages.refund.tag")}
      title={t("legalPages.refund.title")}
      subtitle={t("legalPages.refund.subtitle")}
      sections={Array.isArray(sections) ? sections : []}
    />
  );
}
