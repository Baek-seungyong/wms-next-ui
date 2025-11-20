"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import WmsMainPage from "../page"; // ✅ default export를 이렇게 import
import { WarehouseMapView } from "../../components/WarehouseMapView";

type ViewKey = "WMS" | "MAP";

export default function DashboardPage(): ReactElement {
  const [view, setView] = useState<ViewKey>("WMS");

  return (
    <main className="flex min-h-screen bg-gray-100">
      {/* 왼쪽 메뉴 */}
      <aside className="flex w-60 flex-col border-r bg-white shadow-sm">
        <div className="border-b px-4 py-3 text-sm font-semibold">
          WMS 대시보드
        </div>
        <nav className="flex-1 py-2">
          <button
            type="button"
            onClick={() => setView("WMS")}
            className={`block w-full rounded-none px-4 py-2 text-left text-sm ${
              view === "WMS"
                ? "bg-blue-50 font-semibold text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            📦 WMS 출고 / AMR 화면
          </button>
          <button
            type="button"
            onClick={() => setView("MAP")}
            className={`mt-1 block w-full rounded-none px-4 py-2 text-left text-sm ${
              view === "MAP"
                ? "bg-blue-50 font-semibold text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            🗺 창고 도면 재고조회
          </button>
        </nav>
      </aside>

      {/* 오른쪽 실제 화면 영역 */}
      <section className="flex-1 overflow-auto p-4">
        {view === "WMS" ? <WmsMainPage /> : <WarehouseMapView />}
      </section>
    </main>
  );
}
