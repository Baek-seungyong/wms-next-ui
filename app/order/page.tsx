// app/order/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import OrderManagement, {
  baseOrders,
  buildInitialItemsByOrder,
} from "@/components/OrderManagement";
import { PickingWorkStatusView } from "@/components/PickingWorkStatusView";
import type { Order, OrderItem } from "@/components/types";
import type { ActiveOrderSummary } from "@/components/PickingWorkStatusView";

type OrderSubTab = "order" | "picking";

interface OrderPageProps {
  searchParams?: {
    tab?: string; // ?tab=order | ?tab=picking
  };
}

export default function OrderPage({ searchParams }: OrderPageProps) {
  const tabParam = searchParams?.tab;
  const initialTab: OrderSubTab = tabParam === "picking" ? "picking" : "order";
  const [activeTab, setActiveTab] = useState<OrderSubTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // ✅ a방식 핵심: 상태를 페이지로 올림
  const [orders, setOrders] = useState<Order[]>(baseOrders);
  const [itemsByOrderId, setItemsByOrderId] = useState<Record<string, OrderItem[]>>(
    buildInitialItemsByOrder(baseOrders),
  );

  // ✅ picking 탭에서 쓸 “출고중 주문 요약”
  const activeOrdersSummary = useMemo<ActiveOrderSummary[]>(() => {
    return orders
      .filter((o) => o.status === "출고중")
      .slice(0, 4)
      .map((o) => {
        const items = itemsByOrderId[o.id] ?? [];
        return {
          orderNo: o.id,
          customerName: o.customer,
          items: items.map((it) => ({
            productName: it.name,
            orderQty: it.orderQty,
          })),
        };
      });
  }, [orders, itemsByOrderId]);

  return (
    <div className="flex min-h-screen flex-col gap-4">
      <header className="rounded-2xl border bg-white px-6 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">주문관리</h1>
        </div>
      </header>

      <main className="flex-1">
        {activeTab === "order" && (
          <OrderManagement
            orders={orders}
            setOrders={setOrders}
            itemsByOrderId={itemsByOrderId}
            setItemsByOrderId={setItemsByOrderId}
          />
        )}

        {activeTab === "picking" && (
          <PickingWorkStatusView activeOrders={activeOrdersSummary} />
        )}
      </main>
    </div>
  );
}
