"use client";
/* Remote, dynamic image srcs (profile pics + user-uploaded attachments) with
   next.config images.unoptimized — plain <img> is intentional here. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Paperclip, Send, Loader2, X, RotateCw, ShieldCheck, AlertTriangle,
  Download, FileText, ImageIcon, Wallet, ScrollText, CreditCard, Plus, Smile, Info,
  Check, CheckCheck,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/hooks/useLang";
import { usePusherBroadcastConfig } from "@/hooks/useBasicSettings";
import { env } from "@/config/env";
import { TOKEN_KEY } from "@/lib/axios";
import {
  useEscrowConversation,
  useSendEscrowMessage,
  useEscrowIndex,
  useReleaseRequest,
  useReleasePayment,
  useDisputePayment,
} from "@/hooks/useEscrow";

/* backend escrow status enum → i18n key + colours */
const STATUS_META: Record<number, { key: string; dot: string; text: string; box: string }> = {
  1: { key: "ongoing", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", box: "border-blue-500/20 bg-blue-500/10" },
  2: { key: "paymentPending", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", box: "border-amber-500/20 bg-amber-500/10" },
  3: { key: "approvalPending", dot: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400", box: "border-yellow-500/20 bg-yellow-500/10" },
  4: { key: "released", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", box: "border-emerald-500/20 bg-emerald-500/10" },
  5: { key: "activeDispute", dot: "bg-orange-500", text: "text-orange-600 dark:text-orange-400", box: "border-orange-500/20 bg-orange-500/10" },
  6: { key: "disputed", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", box: "border-rose-500/20 bg-rose-500/10" },
  7: { key: "canceled", dot: "bg-slate-500", text: "text-slate-600 dark:text-slate-400", box: "border-slate-500/20 bg-slate-500/10" },
  8: { key: "refunded", dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", box: "border-violet-500/20 bg-violet-500/10" },
  9: { key: "paymentWaiting", dot: "bg-fuchsia-500", text: "text-fuchsia-600 dark:text-fuchsia-400", box: "border-fuchsia-500/20 bg-fuchsia-500/10" },
};

/** First non-empty value among the given keys. */
const pick = (obj: any, ...keys: string[]) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

/** Build a full URL for a conversation attachment ({ file_path, file_name }). */
const attachmentUrl = (a: any) => {
  const url = a?.attachment_download_link ?? a?.fullPath ?? a?.url;
  if (url) return String(url);
  const path = a?.file_path ?? a?.path;
  const name = a?.file_name ?? a?.name;
  return path && name ? `${String(path).replace(/\/$/, "")}/${name}` : (name ?? "");
};
const isImageAttachment = (a: any) => {
  const type = String(a?.file_type ?? a?.type ?? "");
  const url = attachmentUrl(a);
  return type.includes("image") || /\.(png|jpe?g|webp|gif|svg)$/i.test(url);
};

/** Format an amount, avoiding a doubled currency ("20.00 USD USD"). */
const fmtAmount = (amt: any, cur: string) => {
  if (amt == null || amt === "") return undefined;
  const s = String(amt);
  return /[a-zA-Z]/.test(s) ? s : `${s} ${cur}`.trim();
};

/** A displayable timestamp for a message (relative string, or HH:mm from an ISO date). */
const fmtMsgTime = (m: any) => {
  if (m?.time) return String(m.time);
  const raw = m?.created_at ?? m?.date;
  if (!raw) return "";
  const mm = String(raw).match(/T(\d{2}:\d{2})/);
  return mm ? mm[1] : "";
};

/** Force a real download (cross-origin friendly): fetch as blob, then save. */
const downloadFile = async (url: string, name?: string) => {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = name || url.split("/").pop() || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  } catch {
    window.open(url, "_blank", "noopener");
  }
};

type Pending = {
  tempId: number;
  message: string;
  files: File[];
  previews: { url: string; isImage: boolean; name: string }[];
  status: "sending" | "failed";
};

const initials = (s: string) =>
  (s || "").replace(/[^a-zA-Z ]/g, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

/* ── who wrote a message ─────────────────────────────────────────────────────
   The API tags every row with `sender_type` ("USER" | "ADMIN") and
   `message_sender` ("own" | "opposite" | "admin"):

     { sender: 3, sender_type: "USER",  message_sender: "own"      }  → me
     { sender: 5, sender_type: "USER",  message_sender: "opposite" }  → counterparty
     { sender: 1, sender_type: "ADMIN", message_sender: "admin"    }  → support

   Only a USER row flagged "own" is the viewer's own message and goes on the
   RIGHT. Everything else — the counterparty and any admin/support row — sits on
   the LEFT, each labelled with its sender so the thread is unambiguous. */
const isMine = (m: any) =>
  String(m?.sender_type ?? "USER").toUpperCase() === "USER" && m?.message_sender === "own";

const isAdminMsg = (m: any) =>
  String(m?.sender_type ?? "").toUpperCase() === "ADMIN" || m?.message_sender === "admin";

/** Identity used to group consecutive bubbles from the same person. */
const senderKey = (m: any) => `${m?.sender_type ?? ""}|${m?.message_sender ?? ""}|${m?.sender ?? ""}`;

/* ── realtime transport ──────────────────────────────────────────────────────
   The thread is fed by Pusher alone — there is no polling interval anywhere.
   That makes the socket's health part of the UI: if it drops, the user must be
   able to see it and pull manually, so we surface the connection state. */
type LiveState = "connecting" | "connected" | "offline";

const LIVE_META: Record<LiveState, { key: string; dot: string; text: string }> = {
  connected:  { key: "live",       dot: "bg-emerald-500",              text: "text-emerald-600 dark:text-emerald-400" },
  connecting: { key: "connecting", dot: "bg-amber-500 animate-pulse",  text: "text-amber-600 dark:text-amber-400" },
  offline:    { key: "offline",    dot: "bg-rose-500",                 text: "text-rose-600 dark:text-rose-400" },
};

/** Resolve the backend's channel template (e.g. `escrow.conversation.{escrow_id}`). */
const resolveChannelName = (template: string, id: string) =>
  template.trim().replace(/\{escrow_id\}|\{id\}/g, id);

/* Full emoji picker — lazy, client-only (keeps its chunk out of the initial load). */
const EmojiPickerPopover = dynamic(() => import("./EmojiPickerPopover"), {
  ssr: false,
  loading: () => (
    <div className="grid h-95 w-75 place-items-center rounded-2xl border border-border bg-card">
      <Loader2 size={20} className="animate-spin text-muted" aria-hidden />
    </div>
  ),
});

/* ─────────────────────────── confirm dialog ─────────────────────────── */

function ConfirmDialog({
  open, title, desc, confirmLabel, tone, loading, onConfirm, onCancel,
}: {
  open: boolean; title: string; desc: string; confirmLabel: string;
  tone: "primary" | "danger"; loading: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const { t } = useLang();
  if (!open) return null;
  const Icon = tone === "danger" ? AlertTriangle : ShieldCheck;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <span className={`grid h-12 w-12 place-items-center rounded-full ${tone === "danger" ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"}`}>
          <Icon size={24} strokeWidth={2} aria-hidden />
        </span>
        <h3 className="mt-4 text-lg font-bold text-heading">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 cursor-pointer rounded-xl border border-border bg-surface py-2.5 text-sm font-semibold text-muted transition hover:text-heading">
            {t("dashboard.conversation.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
              tone === "danger" ? "bg-rose-500 hover:bg-rose-600" : "bg-primary hover:bg-primary/90"
            }`}
          >
            {loading && <Loader2 size={15} className="animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── detail row ─────────────────────────── */

function DetailRow({ label, children, last }: { label?: React.ReactNode; children?: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 sm:px-5 ${last ? "" : "border-b border-border/70"}`}>
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span className="min-w-0 wrap-break-word text-right text-sm font-semibold text-heading">{children}</span>
    </div>
  );
}

/* ─────────────────────────── attachment bubbles ─────────────────────────── */

function ChatAttachment({ a, mine }: { a: any; mine: boolean }) {
  const url = attachmentUrl(a);
  const name = a?.original_name ?? a?.file_name ?? a?.name ?? "attachment";
  if (!url) return null;
  if (isImageAttachment(a)) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-border">
        <img src={url} alt={name} className="max-h-72 w-full max-w-xs object-cover" />
        <button
          type="button"
          onClick={() => downloadFile(url, name)}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
          aria-label="download"
        >
          <Download size={15} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => downloadFile(url, name)}
      className={`inline-flex max-w-xs items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left text-xs font-medium transition ${
        mine ? "bg-primary/85 text-white hover:bg-primary" : "border border-border bg-card text-body hover:border-primary/40"
      }`}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${mine ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
        <FileText size={15} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <Download size={14} strokeWidth={2.5} aria-hidden className="shrink-0 opacity-80" />
    </button>
  );
}

/* ─────────────────────────── component ─────────────────────────── */

export function Conversation() {
  const { t } = useLang();
  const qc = useQueryClient();
  const params = useSearchParams();
  const id = params.get("id");

  const { data: convRes, isLoading, isFetching, refetch } = useEscrowConversation(id);
  // Pusher credentials + channel/event names, served by the backend.
  const pusherCfg = usePusherBroadcastConfig();
  const conv = (convRes as { data?: any } | undefined)?.data;
  const apiMessages: any[] = conv?.escrow_conversations ?? [];

  const send = useSendEscrowMessage();
  const releaseReq = useReleaseRequest();
  const release = useReleasePayment();
  const dispute = useDisputePayment();

  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [action, setAction] = useState<null | "request" | "payment" | "dispute">(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  // Below lg the details column is a slide-over, so its escrow info and the
  // release/dispute actions stay reachable on phones.
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Realtime socket health — the thread has no polling, so this is the user's
  // only signal that messages are still flowing.
  //
  // State holds what the *socket* reported; whether realtime is possible at all
  // is derived from the config rather than stored. Without that split the effect
  // had to push "offline" into state on every config miss, which is a render
  // cascade for a value the config already tells us.
  const [socketState, setSocketState] = useState<LiveState>("connecting");
  const live: LiveState = pusherCfg.isLoading
    ? "connecting"
    : pusherCfg.ready
      ? socketState
      : "offline";
  const connectedOnceRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tempIdRef = useRef(1);

  const insertEmoji = (emoji: string) => {
    setDraft((d) => d + emoji);
    textInputRef.current?.focus();
  };

  // ── escrow details (from the conversation payload; nested or flat) ──
  const { data: idxRes } = useEscrowIndex();
  const rawIdx = (idxRes as any)?.data;
  const idxList: any[] = Array.isArray(rawIdx)
    ? rawIdx
    : rawIdx?.escrow_data ?? rawIdx?.escrows ?? rawIdx?.escrow ?? rawIdx?.myEscrow ?? rawIdx?.data ?? [];
  const row = idxList.find((r) => String(r.id) === String(id) || String(r.escrow_id) === String(id)) ?? {};

  // Escrow / payment detail fields may sit on `conv` or on any of several nested
  // objects — merge them all so lookups find a field wherever the API puts it.
  const detailObjs = [
    conv?.escrow, conv?.escrow_details, conv?.escrowDetails, conv?.details,
    conv?.escrow_information, conv?.payment, conv?.payment_details, conv?.payment_informations,
  ].filter((o) => o && typeof o === "object");
  const src: any = Object.assign({}, row ?? {}, conv ?? {}, ...detailObjs);

  const statusNum = Number(pick(src, "status") ?? row?.status);
  const statusMeta = STATUS_META[statusNum];
  const statusLabel = statusMeta ? t(`dashboard.escrowStatus.${statusMeta.key}`) : (row?.status_string ?? "—");
  const isOngoing = statusNum === 1;

  // The API's `role` is already the CURRENT viewer's role (seller for the seller,
  // buyer for the buyer) — which is exactly the outcome the backend blade computes
  // from role + user_id. So the button follows the viewer's role directly:
  //   seller → Release Request | buyer → Release Payment | dispute always (ongoing).
  const viewerRole = String(pick(src, "role", "my_role", "user_role") ?? "").toLowerCase();
  const showReleaseRequest = isOngoing && viewerRole === "seller";
  const showReleasePayment = isOngoing && viewerRole === "buyer";

  // The counterparty is whichever side the viewer is not; when the role is
  // unknown, fall back to a neutral "Other Party".
  const oppositeLabel =
    viewerRole === "buyer"
      ? t("dashboard.conversation.senderSeller")
      : viewerRole === "seller"
        ? t("dashboard.conversation.senderBuyer")
        : t("dashboard.conversation.senderOther");

  /** Display name shown above each message bubble. */
  const senderName = (m: any) =>
    isMine(m)
      ? t("dashboard.conversation.senderYou")
      : isAdminMsg(m)
        ? t("dashboard.conversation.senderAdmin")
        : oppositeLabel;

  const escrowId = pick(src, "escrow_id", "trx", "id") ?? id;
  const currency = pick(src, "escrow_currency", "currency_code", "currency") ?? "";
  const details = {
    title: pick(src, "title"),
    role: viewerRole || undefined,
    createdBy: pick(src, "created_by", "creator", "created_by_name", "createdBy", "creator_name", "owner", "created_user"),
    productType: pick(src, "product_type", "category", "productType", "category_name", "product_name"),
    totalPrice: fmtAmount(pick(src, "total_price", "total_amount", "totalPrice", "amount"), currency),
    chargePayer: pick(src, "charge_payer", "chargePayer", "who_will_pay", "who_will_pay_options", "fee_payer"),
    remarks: pick(src, "remarks", "remark", "description", "note"),
  };
  const payment = {
    fees: fmtAmount(pick(src, "total_charge", "fees_charge", "fee", "feesCharge", "charge"), currency),
    seller: fmtAmount(pick(src, "seller_amount", "seller_get", "sellerAmount", "seller_will_get"), currency),
    payWith: pick(src, "pay_with", "gateway_currency_name", "payWith", "payment_gateway", "gateway"),
    rate: pick(src, "exchange_rate", "exchangeRate", "rate"),
    buyerPaid: fmtAmount(pick(src, "buyer_paid", "payable_amount", "buyer_amount", "buyerPaid", "buyer_will_pay", "paid_amount"), currency),
  };
  const hasPayment = Object.values(payment).some((v) => v !== undefined);

  const escAttachmentsRaw = pick(src, "escrow_attachments", "attachments", "attachment", "files", "file", "escrow_files");
  const escAttachments: any[] = Array.isArray(escAttachmentsRaw) ? escAttachmentsRaw : escAttachmentsRaw ? [escAttachmentsRaw] : [];

  const title = details.title ?? t("dashboard.conversation.escrowDetails");

  // ── Realtime: Pusher Channels, and nothing else ───────────────────────────
  // There is no polling fallback: every new message or status change reaches
  // this screen because the backend broadcast fired. The broadcast only tells
  // us "something changed", so we invalidate and let React Query pull the
  // thread — one request per real event instead of one every few seconds.
  //
  // Credentials, channel and event name all come from the backend at runtime
  // (`pusher_broadcast_config`), so nothing here is hardcoded.
  useEffect(() => {
    if (!id) return;
    if (pusherCfg.isLoading) return;          // config still loading — stay "connecting"
    // `live` already reads "offline" from the config alone — nothing to set here.
    if (!pusherCfg.ready) {
      console.warn("[chat] no Pusher config from the backend — realtime is off");
      return;
    }

    let pusher: any;
    let cancelled = false;
    const channelName = resolveChannelName(pusherCfg.channelTemplate, id);
    const eventName = pusherCfg.event;
    let channel: any;
    const pull = () => qc.invalidateQueries({ queryKey: ["escrow", "conversation", id] });

    (async () => {
      try {
        const Pusher = (await import("pusher-js")).default;
        if (cancelled) return;

        const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) ?? "" : "";
        pusher = new Pusher(pusherCfg.key, {
          cluster: pusherCfg.cluster,
          // Used only when the channel name starts with `private-`.
          authEndpoint: env.pusherAuthEndpoint,
          auth: { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
        });

        pusher.connection.bind("state_change", ({ current }: { current: string }) => {
          if (cancelled) return;
          setSocketState(
            current === "connected" ? "connected"
              : current === "connecting" || current === "initialized" ? "connecting"
                : "offline",
          );
          // Re-connected after a drop → pull whatever was missed while offline.
          // (Event-driven catch-up, not a timer.)
          if (current === "connected") {
            if (connectedOnceRef.current) pull();
            connectedOnceRef.current = true;
          }
        });

        channel = pusher.subscribe(channelName);

        // The configured event…
        if (eventName) channel.bind(eventName, () => pull());
        // …plus anything else on this channel (status changes, or a slightly
        // different event name than configured). React Query de-dupes the
        // refetch, so a double fire costs nothing.
        channel.bind_global((name: string) => {
          if (typeof name !== "string" || name.startsWith("pusher:") || name === eventName) return;
          pull();
        });

        // Without polling, a silent subscription failure would just look like
        // "chat is broken" — make it loud in the console instead.
        channel.bind("pusher:subscription_error", (err: unknown) =>
          console.warn(`[chat] could not subscribe to "${channelName}" — check the backend channel name / auth`, err),
        );
      } catch (err) {
        if (!cancelled) {
          setSocketState("offline");
          console.warn("[chat] realtime transport failed to start", err);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        channel?.unbind_global();
        pusher?.unsubscribe(channelName);
        pusher?.disconnect();
      } catch { /* ignore */ }
    };
  }, [id, qc, pusherCfg.isLoading, pusherCfg.ready, pusherCfg.key, pusherCfg.cluster, pusherCfg.channelTemplate, pusherCfg.event]);

  // Keep the thread scrolled to the newest message.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [apiMessages.length, pending.length]);

  // Land in the composer on arrival, so a reply can be typed without clicking.
  //
  // Keyed on `id` rather than done with the `autoFocus` attribute: opening a
  // different thread keeps the same route, so React reuses this component and an
  // attribute would only ever fire on the first mount. `preventScroll` stops the
  // focus from yanking the page while the thread scrolls itself to the newest
  // message. Touch browsers ignore focus without a gesture, so this doesn't
  // throw a keyboard over the conversation on phones.
  useEffect(() => {
    textInputRef.current?.focus({ preventScroll: true });
  }, [id]);

  // Facebook-style auto-growing composer: grow with content up to ~5 lines.
  useEffect(() => {
    const el = textInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  // Revoke object URLs on unmount.
  useEffect(() => {
    return () => { pending.forEach((p) => p.previews.forEach((pv) => { if (pv.isImage) URL.revokeObjectURL(pv.url); })); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── send (optimistic: show immediately, upload in the background, retry on fail) ──
  const doSend = (item: Pending) => {
    if (!id) return;
    setPending((prev) => prev.map((p) => (p.tempId === item.tempId ? { ...p, status: "sending" } : p)));
    send.mutate(
      { escrow_id: id, message: item.message, files: item.files },
      {
        onSuccess: async () => {
          await qc.invalidateQueries({ queryKey: ["escrow", "conversation", id] });
          item.previews.forEach((pv) => { if (pv.isImage) URL.revokeObjectURL(pv.url); });
          setPending((prev) => prev.filter((p) => p.tempId !== item.tempId));
        },
        onError: () => setPending((prev) => prev.map((p) => (p.tempId === item.tempId ? { ...p, status: "failed" } : p))),
      },
    );
  };

  const submitMessage = () => {
    const text = draft.trim();
    if (!id || (!text && files.length === 0)) return;
    const previews = files.map((f) => {
      const isImage = f.type.includes("image");
      return { url: isImage ? URL.createObjectURL(f) : "", isImage, name: f.name };
    });
    const item: Pending = { tempId: tempIdRef.current++, message: text, files, previews, status: "sending" };
    setPending((prev) => [...prev, item]);
    setDraft("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    doSend(item);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  // Per-action dialog content + mutation.
  const ACTIONS = {
    request: { mut: releaseReq, title: t("dashboard.conversation.releaseRequestConfirmTitle"), desc: t("dashboard.conversation.releaseRequestConfirmDesc"), label: t("dashboard.conversation.releaseRequest"), tone: "primary" as const },
    payment: { mut: release, title: t("dashboard.conversation.releaseConfirmTitle"), desc: t("dashboard.conversation.releaseConfirmDesc"), label: t("dashboard.conversation.releasePayment"), tone: "primary" as const },
    dispute: { mut: dispute, title: t("dashboard.conversation.disputeConfirmTitle"), desc: t("dashboard.conversation.disputeConfirmDesc"), label: t("dashboard.conversation.disputePayment"), tone: "danger" as const },
  };
  const activeAction = action ? ACTIONS[action] : null;

  const confirmAction = () => {
    if (!id || !activeAction) return;
    activeAction.mut.mutate(id, { onSuccess: () => setAction(null) });
  };

  const empty = apiMessages.length === 0 && pending.length === 0;

  return (
    /* dvh, not vh — mobile browsers count the collapsing URL bar into vh and
       would push the composer below the fold. */
    <div className="grid h-[calc(100dvh-4rem)] grid-cols-1 lg:grid-cols-[1fr_380px]">
      {/* ── chat column ── */}
      <section className="flex min-h-0 min-w-0 flex-col bg-bg lg:border-r lg:border-border">
        {/* chat header */}
        <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card/70 px-3 py-3 backdrop-blur sm:gap-3 sm:px-5">
          <Link
            href="/dashboard/escrow"
            aria-label={t("dashboard.conversation.backToMyEscrow")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-black/5 hover:text-heading dark:hover:bg-white/10 lg:hidden"
          >
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          </Link>
          <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary sm:grid">
            {initials(String(title))}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-heading">{title}</p>
            <p className="truncate font-mono text-[11px] text-muted">#{escrowId}</p>
          </div>
          {statusMeta && (
            <span className={`hidden items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex ${statusMeta.box} ${statusMeta.text}`}>
              <i className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
              {statusLabel}
            </span>
          )}

          {/* realtime health — click to pull the thread by hand (no auto-polling) */}
          <button
            type="button"
            onClick={() => refetch()}
            title={t(`dashboard.conversation.${LIVE_META[live].key}`)}
            aria-label={t("dashboard.conversation.refresh")}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-[11px] font-medium transition hover:bg-black/5 dark:hover:bg-white/10 ${LIVE_META[live].text}`}
          >
            {isFetching ? (
              <Loader2 size={11} strokeWidth={2.5} className="animate-spin" aria-hidden />
            ) : (
              <i className={`h-1.5 w-1.5 rounded-full ${LIVE_META[live].dot}`} />
            )}
            <span className="hidden text-[11px] font-medium sm:block">
              {t(`dashboard.conversation.${LIVE_META[live].key}`)}
            </span>
          </button>
          {/* details / actions — the side column is a slide-over below lg */}
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            aria-label={t("dashboard.conversation.escrowDetails")}
            className="relative grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-border text-muted transition hover:bg-black/5 hover:text-heading dark:hover:bg-white/10 lg:hidden"
          >
            <Info size={18} strokeWidth={2} aria-hidden />
            {isOngoing && <span aria-hidden className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />}
          </button>
        </header>

        {/* messages */}
        <div
          ref={listRef}
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 py-6 sm:px-8"
          style={{ backgroundImage: "radial-gradient(rgba(128,128,128,0.06) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        >
          {isLoading && empty ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex items-end gap-2.5 ${i % 2 ? "flex-row-reverse" : ""}`}>
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-border" />
                <div className="h-10 animate-pulse rounded-2xl bg-border" style={{ width: `${140 + (i % 3) * 60}px` }} />
              </div>
            ))
          ) : empty ? (
            <div className="m-auto max-w-xs text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-linear-to-br from-primary/15 to-primary/5 text-primary">
                <Send size={24} strokeWidth={2} aria-hidden />
              </div>
              <p className="mt-4 text-sm font-semibold text-heading">{t("dashboard.conversation.noMessages")}</p>
              <p className="mt-1 text-xs text-muted">{t("dashboard.conversation.noMessagesDesc")}</p>
            </div>
          ) : (
            <>
              {/* secure-escrow context chip */}
              <div className="mx-auto mb-3 flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-[11px] font-medium text-muted shadow-sm backdrop-blur">
                <ShieldCheck size={13} strokeWidth={2} className="text-primary" aria-hidden />
                {t("dashboard.conversation.secureNote")}
              </div>

              {apiMessages.map((m, i) => {
                const mine = isMine(m);          // USER + "own"  → right side
                const admin = isAdminMsg(m);     // ADMIN/support → left side, tinted
                const prev = apiMessages[i - 1];
                const next = apiMessages[i + 1];
                // Group by the actual person, not just the "own/opposite/admin"
                // flag — two different admins must not merge into one run.
                const groupStart = !prev || senderKey(prev) !== senderKey(m);
                const groupEnd = !next || senderKey(next) !== senderKey(m);
                const attachments: any[] = m.attachments ?? [];
                const time = fmtMsgTime(m);
                const name = senderName(m);
                // `seen` arrives as 1 / 0 (sometimes stringified) — 1 means the
                // other party has opened it.
                const seen = String(m?.seen) === "1";
                return (
                  <div key={i} className={`flex min-w-0 items-end gap-2.5 ${mine ? "flex-row-reverse" : ""} ${groupStart && i > 0 ? "mt-3" : ""}`}>
                    {groupEnd ? (
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-bold ring-1 ${
                          admin
                            ? "bg-indigo-500/10 text-indigo-500 ring-indigo-500/30 dark:text-indigo-400"
                            : "bg-black/5 text-muted ring-border dark:bg-white/10"
                        }`}
                      >
                        {m.profile_img ? (
                          <img src={m.profile_img} alt={name} className="h-full w-full object-cover" />
                        ) : admin ? (
                          <ShieldCheck size={15} strokeWidth={2} aria-hidden />
                        ) : (
                          initials(name)
                        )}
                      </span>
                    ) : (
                      <span className="w-9 shrink-0" aria-hidden />
                    )}
                    <div className={`flex min-w-0 max-w-[78%] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                      {/* who sent it — printed once per run of messages */}
                      {groupStart && (
                        <span
                          className={`flex items-center gap-1 px-1 text-[11px] font-semibold ${
                            admin ? "text-indigo-500 dark:text-indigo-400" : mine ? "text-primary" : "text-muted"
                          }`}
                        >
                          {admin && <ShieldCheck size={11} strokeWidth={2.5} aria-hidden />}
                          {name}
                        </span>
                      )}
                      {m.message && (
                        <div
                          className={`whitespace-pre-wrap wrap-break-word rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                            mine
                              ? `bg-primary text-white ${groupEnd ? "rounded-br-md" : ""}`
                              : admin
                                ? `border border-indigo-500/25 bg-indigo-500/[0.07] text-body ${groupEnd ? "rounded-bl-md" : ""}`
                                : `border border-border bg-card text-body ${groupEnd ? "rounded-bl-md" : ""}`
                          }`}
                        >
                          {m.message}
                        </div>
                      )}
                      {attachments.map((a, ai) => <ChatAttachment key={ai} a={a} mine={mine} />)}
                      {groupEnd && (time || mine) && (
                        <span className="flex items-center gap-1 px-1 text-[10px] text-muted">
                          {time}
                          {/* Read receipt — only on my own messages: `seen` says
                              whether the counterparty has opened it, which is
                              meaningless to show on a message they sent me. */}
                          {mine && (
                            <span className={`flex items-center gap-0.5 ${seen ? "text-primary" : ""}`}>
                              {seen
                                ? <CheckCheck size={12} strokeWidth={2.5} aria-hidden />
                                : <Check size={12} strokeWidth={2.5} aria-hidden />}
                              {t(seen ? "dashboard.conversation.seen" : "dashboard.conversation.sent")}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* optimistic (pending / failed) — always mine */}
              {pending.map((p) => (
                <div key={`p-${p.tempId}`} className="mt-3 flex min-w-0 flex-row-reverse items-end gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-1 ring-border">
                    {initials(t("dashboard.conversation.senderYou"))}
                  </span>
                  <div className={`flex min-w-0 max-w-[78%] flex-col items-end gap-1 ${p.status === "sending" ? "opacity-70" : ""}`}>
                    <span className="px-1 text-[11px] font-semibold text-primary">
                      {t("dashboard.conversation.senderYou")}
                    </span>
                    {p.message && (
                      <div className="whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                        {p.message}
                      </div>
                    )}
                    {p.previews.map((pv, i) =>
                      pv.isImage ? (
                        <img key={i} src={pv.url} alt={pv.name} className="max-h-72 w-full max-w-xs rounded-2xl border border-border object-cover" />
                      ) : (
                        <span key={i} className="inline-flex items-center gap-2 rounded-2xl bg-primary/85 px-3.5 py-2.5 text-xs font-medium text-white">
                          <FileText size={14} strokeWidth={2} aria-hidden />
                          <span className="max-w-50 truncate">{pv.name}</span>
                        </span>
                      ),
                    )}
                    {p.status === "sending" ? (
                      <span className="flex items-center gap-1 px-1 text-[10px] text-muted">
                        <Loader2 size={11} className="animate-spin" aria-hidden />
                        {t("dashboard.conversation.sending")}
                      </span>
                    ) : (
                      <button type="button" onClick={() => doSend(p)} className="flex cursor-pointer items-center gap-1 px-1 text-[10px] font-semibold text-rose-500 transition hover:text-rose-600">
                        <RotateCw size={11} strokeWidth={2.5} aria-hidden />
                        {t("dashboard.conversation.failedRetry")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* composer */}
        <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-card/70 px-4 py-3 backdrop-blur sm:px-6">
          {files.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {files.map((f, i) => {
                const isImg = f.type.includes("image");
                return (
                  <span key={i} className="group relative inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-body">
                    <span className="grid h-5 w-5 place-items-center rounded bg-primary/10 text-primary">
                      {isImg ? <ImageIcon size={12} strokeWidth={2} aria-hidden /> : <FileText size={12} strokeWidth={2} aria-hidden />}
                    </span>
                    <span className="max-w-35 truncate">{f.name}</span>
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-muted transition hover:text-rose-500" aria-label="remove">
                      <X size={13} strokeWidth={2.5} aria-hidden />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex items-end gap-1.5 rounded-3xl border border-border bg-surface p-1.5 pl-2 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
            {/* attach */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={t("dashboard.conversation.attachFile")}
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition hover:bg-primary/10 hover:text-primary"
            >
              <Plus size={20} strokeWidth={2.5} aria-hidden />
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])} />

            {/* emoji */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setEmojiOpen((o) => !o)}
                aria-label={t("dashboard.conversation.emoji")}
                className={`grid h-9 w-9 cursor-pointer place-items-center rounded-full transition hover:bg-primary/10 hover:text-primary ${emojiOpen ? "bg-primary/10 text-primary" : "text-muted"}`}
              >
                <Smile size={19} strokeWidth={2} aria-hidden />
              </button>
              {emojiOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-10 cursor-default" aria-hidden onClick={() => setEmojiOpen(false)} tabIndex={-1} />
                  <div className="absolute bottom-full left-0 z-20 mb-2 overflow-hidden rounded-2xl shadow-xl">
                    <EmojiPickerPopover onPick={insertEmoji} />
                  </div>
                </>
              )}
            </div>

            <textarea
              ref={textInputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitMessage();
                }
              }}
              placeholder={t("dashboard.conversation.writeSomething")}
              className="my-1.5 max-h-30 min-w-0 flex-1 resize-none bg-transparent px-1 text-sm leading-relaxed text-heading outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={!draft.trim() && files.length === 0}
              aria-label={t("dashboard.conversation.sendMessage")}
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-linear-to-br from-primary to-primary/80 text-white shadow-sm shadow-primary/30 transition hover:shadow-md hover:shadow-primary/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Send size={17} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </form>
      </section>

      {/* ── details column — static beside the chat on lg, slide-over below it ── */}
      {detailsOpen && (
        <div
          aria-hidden
          onClick={() => setDetailsOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`${detailsOpen ? "flex" : "hidden"} fixed inset-y-0 inset-e-0 z-50 w-88 max-w-[88vw] min-h-0 flex-col gap-4 overflow-y-auto border-s border-border bg-surface p-4 shadow-2xl
          lg:static lg:z-auto lg:flex lg:w-auto lg:max-w-none lg:border-s-0 lg:shadow-none`}
      >
        {/* slide-over close — the lg column has no header of its own */}
        <div className="flex shrink-0 items-center justify-between lg:hidden">
          <p className="text-sm font-bold text-heading">{t("dashboard.conversation.escrowDetails")}</p>
          <button
            type="button"
            onClick={() => setDetailsOpen(false)}
            aria-label={t("dashboard.conversation.close")}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-muted transition hover:bg-black/5 hover:text-heading dark:hover:bg-white/10"
          >
            <X size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>

        {/* action buttons — only while the escrow is ongoing */}
        {isOngoing && (
          /* stacked — the column is ~350px wide, too narrow for side-by-side labels */
          <div className="flex shrink-0 flex-col gap-2.5">
            {showReleaseRequest && (
              <button
                type="button"
                onClick={() => setAction("request")}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-br from-primary to-primary/80 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:shadow-md hover:shadow-primary/35"
              >
                <ShieldCheck size={16} strokeWidth={2.5} aria-hidden />
                {t("dashboard.conversation.releaseRequest")}
              </button>
            )}
            {showReleasePayment && (
              <button
                type="button"
                onClick={() => setAction("payment")}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-br from-primary to-primary/80 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:shadow-md hover:shadow-primary/35"
              >
                <ShieldCheck size={16} strokeWidth={2.5} aria-hidden />
                {t("dashboard.conversation.releasePayment")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setAction("dispute")}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-400"
            >
              <AlertTriangle size={16} strokeWidth={2.5} aria-hidden />
              {t("dashboard.conversation.disputePayment")}
            </button>
          </div>
        )}

        {/* escrow details */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <h3 className="flex items-center gap-2 border-b border-border px-5 py-3.5 text-sm font-bold text-heading">
            <ScrollText size={16} strokeWidth={2} className="text-primary" aria-hidden />
            {t("dashboard.conversation.escrowDetails")}
          </h3>
          {details.title != null && <DetailRow label={t("dashboard.conversation.title")}>{details.title}</DetailRow>}
          {details.role != null && <DetailRow label={t("dashboard.conversation.myRole")}><span className="capitalize">{details.role}</span></DetailRow>}
          {details.createdBy != null && <DetailRow label={t("dashboard.conversation.createdBy")}>{details.createdBy}</DetailRow>}
          {details.productType != null && <DetailRow label={t("dashboard.conversation.productType")}>{details.productType}</DetailRow>}
          {details.totalPrice != null && <DetailRow label={t("dashboard.conversation.totalPrice")}>{details.totalPrice}</DetailRow>}
          {details.chargePayer != null && <DetailRow label={t("dashboard.conversation.chargePayer")}><span className="capitalize">{details.chargePayer}</span></DetailRow>}
          <DetailRow label={t("dashboard.conversation.status")}>
            <span className={`inline-flex items-center gap-1.5 ${statusMeta?.text ?? "text-muted"}`}>
              <i className={`h-1.5 w-1.5 rounded-full ${statusMeta?.dot ?? "bg-muted"}`} />
              {statusLabel}
            </span>
          </DetailRow>
          {escAttachments.length > 0 && (
            <DetailRow label={t("dashboard.conversation.attachment")}>
              <span className="flex flex-wrap justify-end gap-2">
                {escAttachments.map((a, i) => {
                  const url = attachmentUrl(a);
                  const name = a?.original_name ?? a?.file_name ?? a?.name ?? t("dashboard.conversation.image");
                  if (!url) return null;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => downloadFile(url, name)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
                    >
                      <Download size={13} strokeWidth={2.5} aria-hidden />
                      <span className="max-w-[120px] truncate">{name}</span>
                    </button>
                  );
                })}
              </span>
            </DetailRow>
          )}
          <DetailRow label={t("dashboard.conversation.remarks")} last>
            <span className="text-muted">{details.remarks || "—"}</span>
          </DetailRow>
        </div>

        {/* payment details */}
        {hasPayment && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <h3 className="flex items-center gap-2 border-b border-border px-5 py-3.5 text-sm font-bold text-heading">
              <CreditCard size={16} strokeWidth={2} className="text-primary" aria-hidden />
              {t("dashboard.conversation.paymentDetails")}
            </h3>
            {payment.fees != null && <DetailRow label={t("dashboard.conversation.feesCharge")}><span className="text-amber-500">{payment.fees}</span></DetailRow>}
            {payment.seller != null && <DetailRow label={t("dashboard.conversation.sellerAmount")}>{payment.seller}</DetailRow>}
            {payment.payWith != null && <DetailRow label={t("dashboard.conversation.payWith")}>{payment.payWith}</DetailRow>}
            {payment.rate != null && <DetailRow label={t("dashboard.conversation.exchangeRate")}>{payment.rate}</DetailRow>}
            {payment.buyerPaid != null && (
              <DetailRow label={t("dashboard.conversation.buyerPaid")} last>
                <span className="inline-flex items-center gap-1.5 text-primary"><Wallet size={13} strokeWidth={2} aria-hidden />{payment.buyerPaid}</span>
              </DetailRow>
            )}
          </div>
        )}
      </aside>

      {/* confirmation modal */}
      <ConfirmDialog
        open={!!activeAction}
        title={activeAction?.title ?? ""}
        desc={activeAction?.desc ?? ""}
        confirmLabel={activeAction?.label ?? ""}
        tone={activeAction?.tone ?? "primary"}
        loading={activeAction?.mut.isPending ?? false}
        onConfirm={confirmAction}
        onCancel={() => setAction(null)}
      />
    </div>
  );
}
