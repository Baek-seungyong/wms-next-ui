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

  const planText = (() => {
    const p = plan.pallets;
    const b = plan.boxes;
    const e = plan.eas;

    const pTxt = p == null ? "-" : `${p.toLocaleString()}P`;
    const bTxt = b == null ? "-" : `${b.toLocaleString()}BOX`;
    const eTxt = e == null ? "-" : `${e.toLocaleString()}EA`;
    return `${pTxt} · ${bTxt} · ${eTxt}`;
  })();

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

  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div>
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

        {/* ✅ 1) 계획(파렛트/박스/낱개) */}
        <div className="mt-1 text-[12px] text-gray-900">
        포장 계획 <span className="font-semibold">{planText}</span>
        </div>

        {/* ✅ 2) 실시간(주문/지정이송/잔량) */}
        <div className="mt-1 text-[12px] text-gray-700">
          주문{" "}
          <span className="font-semibold text-gray-900">
            {Number(orderEaQty).toLocaleString()}
          </span>{" "}
          EA
          <span className="mx-2 text-gray-300">|</span>
          지정이송{" "}
          <span className="font-semibold text-blue-700">
            {Number(directTransferEaQty).toLocaleString()}
          </span>{" "}
          EA
          <span className="mx-2 text-gray-300">|</span>
          잔량{" "}
          <span className="font-semibold text-gray-900">
            {Number(remainingEaQty).toLocaleString()}
          </span>{" "}
          EA
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-full border bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50"
      >
        닫기
      </button>
    </div>
  );
}
