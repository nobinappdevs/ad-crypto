"use client";

/**
 * The gift illustration shared by the About and Auth promo panels.
 *
 * A fixed 340x330 canvas: the SVG gift box, an orbiting coin pair, four sparks
 * and five coin badges are all pinned to exact coordinates, and the way they
 * overlap IS the picture — so it is rendered at its real size and uniformly
 * scaled to whatever width is available (see useFitScale) rather than reflowed.
 *
 * Every offset, radius, timing and delay below is the source design's. The three
 * SVG groups float on deliberately out-of-phase loops (6.6s / 6.6s / 7.5s) and
 * the badges add five more (5.2s-7.2s) with staggered delays, which is what keeps
 * the scene from pulsing as one block.
 */
import { useId } from "react";
import { useFitScale } from "@/hooks/useFitScale";

const SCENE_W = 340;
const SCENE_H = 330;

const ACCENT = "rgb(var(--primary__color))";

/** left / top / size / rotation / loop, in canvas coordinates. */
const SPARKS = [
  { left: 62, top: 62, size: 8, color: ACCENT, duration: "3.2s", delay: "0s" },
  { left: 292, top: 118, size: 6, color: "#67bffe", duration: "2.6s", delay: "0.7s" },
  { left: 34, top: 168, size: 5, color: "#67bffe", duration: "3.6s", delay: "1.4s" },
  { left: 306, top: 268, size: 7, color: ACCENT, duration: "3s", delay: "1.9s" },
];

