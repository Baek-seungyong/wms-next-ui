// app/stock/page.tsx
"use client";

import { useState, useEffect } from "react";
import { WarehouseMapView } from "@/components/WarehouseMapView";
import { WarehouseReplenishView } from "@/components/WarehouseReplenishView";
import { StockHistoryView } from "@/components/StockHistoryView";

type InventoryTab = "map" | "io" | "history";

interface StockPageProps {
  searchParams?: {
    tab?: string;
  };
}

// searchParams 를 props 로 받기
export default function StockPage({ searchParams }: StockPageProps) {
  // 주소창에서 ?tab=... 값 꺼내기
  const tabParam = searchParams?.tab;

  // tabParam 을 보고 초기 탭 결정
  const initialTab: InventoryTab =
    tabParam === "io"
      ? "io"
      : tabParam === "history"
      ? "history"
      : "map";

  // 초기값을 initialTab 으로
  const [activeTab, setActiveTab] = useState<InventoryTab>(initialTab);

  // 주소의 tab 값이 바뀌면 activeTab 도 맞춰주기
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="flex min-h-screen flex-col gap-4">
      {/* 상단 제목 영역 */}
      <header className="rounded-2xl border bg-white px-6 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">재고관리</h1>
        </div>
      </header>

      {/* ------------------------- */}
      {/* 탭별 내용 영역 */}
      {/* ------------------------- */}
      <main className="flex-1">
        {/* ① 창고도면 재고현황 */}
        {activeTab === "map" && <WarehouseMapView />}

        {/* ② 창고별 입출고 관리 */}
        {activeTab === "io" && <WarehouseReplenishView />}

        {/* ③ 입출고 히스토리 */}
        {activeTab === "history" && <StockHistoryView />}
      </main>
    </div>
  );
}
