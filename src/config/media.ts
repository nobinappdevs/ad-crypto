import type { ImagePaths } from "@/services/dashboard.service";

/**
 * Resolves the API's three-part image references into one URL.
 *
 * The backend sends a host, a category directory, a per-record filename — and a
 * `default_image` that is relative to the HOST rather than to `path_location`, which
 * is the part worth stating: joined the same way, the fallback lands in the wrong
 * directory. Returns "" when there is nothing to show and no default.
 */
export function imageUrl(paths: ImagePaths | undefined, file: string | null | undefined): string {
  const base = trimSlashes(paths?.base_url);
  if (!base) return "";

  if (file) {
    const dir = trimSlashes(paths?.path_location);
    return dir ? `${base}/${dir}/${trimSlashes(file)}` : `${base}/${trimSlashes(file)}`;
  }

  const fallback = trimSlashes(paths?.default_image);
  return fallback ? `${base}/${fallback}` : "";
}

function trimSlashes(value: string | null | undefined) {
  return (value ?? "").replace(/^\/+|\/+$/g, "");
}

/**
 * Brand colour and glyph per ticker, for the disc behind a coin — what stands in
 * when the API's flag image is missing. A coin is recognised by its colour before
 * its name, which is why this is not a neutral grey circle.
 */
const COIN_BRAND: Record<string, { color: string; glyph: string }> = {
  BTC: { color: "#f7931a", glyph: "₿" },
  ETH: { color: "#627eea", glyph: "Ξ" },
  USDT: { color: "#26a17b", glyph: "₮" },
  USDC: { color: "#2775ca", glyph: "$" },
  DOGE: { color: "#c3a634", glyph: "Ð" },
  LTC: { color: "#345d9d", glyph: "Ł" },
  SOL: { color: "#14f195", glyph: "◎" },
  XRP: { color: "#23292f", glyph: "✕" },
  BNB: { color: "#f3ba2f", glyph: "B" },
  TRX: { color: "#eb0029", glyph: "T" },
};

/** Falls back to the app's own primary and the ticker's first letter. */
export function coinBrand(code: string | undefined) {
  const ticker = (code ?? "").toUpperCase();
  return COIN_BRAND[ticker] ?? { color: "#2f5ae7", glyph: ticker.slice(0, 1) || "•" };
}
