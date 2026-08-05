# API Integration Guide (escroc-next)

> এই project-এ যেকোনো নতুন API call **একই pattern** এ wire করতে হবে।
> Auth flow (login / register / forgot / OTP / reset / logout) যেভাবে করা হয়েছে,
> নিচে ঠিক সেই recipe-টা step-by-step লেখা আছে। নতুন feature (escrow, wallet,
> transactions, kyc...) এর API করার সময় শুধু এই file দেখে copy করলেই হবে।

---

## 0. কেন এই architecture

Project টা `output: "export"` (fully static SPA — কোনো server runtime নেই)।
তাই **সব data fetching client-side**। Layer গুলো:

```
Component (RHF form / button)
   │  user input → validate (Zod) → call hook
   ▼
Hook (useXxx)            → React Query useMutation / useQuery
   │  onSuccess: toast + navigate + cache    onError: toast
   ▼
Service (xxxService.fn)  → axios call + Zod validate response
   │
   ▼
axios instance (publicApi / privateApi) → baseURL + token + 401 handling
```

প্রতিটা layer-এর **একটাই কাজ**। কখনো component থেকে সরাসরি axios call করবে না।

---

## 1. Layer গুলো (foundation — একবারই বানানো, বার বার লাগবে না)

### 1.1 `src/config/env.ts` — env var
```ts
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
};
```
> Base URL আসে `.env` থেকে: `NEXT_PUBLIC_API_URL=https://escroc.appdevs.net/api/v1`
> ⚠️ `.env.local` রাখবে না — ওটা `.env` কে override করে ভুল URL দেখাবে।

### 1.2 `src/lib/axios.ts` — দুটো axios instance
- **`publicApi`** — auth লাগে না (login, register, forgot...)। কোনো interceptor নেই।
- **`privateApi`** — প্রতিটা request-এ `Authorization: Bearer <token>` auto attach করে
  (localStorage `escroc_token` থেকে), আর response 401 হলে token মুছে `/login` এ পাঠায়।

```ts
export const TOKEN_KEY = "escroc_token";   // localStorage key — সবাই এটা import করে

export const publicApi  = axios.create({ baseURL: env.apiUrl, headers: commonHeaders });
export const privateApi = axios.create({ baseURL: env.apiUrl, headers: commonHeaders });

// request: token attach (SSR-safe — window check)
// response: 401 → remove token + redirect /login
```
> **নিয়ম:** auth লাগে না → `publicApi`। Login করা user দরকার → `privateApi`।

### 1.3 `src/lib/query-client.ts` — React Query config
```ts
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
});
```

### 1.4 `src/providers/QueryProvider.tsx` — provider + toast
`<QueryClientProvider>` + `<Toaster>` (react-hot-toast)। `src/app/layout.tsx` এ
`<LangProvider>` এর ভিতরে wrap করা আছে। নতুন কিছু লাগবে না।

---

## 2. একটা নতুন API call যোগ করার ৪টা ধাপ

ধরো নতুন endpoint: `POST /escrow/create`, body `{ title, amount, seller_email }`.

### ধাপ ১ — Schema (`src/schemas/<feature>.schema.ts`)
Request validate করার জন্য (form), আর response validate করার জন্য (optional কিন্তু ভালো)।
```ts
import { z } from "zod";

export const createEscrowRequestSchema = z.object({
  title: z.string().min(2, "Title is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  seller_email: z.string().email("Enter a valid email"),
});

export type CreateEscrowRequest = z.infer<typeof createEscrowRequestSchema>;
```
> Error message গুলো এখানেই লেখো — RHF এগুলো field-এর নিচে দেখাবে।
> দুই password মেলানোর মতো cross-field check হলে `.refine(...)` ব্যবহার করো
> (দেখো `registerRequestSchema` / `resetPasswordSchema`)।