export function GiftScene() {
  // Gradient ids have to be unique per document, and this scene can appear more
  // than once in a tree, so they are namespaced by React's own id — stripped of
  // everything but word characters, since React wraps it in punctuation that a
  // `url(#…)` reference cannot carry.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;

  const { attach, scale } = useFitScale(SCENE_W);

  return (
    <div
      ref={attach}
      data-promo-scene
      className="w-full max-w-85"
      style={{ height: SCENE_H * scale }}
    >
      <div
        className="relative"
        style={{
          width: SCENE_W,
          height: SCENE_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <svg
          viewBox="0 0 340 330"
          className="absolute inset-0"
          style={{ width: SCENE_W, height: SCENE_H, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <linearGradient id={id("giftFrontL")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#67bffe" stopOpacity="0.42" />
              <stop offset="1" stopColor="#0194fc" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id={id("giftFrontR")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0194fc" stopOpacity="0.34" />
              <stop offset="1" stopColor="#015c97" stopOpacity="0.42" />
            </linearGradient>
            <linearGradient id={id("giftInner")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#013b63" stopOpacity="0.55" />
              <stop offset="1" stopColor="#0194fc" stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id={id("lidTop")} x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#e9f0f6" />
              <stop offset="1" stopColor="#c3d0dc" />
            </linearGradient>
            <linearGradient id={id("lidEdge")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c9d5e0" />
              <stop offset="1" stopColor="#93a4b4" />
            </linearGradient>
            <linearGradient id={id("bowGrad")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#67bffe" />
              <stop offset="1" stopColor="#0194fc" />
            </linearGradient>
          </defs>

          {/* Backdrop: the tilted orbit ring, one loose dot and the thin arc. */}
          <ellipse
            cx="172"
            cy="228"
            rx="126"
            ry="46"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.1"
            strokeOpacity="0.45"
            transform="rotate(-11 172 228)"
          />
          <circle cx="48" cy="238" r="4.4" fill={ACCENT} />
          <path
            d="M126 128 C 166 92, 222 100, 244 136"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.1"
            strokeOpacity="0.35"
          />

          {/* Bow */}
          <g
            style={{
              animation: "promo-float 6.6s ease-in-out infinite",
              transformOrigin: "170px 96px",
            }}
          >
            <path
              d="M170 104 C 132 104, 112 74, 132 58 C 152 43, 166 78, 170 104 Z"
              fill={url("bowGrad")}
              fillOpacity="0.25"
              stroke={url("bowGrad")}
              strokeWidth="9"
              strokeLinejoin="round"
            />
            <path
              d="M170 104 C 208 104, 228 74, 208 58 C 188 43, 174 78, 170 104 Z"
              fill={url("bowGrad")}
              fillOpacity="0.25"
              stroke={url("bowGrad")}
              strokeWidth="9"
              strokeLinejoin="round"
            />
            <ellipse cx="170" cy="104" rx="11" ry="8" fill={ACCENT} />
          </g>

          {/* Lid — same 6.6s loop as the bow, so they travel together. */}
          <g
            style={{
              animation: "promo-float 6.6s ease-in-out infinite",
              transformOrigin: "170px 130px",
            }}
          >
            <path
              d="M170 108 L 262 140 L 176 172 L 84 140 Z"
              fill={url("lidTop")}
              stroke="#ffffff"
              strokeOpacity="0.7"
              strokeWidth="1"
            />
            <path d="M84 140 L 176 172 L 176 184 L 84 152 Z" fill={url("lidEdge")} />
            <path d="M176 172 L 262 140 L 262 152 L 176 184 Z" fill="#a8b7c5" />
            <path d="M120 132 L 200 158" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1.4" />
          </g>

          {/* Box */}
          <g
            style={{
              animation: "promo-float-slow 7.5s ease-in-out infinite",
              transformOrigin: "170px 226px",
            }}
          >
            <path
              d="M170 176 L 246 202 L 170 228 L 94 202 Z"
              fill={url("giftInner")}
              stroke="#8ed4ff"
              strokeOpacity="0.6"
              strokeWidth="1.2"
            />
            <path
              d="M94 202 L 170 228 L 170 292 L 94 266 Z"
              fill={url("giftFrontL")}
              stroke="#8ed4ff"
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />
            <path
              d="M170 228 L 246 202 L 246 266 L 170 292 Z"
              fill={url("giftFrontR")}
              stroke="#8ed4ff"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
            <path d="M170 228 L 170 292" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.2" />
            <path d="M104 206 L 104 264" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
            <path d="M236 206 L 236 264" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1" />
          </g>

          <ellipse cx="170" cy="300" rx="86" ry="16" fill={ACCENT} fillOpacity="0.16" />
        </svg>

        {/* Orbit. The wrapper rotates; the two coins ride its top and bottom
            edges, which is what makes them circle the box. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: 70,
            top: 78,
            width: 200,
            height: 200,
            animation: "promo-orbit 26s linear infinite",
          }}
        >
          <div
            className="absolute grid place-items-center rounded-full text-[13px] font-bold text-white"
            style={{
              left: "50%",
              top: -13,
              marginLeft: -13,
              width: 26,
              height: 26,
              background:
                "radial-gradient(circle at 34% 26%, #bfe6ff 0%, rgb(var(--primary__color)) 60%, #0163a0 100%)",
              boxShadow: "0 6px 14px rgb(1 148 252 / 0.4)",
            }}
          >
            ₿
          </div>
          <div
            className="absolute grid place-items-center rounded-full text-[11px] font-bold text-white"
            style={{
              left: "50%",
              bottom: -11,
              marginLeft: -11,
              width: 22,
              height: 22,
              background:
                "radial-gradient(circle at 34% 26%, #e7f6ff 0%, #67bffe 62%, #0177cd 100%)",
              boxShadow: "0 6px 14px rgb(1 148 252 / 0.32)",
            }}
          >
            ₿
          </div>
        </div>

        {SPARKS.map((spark, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute rounded-full"
            style={{
              left: spark.left,
              top: spark.top,
              width: spark.size,
              height: spark.size,
              background: spark.color,
              animation: `promo-spark ${spark.duration} ease-in-out ${spark.delay} infinite`,
            }}
          />
        ))}

        {/* Lead badge — the only one with a sheen sweeping across it. */}
        <div
          aria-hidden
          className="absolute z-3 grid place-items-center overflow-hidden rounded-full text-white"
          style={{
            left: 132,
            top: 148,
            width: 78,
            height: 78,
            background:
              "radial-gradient(circle at 34% 26%, #9edaff 0%, rgb(var(--primary__color)) 52%, #0163a0 100%)",
            border: "4px solid rgb(255 255 255 / 0.78)",
            boxShadow:
              "inset 0 2px 0 rgb(255 255 255 / 0.55), 0 22px 40px rgb(1 148 252 / 0.4)",
            animation: "promo-float 5.8s ease-in-out 0.3s infinite",
          }}
        >
          <span
            className="absolute"
            style={{
              top: "-20%",
              left: 0,
              width: "34%",
              height: "140%",
              background:
                "linear-gradient(90deg, transparent, rgb(255 255 255 / 0.55), transparent)",
              transform: "skewX(-18deg)",
              animation: "promo-sheen 4.4s ease-in-out infinite",
            }}
          />
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8.6 6.6h4.6a2.7 2.7 0 010 5.4H8.6h5.2a2.7 2.7 0 010 5.4H8.6" />
            <path d="M8.6 6.6v10.8M10.9 4.2v2.4M13.6 4.2v2.4M10.9 17.4v2.4M13.6 17.4v2.4" />
          </svg>
        </div>

        <div
          aria-hidden
          className="absolute z-3 grid place-items-center rounded-full text-white"
          style={{
            left: 162,
            top: 218,
            width: 58,
            height: 58,
            background:
              "radial-gradient(circle at 34% 26%, #c6e9ff 0%, #38adfd 56%, #0177cd 100%)",
            border: "3px solid rgb(255 255 255 / 0.7)",
            boxShadow: "0 18px 32px rgb(1 148 252 / 0.34)",
            animation: "promo-float 6.8s ease-in-out 0.9s infinite",
          }}
        >
          <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 7h4.2a2.5 2.5 0 010 5H9h4.6a2.5 2.5 0 010 5H9" />
            <path d="M9 7v10M11.4 4.8V7M11.4 17v2.2" />
          </svg>
        </div>

        <div
          aria-hidden
          className="absolute grid place-items-center rounded-full text-white"
          style={{
            left: 226,
            top: 12,
            width: 46,
            height: 46,
            background:
              "radial-gradient(circle at 34% 26%, #a6dfff 0%, rgb(var(--primary__color)) 58%, #0163a0 100%)",
            border: "2px solid rgb(255 255 255 / 0.6)",
            boxShadow: "0 14px 26px rgb(1 148 252 / 0.34)",
            animation: "promo-float 5.2s ease-in-out 0.5s infinite",
          }}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.4 7.2h3.8a2.4 2.4 0 010 4.8H9.4h4.2a2.4 2.4 0 010 4.8H9.4" />
            <path d="M9.4 7.2v9.6M11.6 5.2v2M11.6 16.8v2" />
          </svg>
        </div>

        {/* The two tilted badges. `rotate` is baked into the same transform the
            float animation drives, so it has to be part of the keyframe's own
            start value — which is why these carry their rotation inline and the
            animation still wins: the loop replaces `transform` wholesale. */}
        <div
          aria-hidden
          className="absolute grid place-items-center rounded-full"
          style={{
            left: 8,
            top: 250,
            width: 62,
            height: 62,
            background:
              "radial-gradient(circle at 34% 26%, #e7f6ff 0%, #67bffe 52%, #0177cd 100%)",
            border: "3px solid rgb(255 255 255 / 0.85)",
            boxShadow: "0 18px 30px rgb(1 60 110 / 0.32)",
            color: "#014a80",
            transform: "rotate(-18deg)",
            animation: "promo-float 6.2s ease-in-out 1.3s infinite",
          }}
        >
          <svg
            width="27"
            height="27"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="8.4" strokeOpacity="0.45" />
            <path d="M9.6 7.8h3.6a2.3 2.3 0 010 4.6H9.6h4a2.3 2.3 0 010 4.6H9.6" />
            <path d="M9.6 7.8v9.2M11.7 6v1.8M11.7 17v1.8" />
          </svg>
        </div>

        <div
          aria-hidden
          className="absolute grid place-items-center rounded-full"
          style={{
            left: 258,
            top: 204,
            width: 68,
            height: 52,
            background:
              "radial-gradient(circle at 38% 24%, #24384c 0%, #0b1c2b 58%, #061421 100%)",
            border: "2px solid rgb(103 191 254 / 0.75)",
            boxShadow: "0 18px 32px rgb(0 0 0 / 0.4)",
            color: "#8ed4ff",
            transform: "rotate(24deg)",
            animation: "promo-float 7.2s ease-in-out 1.8s infinite",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 8.6c-.7-1.2-1.9-1.8-3.2-1.8-1.8 0-3.1 1-3.1 2.4 0 1.5 1.5 2 3.2 2.5s3.2 1 3.2 2.5c0 1.4-1.4 2.4-3.2 2.4-1.4 0-2.6-.6-3.2-1.8" />
            <path d="M12 4.4v15.2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
