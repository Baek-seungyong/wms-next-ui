// components/PalletDirectTransferModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { TransferInfo } from "./types";

type ZoneId = "A" | "B" | "C" | "D";

type DemoPallet = {
  id: string;
  productCode: string;
  productName: string;
  lotNo: string;
  fromLocation: string;
  boxQty: number;
  eaQty: number;
};

type Props = {
  open: boolean;
  onClose: () => void;

  productCode?: string;
  productName?: string;
  orderEaQty?: number;

  existingTransfer?: TransferInfo | null;
  onConfirmTransfer?: (info: TransferInfo) => void;
};

/** 데모 파렛트 */
const DEMO_PALLETS: DemoPallet[] = [
  {
    id: "PAL-001-01",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    lotNo: "LOT-2501-A",
    fromLocation: "3층창고",
    boxQty: 10,
    eaQty: 1200,
  },
  {
    id: "PAL-001-02",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    lotNo: "LOT-2501-B",
    fromLocation: "3층창고",
    boxQty: 8,
    eaQty: 960,
  },
  {
    id: "PAL-001-03",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    lotNo: "LOT-2501-A",
    fromLocation: "2층창고",
    boxQty: 6,
    eaQty: 720,
  },
  {
    id: "PAL-013-01",
    productCode: "P-013",
    productName: "PET 1L 반투명",
    lotNo: "LOT-2501-A",
    fromLocation: "3층창고",
    boxQty: 2,
    eaQty: 240,
  },
  {
    id: "PAL-013-02",
    productCode: "P-013",
    productName: "PET 1L 반투명",
    lotNo: "LOT-2501-B",
    fromLocation: "2층창고",
    boxQty: 1,
    eaQty: 120,
  },
];

/** 입출고장 임시 슬롯 */
const ZONES: ZoneId[] = ["A", "B", "C", "D"];
const ROWS = 4;
const COLS = 4;

// 점유(노랑)
const OCCUPIED_SET = new Set<string>(["A-1-1", "A-1-2", "B-2-1", "B-2-2"]);

