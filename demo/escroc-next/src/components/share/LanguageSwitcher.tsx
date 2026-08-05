"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useLang } from "@/hooks/useLang";

function Chevron({ open }) {
  return (
    <ChevronDown
      size={12}
      strokeWidth={2.5}
      style={{ transition: "transform 200ms ease", transform: open ? "rotate(180deg)" : "none" }}
      aria-hidden
    />
  );
}

export function LanguageSwitcher({ className = "" }) {
  const { lang, setLang, languages, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = languages.find((l) => l.code === lang) ?? languages[0];

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(code) {
    setLang(code);
    setOpen(false);
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.select")}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-body transition-colors hover:border-primary/50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Globe size={15} strokeWidth={2} aria-hidden />
        <span>{current.code.toUpperCase()}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute inset-e-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-bg py-1 shadow-card"
        >
          {languages.map((l) => {
            const active = l.code === current.code;
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => choose(l.code)}
                  className={`flex w-full cursor-pointer items-center justify-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "text-body hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <span className='text-center!'>{l.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
