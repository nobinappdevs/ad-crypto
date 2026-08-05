/**
 * Tiny className joiner — filters out falsy values and joins with a space.
 * Keeps a clsx-like API without adding a dependency.
 *
 *   cn("a", cond && "b", undefined, ["c", "d"]) → "a b c d"
 */
type ClassValue = string | number | false | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else {
      out.push(String(input));
    }
  }
  return out.join(" ");
}