export function PalletDirectTransferModal({
  open,
  onClose,
  productCode,
  productName,
  orderEaQty,
  existingTransfer,
  onConfirmTransfer,
}: Props) {
  const isStatusMode = !!existingTransfer;

  const palletsForProduct = useMemo(() => {
    if (!productCode) return DEMO_PALLETS;
    return DEMO_PALLETS.filter((p) => p.productCode === productCode);
  }, [productCode]);

  const slotsByZone = useMemo(() => {
    const map: Record<ZoneId, { id: string; occupied: boolean }[]> = {
      A: [],
      B: [],
      C: [],
      D: [],
    };

    (["A", "B", "C", "D"] as ZoneId[]).forEach((zone) => {
      const list: { id: string; occupied: boolean }[] = [];
      for (let r = 1; r <= ROWS; r++) {
        for (let c = 1; c <= COLS; c++) {
          const id = `${zone}-${r}-${c}`;
          list.push({ id, occupied: OCCUPIED_SET.has(id) });
        }
      }
      map[zone] = list;
    });

    return map;
  }, []);

  const [selectedPalletIds, setSelectedPalletIds] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    if (existingTransfer) {
      setSelectedPalletIds(existingTransfer.palletIds ?? []);
      setSelectedSlots(existingTransfer.destinationSlots ?? []);
    } else {
      setSelectedPalletIds([]);
      setSelectedSlots([]);
    }
  }, [open, existingTransfer]);

  // ✅ 파렛트 개수와 슬롯 개수는 항상 동일하게 유지(무조건 트림)
  useEffect(() => {
    setSelectedSlots((prev) => prev.slice(0, selectedPalletIds.length));
  }, [selectedPalletIds.length]);

  const statusPalletDetails = useMemo(() => {
    const ids = new Set(existingTransfer?.palletIds ?? []);
    return palletsForProduct.filter((p) => ids.has(p.id));
  }, [existingTransfer?.palletIds, palletsForProduct]);

  // ✅ 선택모드: 실시간 지정이송 EA 합
  const liveTransferEaQty = useMemo(() => {
    const idSet = new Set(selectedPalletIds);
    return palletsForProduct
      .filter((p) => idSet.has(p.id))
      .reduce((sum, p) => sum + (p.eaQty ?? 0), 0);
  }, [selectedPalletIds, palletsForProduct]);

  // ✅ 선택모드: 실시간 잔량(주문-지정이송)
  const liveRemainEaQty = useMemo(() => {
    const order = orderEaQty ?? 0;
    return order - liveTransferEaQty; // 음수 허용(경고는 나중에 추가 가능)
  }, [orderEaQty, liveTransferEaQty]);

  // ✅ 확정 조건: 파렛트 개수 === 슬롯 개수 && 둘 다 1개 이상
  const canConfirm = useMemo(() => {
    if (isStatusMode) return false;
    const pc = selectedPalletIds.length;
    const sc = selectedSlots.length;
    return pc > 0 && sc > 0 && pc === sc;
  }, [selectedPalletIds.length, selectedSlots.length, isStatusMode]);

  const resetState = () => {
    setSelectedPalletIds([]);
    setSelectedSlots([]);
  };

  const handleTogglePallet = (id: string, checked: boolean) => {
    setSelectedPalletIds((prev) => {
      const next = checked ? [...prev, id] : prev.filter((x) => x !== id);
      return next;
    });
  };

  // ✅ 슬롯은 "파렛트 선택 개수만큼"만 선택 가능
  const handleToggleSlot = (id: string) => {
    if (isStatusMode) return;
    if (OCCUPIED_SET.has(id)) return;

    const max = selectedPalletIds.length;
    if (max <= 0) return; // 파렛트 선택 전에는 슬롯 선택 불가

    setSelectedSlots((prev) => {
      // 해제
      if (prev.includes(id)) return prev.filter((x) => x !== id);

      // 추가(초과 방지)
      if (prev.length >= max) {
        // ✅ 초과 클릭은 무시(원하면 "마지막을 바꾸기"로 바꿀 수도 있음)
        return prev;
      }

      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    if (!canConfirm) return;

    const uniqueZones = Array.from(
      new Set(selectedSlots.map((slotId) => slotId.split("-")[0])),
    );
    const mainZone = uniqueZones[0];
    const nameForAlert = productName ?? productCode ?? "해당 상품";

    alert(
      `${nameForAlert}의 ${selectedPalletIds.length}개 파렛트를 ${mainZone}${
        uniqueZones.length > 1
          ? ` 외 ${uniqueZones.length - 1}개 구역으로`
          : " 구역으로"
      } 이동합니다.`,
    );

    const transferEaQty = liveTransferEaQty;
    const remainingEaQty = (orderEaQty ?? 0) - transferEaQty;

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

  // ✅ 요약 표시값: 모드별로 다르게
  const summaryOrderQty = existingTransfer?.orderEaQty ?? orderEaQty ?? 0;

  const summaryTransferQty = isStatusMode
    ? existingTransfer?.transferEaQty ??
      statusPalletDetails.reduce((sum, p) => sum + (p.eaQty ?? 0), 0)
    : liveTransferEaQty;

  const summaryRemainQty = isStatusMode
    ? existingTransfer?.remainingEaQty ?? summaryOrderQty - summaryTransferQty
    : liveRemainEaQty;

  const needSlotCount = selectedPalletIds.length;
  const pickedSlotCount = selectedSlots.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[700px] w-[980px] flex-col rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">
              지정이송 · 1층 입출고장 파렛트 위치 지정
              {isStatusMode && (
                <span className="ml-2 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                  이송 현황
                </span>
              )}
            </h2>
            <p className="mt-1 text-[11px] text-gray-500">
              대상 상품:{" "}
              <span className="font-semibold text-gray-700">
                {productCode} / {productName}
              </span>
            </p>
          </div>

          <button
            type="button"
            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {/* 요약 */}
        <div className="border-b px-5 py-3">
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard
              label="주문수량(EA)"
              value={summaryOrderQty.toLocaleString()}
            />
            <SummaryCard
              label="지정이송(EA)"
              value={summaryTransferQty.toLocaleString()}
            />
            <SummaryCard
              label="잔량(EA)"
              value={summaryRemainQty.toLocaleString()}
            />
          </div>

          {!isStatusMode && (
            <div className="mt-2 text-[11px] text-gray-600">
              파렛트{" "}
              <span className="font-semibold text-gray-800">
                {needSlotCount}
              </span>
              개 선택 → 도착 위치{" "}
              <span className="font-semibold text-gray-800">
                {pickedSlotCount}/{needSlotCount}
              </span>
              개 지정
              {needSlotCount > 0 && pickedSlotCount !== needSlotCount && (
                <span className="ml-2 text-red-600">
                  (파렛트 개수와 위치 개수가 같아야 확정 가능)
                </span>
              )}
            </div>
          )}
        </div>

        {/* 본문 */}
        <div className="flex flex-1 gap-4 overflow-hidden px-5 py-4">
          {/* 파렛트 선택 */}
          <div className="flex flex-1 flex-col gap-3 overflow-hidden">
            {!isStatusMode && (
              <div className="flex flex-1 flex-col rounded-xl border bg-gray-50/80 p-3">
                <p className="mb-2 text-xs font-semibold text-gray-800">
                  이송할 파렛트 선택
                </p>
                <div className="flex-1 overflow-auto rounded-lg bg-white">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 border-b bg-gray-50 text-[11px]">
                      <tr>
                        <th className="w-8 p-1 text-center">
                          <input
                            type="checkbox"
                            checked={
                              palletsForProduct.length > 0 &&
                              selectedPalletIds.length === palletsForProduct.length
                            }
                            onChange={(e) =>
                              setSelectedPalletIds(
                                e.target.checked
                                  ? palletsForProduct.map((p) => p.id)
                                  : [],
                              )
                            }
                          />
                        </th>
                        <th className="w-24 px-2 py-1 text-left">파렛트ID</th>
                        <th className="px-2 py-1 text-left">상품명</th>
                        <th className="w-28 px-2 py-1 text-left">LOT 번호</th>
                        <th className="w-24 px-2 py-1 text-left">출발 위치</th>
                        <th className="w-16 px-2 py-1 text-right">BOX</th>
                        <th className="w-24 px-2 py-1 text-right">전체 수량(EA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {palletsForProduct.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-3 text-center text-gray-400">
                            선택된 상품에 대한 파렛트가 없습니다.
                          </td>
                        </tr>
                      )}
                      {palletsForProduct.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b text-[11px] last:border-b-0 hover:bg-gray-50"
                        >
                          <td className="p-1 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={selectedPalletIds.includes(p.id)}
                              onChange={(e) =>
                                handleTogglePallet(p.id, e.target.checked)
                              }
                            />
                          </td>
                          <td className="px-2 py-1 align-middle">{p.id}</td>
                          <td className="px-2 py-1 align-middle">{p.productName}</td>
                          <td className="px-2 py-1 align-middle">{p.lotNo}</td>
                          <td className="px-2 py-1 align-middle">{p.fromLocation}</td>
                          <td className="px-2 py-1 text-right align-middle">
                            {p.boxQty.toLocaleString()}
                          </td>
                          <td className="px-2 py-1 text-right align-middle">
                            {p.eaQty.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  선택된 파렛트:{" "}
                  <span className="font-semibold text-gray-800">
                    {selectedPalletIds.length}
                  </span>{" "}
                  개
                </p>
              </div>
            )}

            {isStatusMode && (
              <div className="flex flex-1 flex-col rounded-xl border bg-gray-50/80 p-3">
                <p className="mb-2 text-xs font-semibold text-gray-800">이송중 파렛트</p>
                <div className="flex-1 overflow-auto rounded-lg bg-white p-3 text-[11px]">
                  {statusPalletDetails.length === 0 ? (
                    <div className="text-gray-400">파렛트 정보가 없습니다.</div>
                  ) : (
                    <ul className="space-y-2">
                      {statusPalletDetails.map((p) => (
                        <li key={p.id} className="flex items-center justify-between">
                          <span className="text-gray-700">
                            {p.id} / {p.eaQty.toLocaleString()} EA
                          </span>
                          <span className="text-gray-400">{p.fromLocation}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 존/위치 */}
          <div className="flex-1 overflow-y-auto rounded-xl border bg-gray-50/80 p-3">
            <p className="mb-2 text-xs font-semibold text-gray-800">
              {isStatusMode ? "도착 위치 (이송중)" : "도착 위치 선택"}
            </p>

            <div className="grid grid-cols-2 gap-6">
              {ZONES.map((zone) => (
                <div key={zone}>
                  <div className="mb-1 font-semibold text-gray-700">{zone} zone</div>

                  <div className="inline-grid grid-cols-4 gap-2 rounded-xl bg-gray-50 p-3">
                    {slotsByZone[zone].map(({ id, occupied }) => {
                      const base =
                        "flex h-9 w-9 items-center justify-center rounded-md border";

                      if (isStatusMode && existingTransfer) {
                        const isDest = existingTransfer.destinationSlots.includes(id);
                        if (occupied) {
                          return (
                            <div
                              key={id}
                              className={`${base} border-amber-300 bg-amber-300`}
                              title={`${id} : 점유`}
                            />
                          );
                        }

                        return (
                          <div
                            key={id}
                            className={`${base} ${
                              isDest
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300 bg-white"
                            }`}
                            title={id}
                          />
                        );
                      }

                      if (occupied) {
                        return (
                          <div
                            key={id}
                            className={`${base} border-amber-300 bg-amber-300`}
                            title={`${id} : 점유`}
                          />
                        );
                      }

                      const isSelected = selectedSlots.includes(id);

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleToggleSlot(id)}
                          className={`${base} ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500"
                              : "border-gray-300 bg-white hover:bg-emerald-50"
                          }`}
                          title={id}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!isStatusMode && (
              <div className="mt-3 text-[11px] text-gray-600">
                선택 목적지:{" "}
                <span className="font-semibold text-gray-800">
                  {selectedSlots.length ? selectedSlots.join(", ") : "없음"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between border-t px-5 py-3">
          <button
            type="button"
            className="rounded-full border bg-white px-4 py-2 text-xs hover:bg-gray-50"
            onClick={onClose}
          >
            닫기
          </button>

          {!isStatusMode && (
            <button
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
              className={`rounded-full px-5 py-2 text-xs font-semibold ${
                canConfirm
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              확정
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900 leading-none">
        {value}
      </div>
    </div>
  );
}
