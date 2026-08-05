"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Type, FileText, UploadCloud, Send, X } from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLang } from "@/hooks/useLang";

export function CreateTicket() {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<string[]>([]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const names = Array.from(e.target.files ?? []).map((f) => f.name);
    setFiles(names);
  }

  function clearFiles() {
    setFiles([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* back link */}
      <Link
        href="/dashboard/support"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted transition hover:text-heading"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden />
        {t("dashboard.support.back")}
      </Link>

      <Panel>
        <PanelHeader title={t("dashboard.support.createTitle")} />

        <div className="flex flex-col gap-6 p-4 sm:p-6">
          {/* subject */}
          <Input
            type="text"
            label={t("dashboard.support.subject")}
            required
            leftIcon={<Type size={16} strokeWidth={2} aria-hidden />}
            placeholder={t("dashboard.support.subjectPlaceholder")}
          />

          {/* message */}
          <Input
            type="textarea"
            label={t("dashboard.support.message")}
            required
            rows={6}
            leftIcon={<FileText size={16} strokeWidth={2} aria-hidden />}
            placeholder={t("dashboard.support.messagePlaceholder")}
          />

          {/* attachments */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("dashboard.support.attachments")} <span className="inline font-medium normal-case text-primary">{t("dashboard.support.optional")}</span>
            </label>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center transition hover:border-primary/50 hover:bg-primary/5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                <UploadCloud size={20} strokeWidth={2} aria-hidden />
              </span>
              <span className="text-sm font-medium text-body">{t("dashboard.support.dropHint")}</span>
              <span className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted">
                {t("dashboard.support.browse")}
              </span>
            </button>

            <input ref={fileRef} type="file" multiple onChange={onPick} className="hidden" />

            {/* picked files */}
            {files.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {files.map((name) => (
                  <span key={name} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-body">
                    {name}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={clearFiles}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-muted transition hover:text-red-500"
                >
                  <X size={13} strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            )}
          </div>

          {/* submit */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            leftIcon={<Send size={16} strokeWidth={2.5} aria-hidden />}
          >
            {t("dashboard.support.submit")}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
