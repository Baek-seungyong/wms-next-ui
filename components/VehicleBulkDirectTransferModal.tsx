// components/VehicleBulkDirectTransferModal.tsx
"use client";

import { useMemo, useState } from "react";
import type { Order, OrderItem, TransferInfo } from "./types";

const DEFAULT_EA_PER_BOX = 115;
const DEFAULT_BOXES_PER_PALLET = 10;
const DEFAULT_EA_PER_PALLET = DEFAULT_EA_PER_BOX * DEFAULT_BOXES_PER_PALLET; // 1150

function autoAssignSlots(count: number) {
  const start = 2;
  const slots: string[] = [];
  for (let i = 0; i < Math.max(0, count); i++) slots.push(`A-${start + i}`);
  return slots;
}

function getEaPerPalletFromItem(it: OrderItem) {
  // 데이터 연결 전이니까, 있으면 쓰고 없으면 기본값(1150)
  const v =
    Number((it as any).palletEa ?? (it as any).eaPerPallet ?? (it as any).unitsPerPallet ?? 0) ||
    0;
  return v > 0 ? v : DEFAULT_EA_PER_PALLET;
}

function getOrderEaQtyFromItem(it: OrderItem) {
  return Number((it as any).qty ?? (it as any).orderQty ?? 0);
}

type PlannedLine = {
  code: string;
  name: string;
  orderEaQty: number;
  eaPerPallet: number;
  pallets: number; // 예정 풀파렛트 수
  destinationSlots: string[]; // 예정 목적지
  checked: boolean; // 이송 실행 포함 여부
};

type PlannedOrder = {
  orderId: string;
  customer: string;
  dueDate: string;
  lines: PlannedLine[];
};

type Props = {
  open: boolean;
  onClose: () => void;

  orders: Order[]; // 차량출고 주문들만 넘기는 걸 권장
  itemsByOrderId: Record<string, OrderItem[]>;

  // 실행: itemsByOrderId를 업데이트
  onApplyTransfers: (updates: { orderId: string; nextItems: OrderItem[] }) => void;

  // (옵션) 실행 시 주문 상태도 출고중으로 바꾸고 싶으면
  onMarkOrderWorking?: (orderId: string) => void;
};

