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
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1">
        <ProductionManagementView />
      </main>
    </div>
  );
}
