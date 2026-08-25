"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthMirror } from "@/hooks/useAuthMirror";
import { useDashboard } from "@/hooks/useDashboard";
import { Sk, SkPageHeader } from "@/components/dashboard/Skeletons";
import { accountGateState } from "@/lib/authState";

/**
 * What shows in the two states with nothing to render: the client's first tick
 * before there is a token to read, and the moment before a redirect leaves.
 *
 * The shape of the dashboard rather than a blank page or a spinner — the sidebar
 * column, the top bar and a page header, which is what is about to be there. It
 * replaces the whole shell, because that is what this guard wraps, so it has to
 * draw the shell as well as the page.
 *
 * DELIBERATELY LOCAL, and not exported. It belongs to this one moment: a skeleton
 * of the dashboard appearing anywhere else — in a route's `loading.tsx`, in front
 * of a page that has its own — is the double-loading this guard used to cause.
 * Every page under here already has its own skeleton, and none of them should
 * reach for this one.
 *
 * Not shown while the gate request is in flight either: that moment belongs to the
 * page's own skeleton.
 */
function Holding() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="min-h-screen bg-surface md:grid md:grid-cols-[56px_1fr] lg:grid-cols-[260px_1fr]"
    >
      {/* The sidebar rail: a mark, then a run of nav rows. */}
      <aside className="hidden border-e border-border bg-card p-3 md:block">
        <Sk className="h-9 w-9 rounded-xl" />
        <div className="mt-6 flex flex-col gap-2.5">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Sk className="h-8 w-8 shrink-0 rounded-lg" soft={i > 0} />
              <Sk className="hidden h-3 w-28 lg:block" soft />
            </div>
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-col">
        {/* The top bar. */}
        <div className="flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
          <Sk className="h-3.5 w-40" soft />
          <div className="flex items-center gap-2.5">
            <Sk className="h-9 w-9 rounded-lg" soft />
            <Sk className="h-9 w-9 rounded-full" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
          <SkPageHeader />
          <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            <Sk className="h-72 w-full rounded-2xl lg:col-span-7" soft />
            <Sk className="h-72 w-full rounded-2xl lg:col-span-5" soft />
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Gate on the dashboard.
 *
 * What it gates on is `accountGateState` — the same answer `GuestGuard` reaches,
 * from the same three sources in the same order, so the two guards can never
 * disagree and hand a user back and forth between the dashboard and a code screen.
 *
 * Both halves of that matter here. `GET /user/dashboard` is asked on every entry,
 * because an operator flipping `email_verified` or `two_factor_verified` in the
 * admin panel does not write to anybody's browser and only a request can notice
 * it. And the mirror register/login left behind answers on the first render,
 * before that request lands — without it, arriving with a token and an unanswered
 * question meant walking straight in during the gap.
 *
 * ONE request, when this guard mounts — that is, when the user enters the
 * dashboard from outside it. Nothing polls, and moving between dashboard pages
 * does not ask again: this guard lives in the layout, which stays mounted, and a
 * second call would return the flags it is already holding. The tab being focused
 * or the connection returning refreshes it, since both mean time has passed.
 *
 * The order is fixed: no token at all, then the email address, then the
 * authenticator. The check does not block the page — see the bottom of the
 * component for why the skeleton belongs to the page rather than to the guard.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();

  const mirror = useAuthMirror();
  const { isClient, authed } = mirror;

  const { data } = useDashboard(authed, { refetchOnMount: "always" });

  const { emailVerified, twoFa } = accountGateState(data, mirror);

  /**
   * Nothing answered at all gates nothing — no mirror, no flags in the payload,
   * or a request that errored. That is nobody having answered the question, not an
   * account failing it, and locking the app over a dropped connection would be our
   * outage rather than theirs. Anything the session is genuinely missing is refused
   * by the API where it matters.
   */
  const destination = !isClient
    ? null
    : !authed
      ? "/login"
      : emailVerified === false
        ? "/verify-email"
        : twoFa === "pending"
          ? "/verify-2fa"
          : null;

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  /**
   * Held for the two states that have nothing to show: no session at all, and a
   * redirect already on its way.
   *
   * NOT held while the gate request is in flight. Doing that put a blank screen in
   * front of every single dashboard page for as long as the check took, in place
   * of the skeleton that page had ready — one loading language interrupting
   * another. The page paints its own shape, and if the answer turns out to be a
   * gate, the redirect above replaces it a moment later. Nothing sensitive rides
   * on that moment: the panels are still empty, and their own requests are refused
   * by the API for exactly the same reason the gate would have closed.
   */
  if (!isClient || !authed || destination) return <Holding />;
  return <>{children}</>;
}
