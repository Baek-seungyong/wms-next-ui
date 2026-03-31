// components/dashboard/DashboardTile.tsx
"use client";

import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  title: string;
  desc?: string;
  href: string;
  icon?: ReactNode;
  badge?: { label: string; tone?: "normal" | "good" | "warn" | "danger" };
  stats?: { label: string; value: string }[];
};

const toneClass = (tone: Props["badge"]["tone"]) => {
  switch (tone) {
    case "good":
      return "border-green-200 bg-green-50 text-green-700";
    case "warn":
      return "border-yellow-200 bg-yellow-50 text-yellow-800";
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
};

export default function DashboardTile({ title, desc, href, icon, badge, stats }: Props) {
  return (
    <Link
      href={href}
      className="group relative flex h-[132px] flex-col justify-between rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg border bg-gray-50 text-sm">
              {icon ?? "📦"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
              {desc ? <p className="mt-0.5 truncate text-[11px] text-gray-500">{desc}</p> : null}
            </div>
          </div>
        </div>

        {badge ? (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${toneClass(
              badge.tone
            )}`}
          >
            {badge.label}
          </span>
        ) : null}
      </div>

      <div className="flex items-end justify-between">
        <div className="flex flex-wrap gap-2">
          {(stats ?? []).slice(0, 3).map((s) => (
            <span
              key={s.label}
              className="rounded-md border bg-gray-50 px-2 py-1 text-[11px] text-gray-700"
            >
              <span className="text-gray-500">{s.label}</span> {s.value}
            </span>
          ))}
        </div>

        <span className="text-[11px] text-gray-400 transition group-hover:text-gray-600">
          열기 →
        </span>
      </div>
    </Link>
  );
}
