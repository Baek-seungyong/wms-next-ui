// components/OrderList.tsx
"use client";

import type { ReactElement } from "react";
import type { Order } from "./types";
import { statusBadgeClass } from "./types";

type Props = {
  orders: Order[];
  activeOrderId: string;
  onSelectOrder: (id: string) => void;
};

export function OrderList({
  orders,
  activeOrderId,
  onSelectOrder,
}: Props): ReactElement {
  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-gray-500">주문서 목록</div>
        <div className="text-[11px] text-gray-400">
          예시 데이터 {orders.length}건
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border bg-gray-50">
        <table className="min-w-full border-collapse text-[12px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b px-3 py-2 text-left">주문번호</th>
              <th className="border-b px-3 py-2 text-left">고객명</th>
              {/* 납기일 컬럼 제거 */}
              <th className="border-b px-3 py-2 text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const active = o.id === activeOrderId;
              return (
                <tr
                  key={o.id}
                  className={`cursor-pointer ${
                    active ? "bg-blue-50" : "bg-white"
                  } hover:bg-blue-50`}
                  onClick={() => onSelectOrder(o.id)}
                >
                  <td className="border-t px-3 py-2 font-mono text-[12px]">
                    {o.id}
                  </td>
                  <td className="border-t px-3 py-2 text-[12px]">{o.customer}</td>
                  {/* 상태 뱃지 */}
                  <td className="border-t px-3 py-2 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${statusBadgeClass(
                        (o as any).status,
                      )}`}
                    >
                      {(o as any).statusLabel ?? (o as any).status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="border-t px-3 py-4 text-center text-[12px] text-gray-400"
                >
                  표시할 주문이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
