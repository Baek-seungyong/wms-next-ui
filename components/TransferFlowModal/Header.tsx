// components/TransferFlowModal/Header.tsx
"use client";

import type { TransferFlowStep } from "./types";

type Props = {
  step: TransferFlowStep;
  productCode: string;
  productName: string;

  orderEaQty: number;          // ✅ 추가
  directTransferEaQty: number; // ✅ 추가
  remainingEaQty: number;

  onClose: () => void;
};

export function Header({
  step,
  productCode,
  productName,
  orderEaQty,
  directTransferEaQty,
  remainingEaQty,
  onClose,
}: Props) {
  const stepLabel =
    step === 1
      ? "1단계 · 지정이송"
      : step === 2
        ? "2단계 · 잔량 준비(호출)"
        : "3단계 · 잔량 적재/이송";

  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div>
        <div className="text-sm font-semibold">{stepLabel}</div>

        <div className="mt-1 text-[12px] text-gray-600">
          {productName} <span className="text-gray-400">({productCode})</span>
        </div>

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
