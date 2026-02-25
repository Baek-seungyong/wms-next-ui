// components/TransferFlowModal/Header.tsx
"use client";

import type { TransferFlowStep } from "./types";

type Plan = {
  pallets: number | null;
  boxes: number | null;
  eas: number | null;
};

type Props = {
  step?: TransferFlowStep; // (선택) 기존 호환
  productCode: string;
  productName: string;

  orderEaQty: number;
  directTransferEaQty: number;
  remainingEaQty: number;

  plan: Plan;

  onClose: () => void;
};

function StatPill({
  label,
  value,
  tone = "gray",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "gray" | "blue" | "green" | "amber" | "red";
}) {
  const toneMap: Record<string, string> = {
    gray: "bg-slate-100 text-slate-800 ring-slate-200",
    blue: "bg-blue-50 text-blue-800 ring-blue-200",
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-50 text-amber-900 ring-amber-200",
    red: "bg-rose-50 text-rose-800 ring-rose-200",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1",
        toneMap[tone],
      ].join(" ")}
    >
      <span className="text-[10px] font-medium opacity-70">{label}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

export function Header({
  step,
  productCode,
  productName,
  orderEaQty,
  directTransferEaQty,
  remainingEaQty,
  plan,
  onClose,
}: Props) {
  const title = "지정이송 · 잔량처리";

  const stepHint =
    step === 1
      ? "1단계 작업중"
      : step === 2
        ? "2단계 작업중"
        : step === 3
          ? "3단계 작업중"
          : step === 4
            ? "4단계 작업중"
            : null;

  const p = plan.pallets;
  const b = plan.boxes;
  const e = plan.eas;

  const planP = p == null ? "-" : `${p.toLocaleString()}P`;
  const planB = b == null ? "-" : `${b.toLocaleString()}BOX`;
  const planE = e == null ? "-" : `${e.toLocaleString()}EA`;

  const orderTxt = Number(orderEaQty).toLocaleString();
  const directTxt = Number(directTransferEaQty).toLocaleString();
  const remainTxt = Number(remainingEaQty).toLocaleString();

  const remainTone =
    remainingEaQty <= 0 ? "green" : remainingEaQty < 500 ? "amber" : "red";

  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">{title}</div>
          {stepHint ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
              {stepHint}
            </span>
          ) : null}
        </div>

        <div className="mt-1 text-[12px] text-gray-600">
          {productName} <span className="text-gray-400">({productCode})</span>
        </div>

        {/* ✅ 핵심 요약 바 (포장계획/수량 강조) */}
        <div className="mt-2 rounded-lg border bg-slate-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-700">
              이송 현황
            </span>

            <StatPill label="주문" value={`${orderTxt} EA`} tone="gray" />
            <StatPill label="지정이송" value={`${directTxt} EA`} tone="blue" />
            <StatPill label="잔량" value={`${remainTxt} EA`} tone={remainTone} />
            
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-700">
              포장 계획
            </span>
            <StatPill label="파렛" value={planP} tone="blue" />
            <StatPill label="박스" value={planB} tone="blue" />
            <StatPill label="낱개" value={planE} tone="blue" />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="ml-3 shrink-0 rounded-full border bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50"
      >
        닫기
      </button>
    </div>
  );
}