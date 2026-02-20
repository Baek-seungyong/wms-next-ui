// components/TransferFlowModal/Step1DirectTransfer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { PalletDirectTransferModal } from "../PalletDirectTransferModal";
import type { TransferInfo } from "../types";

type Props = {
  productCode: string;
  productName: string;

  /** 주문 EA */
  orderEaQty: number;

  /** 단위(없으면 자동 계산 불가) */
  eaPerPallet?: number;

  /** 계획치(표시용) */
  planPalletQty: number | null;
  planBoxQty: number | null;
  planEaQty: number | null;

  /** 기존 확정(있으면 현황 모드) */
  existingTransfer: TransferInfo | null;
  existingDestinationSlots: string[];

  /** 자동 배정용 입력 */
  directPalletQty: number;
  onChangeDirectPalletQty: (v: number) => void;

  /** ‘자동 적용’(기본창에서 바로 확정) */
  onApplyAutoDirect: (info: TransferInfo) => void;

  /** 수동 수정(모달에서 확정) */
  onConfirmManualDirect: (info: TransferInfo) => void;
};

function autoAssignSlots(count: number) {
  // ✅ 요청대로: A-2, A-3, A-4... (필요하면 늘려도 됨)
  const start = 2;
  const slots: string[] = [];
  for (let i = 0; i < Math.max(0, count); i++) {
    slots.push(`A-${start + i}`);
  }
  return slots;
}

export function Step1DirectTransfer({
  productCode,
  productName,
  orderEaQty,
  eaPerPallet,
  planPalletQty,
  planBoxQty,
  planEaQty,
  existingTransfer,
  existingDestinationSlots,
  directPalletQty,
  onChangeDirectPalletQty,
  onApplyAutoDirect,
  onConfirmManualDirect,
}: Props) {
  const [manualOpen, setManualOpen] = useState(false);

  // 기본값: 계획 파렛트 수량이 있으면 거기로 세팅
  useEffect(() => {
    if (directPalletQty > 0) return;
    if (planPalletQty != null && planPalletQty > 0) {
      onChangeDirectPalletQty(planPalletQty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planPalletQty]);

  const autoTransferEaQty = useMemo(() => {
    const unit = Number(eaPerPallet ?? 0);
    if (!unit) return 0;
    return Math.max(0, Number(directPalletQty || 0) * unit);
  }, [directPalletQty, eaPerPallet]);

  const canAutoApply = (eaPerPallet ?? 0) > 0 && directPalletQty >= 0;

  const planText = useMemo(() => {
    const p = planPalletQty == null ? "-" : `${planPalletQty}P`;
    const b = planBoxQty == null ? "-" : `${planBoxQty}BOX`;
    const e = planEaQty == null ? "-" : `${planEaQty}EA`;
    return `${p} · ${b} · ${e}`;
  }, [planPalletQty, planBoxQty, planEaQty]);

  // ✅ 현재 “자동 적용”으로 만들어질 파렛트 ID
  const currentPalletIds = useMemo(() => {
    return Array.from({ length: Math.max(0, directPalletQty || 0) }).map(
      (_, i) => `${productCode}-AUTO-FIFO-${String(i + 1).padStart(2, "0")}`,
    );
  }, [productCode, directPalletQty]);

  // ✅ 자동 목적지
  const currentDestSlots = useMemo(() => autoAssignSlots(currentPalletIds.length), [currentPalletIds]);

  const summary = useMemo(() => {
    const pCount = (existingTransfer as any)?.palletIds?.length ?? 0;
    const ea = Number((existingTransfer as any)?.transferEaQty ?? 0);
    const dest =
      ((existingTransfer as any)?.destinationSlots as string[] | undefined)?.join(", ") ??
      existingDestinationSlots?.join(", ") ??
      "-";

    if (!existingTransfer) {
      if (!canAutoApply) return "팔레트당 EA(단위)가 없어서 자동 계산 불가";
      return `자동 배정 예정: ${directPalletQty}P · ${autoTransferEaQty.toLocaleString()} EA · 목적지 ${currentDestSlots.join(
        ", ",
      )}`;
    }

    return `확정: 파렛트 ${pCount}개 · ${ea.toLocaleString()} EA · 목적지 ${dest}`;
  }, [
    existingTransfer,
    existingDestinationSlots,
    canAutoApply,
    directPalletQty,
    autoTransferEaQty,
    currentDestSlots,
  ]);

  return (
    <div className="space-y-3">
      {/* ✅ 헤더(좌측 텍스트 / 우측 버튼) */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-[13px] font-semibold">지정이송(풀파렛트)</div>
          <div className="text-[12px] text-gray-600">
          </div>
        </div>

        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="rounded-full border bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50"
        >
          수정(상세)
        </button>
      </div>

      <div className="rounded-xl border bg-gray-50 px-3 py-2 text-[12px] text-gray-700">
        {summary}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[12px] text-gray-600">파렛트 수량</div>
        <input
          type="number"
          min={0}
          className="w-28 rounded-md border px-2 py-1 text-[12px]"
          value={directPalletQty}
          onChange={(e) => onChangeDirectPalletQty(Number(e.target.value || 0))}
        />

        <div className="text-[12px] text-gray-500">
          {eaPerPallet ? (
            <>
              예상 EA: <b className="text-gray-900">{autoTransferEaQty.toLocaleString()}</b>
            </>
          ) : (
            <span className="text-red-500">eaPerPallet 없음</span>
          )}
        </div>

        <button
          type="button"
          disabled={!canAutoApply}
          onClick={() => {
            const info: TransferInfo = {
              ...(existingTransfer ?? ({} as any)),
              status: "이송중" as any,
              fromLocation: "2,3층 파렛트존" as any,
              palletIds: currentPalletIds as any,
              destinationSlots: currentDestSlots as any,
              orderEaQty: Number(orderEaQty || 0) as any,
              transferEaQty: autoTransferEaQty as any,
              remainingEaQty: Number(orderEaQty || 0) - autoTransferEaQty,
            };

            onApplyAutoDirect(info);
          }}
          className="rounded-full bg-blue-600 px-3 py-1 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          자동 적용
        </button>
      </div>

      {/* ✅ 수동 수정: “파렛트는 고정”, “목적지만 수정” */}
      <PalletDirectTransferModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        productCode={productCode}
        productName={productName}
        orderEaQty={orderEaQty}
        existingTransfer={existingTransfer}
        existingDestinationSlots={existingDestinationSlots}
        fixedPalletIds={(existingTransfer?.palletIds?.length ? existingTransfer.palletIds : currentPalletIds) as any}
        initialDestinationSlots={
          (existingTransfer?.destinationSlots?.length
            ? existingTransfer.destinationSlots
            : currentDestSlots) as any
        }
        forceEdit
        onConfirmTransfer={(info) => {
          onConfirmManualDirect(info);
          setManualOpen(false);
        }}
      />
    </div>
  );
}