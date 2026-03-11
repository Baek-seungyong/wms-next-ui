// components/OrderManagement.tsx
"use client";

import { useMemo, useState } from "react";
import type { Order, OrderItem, OrderStatus } from "./types";
import { OrderList } from "./OrderList";
import { OrderDetail } from "./OrderDetail";
import { RobotProductCallModal } from "./RobotProductCallModal";
import { CarBatchTransferModal } from "./CarBatchTransferModal";

// 🔹 상품별 이미지 매핑 (실제 파일명에 맞게 수정해서 사용)
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "P-001": "/images/products/P-001.png",
  "P-013": "/images/products/P-013.png",
  "C-201": "/images/products/C-201.png",
  "L-009": "/images/products/L-009.png",
};

type ZoneFilter = "ALL" | "수도권" | "비수도권" | "차량출고";

// ✅ page.tsx에서 초기값으로 쓰기 위해 export
export const baseOrders: Order[] = [
  {
    id: "ORD-251114-01",
    customer: "온라인몰 A",
    dueDate: "2025-11-15",
    status: "대기",
    zone: "수도권",
    communication: {
      customerMemo: "문 앞 하차 말고 반드시 연락 후 인계해 주세요.",
      managerMemo: "출고 전 수량 재확인 후 진행.",
      fieldMemos: [],
    },
  } as any,
  {
    id: "ORD-251114-02",
    customer: "B몰",
    dueDate: "2025-11-15",
    status: "보류",
    zone: "비수도권",
    communication: {
      customerMemo: "파손 주의 요청.",
      managerMemo: "",
      fieldMemos: [
        {
          id: "fm-1",
          author: "작업자A",
          text: "피킹 대기 상태 확인함.",
          createdAt: "2026-03-11 09:10",
        },
      ],
    },
  } as any,
  { id: "ORD-251114-03", customer: "C도매", dueDate: "2025-11-16", status: "출고중", zone: "수도권" } as any,
  { id: "ORD-251113-11", customer: "D연구소", dueDate: "2025-11-20", status: "완료", zone: "차량출고" } as any,
  { id: "ORD-251115-01", customer: "온라인몰 B", dueDate: "2025-11-17", status: "대기", zone: "수도권" } as any,
  { id: "ORD-251115-02", customer: "E도매", dueDate: "2025-11-17", status: "출고중", zone: "비수도권" } as any,
  { id: "ORD-251115-03", customer: "F식자재", dueDate: "2025-11-18", status: "보류", zone: "차량출고" } as any,
  { id: "ORD-251116-01", customer: "온라인몰 C", dueDate: "2025-11-18", status: "대기", zone: "수도권" } as any,
  { id: "ORD-251116-02", customer: "G도매", dueDate: "2025-11-19", status: "완료", zone: "비수도권" } as any,
  { id: "ORD-251116-03", customer: "H연구소", dueDate: "2025-11-19", status: "출고중", zone: "차량출고" } as any,
];

// ✅ 제품 카탈로그 (주문마다 여기서 랜덤으로 뽑아씀)
type ProductCatalogItem = {
  code: string;
  name: string;
  boxEa: number;
  palletEa?: number;
};

const PRODUCT_CATALOG: ProductCatalogItem[] = [
  { code: "P-001", name: "PET 500ml 투명", boxEa: 115, palletEa: 1150 },
  { code: "P-002", name: "PET 500ml 갈색", boxEa: 120, palletEa: 1200 },
  { code: "P-003", name: "PET 300ml 투명", boxEa: 150, palletEa: 1500 },
  { code: "P-013", name: "PET 1L 반투명", boxEa: 60, palletEa: 600 },
  { code: "P-021", name: "PET 2L 투명", boxEa: 30, palletEa: 300 },

  { code: "C-201", name: "캡 28파이 화이트", boxEa: 500, palletEa: 5000 },
  { code: "C-202", name: "캡 28파이 블랙", boxEa: 400, palletEa: 4000 },
  { code: "C-210", name: "캡 24파이 화이트", boxEa: 600, palletEa: 6000 },

  { code: "L-009", name: "라벨 500ml 화이트", boxEa: 1000, palletEa: 10000 },
  { code: "L-010", name: "라벨 1L 화이트", boxEa: 800, palletEa: 8000 },
  { code: "L-020", name: "라벨 2L 투명", boxEa: 700, palletEa: 7000 },

  { code: "B-101", name: "박스 500ml 전용", boxEa: 50, palletEa: 500 },
  { code: "B-102", name: "박스 1L 전용", boxEa: 40, palletEa: 400 },
];

