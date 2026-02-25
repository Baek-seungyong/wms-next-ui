"use client";

import { useMemo, useState, useEffect } from "react";
import type { ResidualDraft } from "./types";

type ResidualPalletRow = {
  id: string;
  lotNo: string;
  location: string;
  boxQty: number; // 파렛트 위 박스 수량
  eaPerBox: number; // 박스당 EA
};

type Props = {
  productCode: string;
  productName: string;

  /** 목표(박스 단위) */
  targetBoxQty: number;

  /** 단위(박스당 EA) */
  eaPerBox?: number;

  /** 계획표시(상단/각 STEP 공통) */
  planPalletQty: number | null;
  planBoxQty: number | null;
  planEaQty: number | null;

  draft: ResidualDraft;
  onChangeDraft: (next: ResidualDraft) => void;
};

export function Step2ResidualPrep({
  productCode,
  productName,
  targetBoxQty,
  eaPerBox,
  planPalletQty,
  planBoxQty,
  planEaQty,
  draft,
  onChangeDraft,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // ✅ 더미 후보(나중에 실데이터로 교체)
  const rows: ResidualPalletRow[] = useMemo(
    () => [
      {
        id: `${productCode}-RES-PAL-01`,
        lotNo: "LOT-2501-A",
        location: "2층 잔량랙",
        boxQty: 18,
        eaPerBox: eaPerBox ?? 0,
      },
      {
        id: `${productCode}-RES-PAL-02`,
        lotNo: "LOT-2501-B",
        location: "2층 잔량랙",
        boxQty: 6,
        eaPerBox: eaPerBox ?? 0,
      },
      {
        id: `${productCode}-RES-PAL-03`,
        lotNo: "LOT-2412-C",
        location: "2층 잔량랙",
        boxQty: 30,
        eaPerBox: eaPerBox ?? 0,
      },
    ],
    [productCode, eaPerBox],
  );

  // 기본값: 목표 박스 수량을 draft에 채움(한번만)
  useEffect(() => {
    if (!Number.isFinite(targetBoxQty)) return;
    if ((draft.planBoxQty ?? null) == null && (planBoxQty ?? null) != null) {
      onChangeDraft({ ...draft, planBoxQty });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ draft에 planned / called 를 같이 저장 (types.ts에 아직 없으면 any로 접근)
  const plannedIds: string[] = (draft as any).plannedResidualPalletIds ?? [];
  const calledIds: string[] = (draft as any).calledResidualPalletIds ?? [];

  const plannedTotalBox = plannedIds.reduce((sum, id) => {
    return sum + Number(draft.residualBoxPickMap?.[id] ?? 0);
  }, 0);

  const calledTotalBox = calledIds.reduce((sum, id) => {
    return sum + Number(draft.residualBoxPickMap?.[id] ?? 0);
  }, 0);

  const handleAutoCall = () => {
    // ✅ 규칙: 목표 박스수량보다 많이 얹힌 파렛트 중 “가장 오래된(=목록 앞)” 하나 선택
    const row = rows.find((r) => r.boxQty >= targetBoxQty && targetBoxQty > 0) ?? rows[0];
    if (!row) return;

    const next: any = { ...draft };

    // ✅ 예정만 세팅
    next.plannedResidualPalletIds = [row.id];

    next.residualPalletMeta = {
      ...(next.residualPalletMeta || {}),
      [row.id]: { boxQty: row.boxQty, eaPerBox: row.eaPerBox },
    };

    // 기본 입력값: 목표 박스 수량
    next.residualBoxPickMap = {
      ...(next.residualBoxPickMap || {}),
      [row.id]: Math.max(0, targetBoxQty || 0),
    };

    onChangeDraft(next);
  };

  const handleManualPick = (row: ResidualPalletRow) => {
    const next: any = { ...draft };

    const cur = new Set(next.plannedResidualPalletIds || []);
    cur.add(row.id);
    next.plannedResidualPalletIds = Array.from(cur);

    next.residualPalletMeta = {
      ...(next.residualPalletMeta || {}),
      [row.id]: { boxQty: row.boxQty, eaPerBox: row.eaPerBox },
    };

    // 기본 입력값: 목표 박스 수량 (이미 있으면 유지)
    next.residualBoxPickMap = {
      ...(next.residualBoxPickMap || {}),
      [row.id]:
        Number(next.residualBoxPickMap?.[row.id] ?? 0) > 0
          ? Number(next.residualBoxPickMap?.[row.id] ?? 0)
          : Math.max(0, targetBoxQty || 0),
    };

    onChangeDraft(next);
  };

  const removePlanned = (id: string) => {
    const next: any = { ...draft };
    next.plannedResidualPalletIds = (next.plannedResidualPalletIds || []).filter((x: string) => x !== id);

    const { [id]: _, ...rest } = next.residualBoxPickMap || {};
    next.residualBoxPickMap = rest;

    onChangeDraft(next);
  };

  const confirmCall = () => {
    if (plannedIds.length === 0) return;

    const next: any = { ...draft };

    // ✅ 예정 → 호출됨(확정)으로 이동 (중복 방지)
    const merged = new Set<string>([...(next.calledResidualPalletIds || []), ...plannedIds]);
    next.calledResidualPalletIds = Array.from(merged);

    // ✅ 예정 비움
    next.plannedResidualPalletIds = [];

    onChangeDraft(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold">파렛트 호출(박스 단위)</div>
          <div className="mt-1 text-[12px] text-gray-600">
            목표 박스수량:{" "}
            <span className="font-semibold">{Number(targetBoxQty).toLocaleString()}</span> BOX
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoCall}
            className="rounded-full bg-gray-900 px-3 py-1 text-[12px] font-semibold text-white hover:opacity-90"
          >
            자동 적용
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="rounded-full border bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50"
          >
            지정호출
          </button>
        </div>
      </div>

      {/* 지정호출 패널(간단 버전) */}
      {pickerOpen ? (
        <div className="rounded-xl border bg-white p-3">
          <div className="mb-2 text-[12px] font-semibold text-gray-700">
            잔량 파렛트 후보 ({rows.length})
          </div>
          <div className="space-y-2">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleManualPick(r)}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12px] hover:bg-gray-50"
              >
                <div>
                  <div className="font-semibold text-gray-900">{r.id}</div>
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {r.location} · {r.lotNo}
                  </div>
                </div>
                <div className="text-right text-[11px] text-gray-600">
                  <div>잔량 {r.boxQty.toLocaleString()} BOX</div>
                  <div>ea/box {Number(r.eaPerBox || 0).toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ✅ 예정 파렛트(확정 전) */}
      <div className="rounded-xl border bg-white p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[12px] font-semibold text-gray-700">
            예정 파렛트 ({plannedIds.length})
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] text-gray-500">
              입력 합계: <b className="text-gray-900">{plannedTotalBox.toLocaleString()}</b> BOX
            </div>
            <button
              type="button"
              disabled={plannedIds.length === 0}
              onClick={confirmCall}
              className="rounded-full bg-emerald-600 px-3 py-1 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
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
              const meta = draft.residualPalletMeta?.[id];
              const maxBox = Number(meta?.boxQty ?? 0);
              const val = Number(draft.residualBoxPickMap?.[id] ?? 0);

              return (
                <div
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <div>
                    <div className="text-[12px] font-semibold text-gray-900">{id}</div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      잔량 {maxBox.toLocaleString()} BOX
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={maxBox || undefined}
                      className="w-24 rounded-md border px-2 py-1 text-[12px]"
                      value={val}
                      onChange={(e) => {
                        const nextVal = Math.max(0, Number(e.target.value || 0));
                        onChangeDraft({
                          ...draft,
                          residualBoxPickMap: { ...(draft.residualBoxPickMap || {}), [id]: nextVal },
                        });
                      }}
                    />
                    <span className="text-[12px] text-gray-600">BOX</span>
                    <button
                      type="button"
                      onClick={() => removePlanned(id)}
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

      {/* ✅ 호출된 파렛트(확정 후) - 락 */}
      <div className="rounded-xl border bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-semibold text-gray-700">
            호출된 파렛트 ({calledIds.length})
          </div>
          <div className="text-[11px] text-gray-500">
            입력 합계: <b className="text-gray-900">{calledTotalBox.toLocaleString()}</b> BOX
          </div>
        </div>

        {calledIds.length === 0 ? (
          <div className="text-[12px] text-gray-500"></div>
        ) : (
          <div className="space-y-2">
            {calledIds.map((id) => {
              const meta = draft.residualPalletMeta?.[id];
              const maxBox = Number(meta?.boxQty ?? 0);
              const val = Number(draft.residualBoxPickMap?.[id] ?? 0);

              return (
                <div
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2"
                >
                  <div>
                    <div className="text-[12px] font-semibold text-gray-900">{id}</div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      잔량 {maxBox.toLocaleString()} BOX
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-[12px] text-gray-700">
                      <b className="tabular-nums">{val.toLocaleString()}</b> BOX
                    </div>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
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