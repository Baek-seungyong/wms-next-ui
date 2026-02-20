// components/ResidualTransferModal.tsx
"use client";

import { useMemo } from "react";
import type { ResidualTransferInfo, TransferInfo } from "./types";
import type { ResidualDraft } from "./TransferFlowModal/types";

type Props = {
  open: boolean;
  onClose: () => void;

  /** ✅ 3STEP 잔량 이송 결과(기존) */
  info: ResidualTransferInfo | null;

  /** ✅ 1STEP 지정이송 정보(추가) */
  directTransfer?: TransferInfo | null;

  /** ✅ 2STEP 호출/3STEP 입력/4STEP 합포 진행정보(추가) */
  draft?: ResidualDraft | null;
};

export function ResidualTransferModal({ open, onClose, info, directTransfer, draft }: Props) {
  if (!open || !info) return null;

  const totalEa = Number(info.transferredEaQty ?? 0);

  /** ---------------------------
   *  3STEP: 담기(원천) 내역
   * -------------------------- */
  const sourceRows = useMemo(() => {
    return (info.sources ?? []).map((s, idx) => ({
      key: `${(s as any).type ?? (s as any).sourceType}-${(s as any).sourceId}-${idx}`,
      ...s,
    }));
  }, [info.sources]);

  /** ---------------------------
   *  1STEP: 지정이송 내역 (네 Step1 기준: destinationSlots / palletIds 확정)
   * -------------------------- */
  const step1Summary = useMemo(() => {
    const t: any = directTransfer ?? null;
    if (!t) return null;

    const orderEa = Number(t.orderEaQty ?? 0);
    const movedEa = Number(t.transferEaQty ?? 0);
    const remainEa = Number(t.remainingEaQty ?? Math.max(0, orderEa - movedEa));

    const destSlots: string[] = Array.isArray(t.destinationSlots) ? t.destinationSlots : [];
    const palletIds: string[] = Array.isArray(t.palletIds) ? t.palletIds : [];

    return { orderEa, movedEa, remainEa, destSlots, palletIds };
  }, [directTransfer]);

  /** ---------------------------
   *  2STEP: 호출 내역(draft 기반)
   * -------------------------- */
  const step2Rows = useMemo(() => {
    const d = draft ?? null;
    if (!d) return { pallets: [], totes: [] as any[] };

    const pallets = (d.calledResidualPalletIds ?? []).map((id) => {
      const m: any = d.residualPalletMeta?.[id] ?? {};
      const eaPerBox = Number(m.eaPerBox ?? 115);
      const boxQty = Number(m.boxQty ?? 0);
      const totalEa = Number(m.totalEa ?? boxQty * eaPerBox);

      return { key: `PAL-${id}`, id, eaPerBox, boxQty, totalEa };
    });

    const totes = (d.calledToteIds ?? []).map((id) => {
      const m: any = d.toteMeta?.[id] ?? {};
      const totalEa = Number(m.totalEa ?? 0);

      const fallbackEaPerBox = pallets[0]?.eaPerBox != null ? Number(pallets[0].eaPerBox) : 115;

      return { key: `TOTE-${id}`, id, eaPerBox: fallbackEaPerBox, totalEa };
    });

    return { pallets, totes };
  }, [draft]);

  /** ---------------------------
   *  4STEP: 합포 파렛트(빈 파렛트 + 목적지)
   * -------------------------- */
  const step4Summary = useMemo(() => {
    const d = draft ?? null;
    if (!d) return null;

    const emptyPalletId = d.consolidationPalletId?.trim() ? d.consolidationPalletId : null;
    const destSlot = d.consolidationDestSlot?.trim() ? d.consolidationDestSlot : null;
    const mode = d.consolidationDestMode ?? "AUTO";

    // 합포 대상 여부(계획 박스/EA가 0이면 Step4 스킵 가능)
    const hasAnyConsolidation = (Number(d.planBoxQty ?? 0) > 0) || (Number(d.planEaQty ?? 0) > 0);

    return { emptyPalletId, destSlot, mode, hasAnyConsolidation };
  }, [draft]);

  /** ---------------------------
   *  화면 상단/우측 요약용 값
   * -------------------------- */
  const rightSummary = useMemo(() => {
    const step1Dest = step1Summary?.destSlots?.length ? step1Summary.destSlots.join(", ") : "-";
    const step3Dest = info.destinationSlot ?? "-";

    const emptyPallet =
      step4Summary?.emptyPalletId ??
      (info as any).emptyPalletId ??
      "-";

    const step4Dest = step4Summary?.destSlot ?? "-";

    return { step1Dest, step3Dest, emptyPallet, step4Dest };
  }, [step1Summary, info.destinationSlot, info, step4Summary]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[660px] w-[1000px] flex-col rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">
              이송조회 · 전체 내역
              <span className="ml-2 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                {info.status}
              </span>
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-600">
              대상 상품:{" "}
              <span className="font-semibold">
                {info.productCode} / {info.productName ?? "-"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
          >
            닫기
          </button>
        </div>

        {/* 본문 */}
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden px-5 py-4 text-[11px]">
          {/* 좌측: 1~4STEP */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pr-1">
            {/* ✅ 1STEP */}
            <div className="rounded-xl border bg-gray-50/80 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-800">1STEP · 지정이송 내역</p>
                <p className="text-[11px] text-gray-500">
                  생성: <span className="font-medium">{info.createdAt}</span>
                </p>
              </div>

              {!step1Summary ? (
                <div className="mt-2 rounded-lg border bg-white p-3 text-center text-gray-400">
                  1STEP 내역이 없습니다.
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-white p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">주문수량(EA)</span>
                      <span className="font-semibold text-gray-800">
                        {step1Summary.orderEa.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-gray-500">지정이송(EA)</span>
                      <span className="font-semibold text-gray-800">
                        {step1Summary.movedEa.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-gray-500">잔량(EA)</span>
                      <span className="font-semibold text-gray-800">
                        {step1Summary.remainEa.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-white p-2">
                    <div className="text-gray-500">도착 위치(1STEP)</div>
                    <div className="mt-1 font-semibold text-gray-800">
                      {step1Summary.destSlots.length ? step1Summary.destSlots.join(", ") : "-"}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="max-h-[110px] overflow-auto rounded-lg border bg-white">
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0 border-b bg-gray-50">
                          <tr>
                            <th className="px-2 py-1 text-left">파렛트ID</th>
                            <th className="w-24 px-2 py-1 text-right">수량</th>
                          </tr>
                        </thead>
                        <tbody>
                          {step1Summary.palletIds.length === 0 ? (
                            <tr>
                              <td colSpan={2} className="p-2 text-center text-gray-400">
                                파렛트 상세 내역 없음
                              </td>
                            </tr>
                          ) : (
                            step1Summary.palletIds.map((id, idx) => (
                              <tr key={`${id}-${idx}`} className="border-b last:border-b-0">
                                <td className="px-2 py-1">{id}</td>
                                <td className="px-2 py-1 text-right">-</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      ※ Step1은 현재 palletIds만 확정 저장. (EA 상세는 나중에 palletTransfers 붙이면 여기 바로 확장 가능)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ 2STEP */}
            <div className="rounded-xl border bg-gray-50/80 p-3">
              <p className="text-xs font-semibold text-gray-800">2STEP · 호출 내역</p>

              {!draft ? (
                <div className="mt-2 rounded-lg border bg-white p-3 text-center text-gray-400">
                  2STEP 호출 내역이 없습니다.
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-white p-2">
                    <div className="text-[11px] font-semibold text-gray-800">호출 잔량파렛트</div>
                    <div className="mt-2 space-y-2">
                      {step2Rows.pallets.length === 0 ? (
                        <div className="text-center text-gray-400">없음</div>
                      ) : (
                        step2Rows.pallets.map((p) => (
                          <div key={p.key} className="rounded-md border bg-gray-50 px-2 py-1">
                            <div className="font-medium text-gray-800">{p.id}</div>
                            <div className="mt-0.5 text-gray-500">
                              내품 {p.eaPerBox} / BOX {p.boxQty} / 전체 {p.totalEa.toLocaleString()} EA
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-white p-2">
                    <div className="text-[11px] font-semibold text-gray-800">호출 토트</div>
                    <div className="mt-2 space-y-2">
                      {step2Rows.totes.length === 0 ? (
                        <div className="text-center text-gray-400">없음</div>
                      ) : (
                        step2Rows.totes.map((t) => (
                          <div key={t.key} className="rounded-md border bg-gray-50 px-2 py-1">
                            <div className="font-medium text-gray-800">{t.id}</div>
                            <div className="mt-0.5 text-gray-500">
                              (표시용) 내품 {t.eaPerBox} / 전체 {t.totalEa.toLocaleString()} EA
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ 3STEP */}
            <div className="rounded-xl border bg-gray-50/80 p-3">
              <p className="text-xs font-semibold text-gray-800">3STEP · 담기(원천) 내역</p>

              <div className="mt-2 max-h-[190px] overflow-auto rounded-lg bg-white">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 border-b bg-gray-50">
                    <tr>
                      <th className="w-20 px-2 py-1 text-left">구분</th>
                      <th className="px-2 py-1 text-left">ID</th>
                      <th className="w-28 px-2 py-1 text-right">담은 수량(EA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-3 text-center text-gray-400">
                          담기 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      sourceRows.map((r: any) => (
                        <tr key={r.key} className="border-b last:border-b-0">
                          <td className="px-2 py-1">{r.type === "PALLET" ? "파렛트" : "토트"}</td>
                          <td className="px-2 py-1">{r.sourceId}</td>
                          <td className="px-2 py-1 text-right">
                            {Number(r.eaQty ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-lg border bg-white p-2">
                <span className="text-gray-500">총 잔량 이송(EA)</span>
                <span className="font-semibold text-gray-800">{totalEa.toLocaleString()}</span>
              </div>
            </div>

            {/* ✅ 4STEP */}
            <div className="rounded-xl border bg-gray-50/80 p-3">
              <p className="text-xs font-semibold text-gray-800">4STEP · 합포 파렛트(빈 파렛트)</p>

              {!draft ? (
                <div className="mt-2 rounded-lg border bg-white p-3 text-center text-gray-400">
                  4STEP 내역이 없습니다.
                </div>
              ) : !step4Summary?.hasAnyConsolidation ? (
                <div className="mt-2 rounded-lg border bg-white p-3 text-center text-gray-400">
                  합포 대상이 없어서 이 단계는 스킵(0)
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-white p-2">
                    <div className="text-gray-500">빈 파렛트 QR</div>
                    <div className="mt-1 font-semibold text-gray-800">
                      {step4Summary?.emptyPalletId ?? "-"}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-white p-2">
                    <div className="text-gray-500">도착 위치(4STEP)</div>
                    <div className="mt-1 font-semibold text-gray-800">
                      {step4Summary?.destSlot ?? "-"}{" "}
                      <span className="ml-2 text-[11px] text-gray-500">(모드: {step4Summary?.mode})</span>
                    </div>
                  </div>

                  <div className="col-span-2 rounded-lg border bg-white p-2 text-[11px] text-gray-600">
                    ※ 4STEP 목적지는 “풀파렛트 옆(입출고장)” 자동 배정 + “수정(상세)”로 변경 가능하게 만든 흐름 그대로 표시됨.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 요약 */}
          <div className="w-72 flex-shrink-0 rounded-xl border bg-gray-50 p-3 text-[11px] text-gray-700">
            <p className="mb-2 text-xs font-semibold text-gray-800">전체 요약</p>

            <div className="rounded-lg border bg-white p-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">1STEP 도착지</span>
                <span className="font-semibold">{rightSummary.step1Dest}</span>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span className="text-gray-500">3STEP 목적지</span>
                <span className="font-semibold">{rightSummary.step3Dest}</span>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span className="text-gray-500">빈파렛트</span>
                <span className="font-semibold">{rightSummary.emptyPallet}</span>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span className="text-gray-500">4STEP 도착지</span>
                <span className="font-semibold">{rightSummary.step4Dest}</span>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span className="text-gray-500">이송수량(EA)</span>
                <span className="font-semibold">{totalEa.toLocaleString()}</span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-gray-500">
              ※ 이제 이 화면에서 1~4STEP 전체 내역을 확인할 수 있어.
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end border-t px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
