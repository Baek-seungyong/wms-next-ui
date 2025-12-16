"use client";

import { useMemo } from "react";
import type { ResidualTransferInfo } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  info: ResidualTransferInfo | null;
};

export function ResidualTransferModal({ open, onClose, info }: Props) {
  if (!open || !info) return null;

  const totalEa = info.transferredEaQty ?? 0;

  const sourceRows = useMemo(() => {
    return (info.sources ?? []).map((s, idx) => ({
      key: `${s.type}-${s.sourceId}-${idx}`,
      ...s,
    }));
  }, [info.sources]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[560px] w-[860px] flex-col rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">
              잔량 이송 현황
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
        <div className="flex flex-1 gap-4 overflow-hidden px-5 py-4 text-[11px]">
          {/* 왼쪽 */}
          <div className="flex flex-1 flex-col gap-3 overflow-hidden">
            <div className="rounded-xl border bg-gray-50/80 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-800">담기(원천) 내역</p>
                <p className="text-[11px] text-gray-500">
                  생성: <span className="font-medium">{info.createdAt}</span>
                </p>
              </div>

              <div className="mt-2 max-h-[320px] overflow-auto rounded-lg bg-white">
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
                      sourceRows.map((r) => (
                        <tr key={r.key} className="border-b last:border-b-0">
                          <td className="px-2 py-1">
                            {r.type === "PALLET" ? "파렛트" : "토트"}
                          </td>
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
          </div>

          {/* 오른쪽 */}
          <div className="w-64 flex-shrink-0 rounded-xl border bg-gray-50 p-3 text-[11px] text-gray-700">
            <p className="mb-2 text-xs font-semibold text-gray-800">이송 요약</p>

            <div className="rounded-lg border bg-white p-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">빈파렛트</span>
                <span className="font-semibold">{info.emptyPalletId}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-gray-500">목적지</span>
                <span className="font-semibold">{info.destinationSlot}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-gray-500">이송수량(EA)</span>
                <span className="font-semibold">{totalEa.toLocaleString()}</span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-gray-500">
              ※ 잔량출고를 시작하면 잔량이 0이 되어도 버튼이 유지됩니다.
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
