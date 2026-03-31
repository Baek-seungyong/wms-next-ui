//components/processing/ProcessingOrderLinkPanel.tsx
"use client";

import type { ProcessingOrder } from "./types";

type Props = {
  orders: ProcessingOrder[];
  selectedOrderIds: string[];
  onToggleOrder: (orderId: string) => void;
};

export default function ProcessingOrderLinkPanel({
  orders,
  selectedOrderIds,
  onToggleOrder,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">연결 주문</h3>
        <span className="text-xs text-slate-500">
          후가공 필요 주문을 연결할 수 있어
        </span>
      </div>

      <div className="space-y-2">
        {orders.map((order) => {
          const checked = selectedOrderIds.includes(order.id);

          return (
            <label
              key={order.id}
              className={[
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                checked
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleOrder(order.id)}
                className="mt-1"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{order.id}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {order.status}
                  </span>
                  {order.holdReason ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      {order.holdReason}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  고객사: {order.customer} / 출고예정일:{" "}
                  {order.plannedShipDate || "-"} / 구분: {order.zone}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}