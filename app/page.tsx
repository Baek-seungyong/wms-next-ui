"use client";

import { useState } from "react";
import type { Order, OrderItem } from "../components/types";
import { OrderList } from "../components/OrderList";
import { OrderDetail } from "../components/OrderDetail";
import { RobotProductCallModal } from "../components/RobotProductCallModal";
import { StockManualAdjustModal } from "../components/StockManualAdjustModal";

type LineType = "피킹" | "2-1" | "3-1";

const sampleOrders: Order[] = [
  { id: "ORD-251114-01", customer: "온라인몰 A", dueDate: "2025-11-15", status: "대기" },
  { id: "ORD-251114-02", customer: "B몰", dueDate: "2025-11-15", status: "보류" },
  { id: "ORD-251114-03", customer: "C도매", dueDate: "2025-11-16", status: "출고중" },
  { id: "ORD-251113-11", customer: "D연구소", dueDate: "2025-11-20", status: "완료" },
];

const sampleItems: OrderItem[] = [
  { code: "P-001", name: "PET 500ml 투명", orderQty: 100, stockQty: 150 },
  { code: "P-013", name: "PET 1L 반투명", orderQty: 50, stockQty: 20, lowStock: true },
  { code: "C-201", name: "캡 28파이 화이트", orderQty: 100, stockQty: 500 },
  { code: "L-009", name: "라벨 500ml 화이트", orderQty: 100, stockQty: 80 },
];

export default function Page() {
  const [orders] = useState<Order[]>(sampleOrders);
  const [activeOrderId, setActiveOrderId] = useState<string>(orders[0]?.id ?? "");
  const [robotModalOpen, setRobotModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);

  const activeOrder = orders.find((o) => o.id === activeOrderId) ?? orders[0];

  // AMR 호출 (상품별 피킹/2-1/3-1 복수 선택)
  const handleCallRobotForItem = (item: OrderItem, lines: LineType[]) => {
    const lineText = lines.join(", ");
    alert(`AMR 호출: ${item.name} (${item.code}) → 라인 ${lineText}`);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 text-sm text-gray-900 space-y-4">
      {/* 상단 헤더 + 버튼 */}
      <div className="shadow-sm border border-gray-200 rounded-2xl bg-white">
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">
                출고 WMS · 출고 작업 지시 (피킹라인 기준)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="w-64 border border-gray-300 rounded-md px-2 py-1 text-xs"
                placeholder="주문번호 / 고객명 / 품목 검색 (데모용 비활성)"
                disabled
              />
              <select className="border border-gray-300 rounded-md px-2 py-1 text-xs" disabled>
                <option>상태: 전체</option>
              </select>
              <select className="border border-gray-300 rounded-md px-2 py-1 text-xs" disabled>
                <option>출고위치: 2층 피킹라인</option>
              </select>
            </div>
          </div>

          {/* 오른쪽 상단 기능 버튼들 */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-white"
              onClick={() => setRobotModalOpen(true)}
            >
              🤖 AMR 수동 호출
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
              onClick={() => setStockModalOpen(true)}
            >
              🧮 재고 수동 수정
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
              disabled
            >
              🔄 새로고침 (데모)
            </button>
          </div>
        </div>
      </div>

      {/* 좌측 주문 목록 + 우측 상세 */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <OrderList
            orders={orders}
            activeOrderId={activeOrderId}
            onSelectOrder={setActiveOrderId}
            onOpenRobotModal={() => setRobotModalOpen(true)}
          />
        </div>

        <div className="col-span-8">
          <OrderDetail
            order={activeOrder}
            items={sampleItems}
            onCallRobotForItem={handleCallRobotForItem}
          />
        </div>
      </div>

      {/* 모달들 */}
      <RobotProductCallModal
        open={robotModalOpen}
        onClose={() => setRobotModalOpen(false)}
      />
      <StockManualAdjustModal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
      />
    </main>
  );
}
