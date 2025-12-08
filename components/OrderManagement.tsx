// components/OrderManagement.tsx
"use client";

import { useMemo, useState } from "react";
import type { Order, OrderItem, OrderStatus } from "./types";
import { OrderList } from "./OrderList";
import { OrderDetail } from "./OrderDetail";
import { RobotProductCallModal } from "./RobotProductCallModal";

// 🔹 상품별 이미지 매핑 (실제 파일명에 맞게 수정해서 사용)
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "P-001": "/images/products/P-001.png",
  "P-013": "/images/products/P-013.png",
  "C-201": "/images/products/C-201.png",
  "L-009": "/images/products/L-009.png",
};

type ZoneFilter = "ALL" | "수도권" | "비수도권" | "차량출고";

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
const buildInitialItemsByOrder = (
  orders: Order[],
): Record<string, OrderItem[]> => {
  const map: Record<string, OrderItem[]> = {};
  orders.forEach((o) => {
    map[o.id] = baseItems.map((it) => ({ ...it }));
  });
  return map;
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>(baseOrders);
  const [itemsByOrderId, setItemsByOrderId] = useState<
    Record<string, OrderItem[]>
  >(buildInitialItemsByOrder(baseOrders));

  const [activeOrderId, setActiveOrderId] = useState<string>(
    orders[0]?.id ?? "",
  );

  // 🔸 출고 구분 필터 (수도권 / 비수도권 / 차량출고)
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>("ALL");

  // 🔸 긴급 호출 모달
  const [robotModalOpen, setRobotModalOpen] = useState(false);

  // 🔸 오른쪽 상품 이미지 프리뷰용 상태
  const [previewProduct, setPreviewProduct] = useState<{
    code: string;
    name: string;
  } | null>(null);

  // 필터링된 주문 목록
  const visibleOrders = useMemo(() => {
    if (zoneFilter === "ALL") return orders;
    return orders.filter((o) => o.zone === zoneFilter);
  }, [orders, zoneFilter]);

  // 현재 활성 주문 (필터 고려)
  const activeOrder = useMemo(() => {
    if (visibleOrders.length === 0) return orders[0];
    return (
      visibleOrders.find((o) => o.id === activeOrderId) ??
      visibleOrders[0] ??
      orders[0]
    );
  }, [visibleOrders, activeOrderId, orders]);

  const activeItems = itemsByOrderId[activeOrder?.id ?? ""] ?? [];

  // 상태 변경
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
  };

  // 주문 선택 시
  const handleSelectOrder = (id: string) => {
    setActiveOrderId(id);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: o.status === "대기" ? "출고중" : o.status }
          : o,
      ),
    );

    // 주문 바꾸면 첫 번째 품목으로 프리뷰 초기화
    const firstItem = itemsByOrderId[id]?.[0];
    if (firstItem) {
      setPreviewProduct({ code: firstItem.code, name: firstItem.name });
    }
  };

  // 필터 탭에서 존 변경 시, 현재 필터에서 첫 주문을 자동 선택
  const handleChangeZoneFilter = (zone: ZoneFilter) => {
    setZoneFilter(zone);
    const nextList =
      zone === "ALL" ? orders : orders.filter((o) => o.zone === zone);
    if (nextList.length > 0) {
      setActiveOrderId(nextList[0].id);
      const firstItem = itemsByOrderId[nextList[0].id]?.[0];
      if (firstItem) {
        setPreviewProduct({ code: firstItem.code, name: firstItem.name });
      }
    }
  };

  // 긴급 호출 모달 열기
  const openEmergencyModal = () => {
    setRobotModalOpen(true);
  };

  // 긴급 출고 주문 생성
  const handleCreateEmergencyOrder = (
    products: { code: string; name: string }[],
  ) => {
    if (products.length === 0) return;

    const newId = `EMG-${Date.now()}`;
    const displayName =
      products.length === 1 ? products[0].name : `${products[0].name} 외`;

    const emergencyOrder: Order = {
      id: newId,
      customer: displayName,
      dueDate: "긴급",
      status: "출고중",
      zone: "수도권",
      isEmergency: true,
    };

    const emergencyItems: OrderItem[] = products.map((p, idx) => ({
      code: `EMG-${(idx + 1).toString().padStart(3, "0")}`,
      name: p.name,
      orderQty: 0,
      stockQty: 0,
    }));

    setOrders((prev) => [emergencyOrder, ...prev]);
    setItemsByOrderId((prev) => ({ ...prev, [newId]: emergencyItems }));
    setActiveOrderId(newId);

    if (emergencyItems[0]) {
      setPreviewProduct({
        code: emergencyItems[0].code,
        name: emergencyItems[0].name,
      });
    }
  };

  // 출고 완료
  const handleCompleteOrder = (newItems: OrderItem[]) => {
    const orderId = activeOrder.id;
    setItemsByOrderId((prev) => ({ ...prev, [orderId]: newItems }));
    updateOrderStatus(orderId, "완료");
  };

  // 현재 보여줄 이미지 경로
  const previewImageSrc = previewProduct
    ? PRODUCT_IMAGE_MAP[previewProduct.code] ?? "/images/products/no-image.png"
    : null;

  return (
    <div className="space-y-4">
      {/* 상단 헤더 */}
      <div className="shadow-sm border border-gray-200 rounded-2xl bg-white">
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-base">
              출고 WMS · 출고 작업 지시 (피킹라인 기준)
            </span>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-xs"
              disabled
            >
              <option>출고위치: 2층 피킹라인</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white"
              onClick={openEmergencyModal}
            >
              🚨 긴급 호출
            </button>
          </div>
        </div>
      </div>

      {/* 본문 영역 : 주문서 목록 + 주문 상세 + 우측 이미지 프리뷰 */}
      <div className="grid grid-cols-12 gap-4">
        {/* 왼쪽: 주문서 목록 + 존 필터 탭 */}
        <div className="col-span-4 flex flex-col gap-2">
          {/* 출고 구분 탭 */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-gray-500">출고 구분</span>
            <div className="flex gap-2 mt-1">
              {([
                { key: "ALL", label: "전체" },
                { key: "수도권", label: "수도권" },
                { key: "비수도권", label: "비수도권" },
                { key: "차량출고", label: "차량출고" },
              ] as { key: ZoneFilter; label: string }[]).map((tab) => {
                const active = zoneFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleChangeZoneFilter(tab.key)}
                    className={`px-4 py-1.5 rounded-full border text-xs transition
                      ${
                        active
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div> 
          </div>

          <OrderList
            orders={visibleOrders}
            activeOrderId={activeOrderId}
            onSelectOrder={handleSelectOrder}
          />
        </div>

        {/* 가운데: 주문 상세 */}
        <div className="col-span-5">
          <OrderDetail
            order={activeOrder}
            items={activeItems}
            onChangeStatus={(status) =>
              updateOrderStatus(activeOrder.id, status)
            }
            onComplete={handleCompleteOrder}
            onSelectItemForPreview={(item) =>
              setPreviewProduct({ code: item.code, name: item.name })
            }
          />
        </div>

        {/* 오른쪽: 상품 이미지 프리뷰 */}
        <div className="col-span-3">
          <section className="flex h-full flex-col rounded-2xl border bg-white p-4 text-sm">
            <h2 className="text-base font-semibold">상품 이미지 프리뷰</h2>

            {previewProduct ? (
              <>
                <div className="mt-1 text-[11px] text-gray-500">
                  {previewProduct.name}
                </div>
                <div className="text-[11px] text-gray-400">
                  코드: {previewProduct.code}
                </div>

                <div className="mt-4 flex-1">
                  <div className="flex h-[520px] w-full items-center justify-center rounded-2xl border bg-gray-50">
                    {previewImageSrc && (
                      <img
                        src={previewImageSrc}
                        alt={previewProduct.name}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 flex-1 rounded-2xl border bg-gray-50 p-4 text-[12px] text-gray-400">
                왼쪽 주문 상세에서 상품을 선택하면 이미지가 표시됩니다.
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 긴급 호출 모달 */}
      <RobotProductCallModal
        open={robotModalOpen}
        mode="emergency"
        onClose={() => setRobotModalOpen(false)}
        onConfirmEmergency={handleCreateEmergencyOrder}
      />
    </div>
  );
}
