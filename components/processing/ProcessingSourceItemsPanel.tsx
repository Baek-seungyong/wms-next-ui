//components/processing/ProcessingSourceItemsPanel.tsx
"use client";

import type { ProcessingSourceItem } from "./types";

type Props = {
  items: ProcessingSourceItem[];
  onChange: (items: ProcessingSourceItem[]) => void;
};

export default function ProcessingSourceItemsPanel({ items, onChange }: Props) {
  const updateField = (
    id: string,
    field: keyof ProcessingSourceItem,
    value: string | number
  ) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addRow = () => {
    onChange([
      ...items,
      {
        id: `src-${Date.now()}`,
        productCode: "",
        productName: "",
        qty: 0,
        unit: "EA",
        location: "2층 잔량 파렛트 창고",
      },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">투입 재고</h3>
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
        >
          행 추가
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-6"
          >
            <input
              value={item.productCode}
              onChange={(e) => updateField(item.id, "productCode", e.target.value)}
              placeholder="상품코드"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={item.productName}
              onChange={(e) => updateField(item.id, "productName", e.target.value)}
              placeholder="상품명"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={item.qty}
              onChange={(e) => updateField(item.id, "qty", Number(e.target.value))}
              placeholder="수량"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={item.unit}
              onChange={(e) => updateField(item.id, "unit", e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="EA">EA</option>
              <option value="BOX">BOX</option>
              <option value="PALLET">PALLET</option>
            </select>
            <input
              value={item.location}
              onChange={(e) => updateField(item.id, "location", e.target.value)}
              placeholder="현재위치"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => removeRow(item.id)}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}