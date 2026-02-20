// components/TransferFlowModal/Step3ResidualResult.tsx
"use client";

import { useMemo, useState } from "react";
import type { ResidualDraft } from "./types";

type ToteRow = {
  id: string;
  lotNo: string;
  location: string;
  totalEa: number;
};

type Props = {
  productCode: string;
  productName: string;

  /** 목표(낱개 EA) */
  targetEaQty: number;

  /** 계획표시 */
  planPalletQty: number | null;
  planBoxQty: number | null;
  planEaQty: number | null;

  draft: ResidualDraft;
  onChangeDraft: (next: ResidualDraft) => void;

  /** 토트 부족/수정용: OrderDetail의 ProductManageModal을 그대로 띄우기 */
  onOpenManage?: (productCode: string) => void;
};

export function Step3ResidualResult({
  productCode,
  productName,
  targetEaQty,
  planPalletQty,
  planBoxQty,
  planEaQty,
  draft,
  onChangeDraft,
  onOpenManage,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // ✅ 더미 토트 후보(나중에 실데이터로 교체)
  const rows: ToteRow[] = useMemo(
    () => [
      { id: `${productCode}-TOTE-01`, lotNo: "LOT-2501-A", location: "피킹라인", totalEa: 220 },
      { id: `${productCode}-TOTE-02`, lotNo: "LOT-2501-A", location: "피킹라인", totalEa: 80 },
      { id: `${productCode}-TOTE-03`, lotNo: "LOT-2412-C", location: "피킹라인", totalEa: 400 },
    ],
    [productCode],
  );

  const planText = useMemo(() => {
    const p = planPalletQty == null ? "-" : `${planPalletQty}P`;
    const b = planBoxQty == null ? "-" : `${planBoxQty}BOX`;
    const e = planEaQty == null ? "-" : `${planEaQty}EA`;
    return `${p} · ${b} · ${e}`;
  }, [planPalletQty, planBoxQty, planEaQty]);

  const selectedIds = draft.calledToteIds ?? [];
  const pickedTotalEa = Object.values(draft.toteEaPickMap || {}).reduce(
    (a, b) => a + Number(b || 0),
    0,
  );

  const handleCall = (row: ToteRow) => {
    const next: ResidualDraft = { ...draft };
    const cur = new Set(next.calledToteIds || []);
    cur.add(row.id);
    next.calledToteIds = Array.from(cur);

    next.toteMeta = {
      ...(next.toteMeta || {}),
      [row.id]: { totalEa: row.totalEa, lotNo: row.lotNo, location: row.location },
    };

    // 기본값: 목표 EA(이미 값 있으면 유지)
    next.toteEaPickMap = {
      ...(next.toteEaPickMap || {}),
      [row.id]:
        Number(next.toteEaPickMap?.[row.id] ?? 0) > 0
          ? Number(next.toteEaPickMap?.[row.id] ?? 0)
          : Math.max(0, Number(targetEaQty || 0)),
    };

    onChangeDraft(next);
  };

  const removeSelected = (id: string) => {
    const next: ResidualDraft = { ...draft };
    next.calledToteIds = (next.calledToteIds || []).filter((x) => x !== id);
    const { [id]: _, ...rest } = next.toteEaPickMap || {};
    next.toteEaPickMap = rest;
    onChangeDraft(next);
  };

  const handleAutoCall = () => {
    if (!rows.length) return;

    // 1) 목표 EA 이상 재고가 있는 토트 중 “가장 작은 것” 우선
    const enough = rows
      .filter((r) => r.totalEa >= Number(targetEaQty || 0))
      .sort((a, b) => a.totalEa - b.totalEa)[0];

    // 2) 없으면 “가장 큰 토트 1개”
    const best = enough ?? rows.slice().sort((a, b) => b.totalEa - a.totalEa)[0];

    handleCall(best);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-[13px] font-semibold">토트 호출(낱개 단위)</div>
          <div className="text-[12px] text-gray-600">
            <span className="mx-2 text-gray-300">|</span>
            목표 낱개수량:{" "}
            <span className="font-semibold">{Number(targetEaQty).toLocaleString()}</span> EA
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ 자동호출 */}
          <button
            type="button"
            onClick={handleAutoCall}
            className="rounded-full bg-gray-900 px-3 py-1 text-[12px] font-semibold text-white hover:opacity-90"
            title="목표 EA를 채우는 토트 1개 자동 선택"
          >
            토트호출
          </button>

          {/* ✅ 지정호출(패널 토글) */}
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="rounded-full border bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50"
          >
            지정호출
          </button>

          <button
            type="button"
            onClick={() => onOpenManage?.(productCode)}
            className="rounded-full border bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50"
            title="토트 재고/보충 관리"
          >
            관리
          </button>
        </div>
      </div>

      {/* 지정호출 패널 */}
      {pickerOpen ? (
        <div className="rounded-xl border bg-white p-3">
          <div className="mb-2 text-[12px] font-semibold text-gray-700">
            토트 후보 ({rows.length})
          </div>
          <div className="space-y-2">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleCall(r)}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12px] hover:bg-gray-50"
              >
                <div>
                  <div className="font-semibold text-gray-900">{r.id}</div>
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {r.location} · {r.lotNo}
                  </div>
                </div>
                <div className="text-right text-[11px] text-gray-600">
                  <div>재고 {r.totalEa.toLocaleString()} EA</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 선택된 토트 + EA 입력 */}
      <div className="rounded-xl border bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-semibold text-gray-700">
            호출된 토트 ({selectedIds.length})
          </div>
          <div className="text-[11px] text-gray-500">
            입력 합계: <b className="text-gray-900">{pickedTotalEa.toLocaleString()}</b> EA
          </div>
        </div>

        {selectedIds.length === 0 ? (
          <div className="text-[12px] text-gray-500"></div>
        ) : (
          <div className="space-y-2">
            {selectedIds.map((id) => {
              const meta = draft.toteMeta?.[id];
              const maxEa = Number(meta?.totalEa ?? 0);
              const val = Number(draft.toteEaPickMap?.[id] ?? 0);

              return (
                <div
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <div>
                    <div className="text-[12px] font-semibold text-gray-900">{id}</div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      재고 {maxEa.toLocaleString()} EA
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={maxEa || undefined}
                      className="w-24 rounded-md border px-2 py-1 text-[12px]"
                      value={val}
                      onChange={(e) => {
                        const nextVal = Math.max(0, Number(e.target.value || 0));
                        onChangeDraft({
                          ...draft,
                          toteEaPickMap: { ...(draft.toteEaPickMap || {}), [id]: nextVal },
                        });
                      }}
                    />
                    <span className="text-[12px] text-gray-600">EA</span>
                    <button
                      type="button"
                      onClick={() => removeSelected(id)}
                      className="rounded-md border px-2 py-1 text-[12px] text-gray-600 hover:bg-gray-50"
                    >
                      제거
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}