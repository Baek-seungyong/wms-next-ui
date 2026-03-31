// components/CarBatchTransferModal/index.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrderItem, Order } from "../types";
import type {
  CarBatchTransferPayload,
  CarBatchTransferPlan,
  CarBatchTransferSlotId,
} from "./types";
import { autoAssignCarOutboundSlots, BOXES_PER_PALLET } from "./slotAssign";

type DraftMap = Record<string /*orderId*/, Record<string /*productCode*/, boolean>>;

type Props = {
  open: boolean;
  onClose: () => void;

  // ✅ 모달 안에서 주문 선택
  orders: Order[];
  itemsByOrderId: Record<string, OrderItem[]>;

  // ✅ 주문별 체크 상태 유지(부모에서 들고있음)
  draftByOrder: DraftMap;
  onChangeDraftByOrder: (next: DraftMap) => void;

  // ✅ 확정 시 itemsByOrderId 업데이트(= step1 완료처리)
  onUpdateItems: (orderId: string, nextItems: OrderItem[]) => void;

  // ✅ 이미 차있는 슬롯(옵션)
  occupiedSlotIds?: CarBatchTransferSlotId[];

  initialOrderId?: string;
};

type Line = {
  code: string;
  name: string;
  orderQty: number;

  boxEa: number;
  palletEa: number;

  fullPallets: number; // floor(orderQty/palletEa)
  transferEaQty: number; // fullPallets * palletEa
  remainEa: number; // orderQty - transferEaQty
};

