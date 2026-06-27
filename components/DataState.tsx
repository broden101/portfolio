"use client";

import { type ReactNode } from "react";

type Status = "loading" | "loaded" | "empty" | "error" | "stale" | "offline";

const STATUS_COPY: Record<Status, { label: string; tone: string }> = {
  loading: { label: "Memuat data", tone: "text-[#aaa295]/70" },
  loaded: { label: "Data tersedia", tone: "text-emerald-400" },
  empty: { label: "Data belum tersedia", tone: "text-[#aaa295]/70" },
  error: { label: "Gagal memuat data", tone: "text-red-400" },
  stale: { label: "Data tertunda", tone: "text-amber-400" },
  offline: { label: "Mode data terbatas", tone: "text-amber-400" },
};

export function DataBadge({ status }: { status: Status }) {
  const copy = STATUS_COPY[status];
  return (
    <span className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] ${copy.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "loaded" ? "bg-emerald-400" : status === "error" ? "bg-red-400" : status === "stale" || status === "offline" ? "bg-amber-400" : "bg-[#aaa295]/50"}`} />
      {copy.label}
    </span>
  );
}

export function SourceNote({
  source,
  updatedAt,
  note,
  className,
}: {
  source?: string;
  updatedAt?: string;
  note?: string;
  className?: string;
}) {
  return (
    <div className={`text-[10px] leading-relaxed text-[#aaa295]/50 ${className ?? ""}`}>
      {source ? <div>Sumber: {source}</div> : null}
      {updatedAt ? <div>Terakhir diperbarui: {updatedAt}</div> : null}
      {note ? <div>{note}</div> : null}
    </div>
  );
}

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={`text-[10px] leading-relaxed text-[#aaa295]/40 ${className ?? ""}`}>
      Raga Playbook adalah catatan riset pribadi dan bukan rekomendasi investasi. Data dapat tertunda, tidak lengkap, atau mengandung kesalahan.
      Selalu lakukan riset mandiri dan sesuaikan keputusan dengan profil risiko masing-masing.
    </p>
  );
}

export function EmptyState({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="rounded border border-[rgba(214,173,90,0.16)] bg-[#101010] p-5 text-[#aaa295]/70">
      <p className="text-sm font-medium text-[#f2eee6]">{title}</p>
      {description ? <p className="mt-1 text-xs text-[#aaa295]/60">{description}</p> : null}
      {children ? <div className="mt-3 text-xs">{children}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="rounded border border-red-400/20 bg-red-400/5 p-5 text-red-300">
      <p className="text-sm font-medium text-red-200">{title ?? "Gagal memuat data"}</p>
      {description ? <p className="mt-1 text-xs text-red-300/80">{description}</p> : null}
      {onRetry ? (
        <button onClick={onRetry} className="mt-3 border border-red-400/30 px-3 py-1.5 text-[11px] tracking-[0.12em] text-red-200 transition hover:border-red-400/60">
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}