// ✅ 주문ID 기반으로 "항상 같은 랜덤"이 나오도록 시드 랜덤 생성기
const hashSeed = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pickUnique = <T,>(arr: T[], count: number, rnd: () => number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rnd() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
};

const pickFrom = (candidates: number[], rnd: () => number) =>
  candidates[Math.floor(rnd() * candidates.length)];

export const buildInitialItemsByOrder = (orders: Order[]): Record<string, OrderItem[]> => {
  const map: Record<string, OrderItem[]> = {};

  orders.forEach((o) => {
    const rnd = mulberry32(hashSeed(o.id));

    // ✅ 주문마다 품목 개수 다르게 (4~7개)
    const itemCount = 4 + Math.floor(rnd() * 4); // 4~7

    // ✅ "차량출고"는 용기류(P-코드) 비중 높게
    const catalog =
      o.zone === "차량출고"
        ? [
            ...PRODUCT_CATALOG.filter((p) => p.code.startsWith("P-")),
            ...PRODUCT_CATALOG.filter((p) => p.code.startsWith("C-") || p.code.startsWith("L-")),
          ]
        : PRODUCT_CATALOG;

    const picked = pickUnique(catalog, itemCount, rnd);

    // ✅ 차량출고는 대량 수량 위주
    const vehicleQtyCandidates = [3000, 5000, 10000];

    // ✅ 일반 주문은 중소량 다양화
    const normalQtyCandidates = [30, 50, 80, 100, 150, 200, 300, 500, 800, 1000, 1500];

    const items: OrderItem[] = picked.map((p) => {
      const orderQty =
        o.zone === "차량출고"
          ? pickFrom(vehicleQtyCandidates, rnd)
          : pickFrom(normalQtyCandidates, rnd);

      // ✅ 재고는 주문수량 대비 랜덤하게 (부족/여유 섞이게)
      const low = rnd() < 0.35;

      const stockRatio = low ? (0.1 + rnd() * 0.5) : (0.7 + rnd() * 0.7);
      const stockQty = Math.max(0, Math.floor(orderQty * stockRatio));

      return {
        code: p.code,
        name: p.name,
        orderQty,
        stockQty,
        lowStock: low,
        boxEa: p.boxEa,
        palletEa: p.palletEa ?? 0,

        // ✅ OrderDetail 프리뷰 모달에서 사용할 이미지 URL
        imageUrl: PRODUCT_IMAGE_MAP[p.code] ?? "",
      } as any;
    });

    map[o.id] = items;
  });

  return map;
};

type Props = {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  itemsByOrderId: Record<string, OrderItem[]>;
  setItemsByOrderId: React.Dispatch<React.SetStateAction<Record<string, OrderItem[]>>>;
};

