// app/order/page.tsx
"use client";

import { useEffect, useState } from "react";
import OrderManagement from "@/components/OrderManagement";
import { PickingWorkStatusView } from "@/components/PickingWorkStatusView";

type OrderSubTab = "order" | "picking";

interface OrderPageProps {
  searchParams?: {
    tab?: string; // ?tab=order | ?tab=picking
  };
}

export default function OrderPage({ searchParams }: OrderPageProps) {
  const tabParam = searchParams?.tab;

  const initialTab: OrderSubTab =
    tabParam === "picking" ? "picking" : "order";

  const [activeTab, setActiveTab] = useState<OrderSubTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="flex min-h-screen flex-col gap-4">
      {/* 페이지 제목 */}
      <header className="rounded-2xl border bg-white px-6 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">주문관리</h1>
        </div>
      </header>

      {/* 탭별 내용 */}
      <main className="flex-1">
        {activeTab === "order" && <OrderManagement />}
        {activeTab === "picking" && <PickingWorkStatusView />}
      </main>
    </div>
  );
}
