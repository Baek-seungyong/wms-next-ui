"use client";

import type { ReactElement } from "react";
import type { Order } from "./types";
import { statusBadgeClass } from "./types";

type Props = {
  orders: Order[];
  activeOrderId: string;
  onSelectOrder: (id: string) => void;

  onRefresh?: () => void;
  onOpenEmergency?: () => void;
  onOpenCarBatch?: () => void;

  onOpenBulkCall?: () => void;
  showBulkCallButton?: boolean;
  bulkCallRunning?: boolean;
};

export function OrderList({
  orders,
  activeOrderId,
  onSelectOrder,
  onRefresh,
  onOpenEmergency,
  onOpenCarBatch,
  onOpenBulkCall,
  showBulkCallButton = false,
  bulkCallRunning = false,
}: Props): ReactElement {
  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">주문서 목록</div>

        <div className="flex items-center gap-2">
          {showBulkCallButton && onOpenBulkCall && (
            <button
              type="button"
              onClick={onOpenBulkCall}
              disabled={bulkCallRunning}
              className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {bulkCallRunning ? "전체호출 진행중" : "전체호출"}
            </button>
          )}

          {onOpenEmergency && (
            <button
              type="button"
              onClick={onOpenEmergency}
              className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
            >
              긴급호출
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
            >
              새로고침
            </button>
          )}

          {onOpenCarBatch && (
            <button
              type="button"
              onClick={onOpenCarBatch}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              차량출고 일괄이송
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border bg-gray-50">
        <table className="min-w-full border-collapse text-[12px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b px-3 py-2 text-left">주문번호</th>
              <th className="border-b px-3 py-2 text-left">고객명</th>
              <th className="border-b px-3 py-2 text-center">상태</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => {
              const active = o.id === activeOrderId;

              return (
                <tr
                  key={o.id}
                  className={`cursor-pointer ${active ? "bg-blue-50" : "bg-white"} hover:bg-blue-50`}
                  onClick={() => onSelectOrder(o.id)}
                >
                  <td className="border-t px-3 py-2 font-mono text-[12px]">{o.id}</td>
                  <td className="border-t px-3 py-2 text-[12px]">{o.customer}</td>
                  <td className="border-t px-3 py-2 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${statusBadgeClass(
                        o.status,
                      )}`}
                    >
                      {(o as any).statusLabel ?? o.status}
                    </span>
                  </td>
                </tr>
              );
            })}

            {orders.length === 0 && (
              <tr>
                <td colSpan={3} className="border-t px-3 py-4 text-center text-[12px] text-gray-400">
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