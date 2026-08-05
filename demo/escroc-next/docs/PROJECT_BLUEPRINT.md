# Project Blueprint — Next.js Static SPA (escroc-next pattern)

> **What this file is.**
> A complete, copy-pasteable description of how *this* project is built: folder
> structure, API integration, CSS/typography system, font handling, image
> management, forms, multi-language, theming, and the static (`out/`) build.
>
> **How to use it.**
> Drop this file into a new Next.js project and tell the assistant:
> *"Follow `PROJECT_BLUEPRINT.md` — set the project up exactly this way."*
> Everything needed to reproduce the architecture is here, including the actual
> foundation source files. Nothing else needs to be explained again.
>
> **Reference project:** `escroc-next` (Next.js 16 App Router, static export,
> Laravel REST backend).
> Related docs: [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md) (Bangla,
> deeper API recipe) and [DYNAMIC_CONTENT_ON_STATIC.md](./DYNAMIC_CONTENT_ON_STATIC.md)
> (persisted cache strategy for admin-driven content).

---

## Table of contents

1. [Core decisions](#1-core-decisions)
2. [Dependencies — what and why](#2-dependencies--what-and-why)
3. [Bootstrap a new project](#3-bootstrap-a-new-project)
4. [Folder structure](#4-folder-structure)
5. [Routing and page layout system](#5-routing-and-page-layout-system)
6. [CSS system — Tailwind v4 tokens](#6-css-system--tailwind-v4-tokens)
7. [Typography](#7-typography)
8. [Fonts](#8-fonts)
9. [Theme (light/dark)](#9-theme-lightdark)
10. [Multi-language (i18n)](#10-multi-language-i18n)
11. [API integration architecture](#11-api-integration-architecture)
12. [Forms](#12-forms)
13. [UI component kit](#13-ui-component-kit)
14. [Image management](#14-image-management)
15. [Static export — the `out/` folder](#15-static-export--the-out-folder)
16. [Realtime and push notifications](#16-realtime-and-push-notifications)
17. [Storage keys](#17-storage-keys)
18. [Conventions cheat-sheet](#18-conventions-cheat-sheet)
19. [New feature checklist](#19-new-feature-checklist)
20. [Known gotchas](#20-known-gotchas)

---

## 1. Core decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Next.js 16, **App Router** | Route groups + nested layouts |
| Output | `output: "export"` — fully static SPA | Backend is a separate Laravel API; deploy is a plain `out/` folder on any static host / cPanel |
| Rendering | **All data fetching is client-side** | No server runtime exists in a static export |
| Styling | **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js`) | Design tokens live in `globals.css` |
| Theming | `[data-theme="light"|"dark"]` on `<html>` + CSS variables | No flash, no class-list juggling |
| State/data | **TanStack React Query** (`useQuery`/`useMutation`) | Cache, loading, invalidation for free |
| HTTP | **axios**, two instances (`publicApi` / `privateApi`) | Token attach + 401 handling in one place |
| Validation | **Zod** + `@hookform/resolvers` | One schema = request validation + TS types |
| Forms | **React Hook Form** with `Controller` | Never `useState` per input |
| i18n | **Custom lightweight provider** with JSON dictionaries | No runtime i18n library needed for a static site |
| Icons | **lucide-react** | Tree-shakeable, consistent stroke |
| Toasts | **react-hot-toast** | Fired from hooks, never components |
| React Compiler | **enabled** (`reactCompiler: true`) | Auto-memoization; changes a few rules (see gotchas) |

**The one architectural rule:** a component never calls axios. The chain is always

```
Component  →  Hook (React Query)  →  Service (axios)  →  axios instance
  UI only      toast/navigate/cache    endpoint + shape     baseURL/token/401
```

---

## 2. Dependencies — what and why

### Runtime dependencies

| Package | Used for |
|---|---|
| `next` 16.2.x, `react` 19.2.x, `react-dom` | Framework |
| `axios` | HTTP client (two configured instances) |
| `@tanstack/react-query` | Server-state: queries, mutations, cache invalidation |
| `react-hook-form` | **All** form state |
| `@hookform/resolvers` | Bridges Zod → React Hook Form |
| `zod` | Request/response schemas + inferred TS types |
| `react-hot-toast` | Success/error toasts (fired inside hooks) |
| `lucide-react` | Icon set |
| `swiper` | Sliders / marquee (brand logos, dashboard cards) |
| `qrcode.react` | Crypto deposit address QR codes |
| `emoji-picker-react` | Emoji picker in the escrow chat |
| `pusher-js` | Realtime channel messages (live chat) |
| `@pusher/push-notifications-web` | Web push (Pusher Beams) + service worker |

### Dev dependencies

| Package | Used for |
|---|---|
| `tailwindcss` v4 + `@tailwindcss/postcss` | Styling (PostCSS plugin only — no config file) |
| `typescript`, `@types/*` | Types |
| `eslint`, `eslint-config-next` | Linting (flat config) |
| `babel-plugin-react-compiler` | Required by `reactCompiler: true` |

### Installed but **not** used in this project

`i18next`, `react-i18next`, `i18next-browser-languagedetector` (replaced by the
custom `LangProvider`), and `framer-motion` (all animation is CSS keyframes).
**In a new project, do not install these** unless you actually need them.

```bash
npm install axios @tanstack/react-query react-hook-form @hookform/resolvers zod \
  react-hot-toast lucide-react
# optional, per feature:
npm install swiper qrcode.react emoji-picker-react pusher-js @pusher/push-notifications-web
npm install -D tailwindcss @tailwindcss/postcss babel-plugin-react-compiler
```

There is **no** `clsx` / `tailwind-merge` — a 15-line `cn()` helper covers it
(see [§13](#13-ui-component-kit)).

---

## 3. Bootstrap a new project

### `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node server.js",
    "lint": "eslint"
  }
}
```

> With `output: "export"`, `next start` is not usable. `npm run build` produces
> `out/`; serve that folder statically. `server.js` is only a custom Node server
> kept for the non-export mode — it is not part of the static deploy.

### `next.config.mjs`

```js
const lanDevOrigins = [
  "192.168.*.*",
  "10.*.*.*",
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",          // static SPA → out/
  images: { unoptimized: true }, // required: no image optimizer without a server
  reactCompiler: true,
  allowedDevOrigins: lanDevOrigins, // test on phone over LAN during dev
};

export default nextConfig;
```

### `postcss.config.mjs`

```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

> Tailwind v4 has **no** `tailwind.config.js` and **no** `content` array. All
> configuration is CSS (`@theme`, `@custom-variant`) inside `globals.css`.

### `tsconfig.json` — the two path aliases matter

```jsonc
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,   // required: i18n JSON is imported directly
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@public/*": ["./public/*"]   // lets next/image import static assets cleanly
    }
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `eslint.config.mjs` (flat config)

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

### `.env`

```bash
NEXT_PUBLIC_API_URL=https://your-backend.example.com/api/v1
# optional, per feature
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
```

> Every browser-visible var **must** be prefixed `NEXT_PUBLIC_`.
> **Do not create `.env.local`** — it silently overrides `.env` and causes
> "why is it hitting the old API" confusion.

---

## 4. Folder structure

```
project-root/
├── .env
├── next.config.mjs
├── postcss.config.mjs
├── tsconfig.json
├── eslint.config.mjs
├── docs/                       ← architecture docs (this file)
├── public/
│   ├── assets/                 ← ALL local images, grouped by section
│   │   ├── navbar/logo.webp
│   │   ├── banner/bannerbg.webp
│   │   ├── blog/blog.webp
│   │   ├── brand/brand1..5.webp
│   │   └── dashboard/sidbar/side-bg.webp
│   └── service-worker.js       ← web-push SW (must live at the root scope)
├── out/                        ← build output (gitignored)
└── src/
    ├── app/                    ← routes ONLY — thin files, no business logic
    │   ├── layout.tsx          ← root: font, providers, theme script
    │   ├── not-found.tsx
    │   ├── (auth)/             ← route group: login, register, forgot, otp, reset
    │   ├── (dashboard)/dashboard/…   ← protected app
    │   └── (template)/         ← public marketing site + legal pages
    ├── components/
    │   ├── ui/                 ← primitives: Button, Input, Select, cn
    │   ├── share/              ← cross-area: Navbar, Footer, Container,
    │   │                          ThemeToggle, LanguageSwitcher, Recaptcha…
    │   ├── forms/              ← full form components (LoginForm, …)
    │   ├── auth/               ← auth-page chrome + auth-specific forms
    │   ├── guards/             ← AuthGuard, GuestGuard
    │   ├── homepage/           ← one file per landing-page section
    │   ├── dashboard/
    │   │   ├── DashboardShell.tsx, Sidebar.tsx, Navbar.tsx, ui.tsx
    │   │   └── page/<feature>/ ← the actual screen for each dashboard route
    │   └── context/            ← React contexts (RoleContext…)
    ├── config/env.ts           ← the ONLY place process.env is read
    ├── lib/                    ← framework-free helpers: axios, query-client, …
    ├── services/               ← one file per API domain — axios calls only
    ├── hooks/                  ← one file per API domain — React Query + UX
    ├── schemas/                ← Zod schemas + inferred types
    ├── providers/              ← QueryProvider (+ Toaster)
    ├── i18n/                   ← en.json, es.json, ar.json, fr.json, hi.json
    └── style/globals.css       ← design tokens + base typography
```

### Naming rules

| Thing | Pattern | Example |
|---|---|---|
| Component file | `PascalCase.tsx`, named export matching the file | `AddMoney.tsx` → `export function AddMoney()` |
| Service | `<domain>.service.ts`, exports `<domain>Service` object | `escrow.service.ts` → `escrowService` |
| Hook file | `use<Domain>.ts`, many named hooks inside | `useEscrow.ts` → `useEscrowList`, `useCreateEscrow` |
| Schema | `<domain>.schema.ts` | `auth.schema.ts` |
| Route file | always `page.tsx` / `layout.tsx` | — |
| CSS token | `--color-<role>` in `@theme` | `--color-heading` |

**Golden rule:** `src/app/**` contains routing only. A `page.tsx` is 5–15 lines:
metadata + guard + one imported component. All markup lives in `src/components`.

---

## 5. Routing and page layout system

### Route groups = one layout per *area*

`(auth)`, `(dashboard)`, `(template)` are **route groups** — the parentheses are
stripped from the URL, they only exist to attach a different layout:

| Group | URLs | Layout |
|---|---|---|
| `(template)` | `/`, `/about`, `/blog`, `/faq`, `/privacy-policy`… | Public `Navbar` + `Footer` + `BackToTop` |
| `(auth)` | `/login`, `/register`, `/forgot-password`, `/verify-otp`, `/reset-password` | none (each form renders its own `AuthShell`) |
| `(dashboard)` | `/dashboard/**` | `AuthGuard` → `DashboardShell` (sidebar + navbar) |

### Root layout — `src/app/layout.tsx`

Font, global CSS, the no-flash theme script, and the three providers in this
exact order: **Theme → Lang → Query**.

```tsx
import { Outfit } from "next/font/google";
import "../style/globals.css";
import { ThemeProvider } from "@/hooks/useTheme";
import { LangProvider } from "@/hooks/useLang";
import { QueryProvider } from "@/providers/QueryProvider";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata = {
  title: "App — tagline",
  description: "…",
};

// Runs before paint → no light/dark flash on first load.
const themeScript = `(function(){try{var t=localStorage.getItem('app_theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth"
          className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <LangProvider>
            <QueryProvider>{children}</QueryProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Area layouts

```tsx
// src/app/(template)/layout.tsx — public site
const layout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
    <BackToTop />
  </>
);
export default layout;
```

```tsx
// src/app/(dashboard)/dashboard/layout.tsx — protected app
export const metadata = { title: "Dashboard — App" };

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
```

### Page files stay thin

```tsx
// src/app/(auth)/login/page.tsx
export const metadata = { title: "Sign In — App" };

export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginForm />
    </GuestGuard>
  );
}
```

```tsx
// Any page whose component reads useSearchParams MUST wrap it in <Suspense>
export default function ConversationPage() {
  return (
    <Suspense>
      <Conversation />
    </Suspense>
  );
}
```

### `DashboardShell` — the app chrome

CSS-grid shell with a collapsible sidebar whose state is persisted:

```tsx
<div className={`min-h-screen bg-bg text-heading md:grid md:grid-cols-[56px_1fr]
                 ${collapsed ? "lg:grid-cols-[56px_1fr]" : "lg:grid-cols-[260px_1fr]"}`}>
  {open && <div onClick={close} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" />}
  <Sidebar open={open} collapsed={collapsed} … />
  <main className="flex min-w-0 flex-col">
    <Navbar onMenu={openDrawer} />
    {children}
  </main>
</div>
```

- Mobile: off-canvas drawer + backdrop.
- Tablet: 56px icon rail. Desktop: 260px full sidebar, collapsible.
- `localStorage("sidebar-collapsed")` remembers the preference.
- `min-w-0` on `<main>` is required or wide tables blow out the grid.

---

## 6. CSS system — Tailwind v4 tokens

**Everything lives in `src/style/globals.css`.** There is no JS config file.

### 6.1 The token layer

Colors are stored as **raw RGB channel triplets** in `:root`, then exposed to
Tailwind as `--color-*` utilities in `@theme`. The triplet form is what lets you
write `bg-primary/10`, `rgba(var(--primary__color), .55)` in hand-written CSS, etc.

```css
@import "tailwindcss";

/* dark variant is driven by a data attribute, not a class */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root {
  color-scheme: light;

  --primary__color: 68, 160, 141;   /* brand — the ONE value to change per project */

  --bg:      255, 255, 255;   /* page background            */
  --surface: 247, 249, 250;   /* inputs, table headers      */
  --card:    255, 255, 255;   /* panels sitting on the page */

  --heading: 13, 17, 23;      /* h1–h6, strong text         */
  --text:    51, 65, 85;      /* body copy                  */
  --muted:   100, 116, 139;   /* secondary / hints          */

  --border:  229, 231, 235;
}

[data-theme="dark"] {
  color-scheme: dark;
  --bg:      13, 17, 23;
  --surface: 22, 27, 34;
  --card:    17, 24, 39;
  --heading: 255, 255, 255;
  --text:    209, 213, 219;
  --muted:   156, 163, 175;
  --border:  45, 51, 59;
}

@theme {
  --font-sans: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;

  --color-primary: rgb(var(--primary__color));

  --color-bg:      rgb(var(--bg));
  --color-surface: rgb(var(--surface));
  --color-card:    rgb(var(--card));

  --color-heading: rgb(var(--heading));
  --color-body:    rgb(var(--text));
  --color-muted:   rgb(var(--muted));

  --color-border:  rgb(var(--border));

  --shadow-card: 0 12px 32px -12px rgb(13 17 23 / 0.18);
}
```

### 6.2 The resulting utility vocabulary

| Utility | Use for |
|---|---|
| `bg-bg` | page background |
| `bg-surface` | inputs, table headers, subtle fills |
| `bg-card` | panels/cards |
| `border-border` | every border |
| `text-heading` | headings + emphasized values |
| `text-body` | paragraphs |
| `text-muted` | labels, hints, timestamps |
| `text-primary` / `bg-primary` | brand accents, CTAs |
| `shadow-card` | panel elevation |

**Hard rule: never write a raw color** (`text-gray-500`, `bg-white`, `#333`) for
themed surfaces or text. If it isn't in the token list, add a token. Semantic
state colors (`amber`, `rose`, `emerald`, `indigo`) are the only exception, and
they always ship a `dark:` counterpart — see `StatusBadge` in
`components/dashboard/ui.tsx`.

**Dark mode costs nothing** because tokens flip themselves. Only add `dark:`
when the *shape* of the style differs (e.g. `hover:bg-black/5 dark:hover:bg-white/5`).

### 6.3 Global element styling

```css
html { font-size: 100%; scroll-behavior: smooth; }
body { background: rgb(var(--bg)); overflow-x: hidden; }
img  { max-width: 100%; height: auto; }

::selection { @apply bg-primary text-white; }

/* number inputs: kill the spinners */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input[type="number"] { -moz-appearance: textfield; }
```

### 6.4 Named CSS utilities (things Tailwind can't express)

Keep these few, documented, and grouped with a banner comment:

| Class | Purpose |
|---|---|
| `.scroll-x` | horizontal scroll container with a slim, brand-tinted scrollbar |
| `.dash-table` | forces every table cell visible on mobile (scroll instead of hiding columns), `white-space: nowrap` on headers |
| `.glass-card` | frosted panel: translucent bg + `backdrop-filter: blur(22px) saturate(170%)` + top hairline highlight; has a `[data-theme="dark"]` override |
| `.glass-fields` | makes input wrappers inside a glass panel translucent, via `div:has(> input:not([type=checkbox]):not([type=radio]))` |
| `.brand-slider-mask` | `mask-image` edge fade on marquees |
| `.pause-on-hover` | pauses `[data-marquee]` animation on hover |

### 6.5 Animations

All motion is CSS keyframes in `globals.css` — no animation library:
`progress-fill`, `spin-slow`, `float-y`, `marquee`, `floaty`, `spinSlow`,
`shimmer`, `grow-line`, `fade-up`, `ring-progress`.
Apply with `style={{ animation: "fade-up .5s ease both" }}` or a small utility class.

---

## 7. Typography

Typography is **automatic**: raw `h1`–`h6`, `p`, `span`, `a`, `li`, `table`
elements are styled once in `@layer base`, so pages don't repeat font-size
classes. Every step is fluid across `sm / md / lg / xl`.

```css
@layer base {
  h1 { @apply text-heading font-bold
       leading-[36px] text-[30px]
       sm:leading-[44px] sm:text-[38px]
       md:leading-[56px] md:text-[48px]
       lg:leading-[64px] lg:text-[55px]; }

  h2 { @apply text-heading font-bold
       leading-[30px] text-[24px]
       sm:leading-[36px] sm:text-[30px]
       md:leading-[44px] md:text-[36px]
       lg:leading-[50px] lg:text-[40px]; }

  h3 { /* 22 → 26 → 28 → 30, font-bold */ }
  h4 { /* 18 → 20 → 22 → 24, font-semibold */ }
  h5 { /* 16 → 18 → 20,      font-semibold */ }
  h6 { /* 14 → 16,           font-semibold */ }

  p  { @apply font-normal text-body
       leading-[20px] text-[12px]
       sm:leading-[20px] sm:text-[13px]
       md:leading-[22px] md:text-[14px]
       lg:leading-[24px] lg:text-[16px]
       xl:leading-[26px] xl:text-[18px]; }

  span { @apply block leading-tight text-body font-medium
         text-[12px] md:text-[14px] xl:text-[16px]; }

  a  { @apply inline-block transition-all duration-300 hover:text-primary cursor-pointer
       leading-[20px] text-[12px] md:leading-[22px] md:text-[14px] xl:leading-[26px] xl:text-[16px]; }

  li { @apply list-none font-normal text-body /* 12 → 16 */; }

  table            { @apply w-full text-left border-collapse; }
  table thead tr   { @apply bg-gray-50 border-b border-gray-200; }
  table th         { @apply p-4 font-bold text-heading text-[14px] md:text-[16px]; }
  table td         { @apply p-4 border-b border-gray-100 text-body text-[13px] md:text-[15px]; }
  table tr:last-child td { @apply border-b-0; }
}
```

### Typography rules

1. **Semantic tag first.** Use `<h2>` for a section title — don't use `<div class="text-4xl">`.
2. Override only when a specific design needs it (`className="text-3xl sm:text-4xl"` on the hero `h1`).
3. `span` is `display: block` by default here — use `<span className="inline">` when you need inline behaviour.
4. `li` has `list-none` — add markers deliberately.
5. `a` gets `hover:text-primary` and a 300ms transition for free.
6. Table base styles use fixed grays; the dashboard uses the token-based `dsx.th` / `dsx.td` classes instead (see [§13](#13-ui-component-kit)).

---

## 8. Fonts

One Google font, loaded via `next/font` — self-hosted at build time, zero layout
shift, no external request at runtime (important for a static export).

```tsx
// src/app/layout.tsx
import { Outfit } from "next/font/google";
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

<html className={`${outfit.variable} h-full antialiased`}>
```

The CSS variable is wired to Tailwind's sans stack once, so `font-sans` (the
default on `body`) resolves to it:

```css
@theme { --font-sans: var(--font-outfit), ui-sans-serif, system-ui, sans-serif; }
```

**To change the font in a new project:** swap the import, keep the variable name
(or rename it in both places). Add a second font the same way
(`--font-display`) and expose it as `--font-display` in `@theme` → `font-display`.

---

## 9. Theme (light/dark)

Three pieces:

1. **Blocking inline script** in `layout.tsx` sets `<html data-theme>` *before
   paint* — no flash.
2. **`ThemeProvider`** (`src/hooks/useTheme.tsx`) reads what the script decided
   after mount, and owns toggling + persistence.
3. **`ThemeToggle`** button in the navbars.

```tsx
"use client";
export const THEME_STORAGE_KEY = "app_theme";
export type Theme = "light" | "dark";

export function ThemeProvider({ children }) {
  // "light" on server AND first client render → hydration matches.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "light";
    startTransition(() => setThemeState(current));   // adopt the script's choice
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
  }

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a <ThemeProvider>");
  return ctx;
}
```

> **The hydration pattern used everywhere in this project:** render the *server*
> value on the first client paint, then adopt the real client value in an effect
> wrapped in `startTransition`. Same idea as `useIsClient()` (see [§11](#11-api-integration-architecture)).

---

## 10. Multi-language (i18n)

No i18n library. A provider + JSON dictionaries imported at build time. This
keeps the static bundle self-contained and the API surface tiny: `t("some.key")`.

### Files

```
src/i18n/en.json   ← source of truth (~1350 lines, deeply nested)
src/i18n/es.json
src/i18n/ar.json   ← RTL
src/i18n/fr.json
src/i18n/hi.json
```

Top-level key groups mirror the site: `brand`, `nav`, `auth`, `theme`,
`language`, `banner`, `cookie`, `partners`, `about`, `services`, `expertise`,
`testimonials`, `blog`, `download`, `footer`, `home`, `servicesPage`,
`featuresPage`, `blogPage`, `blogDetail`, `contactPage`, `aboutPage`,
`dashboard`, `common`, `legalPages`, `faqPage`, `notFound`.

### `src/hooks/useLang.tsx`

```tsx
"use client";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";
import ar from "@/i18n/ar.json";
import fr from "@/i18n/fr.json";
import hi from "@/i18n/hi.json";

export const LANG_STORAGE_KEY = "app_lang";
export const DEFAULT_LANG = "en";
export type LangCode = "en" | "es" | "ar" | "fr" | "hi";

export const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "ar", name: "Arabic",  flag: "🇸🇦" },
  { code: "fr", name: "French",  flag: "🇫🇷" },
  { code: "hi", name: "Hindi",   flag: "🇮🇳" },
];

const DICTIONARIES = { en, es, ar, fr, hi };
const RTL_LANGS: LangCode[] = ["ar"];

// "a.b.c" → walk the object
const lookup = (dict, key) =>
  key.split(".").reduce((node, part) => (node == null ? undefined : node[part]), dict);

function applyDocumentLang(code) {
  document.documentElement.setAttribute("lang", code);
  document.documentElement.setAttribute("dir", RTL_LANGS.includes(code) ? "rtl" : "ltr");
}

function detectInitialLang() {
  let saved = null;
  try { saved = localStorage.getItem(LANG_STORAGE_KEY); } catch {}
  const browser = navigator.language?.split("-")[0];
  return [saved, browser, DEFAULT_LANG].find((c) => c && DICTIONARIES[c]) ?? DEFAULT_LANG;
}

export function LangProvider({ children }) {
  // Start at the default so server + first client render match…
  const [lang, setLangState] = useState(DEFAULT_LANG);
  // …then adopt saved/browser language after mount.
  useEffect(() => {
    const initial = detectInitialLang();
    applyDocumentLang(initial);
    startTransition(() => setLangState(initial));
  }, []);

  function setLang(code) {
    if (!DICTIONARIES[code]) return;
    setLangState(code);
    applyDocumentLang(code);
    try { localStorage.setItem(LANG_STORAGE_KEY, code); } catch {}
  }

  // active dict → English fallback → the key itself (missing strings stay visible)
  function t(key) {
    const active = DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANG];
    return lookup(active, key) ?? lookup(DICTIONARIES[DEFAULT_LANG], key) ?? key;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t, languages: LANGUAGES, dir: RTL_LANGS.includes(lang) ? "rtl" : "ltr" }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside a <LangProvider>");
  return ctx;
}
```

### Usage

```tsx
const { t, lang, setLang, languages, dir } = useLang();
<h2>{t("about.title")}</h2>
<Input label={t("auth.labelEmail")} placeholder={t("auth.emailPlaceholder")} />
```

### i18n rules

1. **No hard-coded user-facing string.** Every label, placeholder, button, toast
   fallback, empty state, and `aria-label` goes through `t()`.
2. **Add the key to all 5 JSON files in the same commit.** A missing key falls
   back to English silently, which hides the bug.
3. Key naming: `<area>.<component>.<thing>` — e.g. `banner.form.amountLabel`,
   `dashboard.escrow.emptyTitle`, `common.search`.
4. **Language affects the API too** — pass `lang` to endpoints that return
   localized content, and put it in the React Query key so switching refetches:
   ```ts
   const { lang } = useLang();
   useQuery({ queryKey: ["site-section-data", lang], queryFn: () => siteService.getSiteSectionData(lang) });
   ```
5. **RTL** is handled by `dir="rtl"` on `<html>`. Prefer logical utilities
   (`ps-*`, `pe-*`, `ms-*`, `me-*`) over `pl-*`/`pr-*` in new code.
6. The `LanguageSwitcher` (`components/share/LanguageSwitcher.tsx`) is a
   listbox with outside-click + Escape handling; it just calls `setLang(code)`.

**Adding a 6th language:** add `xx.json` (copy `en.json`, translate) → import it
in `useLang.tsx` → add to `DICTIONARIES` and `LANGUAGES` → add to `RTL_LANGS` if
it's RTL. Nothing else changes.

---

## 11. API integration architecture

### 11.1 The layers

```
Component (RHF form / button)
   │  validate with Zod → call hook
   ▼
Hook  (src/hooks/useXxx.ts)      React Query useQuery / useMutation
   │  onSuccess: toast + navigate + invalidate     onError: toast
   ▼
Service (src/services/xxx.service.ts)   axios call, endpoint + payload shape
   │
   ▼
axios instance (src/lib/axios.ts)   baseURL + token + 401 redirect
   │
   ▼
env (src/config/env.ts)   the only reader of process.env
```

### 11.2 `src/config/env.ts`

```ts
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  pusherKey: process.env.NEXT_PUBLIC_PUSHER_KEY ?? "",
  pusherCluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "ap2",
};
```

### 11.3 `src/lib/axios.ts` — two instances

```ts
import axios from "axios";
import { env } from "@/config/env";

/** localStorage key for the bearer token — imported everywhere, never retyped. */
export const TOKEN_KEY = "app_token";

const commonHeaders = { "Content-Type": "application/json", Accept: "application/json" };

/** No auth, no interceptors — login, register, public content. */
export const publicApi = axios.create({ baseURL: env.apiUrl, headers: commonHeaders });

/** Auto-attaches the bearer token; handles 401. */
export const privateApi = axios.create({ baseURL: env.apiUrl, headers: commonHeaders });

privateApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

privateApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

> **Choosing the instance:** no auth needed → `publicApi`. Logged-in user needed
> → `privateApi`. Never create a third instance ad-hoc.

### 11.4 `src/lib/query-client.ts` + `src/providers/QueryProvider.tsx`

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1, refetchOnWindowFocus: false },
  },
});
```

```tsx
"use client";
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontSize: "14px" },
          success: { iconTheme: { primary: "rgb(68,160,141)", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  );
}
```

### 11.5 The backend envelope (Laravel)

Every response looks like:

```jsonc
{
  "message": { "success": ["Login successful"] },   // or { "error": [...] }
  "data":    { /* the actual payload */ }
}
```

422 validation errors arrive as `response.data.errors = { field: ["msg"] }`.

Three helpers in `src/hooks/useAuth.ts` are reused by **every** feature:

```ts
/** Pull a human message out of any error shape (string | {success:[]} | errors{}). */
export function getApiErrorMessage(err: unknown): string { … }

/** message.success[0] with a fallback. */
export function getApiSuccessMessage(res: unknown, fallback: string): string { … }

/** Tokens land in different places per endpoint: data.user.token ?? data.token ?? token */
function extractToken(res: unknown): string | undefined { … }
```

### 11.6 Adding a new API call — the 4 steps

**Step 1 — Schema** (`src/schemas/escrow.schema.ts`)

```ts
import { z } from "zod";

export const createEscrowRequestSchema = z.object({
  title: z.string().min(2, "Title is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  seller_email: z.string().email("Enter a valid email"),
});
export type CreateEscrowRequest = z.infer<typeof createEscrowRequestSchema>;
```

Error messages live **here** — React Hook Form renders them under the field.
Cross-field checks use `.refine()`:

```ts
export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  password_confirmation: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.password_confirmation, {
  path: ["password_confirmation"],
  message: "Passwords do not match",
});
```

**Step 2 — Service** (`src/services/escrow.service.ts`) — axios only, no UI logic.
Also declare the response `interface`s here so components get typed data.

```ts
import { privateApi } from "@/lib/axios";

export interface EscrowCategory { id: number; name: string; }
export interface EscrowCreateData { escrow_categories: EscrowCategory[]; base_url: string; /* … */ }

export const escrowService = {
  /** GET /user/my-escrow/index — the user's escrow list. */
  async index() {
    const res = await privateApi.get("/user/my-escrow/index");
    return res.data;
  },

  /** POST /user/my-escrow/submit — create an escrow (multipart: has files). */
  async submit(payload: EscrowSubmitPayload) {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("amount", String(payload.amount));
    (payload.files ?? []).forEach((f) => form.append("file[]", f));
    const res = await privateApi.post("/user/my-escrow/submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default escrowService;
```

> **Match the HTTP method to the backend exactly** — e.g. logout is `GET`, not
> `POST`, in this API. Check the Postman collection before writing.
> **Laravel + files → always `FormData` + `multipart/form-data`.** Numbers must
> be `String(...)`-ified; arrays use the `name[]` convention.

**Step 3 — Hook** (`src/hooks/useEscrow.ts`) — React Query + all UX side effects.

```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { escrowService } from "@/services/escrow.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";

export function useEscrowList() {
  return useQuery({ queryKey: ["escrow", "list"], queryFn: () => escrowService.index() });
}

export function useCreateEscrow() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => escrowService.submit(payload),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Escrow created"));
      qc.invalidateQueries({ queryKey: ["escrow", "list"] });
      router.push("/dashboard/escrow");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
```

**Step 4 — Component** — see [§12](#12-forms).

### 11.7 Query key + `staleTime` conventions

| Data | Key | staleTime |
|---|---|---|
| Global default | — | `60_000` |
| Public site settings | `["basic-settings"]` | `10 * 60_000` |
| Localized public content | `["site-section-data", lang]` | `5 * 60_000` |
| User lists | `["escrow", "list"]`, `["notifications"]` | default |
| Paginated | `["transactions", page]` | default |

Keys are arrays, most-general segment first, so
`invalidateQueries({ queryKey: ["escrow"] })` clears the whole domain.

### 11.8 Multi-step flows

For wizards (forgot → OTP → reset), stash the data the next screen needs in
**`sessionStorage`**: set it in the hook's `onSuccess`, read it on the next
screen, clear it at the last step.

```ts
sessionStorage.setItem("app_otp_flow", "reset");
sessionStorage.setItem(RESET_EMAIL, email);
sessionStorage.setItem(RESET_TOKEN, token);
// …last step:
["app_otp_flow", RESET_EMAIL, RESET_TOKEN].forEach((k) => sessionStorage.removeItem(k));
```

### 11.9 Route protection (client-side, because static)

```tsx
// src/hooks/useIsClient.ts — false on server + first render, true after mount,
// with no hydration mismatch.
export function useIsClient(): boolean {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}
```

```tsx
// src/components/guards/AuthGuard.tsx
export function AuthGuard({ children }) {
  const router = useRouter();
  const isClient = useIsClient();
  const authed = isClient ? Boolean(localStorage.getItem(TOKEN_KEY)) : false;

  useEffect(() => { if (isClient && !authed) router.replace("/login"); }, [isClient, authed, router]);

  if (!isClient || !authed) return <Spinner />;   // same markup on server + first paint
  return <>{children}</>;
}
```

`GuestGuard` is the mirror image (logged-in users get pushed to `/dashboard`).
Apply `AuthGuard` at the **layout** level, `GuestGuard` at the **page** level.

---

## 12. Forms

**Stack:** React Hook Form + `Controller` + `zodResolver`. Never `useState` per
input.

```tsx
"use client";
export function LoginForm() {
  const { t } = useLang();
  const login = useLogin();

  const { control, handleSubmit, setError, formState: { errors } } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginRequest) => {
    login.mutate(data, {
      onError: (err) => {
        // Laravel 422 → show the message under the offending field
        const fieldErrors = err.response?.data?.errors;
        if (fieldErrors) {
          (["email", "password"] as const).forEach((field) => {
            const msg = fieldErrors[field]?.[0];
            if (msg) setError(field, { type: "server", message: msg });
          });
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Input
            type="email"
            label={t("auth.labelEmail")}
            placeholder={t("auth.emailPlaceholder")}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
            leftIcon={<Mail size={16} strokeWidth={2} aria-hidden />}
          />
        )}
      />
      {/* … */}
      <AuthSubmit loading={login.isPending} loadingLabel={t("auth.loggingIn")}>
        {t("auth.loginButton")}
      </AuthSubmit>
    </form>
  );
}
```

### Form rules

| Topic | Rule |
|---|---|
| Field state | `Controller` + RHF, always. No `useState` per input |
| Validation | Zod schema; messages in the schema |
| Watching a field | `useWatch({ control, name })` — **not** `watch()` (React Compiler safe) |
| Submit button | `loading={mutation.isPending}` + disabled |
| `noValidate` | always on `<form>` — Zod owns validation, not the browser |
| Server errors | 422 → `setError(field, { type: "server", message })` in `mutate`'s `onError` |
| Toasts | fired in the hook, never in the component |
| Navigation | in the hook's `onSuccess`, never in the component |
| File inputs | keep the `File` in RHF state, append to `FormData` in the service |

### reCAPTCHA (optional, backend-driven)

`components/share/Recaptcha.tsx` loads the Google script once
(`render=explicit`) and renders a v2 checkbox; `useRecaptcha()` reads the site
key + on/off flag from the backend's settings endpoint, so forms gate on one
boolean:

```tsx
const { enabled, siteKey } = useRecaptcha();
{enabled && <Recaptcha siteKey={siteKey} resetSignal={captchaReset} onVerify={setCaptchaToken} />}
```

Tokens are single-use → bump `resetSignal` after a failed submit. The token is
sent as `g-recaptcha-response` in the payload.

---

## 13. UI component kit

### `src/components/ui/cn.ts` — no clsx dependency

```ts
type ClassValue = string | number | false | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) { const nested = cn(...input); if (nested) out.push(nested); }
    else out.push(String(input));
  }
  return out.join(" ");
}
```

### `Button` — 5 variants × 3 sizes

```tsx
type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
// props: variant, size, fullWidth, loading, leftIcon, rightIcon
```
Composition: one `BASE` string + `VARIANTS` record + `SIZES` record, joined by
`cn()`. `loading` swaps `leftIcon` for a spinning `Loader2` and sets
`disabled` + `aria-busy`. Default `type="button"` (submit must be explicit).

### `Input` — one component for every field type

Handles `text | email | password | number | date | … | textarea | checkbox | radio`
in a single component, with `label`, `hint`, `error`, `leftIcon`, `rightIcon`,
`inputSize`, `rows`. Accessibility is built in: `useId()` for `htmlFor`,
`aria-invalid`, `aria-describedby` pointing at the hint/error line.

Layout: label on top → bordered box (`rounded-xl border bg-surface`,
`focus-within:ring-2`) → description line. Errors turn the border and label red.

### `Select` — portal dropdown

Custom listbox (not `<select>`): search box (auto-on above 7 options), keyboard
nav (arrows/Home/End/Enter/Escape/Tab), flip-up when short on space, rendered
through `createPortal` into `document.body`, closes on outside click/scroll.

One rich `SelectOption` type covers every dropdown in the app:

```ts
type SelectOption = {
  value: string; label: string;
  id?: string;            // key when value isn't unique
  sub?: string;           // second line
  badge?: string;         // e.g. FIAT / CRYPTO
  icon?: ReactNode;
  image?: string;         // remote flag/logo URL
  imageFallback?: ReactNode;
  imageRounded?: "full" | "md";
  right?: ReactNode;      // right-aligned (e.g. balance)
  keywords?: string;      // extra search text
  disabled?: boolean;
};
```
Two variants: `field` (full-width bordered) and `chip` (compact, borderless).

### `src/components/dashboard/ui.tsx` — the dashboard design tokens

Instead of repeating class strings across 15 screens, a `dsx` object holds them:

```ts
export const dsx = {
  page:   "mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-10",
  card:   "overflow-hidden rounded-2xl border border-border bg-card",
  header: "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-4 sm:px-6 sm:py-5",
  title:  "text-base font-bold text-heading",
  th:     "border-b border-border bg-surface px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted",
  td:     "border-b border-border px-6 py-3.5 align-middle",
  rowHover: "transition hover:bg-black/[0.025] dark:hover:bg-white/[0.025]",
  btnPrimary: "…", btnGhost: "…", iconBtn: "…", countChip: "…", input: "…",
};
```

Plus components: `Panel`, `PanelHeader`, `StatusBadge` (tones: `pending`,
`success`, `released`, `info`, `danger`, `neutral` — each with a light+dark
border/bg/text triple), `TableFooter`.

### `Container` — the public-site width

```tsx
export function Container({ className = "", children }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
```

### Where components go

| Folder | Contains |
|---|---|
| `ui/` | Generic, app-agnostic primitives. No API imports, no `useLang` except for built-in strings |
| `share/` | App-wide chrome used by more than one area |
| `forms/`, `auth/` | Complete forms and auth-page chrome |
| `homepage/` | One file per landing section — `Banner`, `About`, `Services`… |
| `dashboard/page/<feature>/` | The screen behind each dashboard route |
| `guards/`, `context/` | Access control and React contexts |

---

## 14. Image management

Two completely different pipelines. Pick by **where the image comes from**.

### 14.1 Local/static images → `next/image`

```
public/assets/<section>/<name>.webp
```

- **Always `.webp`** — nothing else unless a format is required (SVG icons).
- Grouped by section: `navbar/`, `banner/`, `blog/`, `brand/`, `dashboard/sidbar/`.
- Imported as a module through the `@public/*` alias, so width/height come from
  the file and there is zero layout shift:

```tsx
import Image from "next/image";
import logo from "@public/assets/navbar/logo.webp";

<Image src={logo} alt={t("brand.name")} width={1583} height={468} priority className="mx-auto h-auto w-32" />
```

- Above-the-fold images (logo, hero) get `priority`.
- Decorative images get `alt=""` + `aria-hidden` on the wrapper.
- Size with Tailwind (`h-auto w-32`), not with the intrinsic attributes.

> `images.unoptimized: true` is mandatory for `output: "export"` — there is no
> server to run the optimizer. `next/image` still gives you sizing, `priority`,
> and lazy loading.

### 14.2 Remote/API images → plain `<img>`

Backend-served images (avatars, currency flags, gateway logos, blog covers)
**cannot** go through `next/image` in a static export, so use a plain `<img>`
with a one-line eslint suppression that states why:

```tsx
{/* eslint-disable-next-line @next/next/no-img-element -- remote avatar in a static-export app */}
<img src={avatarUrl} alt="" className="h-full w-full object-cover" />
```

### 14.3 Building remote URLs

The API returns pieces, never full URLs. The convention is
`base_url + image_path + "/" + filename`, with `default_image` as the fallback.
Define a tiny helper at the top of the component:

```tsx
const baseUrl: string = d?.base_url ?? "";
const flagUrl = (w: any) => (w?.flag ? `${baseUrl}${w.image_path}/${w.flag}` : "");
const gwLogo  = (g: any) => (g?.image ? `${baseUrl}${d?.image_path}/${g.image}` : `${baseUrl}${d?.default_image}`);
```

For blog content:

```tsx
const baseUrl = d?.base_url ?? "";
const blogImagePath = d?.blog_image_path ?? "";
const cover = post.image ? `${baseUrl}${blogImagePath}/${post.image}` : `${baseUrl}${d.default_image}`;
```

When one endpoint omits `base_url`, derive the storage base from another URL the
same response *does* include (see `DashboardHome.tsx`) — don't hard-code a host.

### 14.4 Image rules

| Case | Approach |
|---|---|
| Local asset | `public/assets/<section>/*.webp` + `@public/*` import + `next/image` |
| Remote/API image | `<img>` + eslint-disable comment + URL helper |
| Missing remote image | fall back to `default_image` from the API, or an initials/symbol badge |
| Avatar with no image | initials in a `rounded-full bg-primary/10 text-primary` tile |
| Icons | `lucide-react`, never image files |
| QR codes | `qrcode.react`, generated client-side |
| Decorative | `alt=""` and `aria-hidden` |
| Global safety net | `img { max-width: 100%; height: auto; }` in `globals.css` |

---

## 15. Static export — the `out/` folder

```bash
npm run build      # → out/
```

Produces `index.html`, one `<route>.html` per page, `404.html`, `_next/` with
hashed JS/CSS, and everything from `public/`. Upload `out/` to any static host
(cPanel, Nginx, S3, Netlify). No Node process required.

### What you may NOT use

| Forbidden | Use instead |
|---|---|
| `async` Server Component data fetching | client fetch via React Query |
| Route handlers (`app/api/**`) | the external backend |
| `middleware.ts` | client-side `AuthGuard` / `GuestGuard` |
| ISR, `revalidate`, `dynamic = "force-dynamic"` | client fetch + `staleTime` |
| `next/image` optimization | `images.unoptimized: true` |
| Dynamic routes `[id]` without `generateStaticParams` | **query params** — `/dashboard/escrow/conversation?id=123` |
| `next start` | serve `out/` with any static server |
| Cookies/headers APIs | `localStorage` / `sessionStorage` |

### The dynamic-route workaround (used throughout)

Detail screens are static pages that read an id from the query string:

```tsx
// route: /dashboard/escrow/conversation?id=42
const params = useSearchParams();
const id = params.get("id");
```

`useSearchParams` **must** be inside a `<Suspense>` boundary, otherwise the
static prerender fails:

```tsx
export default function ConversationPage() {
  return <Suspense><Conversation /></Suspense>;
}
```

### Hosting note

Because there is no server, a hard refresh on a deep URL must resolve to the
matching `.html`. Next writes both `about.html` and `about/index.html`, so most
hosts work as-is; if yours doesn't, add a rewrite to `404.html` or enable
`trailingSlash: true` and rely on the directory form.

### Payment-gateway redirects

Hosted checkouts need absolute return URLs. Build them at call time from
`window.location.origin` and send them with the payload
(`source: "WEB"`, `success_url`, `cancel_url`), with dedicated
`/success` and `/cancel` static pages to land on.

---

## 16. Realtime and push notifications

Two independent systems, both optional:

1. **Pusher Channels** (`pusher-js`) — live escrow chat messages. Key/cluster
   come from `env.pusherKey` / `env.pusherCluster`.
2. **Pusher Beams** (`@pusher/push-notifications-web`) — OS-level web push.
   - `public/service-worker.js` must sit at the site root:
     ```js
     importScripts("https://js.pusher.com/beams/service-worker.js");
     self.PusherPushNotifications.onNotificationReceived = ({ pushEvent, payload, handleNotification }) => {
       pushEvent.waitUntil(
         self.clients.matchAll({ type: "window", includeUncontrolled: true })
           .then((clients) => clients.forEach((c) => c.postMessage({ type: "PUSHER_BEAMS_NOTIFICATION", payload }))),
       );
       handleNotification(payload);   // still show the OS notification
     };
     ```
     Forwarding to open tabs is what lets the in-app notification list refresh live.
   - `<PushNotifications />` (mounted in `DashboardShell`) registers the device.
   - `src/lib/pushClient.ts` keeps a module-level handle so **logout can call
     `stopBeamsClient()`** — otherwise the next account on the same browser hits
     *"Changing the `userId` is not allowed."*

---

## 17. Storage keys

Namespace every key with the app prefix and declare it as an exported constant —
never inline a string twice.

| Key | Where | Purpose |
|---|---|---|
| `app_token` | `TOKEN_KEY` in `lib/axios.ts` | bearer token (localStorage) |
| `app_theme` | `THEME_STORAGE_KEY` in `useTheme.tsx` | light/dark |
| `app_lang` | `LANG_STORAGE_KEY` in `useLang.tsx` | language code |
| `sidebar-collapsed` | `DashboardShell` | sidebar preference |
| `app_otp_flow`, `app_reset_token`, `app_reset_email` | `useAuth.ts` | multi-step reset flow (sessionStorage) |

---

## 18. Conventions cheat-sheet

| Topic | Rule |
|---|---|
| Component → axios | **Never.** Always component → hook → service |
| `process.env` | Only in `src/config/env.ts` |
| Token reads | Only via `TOKEN_KEY` imported from `@/lib/axios` |
| Input state | React Hook Form + `Controller` |
| Watching fields | `useWatch({ control, name })`, not `watch()` |
| Validation | Zod, with messages in the schema |
| Toast + navigate + invalidate | In the hook's `onSuccess`/`onError` |
| 422 errors | `setError(field, …)` in `mutate`'s `onError` |
| Colors | Tokens only (`text-heading`, `bg-card`, `border-border`, `text-primary`) |
| Typography | Semantic tags; base layer already styles them |
| Strings | Always `t("key")`; add to all 5 JSON files |
| Local images | `public/assets/<section>/*.webp` + `@public/*` + `next/image` |
| Remote images | `<img>` + eslint-disable + `base_url + image_path + file` |
| Dynamic detail pages | Query params + `<Suspense>` |
| `"use client"` | On every file using hooks/state/browser APIs — which is most components |
| Page files | Metadata + guard + one component. No logic |
| Typecheck | `npx tsc --noEmit` must be clean before you call it done |

---

## 19. New feature checklist

- [ ] `src/schemas/<feature>.schema.ts` — request schema (+ response schema) + inferred types
- [ ] `src/services/<feature>.service.ts` — response `interface`s + axios calls; correct instance (`publicApi`/`privateApi`) and HTTP method; `FormData` if files
- [ ] `src/hooks/use<Feature>.ts` — `useQuery`/`useMutation` + toast + navigation + `invalidateQueries`
- [ ] `src/components/<area>/<Feature>.tsx` — RHF + `Controller` + `zodResolver`, `isPending` loading, 422 → `setError`
- [ ] `src/app/<group>/<route>/page.tsx` — metadata + guard + the component (+ `<Suspense>` if it reads search params)
- [ ] i18n keys added to **all 5** JSON files
- [ ] Tokens only for colors; semantic tags for text
- [ ] Images: local → `next/image` + `@public`; remote → `<img>` + URL helper
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` succeeds and the route appears in `out/`

---

## 20. Known gotchas

1. **No `.env.local`.** It silently overrides `.env` and you'll debug the wrong API host.
2. **React Compiler is on.** Use `useWatch` instead of `watch()`; avoid mutating
   values during render; prefer the "adjust state during render" pattern
   (compare a `prev` state var) over effects for derived resets — see `Select.tsx`.
3. **Hydration.** Anything reading `localStorage`/`navigator` must render the
   server value first and adopt the client value in an effect (`useIsClient()`,
   `ThemeProvider`, `LangProvider`, the navbar's login/dashboard button).
4. **`useSearchParams` without `<Suspense>` breaks the static build.**
5. **HTTP methods differ from intuition** — in this backend, logout is `GET`.
   Always check the API collection.
6. **Laravel token location varies per endpoint** (`data.token`,
   `data.user.token`, top-level `token`) — go through `extractToken()`.
7. **Numbers in `FormData`** must be `String(...)`-ified; file arrays use `name[]`.
8. **Beams logout** — always `stopBeamsClient()` or the next user on that browser
   can't register.
9. **`min-w-0`** on flex/grid children that contain tables, or the layout overflows.
10. **`span` is `display: block`** by default from the base layer — add `inline`
    when you need inline flow.
11. Table base styles in `@layer base` use fixed grays; dashboard tables use
    `dsx.th`/`dsx.td` + `.dash-table` instead so they respect dark mode.

---

### One-paragraph summary for a fresh project

> Next.js 16 App Router with `output: "export"`. Route groups `(auth)`,
> `(dashboard)`, `(template)` each own a layout; `page.tsx` files are thin
> wrappers around components in `src/components`. Tailwind v4 is configured
> entirely in `src/style/globals.css`: RGB-triplet CSS variables in `:root` and
> `[data-theme="dark"]`, exposed as `--color-*` in `@theme`, plus an
> `@layer base` block that styles `h1`–`h6`/`p`/`span`/`a`/`li`/`table`
> responsively so pages need almost no font classes. One Google font via
> `next/font` wired to `--font-sans`. Theme is a `data-theme` attribute set by a
> blocking inline script and managed by `ThemeProvider`. i18n is a custom
> `LangProvider` with five JSON dictionaries, dotted-key `t()`, English
> fallback, and automatic RTL. Data flows component → hook (React Query) →
> service (axios) → `publicApi`/`privateApi` (token + 401), with Zod schemas and
> React Hook Form + `Controller` on the input side and `react-hot-toast` +
> `router` + `invalidateQueries` on the hook side. Local images are `.webp`
> under `public/assets/<section>/` imported via `@public/*` into `next/image`
> (unoptimized); API images use plain `<img>` with URLs built from
> `base_url + image_path + filename`. Auth is client-side via `AuthGuard`/
> `GuestGuard`; detail pages use query params inside `<Suspense>` because
> dynamic routes can't be prerendered. `npm run build` emits a self-contained
> `out/` folder.
