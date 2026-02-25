// components/TransferFlowModal/Step4ConsolidationPallet.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ResidualDraft } from "./types";

type Props = {
  planPalletQty: number | null;
  planBoxQty: number | null;
  planEaQty: number | null;

  draft: ResidualDraft;
  onChangeDraft: (next: ResidualDraft) => void;

  /** 1STEP에서 풀파렛트가 배정된 목적지들 (예: ["A-2","A-3"]) */
  baseOutboundSlots: string[];

  /** 입출고장 전체 슬롯(선택 UI) */
  allOutboundSlots: string[];

  /** 점유 슬롯(선택 불가) */
  occupiedOutboundSlots: string[];
};

function parseSlot(slot: string) {
  const m = slot.match(/^([A-Za-z]+)-(\d+)$/);
  if (!m) return null;
  return { zone: m[1].toUpperCase(), idx: Number(m[2]) };
}

function slotKey(zone: string, idx: number) {
  return `${zone}-${idx}`;
}

/**
 * ✅ 자동 배정 규칙
 * - baseOutboundSlots가 있으면: 같은 zone에서 "가장 큰 idx + 1"부터 빈칸 찾기
 * - 없으면: allOutboundSlots에서 첫 빈칸
 */
function pickAutoSlot(args: {
  baseOutboundSlots: string[];
  allOutboundSlots: string[];
  occupiedOutboundSlots: string[];
}) {
  const { baseOutboundSlots, allOutboundSlots, occupiedOutboundSlots } = args;
  const occupied = new Set(occupiedOutboundSlots);

  const baseParsed = baseOutboundSlots
    .map(parseSlot)
    .filter(Boolean) as Array<{ zone: string; idx: number }>;

  if (baseParsed.length) {
    // zone별 max idx
    const zoneMax = new Map<string, number>();
    for (const b of baseParsed) {
      zoneMax.set(b.zone, Math.max(zoneMax.get(b.zone) ?? 0, b.idx));
    }

    // zone별로 max+1부터 가능한 슬롯 탐색
    for (const [zone, maxIdx] of zoneMax.entries()) {
      const sameZone = allOutboundSlots
        .map(parseSlot)
        .filter((p): p is { zone: string; idx: number } => !!p && p.zone === zone)
        .sort((a, b) => a.idx - b.idx);

      for (const s of sameZone) {
        if (s.idx <= maxIdx) continue;
        const k = slotKey(s.zone, s.idx);
        if (!occupied.has(k)) return k;
      }
    }
  }

  // fallback: 첫 빈칸
  for (const s of allOutboundSlots) {
    if (!occupied.has(s)) return s;
  }
  return null;
}

