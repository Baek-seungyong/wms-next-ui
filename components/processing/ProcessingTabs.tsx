//components/processing/ProcessingTabs.tsx
"use client";

import type { ProcessingTabKey } from "./types";

type Props = {
  activeTab: ProcessingTabKey;
  onChange: (tab: ProcessingTabKey) => void;
};

const tabs: { key: ProcessingTabKey; label: string }[] = [
  { key: "list", label: "후가공 작업목록" },
  { key: "waiting-orders", label: "후가공 대기 주문" },
  { key: "completed-stock", label: "후가공 완료 재고" },
];

export default function ProcessingTabs({ activeTab, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={[
              "rounded-xl border px-4 py-2 text-sm font-semibold transition",
              active
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}