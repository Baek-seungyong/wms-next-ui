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
      {
        id: `${productCode}-TOTE-01`,
        lotNo: "LOT-2501-A",
        location: "피킹라인",
        totalEa: 220,
      },
      {
        id: `${productCode}-TOTE-02`,
        lotNo: "LOT-2501-A",
        location: "피킹라인",
        totalEa: 80,
      },
      {
        id: `${productCode}-TOTE-03`,
        lotNo: "LOT-2412-C",
        location: "피킹라인",
        totalEa: 400,
      },
    ],
    [productCode],
  );

  // ✅ 예정 / 호출 분리
  const plannedIds: string[] = (draft as any).plannedToteIds ?? [];
  const calledIds: string[] = draft.calledToteIds ?? [];

  // ✅ 합계(입력값 기준)
  const plannedTotalEa = plannedIds.reduce(
    (sum, id) => sum + Number(draft.toteEaPickMap?.[id] ?? 0),
    0,
  );

  const calledTotalEa = calledIds.reduce(
    (sum, id) => sum + Number(draft.toteEaPickMap?.[id] ?? 0),
    0,
  );

  // ============================
  // 예정 추가 (선택만 / 수량입력은 호출된에서)
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

    // ✅ 예정 단계에서는 기본 입력값 0으로 두고(= 호출된에서만 입력)
    // 기존에 값이 있으면 유지
    next.toteEaPickMap = {
      ...(next.toteEaPickMap || {}),
      [row.id]: Number(next.toteEaPickMap?.[row.id] ?? 0),
    };

    onChangeDraft(next);
  };

  // ============================
  // 자동 호출: "예정"에 1개 넣기 (수량입력은 호출된에서)
  // ============================
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

    onChangeDraft(next);
  };

  // ============================
  // 예정 → 호출 (확정 이동)
  // ============================
  const callPlannedToCalled = () => {
    if (plannedIds.length === 0) return;

    const next: any = { ...draft };

    // called에 합치기
    const merged = new Set<string>([...(next.calledToteIds || []), ...plannedIds]);
    next.calledToteIds = Array.from(merged);

    // ✅ 호출된으로 넘어갈 때, 아직 입력값이 0이면 "남은 목표" 기준으로 자동 채워주기(편의)
    //  - 이미 값이 있으면 그대로 둠
    const beforeCalledTotal = (next.calledToteIds || [])
      .filter((id: string) => !plannedIds.includes(id))
      .reduce((sum: number, id: string) => sum + Number(next.toteEaPickMap?.[id] ?? 0), 0);

    let remain = Math.max(0, Number(targetEaQty || 0) - beforeCalledTotal);

    next.toteEaPickMap = { ...(next.toteEaPickMap || {}) };
    plannedIds.forEach((id) => {
      const currentVal = Number(next.toteEaPickMap?.[id] ?? 0);
      if (currentVal > 0) return;

      const meta = next.toteMeta?.[id];
      const maxEa = Number(meta?.totalEa ?? 0);

      const fill = Math.min(remain, maxEa);
      next.toteEaPickMap[id] = fill;
      remain = Math.max(0, remain - fill);
    });

    // 예정 비우기
    next.plannedToteIds = [];

    // ✅ “호출” 버튼을 누른 순간: 호출 실행됨(단, 상단 현황 반영은 아래 확인에서)
    next.toteCalledAt = Date.now();

    onChangeDraft(next);
  };

  // ============================
  // 호출된 토트: 수량 입력 (여기서만)
  // ============================
  const updateCalledPickEa = (id: string, nextVal: number) => {
    const next: any = { ...draft };
    next.toteEaPickMap = {
      ...(next.toteEaPickMap || {}),
      [id]: Math.max(0, Number(nextVal || 0)),
    };
    onChangeDraft(next);
  };

  // ============================
  // 호출된 토트: 하단 "확인" (상단 현황 반영용 플래그)
  // ============================
  const confirmCalledTotes = () => {
    if (calledIds.length === 0) return;

    const next: any = { ...draft };

    // ✅ 상단 현황 반영 트리거용(부모에서 이 값 보고 반영하면 됨)
    next.toteCallConfirmed = true;
    next.toteConfirmedAt = Date.now();
    next.toteConfirmedTotalEa = calledIds.reduce(
      (sum, id) => sum + Number(next.toteEaPickMap?.[id] ?? 0),
      0,
    );

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

          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
            {rows.map((r) => {
              const isPlanned = plannedIds.includes(r.id);
              const isCalled = calledIds.includes(r.id);

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => addPlanned(r)}
                  className={[
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12px] transition",
                    "hover:bg-gray-50",
                    isCalled ? "opacity-60 cursor-not-allowed" : "",
                    isPlanned ? "bg-blue-50 border-blue-200" : "bg-white",
                  ].join(" ")}
                  disabled={isCalled}
                  title={isCalled ? "이미 호출된 토트야" : "예정 토트로 추가"}
                >
                  <div>
                    <div className="font-semibold text-gray-900">{r.id}</div>
                    <div className="text-[11px] text-gray-500">
                      {r.location} · {r.lotNo}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-gray-600">
                    재고 {r.totalEa.toLocaleString()} EA
                    {isPlanned && (
                      <div className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
                        예정
                      </div>
                    )}
                    {isCalled && (
                      <div className="mt-1 inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-700">
                        호출됨
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================= */}
      {/* 예정 토트 (선택만 / 수량 입력 없음) */}
      {/* ============================= */}
      <div className="rounded-xl border bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-semibold text-gray-700">
            예정 토트박스 ({plannedIds.length})
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] text-gray-500">
              입력 합계: <b>{plannedTotalEa.toLocaleString()}</b> EA
            </div>

            {/* ✅ 여기 버튼을 "호출"로 변경 */}
            <button
              type="button"
              disabled={plannedIds.length === 0}
              onClick={callPlannedToCalled}
              className="rounded-full bg-slate-800 px-3 py-1 text-[12px] font-semibold text-white disabled:opacity-40"
            >
              호출
            </button>
          </div>
        </div>

        {plannedIds.length === 0 ? (
          <div className="text-[12px] text-gray-500">
          </div>
        ) : (
          <div className="space-y-2">
            {plannedIds.map((id) => {
              const meta = draft.toteMeta?.[id];
              const maxEa = Number(meta?.totalEa ?? 0);

              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{id}</div>
                    <div className="text-[11px] text-gray-500">
                      {meta?.location ?? "-"} · {meta?.lotNo ?? "-"} · 재고 {maxEa.toLocaleString()} EA
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* ✅ 예정에서는 수량 입력 제거 */}
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                      예정
                    </span>
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
      {/* 호출된 토트 (여기서 수량 입력 + 하단 확인) */}
      {/* ============================= */}
      <div className="rounded-xl border bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-semibold text-gray-700">
            호출 토트박스 ({calledIds.length})
          </div>

          <div className="text-[11px] text-gray-500">
            입력 합계: <b>{calledTotalEa.toLocaleString()}</b> EA
          </div>
        </div>

        {calledIds.length === 0 ? (
          <div className="text-[12px] text-gray-500">
          </div>
        ) : (
          <div className="space-y-2">
            {calledIds.map((id) => {
              const meta = draft.toteMeta?.[id];
              const maxEa = Number(meta?.totalEa ?? 0);
              const val = Number(draft.toteEaPickMap?.[id] ?? 0);

              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{id}</div>
                    <div className="text-[11px] text-gray-500">
                      {meta?.location ?? "-"} · {meta?.lotNo ?? "-"} · 재고 {maxEa.toLocaleString()} EA
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={maxEa || undefined}
                      className="w-24 rounded-md border px-2 py-1 text-[12px]"
                      value={val}
                      onChange={(e) => updateCalledPickEa(id, Number(e.target.value || 0))}
                    />
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px]">
                      호출됨
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-3 flex items-center justify-end">
          <button
            type="button"
            disabled={calledIds.length === 0}
            onClick={confirmCalledTotes}
            className="rounded-full bg-emerald-600 px-3 py-1 text-[12px] font-semibold text-white hover:bg-emerald-700"
              >
            확인
          </button>
        </div>

        {/* ✅ 부모에서 이 값 보고 상단 현황 반영하면 됨 */}
        {(draft as any).toteCallConfirmed && (
          <div className="mt-2 text-[11px] text-emerald-700">
            · 호출 수량 확인 완료됨 (상단 현황 반영됨)
          </div>
        )}
      </div>
    </div>
  );
}