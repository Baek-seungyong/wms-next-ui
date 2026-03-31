// components/PalletDirectTransferModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { TransferInfo } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;

  productCode: string;
  productName: string;

  /** 주문 EA */
  orderEaQty: number;

  /** 이미 확정된 이송(있으면 현황모드) */
  existingTransfer: TransferInfo | null;
  existingDestinationSlots: string[];

  /** ✅ 파렛트 선택을 “고정”하고 목적지만 수정하게 하고 싶을 때 */
  fixedPalletIds?: string[];

  /** ✅ 모달 열릴 때 목적지 슬롯 초기 선택 */
  initialDestinationSlots?: string[];

  /** ✅ existingTransfer가 있어도 강제로 편집(설정 모드) */
  forceEdit?: boolean;

  onConfirmTransfer?: (info: TransferInfo) => void;
};

// -------------------- 더미 데이터(기존 유지) --------------------
type PalletItem = {
  id: string;
  productCode: string;
  eaQty: number;
  lotNo: string;
};

const DEMO_PALLETS: PalletItem[] = [
  { id: "P-001-PAL-01", productCode: "P-001", eaQty: 1150, lotNo: "LOT-2501-A" },
  { id: "P-001-PAL-02", productCode: "P-001", eaQty: 1150, lotNo: "LOT-2501-A" },
  { id: "P-001-PAL-03", productCode: "P-001", eaQty: 1150, lotNo: "LOT-2501-B" },
  { id: "P-013-PAL-01", productCode: "P-013", eaQty: 1200, lotNo: "LOT-2501-A" },
  { id: "P-013-PAL-02", productCode: "P-013", eaQty: 1200, lotNo: "LOT-2501-B" },
];

// 목적지 슬롯(예시)
const DEST_SLOTS = [
  "A-1",
  "A-2",
  "A-3",
  "A-4",
  "B-1",
  "B-2",
  "B-3",
  "B-4",
  "C-1",
  "C-2",
  "C-3",
  "C-4",
];

