// app/production/page.tsx
"use client";

import type { ReactNode } from "react";
import ProductionManagementView from "@/components/ProductionManagementView";

export default function ProductionPage(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col gap-4">
      {/* 상단 제목 영역 */}
      <header className="rounded-2xl border bg-white px-6 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">생산관리</h1>
          <p className="text-[12px] text-gray-500">
            생산 완료된 제품의 LOT/QR 등록 및 수정, 라벨 출력, AMR 파렛트 호출과
            입고 처리를 관리하는 화면입니다.
          </p>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1">
        <ProductionManagementView />
      </main>
    </div>
  );
}
