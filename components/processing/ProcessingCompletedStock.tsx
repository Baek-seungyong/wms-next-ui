//components/processing/ProcessingCompletedStock.tsx
"use client";

import type { ProcessingCompletedStockItem } from "./types";

type Props = {
  items: ProcessingCompletedStockItem[];
};

export default function ProcessingCompletedStock({ items }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-bold text-slate-900">후가공 완료 재고</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">작업번호</th>
              <th className="px-4 py-3 text-left font-semibold">상품코드</th>
              <th className="px-4 py-3 text-left font-semibold">상품명</th>
              <th className="px-4 py-3 text-left font-semibold">수량</th>
              <th className="px-4 py-3 text-left font-semibold">위치</th>
              <th className="px-4 py-3 text-left font-semibold">연결주문</th>
              <th className="px-4 py-3 text-left font-semibold">출고예정일</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  완료된 후가공 재고가 아직 없어
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {item.workNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.productCode}</td>
                  <td className="px-4 py-3 text-slate-700">{item.productName}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.qty} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.location}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.linkedOrderIds.join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.plannedShipDate || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}