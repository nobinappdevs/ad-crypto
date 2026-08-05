// Editorial section label: a short primary rule + wide-tracked uppercase tag,
// with the heading below. The <h2> carries no color/size classes so it inherits
// the h2 design from globals.css.
export function SectionHeader({ tag, title, align = "left", className = "" }) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
      <div className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
          {tag}
        </span>
      </div>
      {title ? <h2 className="mt-5">{title}</h2> : null}
    </div>
  );
}
