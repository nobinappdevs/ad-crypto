/**
 * A coin's mark: its glyph on its brand colour, shared by the trade pages. The
 * inset highlight is what keeps the flat colour from reading as a sticker at 30px.
 */
export function CoinBadge({
  color,
  glyph,
  size = 30,
}: {
  color: string;
  glyph: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="grid! shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.5,
        boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.35)",
      }}
    >
      {glyph}
    </span>
  );
}
