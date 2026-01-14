// components/receiving/TransferFlowModal/Step1DirectTransfer.tsx
"use client";

import { useMemo, useState } from "react";
import { PalletDirectTransferModal } from "../PalletDirectTransferModal";
import type { TransferInfo } from "./types";

type Props = {
  onClose: () => void;

  productCode: string;
  productName: string;
  orderEaQty: number;

  existingTransfer: TransferInfo | null;
  existingDestinationSlots: string[];

  onConfirmDirectTransfer: (info: TransferInfo) => void;
};

export function Step1DirectTransfer({
  onClose,
  productCode,
  productName,
  orderEaQty,
  existingTransfer,
  existingDestinationSlots,
  onConfirmDirectTransfer,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const isStatusMode = !!existingTransfer;

  const summary = useMemo(() => {
    if (!existingTransfer) return "아직 선택된 파렛트 없음";
    const pCount = existingTransfer.palletIds?.length ?? 0;
    const dest = existingTransfer.destinationSlots?.length
      ? existingTransfer.destinationSlots.join(", ")
      : "-";
    return `파렛트 ${pCount}개 · ${(existingTransfer.transferEaQty ?? 0).toLocaleString()} EA · 목적지 ${dest}`;
  }, [existingTransfer]);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">1 STEP · 지정이송</div>
          <div className="mt-1 text-[12px] text-gray-600">
            먼저 <span className="font-semibold">{productName}</span> 파렛트를 선택하고
            1층 입출고 위치를 지정해줘.
          </div>

          <div className="mt-2 rounded-xl border bg-gray-50 px-3 py-2 text-[12px] text-gray-700">
            {summary}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
        >
          닫기
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          {isStatusMode ? "이송 현황 보기" : "파렛트 선택 / 위치 지정"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
      </div>

      <PalletDirectTransferModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        productCode={productCode}
        productName={productName}
        orderEaQty={orderEaQty}
        existingTransfer={existingTransfer}
        existingDestinationSlots={existingDestinationSlots}
        onConfirmTransfer={(info) => {
          onConfirmDirectTransfer(info);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
