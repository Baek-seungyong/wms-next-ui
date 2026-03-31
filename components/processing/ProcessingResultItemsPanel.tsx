//components/processing/ProcessingResultItemsPanel.tsx
"use client";

import type { ProcessingResultItem } from "./types";

type Props = {
  items: ProcessingResultItem[];
  onChange: (items: ProcessingResultItem[]) => void;
};

export default function ProcessingResultItemsPanel({ items, onChange }: Props) {
  const updateField = (
    id: string,
    field: keyof ProcessingResultItem,
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
        id: `res-${Date.now()}`,
        productCode: "",
        productName: "",
        qty: 0,
        unit: "EA",
        location: "후가공완료존",
        goodQty: 0,
        defectQty: 0,
        discardQty: 0,
      },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">결과 재고</h3>
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
            className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-8"
          >
            <input
              value={item.productCode}
              onChange={(e) => updateField(item.id, "productCode", e.target.value)}
              placeholder="결과품 코드"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={item.productName}
              onChange={(e) => updateField(item.id, "productName", e.target.value)}
              placeholder="결과품명"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={item.qty}
              onChange={(e) => updateField(item.id, "qty", Number(e.target.value))}
              placeholder="총수량"
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
              type="number"
              value={item.goodQty ?? 0}
              onChange={(e) => updateField(item.id, "goodQty", Number(e.target.value))}
              placeholder="양품"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={item.defectQty ?? 0}
              onChange={(e) =>
                updateField(item.id, "defectQty", Number(e.target.value))
              }
              placeholder="불량"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={item.discardQty ?? 0}
              onChange={(e) =>
                updateField(item.id, "discardQty", Number(e.target.value))
              }
              placeholder="폐기"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                value={item.location}
                onChange={(e) =>
                  updateField(item.id, "location", e.target.value)
                }
                placeholder="결과위치"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeRow(item.id)}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}