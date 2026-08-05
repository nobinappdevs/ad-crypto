"use client";
import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";
import { Recaptcha } from "@/components/share/Recaptcha";
import { useSendContactMessage } from "@/hooks/useContact";
import { useRecaptcha } from "@/hooks/useBasicSettings";

export default function ContactPage() {
  const { t } = useLang();
  const info = t("contactPage.info");
  const infoList = Array.isArray(info) ? info : [];
  const faqItems = t("contactPage.faq.items");
  const faqList = Array.isArray(faqItems) ? faqItems : [];
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const sendMessage = useSendContactMessage();
  const { enabled: recaptchaEnabled, siteKey } = useRecaptcha();
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);

  function handleSubmit(e) {
    e.preventDefault();
    // Block submission until the reCAPTCHA is solved (only when it's enabled).
    if (recaptchaEnabled && !captchaToken) {
      setCaptchaError(t("auth.recaptchaError"));
      return;
    }
    setCaptchaError("");
    sendMessage.mutate(
      { name: form.name, email: form.email, message: form.message, recaptchaToken: captchaToken },
      {
        onSuccess: () => setSent(true),
        onError: () => {
          // The reCAPTCHA token is single-use — reset it so the user can retry.
          setCaptchaToken("");
          setCaptchaReset((n) => n + 1);
        },
      },
    );
  }

  return (
    <>
      {/* Form + Info */}
      <section className="bg-bg py-24 lg:py-32">
        <Container>
          <SectionHeader
            tag={t("contactPage.hero.tag")}
            title={t("contactPage.hero.title")}
          />
        </Container>
        <Container className="grid pt-10 gap-14 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Contact form */}
          <div className="rounded-3xl border border-border bg-card p-8 lg:p-10">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon name="check" size={32} strokeWidth={2.5} />
                </span>
                <p className="mt-4 text-lg font-semibold text-heading">
                  {t("contactPage.form.success")}
                </p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-body">
                      {t("contactPage.form.name")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("contactPage.form.namePlaceholder")}
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                      className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-body placeholder-muted outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-body">
                      {t("contactPage.form.email")}
                    </label>
                    <input
                      type="email"
                      placeholder={t("contactPage.form.emailPlaceholder")}
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                      className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-body placeholder-muted outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-body">
                    {t("contactPage.form.message")}
                  </label>
                  <textarea
                    rows={5}
                    placeholder={t("contactPage.form.messagePlaceholder")}
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    required
                    className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-sm text-body placeholder-muted outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {recaptchaEnabled && (
                  <div>
                    <Recaptcha
                      siteKey={siteKey}
                      resetSignal={captchaReset}
                      onVerify={(token) => {
                        setCaptchaToken(token);
                        if (token) setCaptchaError("");
                      }}
                    />
                    {captchaError && <p className="mt-1.5 text-sm text-rose-500">{captchaError}</p>}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={sendMessage.isPending}
                  className="cursor-pointer group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-sm shadow-primary/25 transition hover:shadow-md hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  {sendMessage.isPending ? t("contactPage.form.sending") : t("contactPage.form.submit")}
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="flex flex-col gap-5">
            {infoList.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon name={item.icon} size={22} />
                  </span>
                  <div>
                    <p className="font-semibold text-heading">{item.title}</p>
                    <p className="mt-1 font-medium text-primary">
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-surface py-24 lg:py-32">
        <Container className="max-w-3xl">
          <SectionHeader
            tag={t("contactPage.faq.tag")}
            title={t("contactPage.faq.title")}
            align="center"
          />
          <div className="mt-12 space-y-3">
            {faqList.map((item, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="cursor-pointer flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-semibold text-heading">{item.q}</span>
                  <span
                    className={`ml-4 shrink-0 text-primary transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  >
                    <Icon
                      name="arrow"
                      size={16}
                      strokeWidth={2.2}
                      className="rotate-90"
                    />
                  </span>
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-6 pb-5 pt-4">
                    <p className="leading-relaxed text-muted">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
