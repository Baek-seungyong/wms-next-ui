"use client";

import { useMemo, useState } from "react";
import type { Order, OrderItem, OrderStatus } from "../components/types";
import { OrderList } from "../components/OrderList";
import { OrderDetail } from "../components/OrderDetail";
import { RobotProductCallModal } from "../components/RobotProductCallModal";
import { StockManualAdjustModal } from "../components/StockManualAdjustModal";

// 기본 주문 데이터
const baseOrders: Order[] = [
  {
    id: "ORD-251114-01",
    customer: "온라인몰 A",
    dueDate: "2025-11-15",
    status: "대기",
    zone: "수도권",
  },
  {
    id: "ORD-251114-02",
    customer: "B몰",
    dueDate: "2025-11-15",
    status: "보류",
    zone: "비수도권",
  },
  {
    id: "ORD-251114-03",
    customer: "C도매",
    dueDate: "2025-11-16",
    status: "출고중",
    zone: "수도권",
  },
  {
    id: "ORD-251113-11",
    customer: "D연구소",
    dueDate: "2025-11-20",
    status: "완료",
    zone: "차량출고",
  },
  {
    id: "ORD-251115-01",
    customer: "온라인몰 B",
    dueDate: "2025-11-17",
    status: "대기",
    zone: "수도권",
  },
  {
    id: "ORD-251115-02",
    customer: "E도매",
    dueDate: "2025-11-17",
    status: "출고중",
    zone: "비수도권",
  },
  {
    id: "ORD-251115-03",
    customer: "F식자재",
    dueDate: "2025-11-18",
    status: "보류",
    zone: "차량출고",
  },
  {
    id: "ORD-251116-01",
    customer: "온라인몰 C",
    dueDate: "2025-11-18",
    status: "대기",
    zone: "수도권",
  },
  {
    id: "ORD-251116-02",
    customer: "G도매",
    dueDate: "2025-11-19",
    status: "완료",
    zone: "비수도권",
  },
  {
    id: "ORD-251116-03",
    customer: "H연구소",
    dueDate: "2025-11-19",
    status: "출고중",
    zone: "차량출고",
  },
];

// 기본 품목 데이터
const baseItems: OrderItem[] = [
  { code: "P-001", name: "PET 500ml 투명", orderQty: 100, stockQty: 150 },
  { code: "P-013", name: "PET 1L 반투명", orderQty: 50, stockQty: 20, lowStock: true },
  { code: "C-201", name: "캡 28파이 화이트", orderQty: 100, stockQty: 500 },
  { code: "L-009", name: "라벨 500ml 화이트", orderQty: 100, stockQty: 80 },
];

// 주문별 품목 상태 초기값
const buildInitialItemsByOrder = (orders: Order[]): Record<string, OrderItem[]> => {
  const map: Record<string, OrderItem[]> = {};
  orders.forEach((o) => {
    map[o.id] = baseItems.map((it) => ({ ...it }));
  });
  return map;
};

type RobotModalMode = "manual" | "emergency";

export default function Page() {
  const [orders, setOrders] = useState<Order[]>(baseOrders);
  const [itemsByOrderId, setItemsByOrderId] = useState<Record<string, OrderItem[]>>(
    buildInitialItemsByOrder(baseOrders),
  );

  const [activeOrderId, setActiveOrderId] = useState<string>(orders[0]?.id ?? "");

  const [robotModalOpen, setRobotModalOpen] = useState(false);
  const [robotModalMode, setRobotModalMode] =
  useState<RobotModalMode>("manual");
  const [stockModalOpen, setStockModalOpen] = useState(false);

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === activeOrderId) ?? orders[0],
    [orders, activeOrderId],
  );

  const activeItems = itemsByOrderId[activeOrder?.id ?? ""] ?? [];

  // 상태 변경 공통
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
  };

  // 주문 선택 시: 대기 → 출고중
  const handleSelectOrder = (id: string) => {
    setActiveOrderId(id);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: o.status === "대기" ? "출고중" : o.status,
            }
          : o,
      ),
    );
  };

  // ✅ 긴급호출 & 일반 호출 공통으로 모달 열기
  const openRobotModal = (mode: RobotModalMode) => {
    setRobotModalMode(mode);
    setRobotModalOpen(true);
  };

  // ✅ 모달에서 긴급출고 확정됐을 때(제품명 + 수량 전달)
  const handleCreateEmergencyOrder = (productName: string, qty: number) => {
    const newId = `EMG-${Date.now()}`;

    const emergencyOrder: Order = {
      id: newId,
      customer: productName, // 주문서 왼쪽 고객명 칸에 상품명 표시
      dueDate: "긴급",
      status: "출고중",
      zone: "수도권",
      isEmergency: true,
    };

    const emergencyItem: OrderItem = {
      code: "EMG-001",
      name: productName,
      orderQty: qty,
      stockQty: qty, // 데모용으로 현재 재고=수량
    };

    // 최상단에 긴급출고 주문 추가
    setOrders((prev) => [emergencyOrder, ...prev]);
    setItemsByOrderId((prev) => ({
      ...prev,
      [newId]: [emergencyItem],
    }));
    setActiveOrderId(newId);
  };

  // 출고 완료 버튼 눌렀을 때
  const handleCompleteOrder = (newItems: OrderItem[]) => {
    const orderId = activeOrder.id;
    setItemsByOrderId((prev) => ({
      ...prev,
      [orderId]: newItems,
    }));
    updateOrderStatus(orderId, "완료");
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 text-sm text-gray-900 space-y-4">
      {/* 상단 헤더 */}
      <div className="shadow-sm border border-gray-200 rounded-2xl bg-white">
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">
                출고 WMS · 출고 작업 지시 (피킹라인 기준)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select className="border border-gray-300 rounded-md px-2 py-1 text-xs" disabled>
                <option>출고위치: 2층 피킹라인</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* 🚨 긴급 호출 : 같은 모달을 긴급 모드로 띄움 */}
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => openRobotModal("emergency")}
            >
              🚨 긴급 호출
            </button>

            {/* 🤖 AMR 수동 호출 : 일반 모드 */}
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-white"
              onClick={() => openRobotModal("manual")}
            >
              🤖 AMR 수동 호출
            </button>

            {/* 🧮 파렛트 입출고 */}
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
              onClick={() => setStockModalOpen(true)}
            >
              🧮 파렛트 입출고
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <OrderList
            orders={orders}
            activeOrderId={activeOrderId}
            onSelectOrder={handleSelectOrder}
          />
        </div>
        <div className="col-span-8">
          <OrderDetail
            order={activeOrder}
            items={activeItems}
            onChangeStatus={(status) => updateOrderStatus(activeOrder.id, status)}
            onComplete={handleCompleteOrder}
          />
        </div>
      </div>

      {/* ✅ 모달에 mode / onConfirmEmergency 추가 */}
      <RobotProductCallModal
        open={robotModalOpen}
        mode={robotModalMode}
        onClose={() => setRobotModalOpen(false)}
        onConfirmEmergency={handleCreateEmergencyOrder}
      />
      <StockManualAdjustModal open={stockModalOpen} onClose={() => setStockModalOpen(false)} />
    </main>
  );
}