### ধাপ ২ — Service (`src/services/<feature>.service.ts`)
শুধু axios call + response return। কোনো UI logic না।
```ts
import { privateApi } from "@/lib/axios";       // auth লাগে → privateApi
import { createEscrowRequestSchema, type CreateEscrowRequest } from "@/schemas/escrow.schema";

export const escrowService = {
  /** POST /escrow/create — requires auth. */
  async create(payload: CreateEscrowRequest) {
    const body = createEscrowRequestSchema.parse(payload);   // request validate
    const res = await privateApi.post("/escrow/create", body);
    return res.data;                                          // Laravel envelope
  },

  /** GET /escrow/list — requires auth. */
  async list() {
    const res = await privateApi.get("/escrow/list");
    return res.data;
  },
};
```
> **HTTP method Postman থেকে মিলিয়ে নাও** (যেমন logout আসলে `GET`, POST না)।
> Laravel সব body **form-data / json** এ নেয়, response সবসময় এই envelope এ আসে:
> ```jsonc
> { "message": { "success": ["..."] },   // অথবা { "error": [...] }
>   "data":    { ... } }                  // আসল payload; token কখনো data.token,
>                                          // কখনো data.user.token (নিচে দেখো)
> ```

### ধাপ ৩ — Hook (`src/hooks/use<Feature>.ts`)
React Query দিয়ে। **মুটেশন (POST/PUT/DELETE) → `useMutation`**, **পড়া (GET) → `useQuery`**।
এখানেই toast + navigation + cache।
```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { escrowService } from "@/services/escrow.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth"; // helpers reuse

// লেখা (mutation)
export function useCreateEscrow() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => escrowService.create(payload),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Escrow created"));
      qc.invalidateQueries({ queryKey: ["escrow", "list"] });  // list refetch
      router.push("/dashboard/escrow");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// পড়া (query)
export function useEscrowList() {
  return useQuery({
    queryKey: ["escrow", "list"],
    queryFn: () => escrowService.list(),
  });
}
```

### ধাপ ৪ — Component (form: React Hook Form + zodResolver)
`useState` দিয়ে input track করবে **না**। RHF + `Controller` ব্যবহার করো।
```tsx
"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateEscrow } from "@/hooks/useEscrow";
import { createEscrowRequestSchema, type CreateEscrowRequest } from "@/schemas/escrow.schema";

export function CreateEscrowForm() {
  const createEscrow = useCreateEscrow();
  const { control, handleSubmit, setError, formState: { errors } } =
    useForm<CreateEscrowRequest>({
      resolver: zodResolver(createEscrowRequestSchema),
      defaultValues: { title: "", amount: 0, seller_email: "" },
    });

  const onSubmit = (data: CreateEscrowRequest) => {
    createEscrow.mutate(data, {
      // Laravel 422 field errors → form field এর নিচে দেখাও
      onError: (err) => {
        const fieldErrors = (err as any).response?.data?.errors;
        if (fieldErrors) Object.keys(fieldErrors).forEach((f) =>
          setError(f as any, { type: "server", message: fieldErrors[f]?.[0] }));
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller name="title" control={control} render={({ field }) => (
        <Input label="Title" {...field} error={errors.title?.message} />
      )} />
      {/* ...বাকি field... */}
      <Button type="submit" loading={createEscrow.isPending} disabled={createEscrow.isPending}>
        Create
      </Button>
    </form>
  );
}
```

---

## 3. মনে রাখার নিয়ম (conventions)

| বিষয় | নিয়ম |
|---|---|
| Input state | সবসময় **React Hook Form + `Controller`**, কখনো `useState` না |
| Validation | **Zod schema** এ, error message schema-তেই লেখা |
| `watch` | RHF এর `watch()` না, **`useWatch({ control, name })`** (React Compiler safe) |
| axios | auth নেই → `publicApi`, auth লাগে → `privateApi` |
| Token read | শুধু `TOKEN_KEY` (`"escroc_token"`) `@/lib/axios` থেকে import |
| Success msg | `getApiSuccessMessage(res, fallback)` — `message.success[0]` পড়ে |
| Error msg | `getApiErrorMessage(err)` — `message`/`errors`/string সব handle করে |
| 422 field error | mutate এর `onError` এ `setError(field, ...)` দিয়ে field-এ দেখাও |
| Loading | button এ `mutation.isPending` দিয়ে `loading` + `disabled` |
| Navigation | hook এর `onSuccess` এ `router.push/replace`, component এ না |
| Cache refresh | লেখার পর `queryClient.invalidateQueries({ queryKey })` |
| Toast | success + error দুটোই hook-level এ (component এ আবার করো না) |

