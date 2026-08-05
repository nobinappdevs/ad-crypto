# Static Export এ Dynamic (admin) Content দেখানোর Guide

> **পরিস্থিতি:** Project static থাকবেই (`output: "export"`, `out/` folder লাগবে,
> কোনো server/SSR/ISR ব্যবহার করা যাবে না)। কিন্তু content (home section, banner,
> ইত্যাদি) **admin panel থেকে dynamic** আসবে আর যেকোনো সময় বদলাতে পারে।
>
> এই file টা সেই strategy + ready-to-build setup। **API এখনো নেই** — যখন আসবে,
> এই file দেখে hubahu implement করতে হবে। (পুরো call pattern আছে
> [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md) এ — এটা তার উপরে বসে।)

---

## ১. সিদ্ধান্ত (কেন এই পথ)

Static export এ fetch দুই জায়গায় হতে পারে:

| | A. Build-time bake | B. Client fetch + persist cache ✅ |
|---|---|---|
| Content update | শুধু নতুন build হলে | admin save করলেই সাথে সাথে |
| First paint | instant | persist থাকলে instant, নাহলে skeleton |
| admin বদলালে | rebuild + redeploy লাগে | কিছু করতে হয় না |
| SEO | পুরো content HTML এ | content JS এর পরে আসে |

**বাছাই = Option B** — কারণ admin যখন খুশি বদলাবে, বারবার rebuild চাই না।
B এর প্রথম-load দুর্বলতা **localStorage persist** দিয়ে কাটানো হবে।

> ব্যতিক্রম: যদি কোনো page এ **SEO জরুরি** হয় (Google এ text index দরকার),
> তখন ওই page এর জন্য hybrid লাগবে — build এ snapshot bake + admin publish এ
> webhook দিয়ে CI rebuild। ডিফল্টে fintech dashboard এ এটা লাগে না।

---

## ২. কীভাবে কাজ করবে (persist cache)

সাধারণ React Query cache শুধু **memory** তে — reload করলেই মুছে যায়।
আমরা cache **localStorage এ persist** করব:

```
১ম visit      → API থেকে আসে (skeleton দেখাই) → localStorage এ save
reload / return → localStorage থেকে পুরোনো content INSTANTLY ⚡
                  + background এ fresh এনে চুপচাপ update
```

ফল: প্রথমবার ছাড়া কখনো খালি screen/loading না — সবসময় শেষবারের content সাথে সাথে।

---

## ৩. Setup (API এলে এই ধাপগুলো করব)

### ধাপ ০ — packages
```bash
npm install @tanstack/react-query-persist-client @tanstack/query-sync-storage-persister
```

### ধাপ ১ — `QueryProvider` কে persist version এ বদলানো
`src/providers/QueryProvider.tsx`:
```tsx
"use client";
import type { ReactNode } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib/query-client";

// localStorage persister — SSR safe (window থাকলে তবেই)
const persister =
  typeof window !== "undefined"
    ? createSyncStoragePersister({ storage: window.localStorage, key: "escroc_query_cache" })
    : undefined;

export function QueryProvider({ children }: { children: ReactNode }) {
  // persister না থাকলে (server) সাধারণ provider; client এ persist provider
  if (!persister) return <>{children}</>; // অথবা normal QueryClientProvider fallback

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,          // ২৪ ঘণ্টা পুরোনো cache রাখবে
        // শুধু dynamic content cache হোক — auth/profile persist না করি
        dehydrateOptions: {
          shouldDehydrateQuery: (q) =>
            ["home", "banner", "content"].includes(String(q.queryKey[0])),
        },
      }}
    >
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontSize: "14px" },
          success: { iconTheme: { primary: "rgb(68,160,141)", secondary: "#fff" } },
        }}
      />
    </PersistQueryClientProvider>
  );
}
```
> ⚠️ auth/profile এর মতো sensitive বা user-specific query **persist করব না** —
> তাই `shouldDehydrateQuery` দিয়ে শুধু public content queryKey গুলো whitelist করা।

### ধাপ ২ — schema (`src/schemas/home.schema.ts`)
admin যে shape এ section data দেবে সেটা mirror করে। (API এলে field মিলিয়ে নেব)
```ts
import { z } from "zod";

export const homeSectionsSchema = z.object({
  hero:     z.object({ title: z.string(), subtitle: z.string(), cta: z.string() }).optional(),
  features: z.array(z.object({ title: z.string(), text: z.string(), icon: z.string() })).optional(),
  // ...admin response অনুযায়ী বাকি section
});
export type HomeSections = z.infer<typeof homeSectionsSchema>;
```

### ধাপ ৩ — service (`src/services/home.service.ts`)
auth লাগে না → `publicApi`. (endpoint API এলে বসাব)
```ts
import { publicApi } from "@/lib/axios";
import { homeSectionsSchema } from "@/schemas/home.schema";

export const homeService = {
  /** GET /home/sections — public. */
  async getSections() {
    const res = await publicApi.get("/home/sections");   // ← real endpoint বসবে
    return homeSectionsSchema.parse(res.data?.data ?? res.data);
  },
};
```

### ধাপ ৪ — hook (`src/hooks/useHome.ts`)
```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { homeService } from "@/services/home.service";

export function useHomeSections() {
  return useQuery({
    queryKey: ["home", "sections"],   // ← "home" দিয়ে শুরু, তাই persist হবে
    queryFn: () => homeService.getSections(),
    staleTime: 10 * 60_000,           // ১০ মিনিট — ঘন ঘন বদলায় না
  });
}
```

### ধাপ ৫ — component (skeleton সহ)
```tsx
const { data, isLoading } = useHomeSections();

// persist থাকলে data সাথে সাথে আসে; একদম প্রথমবার শুধু skeleton
if (isLoading && !data) return <HomeSkeleton />;

return <HeroSection content={data?.hero} />;
```

---

## ৪. নিয়ম / মনে রাখা

| বিষয় | নিয়ম |
|---|---|
| fetch জায়গা | runtime এ browser থেকে (client fetch), build-time bake না |
| api | public content → `publicApi` |
| persist whitelist | শুধু `home` / `banner` / `content` queryKey; auth/profile **না** |
| staleTime | dynamic-but-rarely-changing content এ বড় (৫–১০ মিনিট+) |
| প্রথম load UX | `isLoading && !data` হলে skeleton; persist থাকলে এড়িয়ে যায় |
| SEO লাগলে | আলাদা সিদ্ধান্ত (hybrid: build snapshot + rebuild webhook) |
| static থাকছে তো? | হ্যাঁ — এসব client-side, `output:"export"`/`out/` অক্ষত |

---

## ৫. Checklist (API আসার পর)

- [ ] `npm install` দুটো persist package
- [ ] `QueryProvider` → `PersistQueryClientProvider` + whitelist
- [ ] `schemas/<feature>.schema.ts` — admin response এর shape
- [ ] `services/<feature>.service.ts` — `publicApi.get(real endpoint)`
- [ ] `hooks/use<Feature>.ts` — `useQuery`, বড় `staleTime`, persist-able queryKey
- [ ] component — skeleton + data render
- [ ] `npx tsc --noEmit` clean
- [ ] reload করে দেখা: ২য় বার content instant আসছে কিনা

> মনে রাখা: `out/` folder ঠিক থাকবে, project static-ই থাকবে। এই পুরোটা শুধু
> browser এ চলা client-side fetch + cache — কোনো server/SSR যোগ হচ্ছে না।
