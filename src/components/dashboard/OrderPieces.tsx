"use client";

import { useState, type ReactNode } from "react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import { SelectMenu } from "@/components/dashboard/SelectMenu";
import { FileField, FormLabel, TextAreaField, TextField } from "@/components/dashboard/FormFields";
import { coinBrand, imageUrl } from "@/config/media";
import { acceptAttribute, isFieldRequired, selectOptions } from "@/config/kyc";
import type { ImagePaths } from "@/services/dashboard.service";
import type { KycField, KycValue } from "@/services/kyc.service";

/**
 * The pieces the Buy and Sell order flows share: the summary row, the artwork, the
 * empty states and the operator-declared control.
 */

/**
 * One line of a summary: a glyph, what the line is, and what it is set to. The
 * glyph square is a fixed size so every row lines up down the column.
 */
export function SummaryLine({
  icon,
  label,
  strong,
  plain,
  children,
}: {
  icon: ReactNode;
  label: string;
  /** The figure that matters most on the page: heavier label, no muted grey. */
  strong?: boolean;
  /** The icon is already its own artwork — a coin badge — so skip the tint. */
  plain?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span
        aria-hidden
        className={cn(
          "grid! h-8 w-8 shrink-0 place-items-center",
          !plain && "rounded-lg bg-primary/10 text-primary",
        )}
      >
        {icon}
      </span>
      <dt
        className={cn(
          "min-w-0 flex-1 text-[12.5px]!",
          strong ? "font-bold! text-heading" : "text-muted",
        )}
      >
        {label}
      </dt>
      <dd className="min-w-0 max-w-[58%] text-end text-[12.5px]! font-semibold! text-heading">
        {children}
      </dd>
    </div>
  );
}

/** The centred card a loading failure and an empty state share. */
export function StatePanel({
  icon,
  title,
  tone = "info",
  children,
}: {
  icon: ReactNode;
  title: string;
  tone?: "info" | "bad";
  children: ReactNode;
}) {
  return (
    <Panel className="mx-auto mt-6 max-w-140 p-6 text-center">
      <span
        aria-hidden
        className={cn(
          "mx-auto grid! h-12 w-12 place-items-center rounded-full",
          tone === "bad" ? "bg-hero-neg/10 text-hero-neg" : "bg-primary/10 text-primary",
        )}
      >
        {icon}
      </span>
      <h2 className="mt-4 text-[16px]! font-bold!">{title}</h2>
      <div className="mx-auto mt-1.5 max-w-100 text-[13px]! leading-relaxed! text-muted">
        {children}
      </div>
    </Panel>
  );
}

/**
 * The API's coin image, with the brand disc as fallback. A plain `<img>` — images
 * are unoptimized in this static export and the host comes from an env var.
 * Typed structurally, since every payload names these two fields the same way.
 */
export function CoinArt({
  currency,
  paths,
  size = 30,
}: {
  currency: { code?: string; flag?: string } | undefined;
  paths: ImagePaths | undefined;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const code = (currency?.code ?? "").toUpperCase();
  const brand = coinBrand(code);
  const flag = imageUrl(paths, currency?.flag);

  if (!flag || broken) return <CoinBadge color={brand.color} glyph={brand.glyph} size={size} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flag}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setBroken(true)}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover"
    />
  );
}

/** A payment method's logo, falling back to its currency symbol. */
export function MethodArt({
  gateway,
  paths,
}: {
  gateway: { image?: string | null; currency_code?: string; currency_symbol?: string };
  paths: ImagePaths | undefined;
}) {
  const [broken, setBroken] = useState(false);
  const logo = gateway.image ? imageUrl(paths, gateway.image) : "";

  if (!logo || broken) {
    return (
      <span
        aria-hidden
        className="grid! h-7.5 w-7.5 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px]! font-bold! text-primary"
      >
        {gateway.currency_symbol || (gateway.currency_code ?? "").slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      width={30}
      height={30}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-7.5 w-7.5 shrink-0 rounded-lg object-contain"
    />
  );
}

/**
 * One control from an operator-declared form, chosen by the field's own `type`.
 * Same declaration shape as KYC, which every configurable form here uses. `ns` is
 * the page's translation namespace.
 */
export function DynamicField({
  field,
  value,
  error,
  ns,
  onChange,
}: {
  field: KycField;
  value: KycValue;
  error: string | null;
  ns: string;
  onChange: (value: KycValue) => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`${ns}.${name}`);

  const label = field.label || field.name;
  const required = isFieldRequired(field);
  const text = typeof value === "string" ? value : "";
  // A file picker and a paragraph both want the full row; a text input does not.
  const wide = field.type === "file" || field.type === "textarea" ? "sm:col-span-2" : undefined;

  if (field.type === "file") {
    const mimes = field.validation?.mimes;
    return (
      <FileField
        required={required}
        label={label}
        // The limits come from the API, so they are stated rather than assumed.
        hint={
          mimes?.length
            ? k("fileHint")
                .replace("{types}", mimes.join(", ").toUpperCase())
                .replace("{max}", String(field.validation?.max ?? "—"))
            : undefined
        }
        accept={acceptAttribute(mimes)}
        placeholder={k("filePlaceholder")}
        browseLabel={k("fileBrowse")}
        removeLabel={k("fileRemove")}
        file={value instanceof File ? value : null}
        onChange={(file) => onChange(file)}
        error={error}
        className={wide}
      />
    );
  }

  if (field.type === "select") {
    return (
      <div className="min-w-0">
        <FormLabel required={required}>{label}</FormLabel>
        <SelectMenu
          label={label}
          value={text}
          options={selectOptions(field.validation?.options)}
          placeholder={k("chooseOne")}
          showHintInTrigger={false}
          onChange={onChange}
        />
        {error && <p className="mt-1.5 text-[12px]! text-hero-neg">{error}</p>}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <TextAreaField
        required={required}
        label={label}
        value={text}
        onChange={onChange}
        error={error}
        rows={3}
        className={wide}
      />
    );
  }

  return (
    <TextField
      required={required}
      type={field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
      label={label}
      value={text}
      onChange={onChange}
      error={error}
    />
  );
}
