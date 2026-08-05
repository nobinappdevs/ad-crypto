"use client";

import { Diamond, Circle, BarChart2, Globe, Triangle, Square } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const MARKS = [Diamond, Circle, BarChart2, Globe, Triangle, Square];

function Mark({ variant }) {
  const LucideIcon = MARKS[variant % 6];
  return <LucideIcon size={20} strokeWidth={1.8} aria-hidden />;
}

export function Partners() {
  const { t } = useLang();
  const names = t("partners.names");
  const list = Array.isArray(names) ? names : [];

  return (
    <section className="border-y border-border bg-surface py-8">
      {/* Edge fade + horizontal marquee. The track is rendered twice so the
          -50% translate loops seamlessly. */}
      <div className="pause-on-hover relative overflow-hidden mask-[linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div
          data-marquee
          className="flex w-max items-center gap-16 animate-[marquee_28s_linear_infinite]"
        >
          {[...list, ...list].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="flex shrink-0 items-center gap-2.5 text-muted"
            >
              <Mark variant={i % 6} />
              <span className="text-lg font-semibold tracking-tight text-heading">{name}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