### Token কোথায় থাকে (গুরুত্বপূর্ণ)
Laravel এর response এ token **endpoint ভেদে আলাদা জায়গায়** আসে:
- login → `data.token`
- forgot/send-otp → `data.user.token`

তাই `useAuth.ts` এর `extractToken()` fallback chain ব্যবহার করে:
```ts
data.user.token  ??  data.token  ??  token
```
নতুন কোনো endpoint token দিলে এই helper দিয়েই বের করো, hard-code করবে না।

### Multi-step flow (যেমন forgot → otp → reset)
ধাপে ধাপে যে data পরের screen এ লাগবে (token, email, কোন flow) তা **`sessionStorage`**
তে রাখো, hook এর `onSuccess` এ set করো, পরের screen এ পড়ো, শেষ ধাপে মুছে দাও।
দেখো: `useForgotSendOtp` (set) → `OtpForm` (read) → `useResetPassword` (clear)।

### Protected / guest pages
- Login করা user ছাড়া ঢোকা যাবে না → `<AuthGuard>` দিয়ে wrap (dashboard layout)।
- Login করা থাকলে ঢোকা উচিত না (login/register page) → `<GuestGuard>`।
- দুটোই `useIsClient()` দিয়ে hydration-safe। static export এ server guard সম্ভব না।

---

## 4. বর্তমান auth ফাইল ম্যাপ (reference হিসেবে দেখো)

| Layer | File |
|---|---|
| env | `src/config/env.ts` |
| axios | `src/lib/axios.ts` |
| query client | `src/lib/query-client.ts` |
| provider | `src/providers/QueryProvider.tsx` |
| schema | `src/schemas/auth.schema.ts` |
| service | `src/services/auth.service.ts` |
| hooks | `src/hooks/useAuth.ts` (helpers: `getApiErrorMessage`, `getApiSuccessMessage`, `extractToken`) |
| guards | `src/components/guards/AuthGuard.tsx`, `GuestGuard.tsx`, hook `useIsClient.ts` |
| forms | `src/components/forms/LoginForm.tsx`, `ResetPasswordForm.tsx`; `components/auth/RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `OtpForm.tsx` |

### Auth endpoint গুলো (auth.service.ts)
| Function | Method | Endpoint | api |
|---|---|---|---|
| login | POST | `/user/login` | public |
| register | POST | `/user/register` | public |
| forgotSendOtp | POST | `/user/forgot/password/send/otp` | public |
| forgotVerifyOtp | POST | `/user/forgot/password/verify` `{ otp, token }` | public |
| resetPassword | POST | `/user/forgot/password/reset` `{ password, password_confirmation, token }` | public |
| verifyEmailOtp | POST | `/user/email/otp/verify` `{ otp, token }` | private |
| resendEmailCode | POST | `/user/email/resend/code` | private |
| getProfile | GET | `/user/profile` | private |
| logout | **GET** | `/user/logout` | private |

---

## 5. নতুন feature এর checklist

- [ ] `schemas/<feature>.schema.ts` — request (+response) schema + types
- [ ] `services/<feature>.service.ts` — axios call, public/private ঠিক করো, method মিলাও
- [ ] `hooks/use<Feature>.ts` — useMutation/useQuery + toast + navigate + invalidate
- [ ] component — RHF + Controller + zodResolver, `isPending` loading, 422 → setError
- [ ] auth লাগলে page/layout এ `<AuthGuard>`
- [ ] `npx tsc --noEmit` দিয়ে typecheck পরিষ্কার

> ⚠️ Note: `src/services`, `src/hooks`, `src/schemas`, `src/lib`, `src/config`,
> `src/components/forms`, `src/components/guards`, `src/providers` — এই folder গুলোতে
> কাজ করো। কিছু tracked auth file আগে অজানা কারণে revert হয়েছে; edit করার পর
> `npx tsc --noEmit` চালিয়ে নিশ্চিত হও পরিবর্তন টিকে আছে।
