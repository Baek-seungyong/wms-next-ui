// components/TransferFlowModal/Step2ResidualPrep.tsx
"use client";

import { useMemo, useState } from "react";
import type { ResidualDraft } from "./types";

type PalletRow = {
  id: string;
  productName: string;
  lotNo: string;
  location: string;
  boxQty: number;
  totalEa: number;
};

type ToteRow = {
  id: string;
  productName: string;
  lotNo: string;
  location: string;
  totalEa: number;
};

type Props = {
  productCode: string;
  productName: string;
  remainingEaQty: number;

  draft: ResidualDraft;
  onChangeDraft: (next: ResidualDraft) => void;

  // 호출 확정(호출만) -> Step3로
  onConfirmCalling: (nextDraft: ResidualDraft) => void;

  onBack?: () => void;
};

export function Step2ResidualPrep({
  productCode,
  productName,
  remainingEaQty,
  draft,
  onChangeDraft,
  onConfirmCalling,
  onBack,
}: Props) {
  const [open, setOpen] = useState(false);

  // ✅ 더미 데이터 (기존에 너가 만들던 방식 그대로 “표에서 선택” 형태 유지)
  const palletRows: PalletRow[] = useMemo(
    () => [
      {
        id: `${productCode}-PAL-01`,
        productName,
        lotNo: "LOT-2501-A",
        location: "2층창고",
        boxQty: 10,
        totalEa: 1200,
      },
      {
        id: `${productCode}-PAL-02`,
        productName,
        lotNo: "LOT-2501-B",
        location: "3층창고",
        boxQty: 8,
        totalEa: 960,
      },
      {
        id: `${productCode}-PAL-03`,
        productName,
        lotNo: "LOT-2501-C",
        location: "2층창고",
        boxQty: 6,
        totalEa: 720,
      },
    ],
    [productCode, productName],
  );

  const toteRows: ToteRow[] = useMemo(
    () => [
      { id: `${productCode}-TOTE-01`, productName, lotNo: "LOT-2501-A", location: "피킹라인", totalEa: 120 },
      { id: `${productCode}-TOTE-02`, productName, lotNo: "LOT-2501-A", location: "피킹라인", totalEa: 80 },
    ],
    [productCode, productName],
  );

  /** ✅ 파렛트 선택 토글 + meta 저장(BOX/전체/내품) */
  const toggleCalledPallet = (id: string) => {
    const row = palletRows.find((r) => r.id === id);

    const nextIds = draft.calledPalletIds.includes(id)
      ? draft.calledPalletIds.filter((x) => x !== id)
      : [...draft.calledPalletIds, id];

    const nextMeta = { ...(draft.calledPalletMeta || {}) };

    if (nextIds.includes(id)) {
      if (row) {
        nextMeta[id] = {
          boxQty: row.boxQty,
          totalEa: row.totalEa,
          eaPerBox: 120, // ✅ 임시 내품수량
        };
      }
    } else {
      delete nextMeta[id];
    }

    onChangeDraft({ ...draft, calledPalletIds: nextIds, calledPalletMeta: nextMeta });
  };

  /** ✅ 토트 선택 토글 + meta 저장(전체/내품) */
  const toggleCalledTote = (id: string) => {
    const row = toteRows.find((r) => r.id === id);

    const nextIds = draft.calledToteIds.includes(id)
      ? draft.calledToteIds.filter((x) => x !== id)
      : [...draft.calledToteIds, id];

    const nextMeta = { ...(draft.calledToteMeta || {}) };

    if (nextIds.includes(id)) {
      if (row) {
        nextMeta[id] = {
          totalEa: row.totalEa,
          eaPerBox: 120, // ✅ 임시 내품수량
        };
      }
    } else {
      delete nextMeta[id];
    }

    onChangeDraft({ ...draft, calledToteIds: nextIds, calledToteMeta: nextMeta });
  };

  const summaryText = useMemo(() => {
    const p = draft.calledPalletIds;
    const t = draft.calledToteIds;
    return {
      pallet: p.length ? p.join(", ") : "-",
      tote: t.length ? t.join(", ") : "-",
      palletCount: p.length,
      toteCount: t.length,
    };
  }, [draft.calledPalletIds, draft.calledToteIds]);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold">2 STEP · 파렛트/토트 호출</div>
          <div className="mt-1 text-[12px] text-gray-600">
            잔량 <span className="font-semibold text-gray-900">{Number(remainingEaQty).toLocaleString()}</span> EA를
            처리하기 위해 파렛트/토트를 호출해.
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
            호출 상세창 열기
          </button>
        </div>
      </div>

      {/* ✅ 요약 */}
      <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-[12px]">
        <div className="flex items-center justify-between">
          <div className="text-gray-600">호출 파렛트</div>
          <div className="font-medium text-gray-900">
            {summaryText.palletCount}개 · {summaryText.pallet}
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-gray-600">호출 토트</div>
          <div className="font-medium text-gray-900">
            {summaryText.toteCount}개 · {summaryText.tote}
          </div>
        </div>
      </div>

      {/* ✅ Step2 상세 모달 */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="h-[680px] w-[980px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <div className="text-[13px] font-semibold">2 STEP · 호출 상세</div>
                <div className="text-[12px] text-gray-600">
                  상품: <span className="font-medium text-gray-900">{productName}</span>{" "}
                  <span className="text-gray-400">({productCode})</span>
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
              {/* 파렛트 */}
              <div className="rounded-xl border bg-white p-3">
                <div className="text-[12px] font-semibold text-gray-900">파렛트 내역</div>
                <div className="mt-2 overflow-auto rounded-lg border bg-gray-50">
                  <table className="min-w-full border-collapse text-[12px]">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border-b px-3 py-2 text-left">선택</th>
                        <th className="border-b px-3 py-2 text-left">파렛트ID</th>
                        <th className="border-b px-3 py-2 text-left">상품명</th>
                        <th className="border-b px-3 py-2 text-left">LOT</th>
                        <th className="border-b px-3 py-2 text-left">위치</th>
                        <th className="border-b px-3 py-2 text-right">BOX</th>
                        <th className="border-b px-3 py-2 text-right">전체수량(EA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {palletRows.map((r) => {
                        const checked = draft.calledPalletIds.includes(r.id);
                        return (
                          <tr key={r.id} className="bg-white">
                            <td className="border-t px-3 py-2">
                              <input type="checkbox" checked={checked} onChange={() => toggleCalledPallet(r.id)} />
                            </td>
                            <td className="border-t px-3 py-2">{r.id}</td>
                            <td className="border-t px-3 py-2">{r.productName}</td>
                            <td className="border-t px-3 py-2">{r.lotNo}</td>
                            <td className="border-t px-3 py-2">{r.location}</td>
                            <td className="border-t px-3 py-2 text-right">{r.boxQty}</td>
                            <td className="border-t px-3 py-2 text-right">{r.totalEa.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 토트 */}
              <div className="mt-4 rounded-xl border bg-white p-3">
                <div className="text-[12px] font-semibold text-gray-900">토트 내역</div>
                <div className="mt-2 overflow-auto rounded-lg border bg-gray-50">
                  <table className="min-w-full border-collapse text-[12px]">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border-b px-3 py-2 text-left">선택</th>
                        <th className="border-b px-3 py-2 text-left">토트ID</th>
                        <th className="border-b px-3 py-2 text-left">상품명</th>
                        <th className="border-b px-3 py-2 text-left">LOT</th>
                        <th className="border-b px-3 py-2 text-left">위치</th>
                        <th className="border-b px-3 py-2 text-right">전체수량(EA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {toteRows.map((r) => {
                        const checked = draft.calledToteIds.includes(r.id);
                        return (
                          <tr key={r.id} className="bg-white">
                            <td className="border-t px-3 py-2">
                              <input type="checkbox" checked={checked} onChange={() => toggleCalledTote(r.id)} />
                            </td>
                            <td className="border-t px-3 py-2">{r.id}</td>
                            <td className="border-t px-3 py-2">{r.productName}</td>
                            <td className="border-t px-3 py-2">{r.lotNo}</td>
                            <td className="border-t px-3 py-2">{r.location}</td>
                            <td className="border-t px-3 py-2 text-right">{r.totalEa.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                  className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  onClick={() => {
                    // 호출만 확정 -> Step3로
                    setOpen(false);
                    onConfirmCalling(draft);
                  }}
                >
                  호출 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
