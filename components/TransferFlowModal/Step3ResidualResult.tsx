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

  // 더미 데이터
  const rows: ToteRow[] = useMemo(
    () => [
      { id: `${productCode}-TOTE-01`, lotNo: "LOT-2501-A", location: "피킹라인", totalEa: 220 },
      { id: `${productCode}-TOTE-02`, lotNo: "LOT-2501-A", location: "피킹라인", totalEa: 80 },
      { id: `${productCode}-TOTE-03`, lotNo: "LOT-2412-C", location: "피킹라인", totalEa: 400 },
    ],
    [productCode],
  );

  // ✅ 예정 / 호출 분리
  const plannedIds: string[] = (draft as any).plannedToteIds ?? [];
  const calledIds: string[] = draft.calledToteIds ?? [];

  const plannedTotalEa = plannedIds.reduce(
    (sum, id) => sum + Number(draft.toteEaPickMap?.[id] ?? 0),
    0,
  );

  const calledTotalEa = calledIds.reduce(
    (sum, id) => sum + Number(draft.toteEaPickMap?.[id] ?? 0),
    0,
  );

  // ============================
  // 예정 추가
  // ============================
  const addPlanned = (row: ToteRow) => {
    const next: any = { ...draft };

    const set = new Set(next.plannedToteIds || []);
    set.add(row.id);
    next.plannedToteIds = Array.from(set);

    next.toteMeta = {
      ...(next.toteMeta || {}),
      [row.id]: { totalEa: row.totalEa, lotNo: row.lotNo, location: row.location },
    };

    next.toteEaPickMap = {
      ...(next.toteEaPickMap || {}),
      [row.id]:
        Number(next.toteEaPickMap?.[row.id] ?? 0) > 0
          ? Number(next.toteEaPickMap?.[row.id] ?? 0)
          : Math.max(0, Number(targetEaQty || 0)),
    };

    onChangeDraft(next);
  };

  const handleAutoCall = () => {
    if (!rows.length) return;

    const enough = rows
      .filter((r) => r.totalEa >= Number(targetEaQty || 0))
      .sort((a, b) => a.totalEa - b.totalEa)[0];

    const best = enough ?? rows.slice().sort((a, b) => b.totalEa - a.totalEa)[0];

    addPlanned(best);
    setPickerOpen(false);
  };

  const removePlanned = (id: string) => {
    const next: any = { ...draft };
    next.plannedToteIds = (next.plannedToteIds || []).filter((x: string) => x !== id);

    const { [id]: _, ...rest } = next.toteEaPickMap || {};
    next.toteEaPickMap = rest;

    onChangeDraft(next);
  };

  // ============================
  // 예정 → 호출 확정
  // ============================
  const confirmCall = () => {
    if (plannedIds.length === 0) return;

    const next: any = { ...draft };

    const merged = new Set<string>([...(next.calledToteIds || []), ...plannedIds]);
    next.calledToteIds = Array.from(merged);

    next.plannedToteIds = [];

    onChangeDraft(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold">토트 호출(낱개 단위)</div>
          <div className="text-[12px] text-gray-600">
            목표 낱개수량:{" "}
            <span className="font-semibold">{Number(targetEaQty).toLocaleString()}</span> EA
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoCall}
            className="rounded-full bg-gray-900 px-3 py-1 text-[12px] font-semibold text-white"
          >
            토트호출
          </button>

          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="rounded-full border bg-white px-3 py-1 text-[12px]"
          >
            지정호출
          </button>

          <button
            type="button"
            onClick={() => onOpenManage?.(productCode)}
            className="rounded-full border bg-white px-3 py-1 text-[12px]"
          >
            관리
          </button>
        </div>
      </div>

      {/* 지정호출 패널 */}
      {pickerOpen && (
        <div className="rounded-xl border bg-white p-3">
          <div className="mb-2 text-[12px] font-semibold text-gray-700">
            토트 후보 ({rows.length})
          </div>
          <div className="space-y-2">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => addPlanned(r)}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12px] hover:bg-gray-50"
              >
                <div>
                  <div className="font-semibold text-gray-900">{r.id}</div>
                  <div className="text-[11px] text-gray-500">
                    {r.location} · {r.lotNo}
                  </div>
                </div>
                <div className="text-right text-[11px] text-gray-600">
                  재고 {r.totalEa.toLocaleString()} EA
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============================= */}
      {/* 예정 토트 */}
      {/* ============================= */}
      <div className="rounded-xl border bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-semibold text-gray-700">
            예정 토트 ({plannedIds.length})
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] text-gray-500">
              입력 합계: <b>{plannedTotalEa.toLocaleString()}</b> EA
            </div>
            <button
              type="button"
              disabled={plannedIds.length === 0}
              onClick={confirmCall}
              className="rounded-full bg-emerald-600 px-3 py-1 text-[12px] font-semibold text-white disabled:opacity-40"
            >
              확인
            </button>
          </div>
        </div>

        {plannedIds.length === 0 ? (
          <div className="text-[12px] text-gray-500"></div>
        ) : (
          <div className="space-y-2">
            {plannedIds.map((id) => {
              const meta = draft.toteMeta?.[id];
              const maxEa = Number(meta?.totalEa ?? 0);
              const val = Number(draft.toteEaPickMap?.[id] ?? 0);

              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{id}</div>
                    <div className="text-[11px] text-gray-500">
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
                      onChange={(e) =>
                        onChangeDraft({
                          ...draft,
                          toteEaPickMap: {
                            ...(draft.toteEaPickMap || {}),
                            [id]: Math.max(0, Number(e.target.value || 0)),
                          },
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removePlanned(id)}
                      className="rounded-md border px-2 py-1 text-[12px]"
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

      {/* ============================= */}
      {/* 호출 확정 토트 (락) */}
      {/* ============================= */}
      <div className="rounded-xl border bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-semibold text-gray-700">
            호출된 토트 ({calledIds.length})
          </div>
          <div className="text-[11px] text-gray-500">
            입력 합계: <b>{calledTotalEa.toLocaleString()}</b> EA
          </div>
        </div>

        {calledIds.length === 0 ? (
          <div className="text-[12px] text-gray-500"></div>
        ) : (
          <div className="space-y-2">
            {calledIds.map((id) => {
              const val = Number(draft.toteEaPickMap?.[id] ?? 0);

              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
                >
                  <div className="font-semibold text-gray-900">{id}</div>
                  <div className="flex items-center gap-2 text-[12px]">
                    <b>{val.toLocaleString()} EA</b>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px]">
                      호출 확정
                    </span>
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