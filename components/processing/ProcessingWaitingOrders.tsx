//components/processing/ProcessingWaitingOrders.tsx
"use client";

import type { ProcessingOrder } from "./types";

type Props = {
  orders: ProcessingOrder[];
};

export default function ProcessingWaitingOrders({ orders }: Props) {
  const waitingOrders = orders.filter(
    (order) =>
      order.processingLink?.processingRequired ||
      order.holdReason === "후가공대기" ||
      order.status === "출고대기"
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-bold text-slate-900">후가공 대기 주문</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">주문번호</th>
              <th className="px-4 py-3 text-left font-semibold">고객사</th>
              <th className="px-4 py-3 text-left font-semibold">출고예정일</th>
              <th className="px-4 py-3 text-left font-semibold">주문상태</th>
              <th className="px-4 py-3 text-left font-semibold">후가공상태</th>
              <th className="px-4 py-3 text-left font-semibold">연결작업수</th>
              <th className="px-4 py-3 text-left font-semibold">보류사유</th>
              <th className="px-4 py-3 text-left font-semibold">구분</th>
            </tr>
          </thead>
          <tbody>
            {waitingOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  후가공 관련 주문이 없어
                </td>
              </tr>
            ) : (
              waitingOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {order.id}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{order.customer}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {order.plannedShipDate || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {order.processingLink?.processingStatus || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {order.processingLink?.linkedWorkIds.length || 0}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {order.holdReason || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{order.zone}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}