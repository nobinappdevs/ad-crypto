/**
 * A coin's mark: its glyph on its brand colour. Shared by the trade pages so a
 * coin looks the same in a picker row, a trigger and a summary card.
 *
 * The inset highlight is what keeps the flat brand colour from reading as a
 * sticker at 30px — it gives the disc a light source.
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
