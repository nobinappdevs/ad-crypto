"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { useLang } from "@/hooks/useLang";

export const OTP_LENGTH = 6;

/**
 * The 6-digit code field, as one box per digit.
 *
 * One `<input maxLength={6}>` is simpler, but it gives the user no sense of how
 * far through the code they are and it fights every password manager and SMS
 * autofill on the way in. Six boxes make the length obvious before the first
 * keystroke, and the progress rule under them turns "did that register?" into
 * something visible.
 *
 * The value is held as one string by the caller, not six — the form submits a
 * code, and six pieces of state would have to be joined back together anyway.
 * Everything the boxes need is derived from it, so a paste, a backspace and a
 * resend all reduce to setting one string.
 *
 * Keyboard behaviour worth keeping: typing advances, Backspace on an empty box
 * steps back and clears the one before it, the arrows walk the row, and a paste
 * anywhere in the row fills from the left and parks the caret after the last
 * digit that landed.
 */
export function AuthOtpBoxes({
  value,
  onChange,
  onComplete,
  error,
  autoFocus,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Fired once the sixth digit lands — lets the form submit without a click. */
  onComplete?: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const { t } = useLang();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");
  const filled = value.length;

  /** Report the whole code back up, and announce it once it is complete. */
  function commit(next: string) {
    const code = next.slice(0, OTP_LENGTH);
    onChange(code);
    if (code.length === OTP_LENGTH) onComplete?.(code);
  }

  function focusBox(index: number) {
    inputRefs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();
  }

  function handleChange(index: number, raw: string) {
    if (!/^\d*$/.test(raw)) return;

    // Only the last character typed: with a digit already in the box the field
    // holds two, and the second one is the one the user just meant.
    const digit = raw.slice(-1);

    // The slot was emptied (Delete, or a cut). One string cannot hold a gap, so
    // the code is cut here — the alternative is silently sliding every later
    // digit one box to the left, which looks like the field eating input.
    if (!digit) {
      commit(value.slice(0, index));
      focusBox(index);
      return;
    }

    const next = value.slice(0, index) + digit + value.slice(index + 1);
    commit(next);
    // Follow the code's actual length rather than assuming index + 1: clicking
    // ahead of what is typed lands the digit at the end, and the caret has to be
    // where the digit went.
    focusBox(Math.min(next.length, index + 1));
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      // A filled box clears itself; an empty one steps back and clears the box
      // before it — the behaviour a single long field would have.
      const cut = digits[index] ? index : index - 1;
      if (cut < 0) return;
      commit(value.slice(0, cut));
      focusBox(cut);
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(index - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    commit(pasted);
    focusBox(pasted.length);
  }

  return (
    <div>
      <div className="flex gap-2 sm:gap-2.5" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            // Selecting on focus means typing over a filled box replaces the digit
            // instead of appending to it.
            onFocus={(e) => e.target.select()}
            aria-label={t("authPanel.digitLabel").replace("{n}", String(index + 1))}
            aria-invalid={Boolean(error)}
            className="h-14 min-w-0 flex-1 rounded-xl border text-center text-[20px]! font-bold! text-panel-fg outline-none transition-[border-color,background,box-shadow] duration-250 focus:border-primary focus:shadow-[0_0_0_4px_rgb(1_148_252_/_0.14)] disabled:opacity-60 sm:h-15 sm:text-[22px]!"
            style={{
              borderColor: error
                ? "#d4483f"
                : digit
                  ? "rgb(var(--primary__color))"
                  : "var(--panel-border)",
              background: digit ? "rgb(var(--primary__color) / 0.08)" : "var(--panel-field)",
              color: digit ? "rgb(var(--primary__color))" : undefined,
            }}
          />
        ))}
      </div>

      {/* Progress rule — the row above has no other way to show 4 of 6. */}
      <div
        aria-hidden
        className="mt-3 h-0.5 overflow-hidden rounded-full"
        style={{ background: "var(--panel-border)" }}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${(filled / OTP_LENGTH) * 100}%` }}
        />
      </div>

      {error && <span className="mt-2 block text-[12.5px]! text-[#d4483f]">{error}</span>}
    </div>
  );
}
