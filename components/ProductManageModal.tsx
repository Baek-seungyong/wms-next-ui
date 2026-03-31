"use client";

import Image from "next/image";

export type LocationStatus = "창고" | "입고중" | "작업중" | "출고중";

export type ManageTarget = {
  code: string;
  name: string;
  orderEaQty: number;
  pickingStock: number;
  toteStock: number;
  boxEa: number;
  location: LocationStatus;

  calledToteBoxId?: string | null;
  calledToteBoxStock?: number;

  calledPalletId?: string | null;
  calledPalletStock?: number;
  isPalletCalled?: boolean;
};

type Props = {
  open: boolean;
  target: ManageTarget | null;

  displayToteEa: number;
  displayLocation: LocationStatus;
  isMarked: boolean;

  editToteEa: string;
  onChangeEditToteEa: (v: string) => void;

  onClose: () => void;
  onToggleMark: () => void;
  onApplyToteStock: () => void;

  onReplenish1Box: () => void;
  onCallReplenishPallet: () => void;
  onReturnReplenishPallet: () => void;

  locationBadgeClass: (loc: LocationStatus) => string;
};

export function ProductManageModal({
  open,
  target,
  displayToteEa,
  displayLocation,
  isMarked,
  editToteEa,
  onChangeEditToteEa,
  onClose,
  onToggleMark,
  onApplyToteStock,
  onReplenish1Box,
  onCallReplenishPallet,
  onReturnReplenishPallet,
  locationBadgeClass,
}: Props) {
  if (!open || !target) return null;

  const hasBoxEa = !!target.boxEa && target.boxEa > 0;
  const hasCalledTote = !!target.calledToteBoxId;
  const hasCalledPallet = !!target.calledPalletId && !!target.isPalletCalled;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-[980px] max-w-[95vw] overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div>
            <div className="text-base font-semibold">제품 관리</div>
            <div className="mt-1 text-sm text-gray-700">
              {target.name} <span className="text-gray-400">({target.code})</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
              <span className="rounded-full bg-gray-100 px-2 py-0.5">
                주문: <b className="text-gray-800">{target.orderEaQty.toLocaleString()}</b> EA
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5">
                피킹재고: <b className="text-gray-800">{target.pickingStock.toLocaleString()}</b> EA
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5">
                토트재고: <b className="text-gray-800">{displayToteEa.toLocaleString()}</b> EA
              </span>
              <span className={`rounded-full px-2 py-0.5 ${locationBadgeClass(displayLocation)}`}>
                {displayLocation}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border bg-sky-50 px-3 py-1 text-[11px] text-sky-700">
                호출 토트박스:
                <b className="ml-1 text-sky-900">
                  {target.calledToteBoxId ?? "없음"}
                </b>
              </span>

              <span className="rounded-full border bg-slate-50 px-3 py-1 text-[11px] text-slate-700">
                토트박스 재고:
                <b className="ml-1 text-slate-900">
                  {Number(target.calledToteBoxStock ?? displayToteEa).toLocaleString()} EA
                </b>
              </span>

              <span className="rounded-full border bg-amber-50 px-3 py-1 text-[11px] text-amber-700">
                호출 파렛트:
                <b className="ml-1 text-amber-900">
                  {target.calledPalletId ?? "없음"}
                </b>
              </span>

              <span className="rounded-full border bg-orange-50 px-3 py-1 text-[11px] text-orange-700">
                파렛트 재고:
                <b className="ml-1 text-orange-900">
                  {Number(target.calledPalletStock ?? 0).toLocaleString()} EA
                </b>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px]">
          {/* 좌측 */}
          <div className="space-y-4 p-5">
            {/* 1) 재고부족 마킹 */}
            <section className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">재고부족 마킹</div>

                <button
                  type="button"
                  onClick={onToggleMark}
                  className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-[12px] border transition font-medium ${
                    isMarked
                      ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      : "border-blue-600 bg-blue-600 text-white hover:opacity-90"
                  }`}
                >
                  {isMarked ? "취소" : "재고부족"}
                </button>
              </div>
            </section>

            {/* 2) 1BOX 보충 호출 - 먼저 배치 */}
            <section className="rounded-xl border p-4">
              <div className="text-sm font-semibold">1BOX 보충 호출 (파렛트 → 토트)</div>

              <div className="mt-2 rounded-xl bg-gray-50 p-3 text-[11px] text-gray-600">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <div>
                    호출 토트박스: <b className="text-gray-800">{target.calledToteBoxId ?? "없음"}</b>
                  </div>
                  <div>
                    호출 파렛트: <b className="text-gray-800">{target.calledPalletId ?? "없음"}</b>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-gray-600">
                  1BOX 내품: <b className="text-gray-800">{(target.boxEa ?? 0).toLocaleString()}</b> EA
                  {!hasBoxEa ? (
                    <span className="ml-2 text-red-500">(boxEa 없음 — 데이터에 boxEa/eaPerBox 넣어줘)</span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {!hasCalledPallet ? (
                    <button
                      type="button"
                      className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                      onClick={onCallReplenishPallet}
                      disabled={!hasBoxEa}
                    >
                      파렛트 호출
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={onReturnReplenishPallet}
                    >
                      파렛트 회송
                    </button>
                  )}

                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                    onClick={onReplenish1Box}
                    disabled={!hasBoxEa || !hasCalledPallet || !hasCalledTote}
                  >
                    1BOX 보충
                  </button>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-gray-500">
                보충 후 예상 토트재고:{" "}
                <b className="text-gray-800">
                  {(displayToteEa + (target.boxEa ?? 0)).toLocaleString()}
                </b>{" "}
                EA
              </div>

              {!hasCalledTote && (
                <div className="mt-2 text-[11px] text-red-500">
                  먼저 토트박스가 호출되어 있어야 1BOX 보충을 진행할 수 있어.
                </div>
              )}
            </section>

            {/* 3) 현재 재고 수정 - 아래로 이동 */}
            <section className="rounded-xl border p-4">
              <div className="text-sm font-semibold">현재 재고 수정 (토트)</div>

              <div className="mt-2 rounded-xl bg-gray-50 p-3 text-[11px] text-gray-600">
                <div>
                  수정 대상 토트박스:{" "}
                  <b className="text-gray-800">{target.calledToteBoxId ?? "없음"}</b>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  className="w-44 rounded-md border px-3 py-2 text-sm"
                  value={editToteEa}
                  onChange={(e) => onChangeEditToteEa(e.target.value)}
                  placeholder="현재 토트 재고(EA)"
                  disabled={!hasCalledTote}
                />
                <button
                  type="button"
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                  onClick={onApplyToteStock}
                  disabled={!hasCalledTote}
                >
                  수정 적용
                </button>

                <div className="text-[11px] text-gray-500">
                  현재 표시: <b className="text-gray-800">{displayToteEa.toLocaleString()}</b> EA
                </div>
              </div>

              {!hasCalledTote && (
                <div className="mt-2 text-[11px] text-red-500">
                  아직 호출된 토트박스가 없어. 토트박스를 먼저 호출해줘.
                </div>
              )}
            </section>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={onClose}
              >
                닫기
              </button>
            </div>
          </div>

          {/* 우측 이미지 */}
          <div className="hidden border-l bg-gray-50 p-6 md:flex">
            <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm">
              <div className="relative mt-3 h-[220px] w-full">
                <Image
                  src="/images/warehouse/totebox.png"
                  alt="tote box"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}