export function CarBatchTransferModal({
  open,
  onClose,
  orders,
  itemsByOrderId,
  draftByOrder,
  onChangeDraftByOrder,
  onUpdateItems,
  occupiedSlotIds = [],
  initialOrderId,
}: Props) {
  const vehicleOrders = useMemo(
    () => orders.filter((o) => (o as any).zone === "차량출고"),
    [orders],
  );

  const [activeOrderId, setActiveOrderId] = useState<string>(
    initialOrderId ?? vehicleOrders[0]?.id ?? "",
  );

  // 열릴 때 초기 주문 세팅
  useEffect(() => {
    if (!open) return;
    const first = initialOrderId ?? vehicleOrders[0]?.id ?? "";
    setActiveOrderId(first);
  }, [open, initialOrderId, vehicleOrders]);

  const activeOrder = useMemo(
    () => vehicleOrders.find((o) => o.id === activeOrderId) ?? vehicleOrders[0] ?? null,
    [vehicleOrders, activeOrderId],
  );

  const activeItems = useMemo(() => {
    if (!activeOrder?.id) return [];
    return itemsByOrderId[activeOrder.id] ?? [];
  }, [itemsByOrderId, activeOrder?.id]);

  const occupiedSet = useMemo(() => new Set(occupiedSlotIds), [occupiedSlotIds]);

  const activeDraft = draftByOrder[activeOrder?.id ?? ""] ?? {};

  // ✅ 상품별 풀파렛트 라인 계산
  const lines: Line[] = useMemo(() => {
    return activeItems.map((it) => {
      const code = (it as any).code ?? (it as any).itemCode ?? "";
      const name = (it as any).name ?? "";

      const orderQty = Number((it as any).orderQty ?? (it as any).qty ?? 0);

      const boxEa = Number(
        (it as any).boxEa ??
          (it as any).eaPerBox ??
          (it as any).boxInnerEa ??
          (it as any).unitsPerBox ??
          0,
      );

      const palletEaRaw = Number(
        (it as any).palletEa ??
          (it as any).eaPerPallet ??
          (it as any).unitsPerPallet ??
          (it as any).eaPerPalletQty ??
          0,
      );
      const palletEa =
        palletEaRaw > 0 ? palletEaRaw : boxEa > 0 ? boxEa * BOXES_PER_PALLET : 0;

      const fullPallets = orderQty > 0 && palletEa > 0 ? Math.floor(orderQty / palletEa) : 0;
      const transferEaQty = fullPallets * palletEa;
      const remainEa = Math.max(0, orderQty - transferEaQty);

      return { code, name, orderQty, boxEa, palletEa, fullPallets, transferEaQty, remainEa };
    });
  }, [activeItems]);

  // ✅ 전체선택(풀파렛트 있는 라인만 대상)
  const eligibleLines = useMemo(() => lines.filter((l) => l.fullPallets > 0), [lines]);

  const toggleAll = (next: boolean) => {
    if (!activeOrder?.id) return;
    const orderId = activeOrder.id;

    const curForOrder = draftByOrder[orderId] ?? {};
    const nextForOrder = { ...curForOrder };

    for (const l of eligibleLines) {
      nextForOrder[l.code] = next;
    }

    onChangeDraftByOrder({ ...draftByOrder, [orderId]: nextForOrder });
  };

  // ✅ 요구사항: 기본 체크는 전부 선택(풀파렛트 있는 것만)
  // - 이미 사용자가 체크를 만진 주문은 유지
  // - "해당 주문에 체크 기록이 하나도 없을 때만" 자동 전체 선택
  useEffect(() => {
    if (!open) return;
    if (!activeOrder?.id) return;

    const orderId = activeOrder.id;
    if (eligibleLines.length === 0) return;

    const curForOrder = draftByOrder[orderId] ?? {};
    const hasAnyRecord = eligibleLines.some((l) => curForOrder[l.code] !== undefined);

    if (!hasAnyRecord) {
      const nextForOrder: Record<string, boolean> = { ...curForOrder };
      for (const l of eligibleLines) nextForOrder[l.code] = true;
      onChangeDraftByOrder({ ...draftByOrder, [orderId]: nextForOrder });
    }
  }, [open, activeOrder?.id, eligibleLines, draftByOrder, onChangeDraftByOrder]);

  const allChecked = useMemo(() => {
    if (eligibleLines.length === 0) return false;
    return eligibleLines.every((l) => !!activeDraft[l.code]);
  }, [eligibleLines, activeDraft]);

  const someChecked = useMemo(() => {
    const checkedCount = eligibleLines.filter((l) => !!activeDraft[l.code]).length;
    return checkedCount > 0 && checkedCount < eligibleLines.length;
  }, [eligibleLines, activeDraft]);

  const toggleItemChecked = (code: string, next: boolean) => {
    if (!activeOrder?.id) return;

    const orderId = activeOrder.id;
    const curForOrder = draftByOrder[orderId] ?? {};

    const nextForOrder = { ...curForOrder, [code]: next };
    onChangeDraftByOrder({ ...draftByOrder, [orderId]: nextForOrder });
  };

  // ✅ 체크된 상품만 대상으로 파렛트 수 합계
  const selectedLines = useMemo(() => {
    return lines.filter((l) => !!activeDraft[l.code] && l.fullPallets > 0);
  }, [lines, activeDraft]);

  const plan: CarBatchTransferPlan = useMemo(() => {
    const plannedPalletCount = selectedLines.reduce((sum, l) => sum + l.fullPallets, 0);
    const plannedEaCount = selectedLines.reduce((sum, l) => sum + l.transferEaQty, 0);
    return { plannedPalletCount, plannedEaCount };
  }, [selectedLines]);

  // ✅ 요구사항: 목적지 슬롯은 "자동으로만" 지정
  const selectedSlots: CarBatchTransferSlotId[] = useMemo(() => {
    if (!open) return [];
    if (plan.plannedPalletCount <= 0) return [];
    return autoAssignCarOutboundSlots(plan.plannedPalletCount, occupiedSet);
  }, [open, plan.plannedPalletCount, occupiedSet]);

  const isReady =
    plan.plannedPalletCount > 0 && selectedSlots.length === plan.plannedPalletCount;

  // ✅ 확정: 선택된 상품들만 1STEP 지정이송 완료 처리(directTransfer 세팅)
  const handleConfirm = () => {
    if (!activeOrder?.id) return;
    if (!isReady) return;

    const orderId = activeOrder.id;

    // 1) 전체 파렛트(선택된 상품들의 fullPallets 합) 만큼 슬롯을 순서대로 배분
    const destByCode: Record<string, CarBatchTransferSlotId[]> = {};
    let cursor = 0;
    for (const l of selectedLines) {
      destByCode[l.code] = selectedSlots.slice(cursor, cursor + l.fullPallets);
      cursor += l.fullPallets;
    }

    // 2) payload
    const payload: CarBatchTransferPayload = {
      orderId,
      createdAt: new Date().toISOString(),
      pallets: selectedSlots.map((toSlotId, idx) => ({ seq: idx + 1, toSlotId })),
      lines: selectedLines.map((l) => ({
        code: l.code,
        name: l.name,
        fullPallets: l.fullPallets,
        palletEa: l.palletEa,
        transferEaQty: l.transferEaQty,
        remainEa: l.remainEa,
        destinationSlots: destByCode[l.code] ?? [],
      })),
    } as any;

    // 3) items 업데이트
    const nextItems = activeItems.map((it) => {
      const code = (it as any).code ?? (it as any).itemCode ?? "";
      const line = selectedLines.find((x) => x.code === code);

      // 모든 아이템에 payload 저장(주문단위 조회 편의)
      const baseNext = { ...(it as any), carBatchTransfer: payload } as any;

      if (!line) return baseNext;

      const directTransfer = {
        status: "이송중",
        productCode: code,
        productName: (it as any).name ?? "",
        palletIds: Array.from({ length: line.fullPallets }).map(
          (_, idx) => `CBT-${orderId}-${code}-${idx + 1}`,
        ),
        destinationSlots: destByCode[code] ?? [],
        transferEaQty: line.transferEaQty,
        orderEaQty: line.orderQty,
        remainingEaQty: Math.max(0, line.orderQty - line.transferEaQty),
        residualOutboundEaQty: 0,
        createdAt: new Date().toISOString(),
      };

      return { ...baseNext, directTransfer } as any;
    });

    onUpdateItems(orderId, nextItems);
    onClose();
  };

  if (!open) return null;

  return (
    // ✅ overlay: top 정렬 + 화면 상단 여백(헤더 겹침 방지) + 모달 내부만 스크롤
    <div className="fixed inset-0 z-[9999] bg-black/40 px-3 pb-3 pt-[84px]">
      <div className="mx-auto w-full max-w-6xl h-[calc(100vh-96px)] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col text-[12px]">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b bg-white">
          <div>
            <div className="text-base font-semibold">차량출고 · 파렛트 일괄이송</div>
            <div className="text-xs text-gray-500">
              선택 주문: <b>{activeOrder?.id ?? "-"}</b> · 포장계획 파렛트:{" "}
              <b>{plan.plannedPalletCount}</b>
              {plan.plannedEaCount != null ? (
                <>
                  {" "}
                  · EA: <b>{plan.plannedEaCount}</b>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ 요구사항: 목적지 슬롯 선택 UI 삭제 → 관련 버튼도 제거하고 닫기만 유지 */}
            <button
              className="px-3 py-1.5 rounded-lg text-sm border bg-white"
              onClick={onClose}
              type="button"
            >
              닫기
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-12">
            {/* LEFT: 주문 리스트 */}
            <div className="col-span-3 min-h-0 border-r bg-gray-50 h-full overflow-auto">
              <div className="p-3 text-sm font-semibold">차량출고 주문</div>

              {vehicleOrders.length === 0 ? (
                <div className="px-3 pb-3 text-xs text-gray-500">차량출고 주문이 없어.</div>
              ) : (
                <div className="px-2 pb-3 space-y-1">
                  {vehicleOrders.map((o) => {
                    const active = o.id === activeOrder?.id;
                    const orderDraft = draftByOrder[o.id] ?? {};
                    const checkedCount = Object.values(orderDraft).filter(Boolean).length;

                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setActiveOrderId(o.id)}
                        className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                          active
                            ? "bg-white border-blue-400 shadow-sm"
                            : "bg-white border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="text-[12px] font-mono">{o.id}</div>
                        <div className="text-[12px] text-gray-700">{(o as any).customer}</div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          체크된 품목: <b>{checkedCount}</b>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MIDDLE: 상품 체크 + 파렛트 계산 */}
            <div className="col-span-6 min-h-0 p-4 h-full overflow-auto">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">상품별 1차(풀파렛트) 이송 대상 선택</div>
                <div className="text-xs text-gray-500">
                  체크된 상품: <b>{selectedLines.length}</b>개
                </div>
              </div>

              <div className="rounded-2xl border overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left w-[92px]">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            ref={(el) => {
                              if (!el) return;
                              el.indeterminate = someChecked;
                            }}
                            disabled={eligibleLines.length === 0}
                            onChange={(e) => toggleAll(e.target.checked)}
                            title="풀파렛트 있는 상품 전체 선택/해제"
                          />
                          <span className="text-[11px] text-gray-600">전체</span>
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left">상품</th>
                      <th className="px-3 py-2 text-right">주문수량</th>
                      <th className="px-3 py-2 text-right">1PALLET EA</th>
                      <th className="px-3 py-2 text-right">풀파렛트</th>
                      <th className="px-3 py-2 text-right">이송 EA</th>
                      <th className="px-3 py-2 text-right">잔량 EA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => {
                      const checked = !!activeDraft[l.code];
                      const disabled = l.fullPallets <= 0;

                      return (
                        <tr key={l.code} className="border-t">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={(e) => toggleItemChecked(l.code, e.target.checked)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{l.name}</div>
                            <div className="text-[11px] text-gray-500">{l.code}</div>
                            {disabled ? (
                              <div className="text-[11px] text-red-600">
                                풀파렛트 0 (주문수량 &lt; 1PALLET EA)
                              </div>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-right">{l.orderQty.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{l.palletEa.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {l.fullPallets.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {l.transferEaQty.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">{l.remainEa.toLocaleString()}</td>
                        </tr>
                      );
                    })}

                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                          선택된 주문의 상품이 없어.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 rounded-xl border bg-gray-50 px-3 py-2 text-[12px] text-gray-700">
                <div>
                  선택된 풀파렛트 합계: <b>{plan.plannedPalletCount}</b> PLT
                </div>
                <div>
                  1차 이송 EA 합계(풀파렛트): <b>{plan.plannedEaCount ?? 0}</b> EA
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  잔량은 이 단계에 포함되지 않고, 이후 잔량 흐름(2STEP~)에서 처리하면 됨.
                </div>
              </div>
            </div>

            {/* RIGHT: ✅ 슬롯선택 제거 → 요약 + 버튼만 */}
            <div className="col-span-3 min-h-0 h-full flex flex-col border-l">
              {/* 스크롤 되는 본문 */}
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="text-sm font-semibold mb-2">이송 요약</div>

                {plan.plannedPalletCount === 0 ? (
                  <div className="text-sm text-red-600">체크된 ‘풀파렛트’ 상품이 없어.</div>
                ) : !isReady ? (
                  <div className="text-sm text-red-600">
                    자동 배정 가능한 슬롯이 부족해. (필요: {plan.plannedPalletCount}, 배정:{" "}
                    {selectedSlots.length})
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from({ length: plan.plannedPalletCount }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border rounded-lg px-3 py-2"
                      >
                        <div className="text-sm font-medium">PALLET #{i + 1}</div>
                        <div className="text-sm">
                          목적지: <b>{selectedSlots[i]}</b>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ✅ 하단 고정 버튼(항상 보이게) */}
              <div className="border-t bg-white p-4">
                <button
                  className={`w-full px-3 py-2 rounded-xl text-sm font-semibold ${
                    isReady ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                  onClick={handleConfirm}
                  disabled={!isReady}
                  type="button"
                >
                  일괄이송 확정
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* footer 고정 필요하면 여기 추가 가능 */}
      </div>
    </div>
  );
}