export default function OrderManagement({
  orders,
  setOrders,
  itemsByOrderId,
  setItemsByOrderId,
}: Props) {
  const [activeOrderId, setActiveOrderId] = useState<string>(orders[0]?.id ?? "");

  // 🔸 출고 구분 필터
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>("ALL");

  // ✅ 차량출고: 파렛트 일괄이송 모달
  const [carBatchOpen, setCarBatchOpen] = useState(false);

  // ✅ 주문별 체크 상태(모달에서 유지됨)
  const [carBatchDraftByOrder, setCarBatchDraftByOrder] = useState<
    Record<string, Record<string, boolean>>
  >({});

  // 🔸 긴급 호출 모달
  const [robotModalOpen, setRobotModalOpen] = useState(false);

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
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  // 주문 선택 시
  const handleSelectOrder = (id: string) => {
    setActiveOrderId(id);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: o.status === "대기" ? "출고중" : o.status } : o,
      ),
    );
  };

  // 필터 탭 변경
  const handleChangeZoneFilter = (zone: ZoneFilter) => {
    setZoneFilter(zone);
    const nextList = zone === "ALL" ? orders : orders.filter((o) => o.zone === zone);
    if (nextList.length > 0) setActiveOrderId(nextList[0].id);
  };

  // 긴급 호출 모달 열기
  const openEmergencyModal = () => setRobotModalOpen(true);

  // 긴급 출고 주문 생성
  const handleCreateEmergencyOrder = (products: { code: string; name: string }[]) => {
    if (products.length === 0) return;

    const newId = `EMG-${Date.now()}`;
    const displayName = products.length === 1 ? products[0].name : `${products[0].name} 외`;

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
      imageUrl: "", // 긴급은 일단 없음
    })) as any;

    setOrders((prev) => [emergencyOrder, ...prev]);
    setItemsByOrderId((prev) => ({ ...prev, [newId]: emergencyItems }));
    setActiveOrderId(newId);
  };

  const handleAddFieldMemo = (orderId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;

        const communication = (o as any).communication ?? {};
        const prevFieldMemos = communication.fieldMemos ?? [];

        return {
          ...(o as any),
          communication: {
            ...communication,
            fieldMemos: [
              ...prevFieldMemos,
              {
                id: `field-${Date.now()}`,
                author: "작업자A",
                text: trimmed,
                createdAt: `${yyyy}-${mm}-${dd} ${hh}:${mi}`,
              },
            ],
          },
        };
      }),
    );
  };

  // 출고 완료
  const handleCompleteOrder = (newItems: OrderItem[]) => {
    const orderId = activeOrder.id;
    setItemsByOrderId((prev) => ({ ...prev, [orderId]: newItems }));
    updateOrderStatus(orderId, "완료");
  };

  return (
    <div className="space-y-4">
      {/* 상단 헤더 */}
      <div className="shadow-sm border border-gray-200 rounded-2xl bg-white">
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-base">출고 WMS · 출고 작업 지시</span>
            <select className="border border-gray-300 rounded-md px-2 py-1 text-xs" disabled>
              <option>출고위치: 2층 피킹라인</option>
            </select>
          </div>
        </div>
      </div>

      {/* 본문 영역 */}
      <div className="grid grid-cols-12 gap-4">
        {/* 왼쪽: 주문서 목록 + 존 필터 탭 */}
        <div className="col-span-3 flex flex-col gap-2">
          {/* 출고 구분 탭 */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-gray-500">출고 구분</span>
            <div className="flex gap-2 mt-1">
              {(
                [
                  { key: "ALL", label: "전체" },
                  { key: "수도권", label: "수도권" },
                  { key: "비수도권", label: "비수도권" },
                  { key: "차량출고", label: "차량출고" },
                ] as { key: ZoneFilter; label: string }[]
              ).map((tab) => {
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
                      }`}
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
            onRefresh={() => alert("새로고침(데모)")}
            onOpenEmergency={openEmergencyModal}
            onOpenCarBatch={zoneFilter === "차량출고" ? () => setCarBatchOpen(true) : undefined}
          />
        </div>

        {/* 가운데: 주문 상세 (✅ 6 → 9로 확장) */}
        <div className="col-span-9">
        <OrderDetail
          order={activeOrder}
          items={activeItems}
          onChangeStatus={(status) => updateOrderStatus(activeOrder.id, status)}
          onComplete={handleCompleteOrder}
          onAddFieldMemo={handleAddFieldMemo}
          onUpdateItems={(orderId, nextItems) => {
            setItemsByOrderId((prev) => ({ ...prev, [orderId]: nextItems }));
          }}
        />
        </div>
      </div>

      {/* ✅ 차량출고: 파렛트 일괄이송(신버전) */}
      <CarBatchTransferModal
        open={carBatchOpen}
        onClose={() => setCarBatchOpen(false)}
        orders={orders}
        itemsByOrderId={itemsByOrderId}
        draftByOrder={carBatchDraftByOrder}
        onChangeDraftByOrder={setCarBatchDraftByOrder}
        onUpdateItems={(orderId, nextItems) => {
          setItemsByOrderId((prev) => ({ ...prev, [orderId]: nextItems }));
        }}
        occupiedSlotIds={[]}
        initialOrderId={activeOrder?.id ?? ""}
      />

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