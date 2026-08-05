"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { InputProps } from "@/components/ui/Input";
import { useLang } from "@/hooks/useLang";

/**
 * Password Input with a built-in show/hide toggle and lock icon.
 * Forwards every Input prop (value, onChange, placeholder, error, required…).
 */
export function PasswordField(props: InputProps) {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  return (
    <Input
      {...props}
      type={show ? "text" : "password"}
      leftIcon={<Lock size={16} strokeWidth={2} aria-hidden />}
      rightIcon={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={t("auth.togglePassword")}
          className="cursor-pointer text-muted transition hover:text-primary"
        >
          {show ? <EyeOff size={16} strokeWidth={2} aria-hidden /> : <Eye size={16} strokeWidth={2} aria-hidden />}
        </button>
      }
    />
  );
}