export function PalletDirectTransferModal({
  open,
  onClose,
  productCode,
  productName,
  orderEaQty,
  existingTransfer,
  existingDestinationSlots,
  fixedPalletIds,
  initialDestinationSlots,
  forceEdit,
  onConfirmTransfer,
}: Props) {
  const isStatusMode = Boolean(existingTransfer) && !forceEdit;

  // ---------- 설정 모드용 상태 ----------
  const [selectedPalletIds, setSelectedPalletIds] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // 선택한 상품의 파렛트 리스트
  const palletsForProduct = useMemo(() => {
    if (!productCode) return DEMO_PALLETS;
    return DEMO_PALLETS.filter((p) => p.productCode === productCode);
  }, [productCode]);

  // ✅ open 시 초기화(고정/초기 선택 반영)
  useEffect(() => {
    if (!open) return;

    const palletsInit =
      fixedPalletIds?.length
        ? fixedPalletIds
        : forceEdit
          ? (existingTransfer?.palletIds ?? [])
          : [];

    const slotsInit =
      initialDestinationSlots?.length
        ? initialDestinationSlots
        : forceEdit
          ? (existingTransfer?.destinationSlots ?? existingDestinationSlots ?? [])
          : [];

    setSelectedPalletIds(palletsInit);
    setSelectedSlots(slotsInit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ 설정 모드: 실시간 지정이송 수량(EA)
  const liveTransferEaQty = useMemo(() => {
    return selectedPalletIds
      .map((id) => DEMO_PALLETS.find((p) => p.id === id)?.eaQty ?? 0)
      .reduce((a, b) => a + b, 0);
  }, [selectedPalletIds]);

  // ✅ 설정 모드: 실시간 잔량(EA) (음수 허용)
  const liveRemainingEaQty = useMemo(() => {
    return (orderEaQty ?? 0) - liveTransferEaQty;
  }, [orderEaQty, liveTransferEaQty]);

  const isOverTransfer = liveTransferEaQty > (orderEaQty ?? 0);

  const canConfirm =
    !isStatusMode &&
    selectedPalletIds.length > 0 &&
    selectedSlots.length === selectedPalletIds.length;

  const resetState = () => {
    setSelectedPalletIds([]);
    setSelectedSlots([]);
  };

  // ---------- 현황 모드용 파렛트 상세 ----------
  const statusPalletDetails = useMemo(() => {
    const ids = existingTransfer?.palletIds ?? []; // ✅ 핵심

    if (ids.length === 0) return [];

    return ids
      .map((id) => DEMO_PALLETS.find((p) => p.id === id) || null)
      .filter((p): p is PalletItem => p !== null);
  }, [existingTransfer]);

  const handleTogglePallet = (id: string, checked: boolean) => {
    // ✅ 고정모드면 파렛트 변경 금지
    if (fixedPalletIds?.length) return;

    setSelectedPalletIds((prev) => {
      const next = checked ? [...prev, id] : prev.filter((x) => x !== id);

      // 파렛트 개수가 줄어들면 슬롯 개수도 맞춰주기
      if (selectedSlots.length > next.length) {
        setSelectedSlots((prevSlots) => prevSlots.slice(0, next.length));
      }
      return next;
    });
  };

  const handleToggleSlot = (id: string) => {
    // ✅ 이미 선택된 슬롯이면 "재클릭 = 선택 취소"
    if (selectedSlots.includes(id)) {
      setSelectedSlots((prev) => prev.filter((x) => x !== id));
      return;
    }

    if (selectedPalletIds.length === 0) {
      alert("먼저 이송할 파렛트를 선택해 주세요.");
      return;
    }

    if (selectedSlots.length >= selectedPalletIds.length) {
      alert(
        `현재 선택된 파렛트는 ${selectedPalletIds.length}개입니다.\n위치도 동일한 개수만 선택할 수 있습니다.`,
      );
      return;
    }

    setSelectedSlots((prev) => [...prev, id]);
  };

  const handleConfirm = () => {
    if (!canConfirm) return;

    const transferEaQty = liveTransferEaQty;
    const remainingEaQty = (orderEaQty ?? 0) - transferEaQty; // ✅ 음수 허용

    const transferInfo: TransferInfo = {
      status: "이송중",
      fromLocation: "2,3층 파렛트존",
      palletIds: selectedPalletIds,
      destinationSlots: selectedSlots,

      orderEaQty: orderEaQty ?? 0,
      transferEaQty,
      remainingEaQty,
    };

    onConfirmTransfer?.(transferInfo);
    resetState();
    onClose();
  };

  if (!open) return null;

  // ✅ 현황 모드에서 혹시 값이 비어있을 때도 보이도록 fallback 계산
  const statusOrderQty = existingTransfer?.orderEaQty ?? orderEaQty ?? 0;
  const statusTransferQty =
    existingTransfer?.transferEaQty ??
    statusPalletDetails.reduce((sum, p) => sum + (p.eaQty ?? 0), 0);
  const statusRemainQty =
    existingTransfer?.remainingEaQty ?? statusOrderQty - statusTransferQty;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-[920px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="text-[14px] font-semibold text-gray-900">
              지정이송 목적지 설정
            </div>
            <div className="mt-1 text-[12px] text-gray-600">
              {productName} ({productCode})
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

        <div className="p-5">
          {/* 현황 모드 */}
          {isStatusMode ? (
            <div className="space-y-3">
              <div className="rounded-xl border bg-gray-50 p-3 text-[12px] text-gray-700">
                주문 {statusOrderQty.toLocaleString()} EA · 지정이송{" "}
                {statusTransferQty.toLocaleString()} EA · 잔량{" "}
                {statusRemainQty.toLocaleString()} EA
              </div>

              <div className="rounded-xl border p-3">
                <div className="text-[12px] font-semibold text-gray-800">
                  이송 파렛트 ({statusPalletDetails.length})
                </div>
                <div className="mt-2 space-y-2">
                  {statusPalletDetails.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-[12px]"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{p.id}</div>
                        <div className="mt-0.5 text-[11px] text-gray-500">
                          {p.lotNo}
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-600">
                        {p.eaQty.toLocaleString()} EA
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-[12px] text-gray-700">
                  목적지:{" "}
                  <b className="text-gray-900">
                    {(existingTransfer?.destinationSlots ?? existingDestinationSlots ?? []).join(
                      ", ",
                    ) || "-"}
                  </b>
                </div>
              </div>

              <div className="text-[12px] text-gray-500">
                · 이 화면은 현황 모드야. 편집하려면 forceEdit로 열어야 돼.
              </div>
            </div>
          ) : (
            // 설정(편집) 모드
            <div className="grid grid-cols-2 gap-4">
              {/* 좌: 파렛트 선택 */}
              <div className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-semibold text-gray-800">
                    이송할 파렛트
                  </div>
                  {fixedPalletIds?.length ? (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                      파렛트 고정
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 space-y-2">
                  {palletsForProduct.map((p) => {
                    const checked = selectedPalletIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-[12px] hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={Boolean(fixedPalletIds?.length)}
                            onChange={(e) => handleTogglePallet(p.id, e.target.checked)}
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{p.id}</div>
                            <div className="mt-0.5 text-[11px] text-gray-500">
                              {p.lotNo}
                            </div>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {p.eaQty.toLocaleString()} EA
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-[12px] text-gray-700">
                  지정이송 {liveTransferEaQty.toLocaleString()} EA · 잔량{" "}
                  <span className={isOverTransfer ? "font-semibold text-red-600" : "font-semibold"}>
                    {liveRemainingEaQty.toLocaleString()} EA
                  </span>
                </div>
                {isOverTransfer ? (
                  <div className="mt-2 text-[12px] text-red-600">
                    ⚠ 주문 수량보다 많이 선택했어(초과).
                  </div>
                ) : null}
              </div>

              {/* 우: 목적지 슬롯 선택 */}
              <div className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-semibold text-gray-800">
                    목적지 선택 ({selectedSlots.length}/{selectedPalletIds.length})
                  </div>
                  <div className="text-[11px] text-gray-500">
                    · 재클릭 = 선택 취소
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {DEST_SLOTS.map((s) => {
                    const selected = selectedSlots.includes(s);

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleToggleSlot(s)}
                        className={[
                          "rounded-lg border px-2 py-2 text-[12px] font-semibold",
                          selected
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                        ].join(" ")}
                        title={selected ? "선택됨(클릭하면 취소)" : "선택"}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 text-[12px] text-gray-600">
                  선택된 목적지:{" "}
                  <b className="text-gray-900">{selectedSlots.join(", ") || "-"}</b>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlots([]);
                    }}
                    className="rounded-full border bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50"
                  >
                    목적지 초기화
                  </button>

                  <button
                    type="button"
                    disabled={!canConfirm}
                    onClick={handleConfirm}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                  >
                    확정
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-gray-50 px-5 py-3 text-[11px] text-gray-600">
          · 파렛트 수 = 목적지 선택 수가 같아야 확정 가능해.
        </div>
      </div>
    </div>
  );
}