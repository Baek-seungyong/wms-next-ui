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

  // ✅ 리스트 선택 표시: 자동호출로 선택된 것도 포함해서 “선택됨” 표시
  const selectedSet = useMemo(() => {
    return new Set<string>([...plannedIds, ...calledIds]);
  }, [plannedIds, calledIds]);

  // ✅ 입력은 "호출된 파렛트"에서만 한다 (그래도 값 저장은 residualBoxPickMap을 계속 사용)
  const calledTotalBox = calledIds.reduce((sum, id) => {
    return sum + Number(draft.residualBoxPickMap?.[id] ?? 0);
  }, 0);

  const handleAutoCall = () => {
    // ✅ 규칙: 목표 박스수량보다 많이 얹힌 파렛트 중 “가장 오래된(=목록 앞)” 하나 선택
    const row = rows.find((r) => r.boxQty >= targetBoxQty && targetBoxQty > 0) ?? rows[0];
    if (!row) return;

    const next: any = { ...draft };

    // ✅ 예정만 세팅 (수량 입력은 호출된 파렛트에서)
    next.plannedResidualPalletIds = [row.id];

    next.residualPalletMeta = {
      ...(next.residualPalletMeta || {}),
      [row.id]: { boxQty: row.boxQty, eaPerBox: row.eaPerBox },
    };

    // ✅ 호출 후 입력하기 편하게 기본값은 미리 넣어둠(표시는 호출된 파렛트에서만)
    next.residualBoxPickMap = {
      ...(next.residualBoxPickMap || {}),
      [row.id]: Math.max(0, targetBoxQty || 0),
    };

    onChangeDraft(next);
  };

  const handleManualPick = (row: ResidualPalletRow) => {
    const next: any = { ...draft };

    // ✅ 예정에 추가(중복 방지)
    const cur = new Set(next.plannedResidualPalletIds || []);
    cur.add(row.id);
    next.plannedResidualPalletIds = Array.from(cur);

    next.residualPalletMeta = {
      ...(next.residualPalletMeta || {}),
      [row.id]: { boxQty: row.boxQty, eaPerBox: row.eaPerBox },
    };

    // ✅ 기본 입력값은 미리 넣어둠(표시는 호출된 파렛트에서만)
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
    next.plannedResidualPalletIds = (next.plannedResidualPalletIds || []).filter(
      (x: string) => x !== id,
    );

    // ✅ 값도 같이 제거(원하면 유지해도 되는데, 여기선 깔끔하게 제거)
    const { [id]: _, ...rest } = next.residualBoxPickMap || {};
    next.residualBoxPickMap = rest;

    onChangeDraft(next);
  };

  // ✅ 예정 → 호출됨(=AMR 호출 버튼 역할)
  const callPlanned = () => {
    if (plannedIds.length === 0) return;

    const next: any = { ...draft };

    // ✅ 예정 → 호출됨(중복 방지)
    const merged = new Set<string>([...(next.calledResidualPalletIds || []), ...plannedIds]);
    next.calledResidualPalletIds = Array.from(merged);

    // ✅ 예정 비움
    next.plannedResidualPalletIds = [];

    onChangeDraft(next);
  };

  // ✅ 호출된 파렛트 입력 확정(하단 확인 버튼)
  const confirmCalledInputs = () => {
    if (calledIds.length === 0) return;

    const next: any = { ...draft };

    // ✅ “상단 이송현황”이 draft를 읽는 구조라면 바뀌게 만들 수 있도록 값 저장
    // - planBoxQty / planEaQty 같은 키가 types에 없으면 any로 들어감
    const ea = Number(eaPerBox ?? 0);
    next.step2ConfirmedCalledBoxQty = calledTotalBox;
    next.step2ConfirmedCalledEaQty = calledTotalBox * ea;
    next.step2ConfirmedCalledAt = new Date().toISOString();

    // ✅ 원하면 이걸 planBoxQty에 덮어써서 상단 표시를 강제로 바꾸는 방식도 가능
    // (부모가 planBoxQty를 draft.planBoxQty로 만들고 있다면 바로 반영됨)
    next.planBoxQty = calledTotalBox;
    next.planEaQty = calledTotalBox * ea;

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
            자동 호출
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

      {/* ✅ 지정호출 패널(독립감 + 스크롤 + 선택 표시) */}
      {pickerOpen ? (
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[12px] font-semibold text-gray-700">
              잔량 파렛트 선택 ({rows.length})
            </div>
            <div className="text-[11px] text-gray-500">
              선택됨: <b className="text-gray-900">{selectedSet.size}</b>
            </div>
          </div>

          {/* ✅ 고정 높이 + 우측 스크롤 */}
          <div className="max-h-[240px] overflow-y-auto pr-1">
            <div className="space-y-2">
              {rows.map((r) => {
                const isSelected = selectedSet.has(r.id);

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleManualPick(r)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12px] transition ${
                      isSelected
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
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
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ 예정 파렛트(호출 전) - 수량 입력 없음 */}
      <div className="rounded-xl border bg-white p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[12px] font-semibold text-gray-700">
            선택 파렛트 ({plannedIds.length})
          </div>

          <button
            type="button"
            disabled={plannedIds.length === 0}
            onClick={callPlanned}
            className="rounded-full bg-gray-900 px-3 py-1 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40"
            title="예정 파렛트를 호출된 파렛트로 이동"
          >
            호출
          </button>
        </div>

        {plannedIds.length === 0 ? (
          <div className="text-[12px] text-gray-500"></div>
        ) : (
          <div className="space-y-2">
            {plannedIds.map((id) => {
              const meta = draft.residualPalletMeta?.[id];
              const maxBox = Number(meta?.boxQty ?? 0);

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

                  <button
                    type="button"
                    onClick={() => removePlanned(id)}
                    className="rounded-md border px-2 py-1 text-[12px] text-gray-600 hover:bg-gray-50"
                  >
                    제거
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ 호출된 파렛트(호출 후) - 여기서 수량 입력 */}
      <div className="rounded-xl border bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-semibold text-gray-700">
            호출 파렛트 ({calledIds.length})
          </div>
          <div className="text-[11px] text-gray-500">
            입력 합계: <b className="text-gray-900">{calledTotalBox.toLocaleString()}</b> BOX
          </div>
        </div>

        {calledIds.length === 0 ? (
          <div className="text-[12px] text-gray-500"></div>
        ) : (
          <>
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
                      <input
                        type="number"
                        min={0}
                        max={maxBox || undefined}
                        className="w-24 rounded-md border px-2 py-1 text-[12px]"
                        value={val}
                        onChange={(e) => {
                          const nextValRaw = Number(e.target.value || 0);
                          const nextVal = Math.max(0, nextValRaw);
                          onChangeDraft({
                            ...draft,
                            residualBoxPickMap: {
                              ...(draft.residualBoxPickMap || {}),
                              [id]: nextVal,
                            },
                          });
                        }}
                      />
                      <span className="text-[12px] text-gray-600">BOX</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ✅ 하단 확인 버튼: 입력 확정 → 상단 현황 바뀌게 draft에 값 저장 */}
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={confirmCalledInputs}
                className="rounded-full bg-emerald-600 px-3 py-1 text-[12px] font-semibold text-white hover:bg-emerald-700"
              >
                확인
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}