export function VehicleBulkDirectTransferModal({
  open,
  onClose,
  orders,
  itemsByOrderId,
  onApplyTransfers,
  onMarkOrderWorking,
}: Props) {
  const [byOrderPlan, setByOrderPlan] = useState<Record<string, PlannedOrder>>({});

  // 초기 계획 생성(모달 열릴 때 1회)
  const plannedOrders: PlannedOrder[] = useMemo(() => {
    return orders.map((o) => {
      const items = itemsByOrderId[o.id] ?? [];
      const lines: PlannedLine[] = items
        .map((it) => {
          const code = (it as any).code ?? (it as any).itemCode ?? "";
          const name = (it as any).name ?? "";
          const orderEaQty = getOrderEaQtyFromItem(it);
          const eaPerPallet = getEaPerPalletFromItem(it);
          const pallets = Math.floor(Math.max(0, orderEaQty) / eaPerPallet);

          // 이미 Step1이 저장돼 있으면 제외(= 완료 상태)
          const existing = (it as any).directTransfer as TransferInfo | undefined;
          const alreadyDone = !!existing?.palletIds?.length;

          if (!code || alreadyDone) return null;
          if (pallets <= 0) return null;

          return {
            code,
            name,
            orderEaQty,
            eaPerPallet,
            pallets,
            destinationSlots: autoAssignSlots(pallets),
            checked: true,
          } as PlannedLine;
        })
        .filter(Boolean) as PlannedLine[];

      return {
        orderId: o.id,
        customer: (o as any).customer ?? "",
        dueDate: (o as any).dueDate ?? "",
        lines,
      };
    });
  }, [orders, itemsByOrderId]);

  // byOrderPlan이 비어있으면 plannedOrders로 초기화(오픈 시)
  useMemo(() => {
    if (!open) return;
    setByOrderPlan((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const map: Record<string, PlannedOrder> = {};
      for (const po of plannedOrders) map[po.orderId] = po;
      return map;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const allCount = useMemo(() => {
    const list = Object.values(byOrderPlan);
    const ordersCnt = list.filter((x) => (x.lines?.length ?? 0) > 0).length;
    const palletsCnt = list.reduce((a, o) => a + o.lines.reduce((b, l) => b + (l.pallets || 0), 0), 0);
    return { ordersCnt, palletsCnt };
  }, [byOrderPlan]);

  if (!open) return null;

  const applyForOrder = (orderId: string) => {
    const plan = byOrderPlan[orderId];
    if (!plan) return;

    const items = itemsByOrderId[orderId] ?? [];
    if (!items.length) return;

    const selected = (plan.lines ?? []).filter((l) => l.checked);
    if (!selected.length) {
      alert("선택된 이송 대상이 없어.");
      return;
    }

    const nextItems = items.map((it) => {
      const code = (it as any).code ?? (it as any).itemCode ?? "";
      const line = selected.find((l) => l.code === code);
      if (!line) return it;

      const palletIds = Array.from({ length: Math.max(0, line.pallets) }).map(
        (_, i) => `${code}-AUTO-FIFO-${String(i + 1).padStart(2, "0")}`,
      );

      const transferEaQty = Math.max(0, line.pallets * line.eaPerPallet);
      const remainingEaQty = Math.max(0, line.orderEaQty - transferEaQty);

      const info: TransferInfo = {
        productCode: code,
        status: "이송중",
        fromLocation: "2,3층 파렛트존",
        palletIds,
        destinationSlots: line.destinationSlots,
        orderEaQty: line.orderEaQty,
        transferEaQty,
        remainingEaQty,
      };

      return { ...(it as any), directTransfer: info } as any;
    });

    onApplyTransfers({ orderId, nextItems });
    onMarkOrderWorking?.(orderId);

    alert(`주문 ${orderId} : 풀파렛트(1STEP) 일괄 이송이 등록됐어.`);
  };

  const updateLine = (orderId: string, code: string, patch: Partial<PlannedLine>) => {
    setByOrderPlan((prev) => {
      const cur = prev[orderId];
      if (!cur) return prev;
      return {
        ...prev,
        [orderId]: {
          ...cur,
          lines: cur.lines.map((l) => (l.code === code ? { ...l, ...patch } : l)),
        },
      };
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[760px] w-[1120px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b bg-white px-4 py-3">
          <div>
            <div className="text-sm font-semibold">차량출고 · 풀파렛트(1STEP) 일괄 지정이송</div>
            <div className="mt-1 text-[12px] text-gray-600">
              대상 주문 <b className="text-gray-900">{allCount.ordersCnt}</b>건 · 총 예정 파렛트{" "}
              <b className="text-gray-900">{allCount.palletsCnt}</b>P
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

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {Object.values(byOrderPlan)
              .filter((po) => (po.lines?.length ?? 0) > 0)
              .map((po) => (
                <div key={po.orderId} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-semibold">
                        {po.orderId} <span className="ml-2 text-[12px] text-gray-500">{po.customer}</span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-gray-500">
                        납기: <span className="text-gray-700">{po.dueDate}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => applyForOrder(po.orderId)}
                      className="rounded-full bg-emerald-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700"
                    >
                      이송 실행
                    </button>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-xl border">
                    <table className="min-w-full border-collapse text-[12px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border-b px-3 py-2 text-left">선택</th>
                          <th className="border-b px-3 py-2 text-left">상품</th>
                          <th className="border-b px-3 py-2 text-right">주문EA</th>
                          <th className="border-b px-3 py-2 text-right">예정P</th>
                          <th className="border-b px-3 py-2 text-left">예정 목적지</th>
                        </tr>
                      </thead>
                      <tbody>
                        {po.lines.map((l) => (
                          <tr key={l.code} className="bg-white">
                            <td className="border-t px-3 py-2">
                              <input
                                type="checkbox"
                                checked={!!l.checked}
                                onChange={(e) => updateLine(po.orderId, l.code, { checked: e.target.checked })}
                              />
                            </td>
                            <td className="border-t px-3 py-2">
                              <div className="font-semibold text-gray-900">{l.name}</div>
                              <div className="text-[11px] text-gray-500">{l.code}</div>
                            </td>
                            <td className="border-t px-3 py-2 text-right">
                              {Number(l.orderEaQty).toLocaleString()}
                            </td>
                            <td className="border-t px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                className="w-20 rounded-md border px-2 py-1 text-[12px]"
                                value={l.pallets}
                                onChange={(e) => {
                                  const pallets = Math.max(0, Number(e.target.value || 0));
                                  updateLine(po.orderId, l.code, {
                                    pallets,
                                    destinationSlots: autoAssignSlots(pallets),
                                  });
                                }}
                              />
                            </td>
                            <td className="border-t px-3 py-2">
                              <input
                                className="w-full rounded-md border px-2 py-1 text-[12px]"
                                value={l.destinationSlots.join(", ")}
                                onChange={(e) => {
                                  const slots = e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  updateLine(po.orderId, l.code, { destinationSlots: slots });
                                }}
                              />
                              <div className="mt-1 text-[11px] text-gray-500">
                                자동배정: A-2부터 · {l.pallets}P
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 text-[11px] text-gray-500">
                    * “이송 실행” 누르면 해당 주문의 각 품목에 Step1(풀파렛트) directTransfer가 저장돼. 다음날 주문 상세에서 2STEP부터 하면 돼.
                  </div>
                </div>
              ))}

            {Object.values(byOrderPlan).filter((po) => (po.lines?.length ?? 0) > 0).length === 0 ? (
              <div className="rounded-2xl border bg-gray-50 p-4 text-[12px] text-gray-600">
                대상이 없어. (이미 Step1 완료됐거나, 풀파렛트 수량이 0인 품목만 있음)
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}