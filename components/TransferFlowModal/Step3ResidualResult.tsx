// components/TransferFlowModal/Step3ResidualResult.tsx
"use client";

import { useMemo, useState } from "react";
import type { ResidualDraft } from "./types";
import type { ResidualTransferPayload } from "../types";

type Props = {
  productCode: string;
  productName: string;
  remainingEaQty: number;

  draft: ResidualDraft;
  onChangeDraft: (next: ResidualDraft) => void;

  // ✅ 1STEP에서 지정한 목적지(표시용/충돌방지용)
  directDestinationSlots?: string[];

  onBack?: () => void;

  onConfirmResidual: (payload: ResidualTransferPayload, nextDraft: ResidualDraft) => void;
};

const ROWS = 4;
const COLS = 4;
const ZONES = ["A", "B", "C", "D"] as const;

// ✅ 예시 점유(노랑) - 나중에 실제 점유데이터로 교체
const OCCUPIED_SET = new Set<string>(["A-1-1", "A-1-2", "B-2-1", "B-2-2"]);

function SlotMapModal({
  open,
  title,
  selected,
  occupiedSet,
  blockedSlots,
  onClose,
  onSelect,
}: {
  open: boolean;
  title: string;
  selected: string | null;
  occupiedSet: Set<string>;
  blockedSlots: Set<string>; // ✅ 1STEP 사용중 슬롯
  onClose: () => void;
  onSelect: (slotId: string) => void;
}) {
  if (!open) return null;

  const blockedList = Array.from(blockedSlots);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-[980px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-[13px] font-semibold">{title}</div>
          <button
            type="button"
            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-6">
            {ZONES.map((zone) => (
              <div key={zone} className="rounded-2xl border bg-white p-4">
                <div className="mb-3 text-sm font-semibold text-gray-800">{zone} zone</div>

                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: ROWS * COLS }).map((_, idx) => {
                    const r = Math.floor(idx / COLS) + 1;
                    const c = (idx % COLS) + 1;
                    const slotId = `${zone}-${r}-${c}`;

                    const isOccupied = occupiedSet.has(slotId);
                    const isBlocked = blockedSlots.has(slotId); // ✅ 1STEP 사용중(파랑)
                    const isSelected = selected === slotId;

                    const disabled = isOccupied || isBlocked;

                    const base = "h-12 rounded-lg border text-[12px]";
                    const ui = disabled ? "cursor-not-allowed" : "hover:bg-gray-50";

                    // ✅ 기본 흰색 -> 점유(노랑) -> 1STEP(파랑) 순서로 덮어쓰기
                    let cls = `${base} ${ui} border-gray-200 bg-white`;
                    if (isOccupied) cls = `${base} ${ui} border-amber-300 bg-amber-200`;
                    if (isBlocked) cls = `${base} ${ui} border-blue-300 bg-blue-100`;
                    if (isSelected) cls += " ring-2 ring-blue-300";

                    return (
                      <button
                        key={slotId}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(slotId)}
                        className={cls}
                        title={isOccupied ? "점유됨(예시)" : isBlocked ? "1STEP 지정이송으로 사용중" : slotId}
                      >
                        {/* 버튼 안에 텍스트는 굳이 안 넣어도 됨 */}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 text-[11px] text-gray-600">
                  <span className="inline-block h-3 w-3 rounded-sm border border-amber-300 bg-amber-200 align-[-2px]" />{" "}
                  점유
                  <span className="ml-3 inline-block h-3 w-3 rounded-sm border border-blue-300 bg-blue-100 align-[-2px]" />{" "}
                  1STEP 사용중
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 rounded-xl border bg-gray-50 p-3 text-[12px]">
            <div>
              현재 선택: <span className="font-semibold text-gray-900">{selected ?? "-"}</span>
            </div>
            <div className="text-gray-700">
              1STEP 사용중:{" "}
              <span className="font-medium text-gray-900">{blockedList.length ? blockedList.join(", ") : "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Step3ResidualResult({
  productCode,
  productName,
  remainingEaQty,
  draft,
  onChangeDraft,
  directDestinationSlots,
  onBack,
  onConfirmResidual,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const totalPickEa = useMemo(() => {
    const p = Object.values(draft.palletBoxPickMap || {}).reduce((a, b) => a + Number(b || 0), 0);
    const t = Object.values(draft.toteEaPickMap || {}).reduce((a, b) => a + Number(b || 0), 0);
    return p + t;
  }, [draft.palletBoxPickMap, draft.toteEaPickMap]);

  const over = totalPickEa > Number(remainingEaQty);

  // ✅ 확정 가드레일(운영용)
  const emptyOk = (draft.emptyPalletId || "").trim().length > 0;
  const destOk = !!draft.destSlot;
  const pickOk = Number(totalPickEa) > 0;

  const linesOk = (() => {
    const p = (draft.calledPalletIds || [])
      .map((id) => Number(draft.palletBoxPickMap?.[id] ?? 0))
      .reduce((a, b) => a + b, 0);
    const t = (draft.calledToteIds || [])
      .map((id) => Number(draft.toteEaPickMap?.[id] ?? 0))
      .reduce((a, b) => a + b, 0);
    return p + t > 0;
  })();

  const canConfirm = !over && destOk && emptyOk && pickOk && linesOk;

  const blockedSlots = useMemo(() => {
    // ✅ 1STEP 지정이송 위치는 3STEP 목적지 선택에서 선택 못 하게 막고 + 파랗게 표시
    return new Set<string>((directDestinationSlots ?? []).filter(Boolean));
  }, [directDestinationSlots]);

  const step1DestText = useMemo(() => {
    const arr = (directDestinationSlots ?? []).filter(Boolean);
    return arr.length ? arr.join(", ") : "-";
  }, [directDestinationSlots]);

  // ✅ 3STEP 선택 목적지
  const step3DestText = draft.destSlot ?? "-";

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold">3 STEP · 잔량 출고 수량 입력 / 위치 지정 / 이송</div>
          <div className="mt-1 text-[12px] text-gray-600">
            잔량 <span className="font-semibold text-gray-900">{Number(remainingEaQty).toLocaleString()}</span> EA · 현재 입력{" "}
            <span className={`font-semibold ${over ? "text-red-600" : "text-gray-900"}`}>
              {Number(totalPickEa).toLocaleString()}
            </span>{" "}
            EA
            {over && <span className="ml-2 text-[11px] text-red-600">잔량보다 많이 입력됨</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
              onClick={onBack}
            >
              이전
            </button>
          )}

          <button
            type="button"
            className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
            onClick={() => setOpen(true)}
          >
            3STEP 상세창 열기
          </button>
        </div>
      </div>

      {/* ✅ 상세 모달 */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="h-[680px] w-[980px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <div className="text-[13px] font-semibold">3 STEP · 잔량 이송 상세</div>
                <div className="text-[12px] text-gray-600">
                  상품: <span className="font-medium text-gray-900">{productName}</span>{" "}
                  <span className="text-gray-400">({productCode})</span> · 잔량{" "}
                  <span className="font-semibold text-gray-900">{Number(remainingEaQty).toLocaleString()}</span> EA · 현재 입력{" "}
                  <span className={`font-semibold ${over ? "text-red-600" : "text-gray-900"}`}>
                    {Number(totalPickEa).toLocaleString()}
                  </span>{" "}
                  EA
                </div>
              </div>

              <button
                type="button"
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="h-[calc(680px-56px)] overflow-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* 좌측: 파렛트/토트 입력 */}
                <div className="space-y-4">
                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-[12px] font-semibold text-gray-900">호출된 파렛트</div>

                    {draft.calledPalletIds.length === 0 ? (
                      <div className="mt-2 text-[12px] text-gray-500">호출된 파렛트가 없어.</div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {draft.calledPalletIds.map((id) => {
                          const meta = draft.calledPalletMeta?.[id];
                          const eaPerBox = meta?.eaPerBox ?? 120;
                          const boxQty = meta?.boxQty ?? 0;
                          const totalEa = meta?.totalEa ?? 0;

                          return (
                            <div key={id} className="rounded-lg border bg-gray-50 px-3 py-2">
                              <div className="flex items-center justify-between">
                                <div className="text-[12px] font-medium text-gray-900">{id}</div>
                                <div className="flex items-center gap-2">
                                  <div className="text-[11px] text-gray-500">EA</div>
                                  <input
                                    className="w-24 rounded border bg-white px-2 py-1 text-right text-[12px]"
                                    inputMode="numeric"
                                    value={String(draft.palletBoxPickMap?.[id] ?? 0)}
                                    onChange={(e) =>
                                      onChangeDraft({
                                        ...draft,
                                        palletBoxPickMap: {
                                          ...(draft.palletBoxPickMap || {}),
                                          [id]: Math.max(0, Number(e.target.value || 0)),
                                        },
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              {/* ✅ 메타 표시 */}
                              <div className="mt-1 text-[11px] text-gray-500">
                                내품 {eaPerBox} / BOX {boxQty} / 전체 {Number(totalEa).toLocaleString()} EA
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-[12px] font-semibold text-gray-900">호출된 토트</div>

                    {draft.calledToteIds.length === 0 ? (
                      <div className="mt-2 text-[12px] text-gray-500">호출된 토트가 없어.</div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {draft.calledToteIds.map((id) => {
                          const meta = draft.calledToteMeta?.[id];
                          const eaPerBox = meta?.eaPerBox ?? 120;
                          const totalEa = meta?.totalEa ?? 0;

                          return (
                            <div key={id} className="rounded-lg border bg-gray-50 px-3 py-2">
                              <div className="flex items-center justify-between">
                                <div className="text-[12px] font-medium text-gray-900">{id}</div>
                                <div className="flex items-center gap-2">
                                  <div className="text-[11px] text-gray-500">EA</div>
                                  <input
                                    className="w-24 rounded border bg-white px-2 py-1 text-right text-[12px]"
                                    inputMode="numeric"
                                    value={String(draft.toteEaPickMap?.[id] ?? 0)}
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
                                </div>
                              </div>

                              {/* ✅ 메타 표시 (토트는 BOX 없음) */}
                              <div className="mt-1 text-[11px] text-gray-500">
                                내품 {eaPerBox} / 전체 {Number(totalEa).toLocaleString()} EA
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 우측: 목적지/빈파렛트 */}
                <div className="space-y-4">
                  <div className="rounded-xl border bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] font-semibold text-gray-900">목적지 선택</div>
                      <button
                        type="button"
                        className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        onClick={() => setMapOpen(true)}
                      >
                        맵에서 선택
                      </button>
                    </div>

                    {/* ✅ 노란 박스: 1STEP 내용 + 3STEP 선택 목적지 표시 */}
                    <div className="mt-2 rounded-lg border bg-amber-50 p-2 text-[12px] text-amber-900">
                      <div className="font-semibold">1STEP 지정이송 위치</div>
                      <div className="mt-1">{step1DestText}</div>

                      <div className="mt-2 border-t border-amber-200 pt-2">
                        <div className="font-semibold">3STEP 선택 목적지</div>
                        <div className="mt-1">
                          <span className="font-semibold text-gray-900">{step3DestText}</span>
                          <span className="ml-2 text-[11px] text-amber-800">
                            (맵에서 선택하면 여기도 같이 표시됨)
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-amber-800">
                        ※ 3STEP 목적지는 1STEP에서 사용중인 슬롯은 선택 못 하게 막아둘게.
                      </div>
                    </div>

                    {/* ✅ (기존 노란 테두리 빠른 버튼 영역은 아예 없음) */}
                  </div>

                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-[12px] font-semibold text-gray-900">빈 파렛트 입력</div>
                    <input
                      className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-[12px]"
                      placeholder="예: EMPTY-PAL-001"
                      value={draft.emptyPalletId}
                      onChange={(e) => onChangeDraft({ ...draft, emptyPalletId: e.target.value })}
                    />
                  </div>

                  <div className="rounded-xl border bg-gray-50 p-3 text-[12px]">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-600">잔량(EA)</div>
                      <div className="font-semibold">{Number(remainingEaQty).toLocaleString()}</div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-gray-600">입력(EA)</div>
                      <div className={`font-semibold ${over ? "text-red-600" : ""}`}>{Number(totalPickEa).toLocaleString()}</div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-gray-600">남는 잔량(EA)</div>
                      <div className="font-semibold">
                        {Math.max(0, Number(remainingEaQty) - Number(totalPickEa)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full border border-gray-300 bg-white px-4 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  취소
                </button>

                <button
                  type="button"
                  className={`rounded-full px-4 py-1 text-xs font-semibold text-white ${
                    canConfirm ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300"
                  }`}
                  disabled={!canConfirm}
                  onClick={() => {
                    if (!canConfirm) return;

                    const packedLines = [
                      ...(draft.calledPalletIds || [])
                        .map((id) => ({
                          sourceType: "PALLET" as const,
                          sourceId: id,
                          eaQty: Number(draft.palletBoxPickMap?.[id] ?? 0),
                        }))
                        .filter((x) => x.eaQty > 0),
                      ...(draft.calledToteIds || [])
                        .map((id) => ({
                          sourceType: "TOTE" as const,
                          sourceId: id,
                          eaQty: Number(draft.toteEaPickMap?.[id] ?? 0),
                        }))
                        .filter((x) => x.eaQty > 0),
                    ];

                    const nextDraft: ResidualDraft = { ...draft, packedLines };

                    const payload: ResidualTransferPayload = {
                      productCode,
                      productName,
                      totalEa: Number(totalPickEa),
                      emptyPalletId: draft.emptyPalletId,
                      destSlot: draft.destSlot,
                      packedLines,
                    } as any;

                    setOpen(false);
                    onConfirmResidual(payload, nextDraft);
                  }}
                >
                  잔량 이송 확정
                </button>
              </div>

              {(!destOk || !emptyOk || !pickOk) && (
                <div className="mt-2 text-right text-[11px] text-red-600">
                  {!pickOk && <div>출고 수량을 1 이상 입력해야 해.</div>}
                  {!destOk && <div>목적지를 선택해야 해.</div>}
                  {!emptyOk && <div>빈 파렛트 ID를 입력해야 해.</div>}
                </div>
              )}
            </div>
          </div>

          {/* ✅ 목적지 맵 모달 (1STEP 사용중 슬롯 파랗게 표시됨) */}
          <SlotMapModal
            open={mapOpen}
            title="목적지 선택 · 맵에서 고르기"
            selected={draft.destSlot ?? null}
            occupiedSet={OCCUPIED_SET}
            blockedSlots={blockedSlots}
            onClose={() => setMapOpen(false)}
            onSelect={(slotId) => {
              onChangeDraft({ ...draft, destSlot: slotId });
              setMapOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