export function Step4ConsolidationPallet({
  planPalletQty,
  planBoxQty,
  planEaQty,
  draft,
  onChangeDraft,
  baseOutboundSlots,
  allOutboundSlots,
  occupiedOutboundSlots,
}: Props) {
  const planText = useMemo(() => {
    const p = planPalletQty == null ? "-" : `${planPalletQty}P`;
    const b = planBoxQty == null ? "-" : `${planBoxQty}BOX`;
    const e = planEaQty == null ? "-" : `${planEaQty}EA`;
    return `${p} · ${b} · ${e}`;
  }, [planPalletQty, planBoxQty, planEaQty]);

  const hasAnyConsolidation = (planBoxQty ?? 0) > 0 || (planEaQty ?? 0) > 0;

  const destSlot = (draft as any).consolidationDestSlot ?? null;
  const destMode: "AUTO" | "MANUAL" = ((draft as any).consolidationDestMode as any) ?? "AUTO";

  const [editOpen, setEditOpen] = useState(false);

  const occupiedSet = useMemo(() => new Set(occupiedOutboundSlots ?? []), [occupiedOutboundSlots]);

  const palletId = (draft as any).consolidationPalletId ?? "";
  const hasPalletId = String(palletId).trim().length > 0;

  // ✅ 합포 대상 있고, 아직 목적지 없으면 자동 배정 (단, QR 입력된 상태일 때만)

  const applyAuto = () => {
    if (!hasPalletId) return;

    const auto = pickAutoSlot({
      baseOutboundSlots: baseOutboundSlots ?? [],
      allOutboundSlots: allOutboundSlots ?? [],
      occupiedOutboundSlots: occupiedOutboundSlots ?? [],
    });

    onChangeDraft({
      ...(draft as any),
      consolidationDestMode: "AUTO",
      consolidationDestSlot: auto,
    });
  };

  const toggleSlot = (slot: string) => {
    if (!hasPalletId) return;
    if (occupiedSet.has(slot)) return;

    // ✅ 같은 슬롯 다시 누르면 해제
    const next = destSlot === slot ? null : slot;

    const applyAuto = () => {
    if (!hasPalletId) return;

    const auto = pickAutoSlot({
      baseOutboundSlots: baseOutboundSlots ?? [],
      allOutboundSlots: allOutboundSlots ?? [],
      occupiedOutboundSlots: occupiedOutboundSlots ?? [],
    });

    if (!auto) {
      alert("자동 배정 가능한 슬롯이 없어.");
      return;
    }

    onChangeDraft({
      ...(draft as any),
      consolidationDestMode: "AUTO",
      consolidationDestSlot: auto,
    });
  };

    onChangeDraft({
      ...(draft as any),
      consolidationDestMode: "MANUAL",
      consolidationDestSlot: next,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold">합포 파렛트 등록(빈 파렛트)</div>
          <div className="mt-1 text-[12px] text-gray-600">계획: {planText}</div>
        </div>

        {/* ✅ 여기(상단 우측) 버튼 제거: 목적지 카드 헤더로 이동 */}
      </div>

      {!hasAnyConsolidation ? (
        <div className="rounded-xl border bg-gray-50 px-3 py-2 text-[12px] text-gray-600">
          박스/낱개 합포 대상이 없어서(0) 이 단계는 스킵해도 돼.
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-3">
          {/* 빈 파렛트 QR */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[12px] text-gray-600">빈 파렛트 QR</div>
            <input
              className="w-64 rounded-md border px-3 py-2 text-[12px]"
              value={palletId}
              onChange={(e) =>
                onChangeDraft({ ...(draft as any), consolidationPalletId: e.target.value })
              }
              placeholder="예: PLT-1234"
            />
          </div>

          <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-[12px] text-gray-700">
            등록된 합포 파렛트: <b>{hasPalletId ? palletId : "-"}</b>
          </div>

          {/* 목적지 요약 */}
          <div className="mt-4 rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[12px] font-semibold">합포 파렛트 목적지(풀파렛트 옆)</div>

              {/* ✅ 버튼을 여기로 이동 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyAuto}
                  disabled={!hasPalletId}
                  className="rounded-lg border bg-white px-3 py-1.5 text-[12px] hover:bg-gray-50 disabled:opacity-40"
                >
                  자동적용
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen((v) => !v)}
                  disabled={!hasPalletId}
                  className="rounded-lg border bg-white px-3 py-1.5 text-[12px] hover:bg-gray-50 disabled:opacity-40"
                >
                  수정(상세)
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[12px] text-gray-700">
                현재: <b>{destSlot ?? "-"}</b>{" "}
                <span className="ml-2 text-gray-500">(모드: {destMode})</span>
              </div>

              {!hasPalletId ? (
                <div className="text-[11px] text-amber-600">
                  빈 파렛트를 입력하세요
                </div>
              ) : null}
            </div>

            {/* 상세 수정 UI */}
            {editOpen && (
              <div className="mt-3">
                <div className="grid grid-cols-6 gap-2">
                  {allOutboundSlots.map((slot) => {
                    const isSelected = destSlot === slot;
                    const isLocked = occupiedSet.has(slot);

                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleSlot(slot)}
                        disabled={!hasPalletId || isLocked}
                        className={[
                          "rounded-lg border px-2 py-2 text-[12px]",
                          !hasPalletId
                            ? "bg-gray-100 text-gray-400"
                            : isLocked
                              ? "bg-gray-100 text-gray-400"
                              : "bg-white hover:bg-gray-50",
                          isSelected ? "border-black bg-black text-white hover:bg-black" : "",
                        ].join(" ")}
                        title={
                          !hasPalletId
                            ? "빈 파렛트 QR 입력 후 선택 가능"
                            : isLocked
                              ? "점유중(선택불가)"
                              : "선택"
                        }
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-[12px] text-gray-700">
                  선택된 목적지: <b>{destSlot ?? "-"}</b>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}