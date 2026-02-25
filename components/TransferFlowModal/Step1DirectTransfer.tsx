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

  /**
   * ✅ 예정 상태(확인 전)
   * - 자동적용/수정(상세)에서 값이 만들어지면 draft에 저장
   * - 확인 버튼을 누르면 draft → 확정(existingTransfer로 전환되는 흐름)
   */
  const [draftTransfer, setDraftTransfer] = useState<TransferInfo | null>(null);
  const [draftMode, setDraftMode] = useState<"auto" | "manual" | null>(null);

  // 기본값: 계획 파렛트 수량이 있으면 거기로 세팅
  useEffect(() => {
    if (directPalletQty > 0) return;
    if (planPalletQty != null && planPalletQty > 0) {
      onChangeDirectPalletQty(planPalletQty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planPalletQty]);

  // ✅ 입력 수량이 바뀌면, 이전 "예정"은 무효니까 draft 제거
  useEffect(() => {
    if (existingTransfer) return; // 이미 확정이면 draft 의미 없음
    setDraftTransfer(null);
    setDraftMode(null);
  }, [directPalletQty, existingTransfer]);

  // ✅ 확정이 들어오면 draft도 정리
  useEffect(() => {
    if (!existingTransfer) return;
    setDraftTransfer(null);
    setDraftMode(null);
  }, [existingTransfer]);

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
  const currentDestSlots = useMemo(
    () => autoAssignSlots(currentPalletIds.length),
    [currentPalletIds],
  );

  // ✅ 표시용: 확정/예정 요약 (처음은 비어있게)
  const summary = useMemo(() => {
    // 1) 확정 상태
    if (existingTransfer) {
      const pCount = (existingTransfer as any)?.palletIds?.length ?? 0;
      const ea = Number((existingTransfer as any)?.transferEaQty ?? 0);
      const dest =
        ((existingTransfer as any)?.destinationSlots as string[] | undefined)?.join(", ") ??
        existingDestinationSlots?.join(", ") ??
        "-";

      return `확정 파렛트: ${pCount}P · ${ea.toLocaleString()} EA · 목적지 ${dest}`;
    }

    // 2) 예정 상태
    if (draftTransfer) {
      const pCount = (draftTransfer as any)?.palletIds?.length ?? 0;
      const ea = Number((draftTransfer as any)?.transferEaQty ?? 0);
      const dest =
        ((draftTransfer as any)?.destinationSlots as string[] | undefined)?.join(", ") ?? "-";

      return `예정 파렛트: ${pCount}P · ${ea.toLocaleString()} EA · 목적지 ${dest}`;
    }

    // 3) 초기(비어있게)
    return `예정 파렛트:`;
  }, [existingTransfer, existingDestinationSlots, draftTransfer]);

  // ✅ 확인 가능 조건: "확정이 아직 없고" + "예정이 있음"
  const canConfirm = !existingTransfer && !!draftTransfer;

  return (
    <div className="space-y-3">
      {/* ✅ 헤더(좌측 텍스트 / 우측 버튼) */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-[13px] font-semibold">지정 이송(파렛트 단위)</div>
          <div className="text-[12px] text-gray-600">
            계획: <span className="font-semibold text-gray-900">{planText}</span>
          </div>
        </div>

        {/* ✅ 자동적용을 수정(상세) 왼쪽으로 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canAutoApply || !!existingTransfer}
            onClick={() => {
              // ✅ 자동적용 = "예정"만 만든다
              if (!canAutoApply) return;

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

              setDraftTransfer(info);
              setDraftMode("auto");
            }}
            className="rounded-full bg-blue-600 px-3 py-1 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            자동 적용
          </button>

          <button
            type="button"
            onClick={() => setManualOpen(true)}
            disabled={!!existingTransfer}
            className="rounded-full border bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            수정(상세)
          </button>
        </div>
      </div>

      {/* ✅ 요약 */}
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
          disabled={!!existingTransfer}
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

        {/* ✅ 기존 자동적용 위치에 "확인" 버튼 */}
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => {
            if (!draftTransfer) return;

            // ✅ 예정 → 확정
            // 자동에서 만든 예정이면 onApplyAutoDirect
            // 수동(상세)에서 만든 예정이면 onConfirmManualDirect
            if (draftMode === "manual") {
              onConfirmManualDirect(draftTransfer);
            } else {
              onApplyAutoDirect(draftTransfer);
            }
          }}
          className="rounded-full bg-emerald-600 px-3 py-1 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          확인
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
        fixedPalletIds={
          (existingTransfer?.palletIds?.length ? existingTransfer.palletIds : currentPalletIds) as any
        }
        initialDestinationSlots={
          (existingTransfer?.destinationSlots?.length
            ? existingTransfer.destinationSlots
            : currentDestSlots) as any
        }
        forceEdit
        onConfirmTransfer={(info) => {
          // ✅ 수정(상세)도 즉시 확정이 아니라 "예정"만 만든다
          setDraftTransfer(info);
          setDraftMode("manual");
          setManualOpen(false);
        }}
      />
    </div>
  );
}