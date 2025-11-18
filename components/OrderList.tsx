"use client";

import type { Order } from "./types";
import { statusBadgeClass } from "./types";

type Props = {
  orders: Order[];
  activeOrderId: string;
  onSelectOrder: (id: string) => void;
  onOpenRobotModal: () => void;
};

export function OrderList({ orders, activeOrderId, onSelectOrder, onOpenRobotModal }: Props) {
  const activeOrder = orders.find((o) => o.id === activeOrderId) ?? orders[0];

  return (
    <div className="bg-white shadow-sm rounded-2xl border border-gray-200 h-full">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold">주문서 목록</h2>
            <p className="text-[11px] text-gray-500 mt-1">예시 데이터 {orders.length}건</p>
          </div>
          <span className="text-[11px] text-gray-500">총 {orders.length}건</span>
        </div>

        <div className="flex items-center gap-3 mb-3 text-[11px] text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300" /> 대기
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> 출고중
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-300" /> 보류
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400" /> 완료
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden text-xs flex-1">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-2 border-b w-32">주문번호</th>
                <th className="p-2 border-b">고객명</th>
                <th className="p-2 border-b w-16 text-center">납기일</th>
                <th className="p-2 border-b w-20 text-center">상태</th>
                <th className="p-2 border-b w-20 text-center">보류</th>
                <th className="p-2 border-b w-16 text-center">AMR</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const isActive = o.id === activeOrder.id;
                const rowBg =
                  o.status === "대기"
                    ? "bg-white"
                    : o.status === "출고중"
                    ? "bg-blue-50"
                    : o.status === "보류"
                    ? "bg-yellow-50"
                    : "bg-green-50";

                return (
                  <tr
                    key={o.id}
                    className={`${rowBg} ${
                      isActive ? "ring-1 ring-blue-400" : ""
                    } cursor-pointer hover:bg-gray-50`}
                    onClick={() => onSelectOrder(o.id)}
                  >
                    <td className="p-2 border-t align-middle">{o.id}</td>
                    <td className="p-2 border-t align-middle">{o.customer}</td>
                    <td className="p-2 border-t text-center align-middle">{o.dueDate}</td>
                    <td className="p-2 border-t text-center align-middle">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] ${statusBadgeClass(
                          o.status,
                        )}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-2 border-t text-center align-middle">
                      <button
                        type="button"
                        className="text-[11px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border-0 hover:bg-yellow-200"
                      >
                        보류
                      </button>
                    </td>
                    <td className="p-2 border-t text-center align-middle">
                      <button
                        type="button"
                        className="text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                        onClick={onOpenRobotModal}
                      >
                        🤖
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}