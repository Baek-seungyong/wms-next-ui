// components/ProductManageModal.tsx
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
};

type Props = {
  open: boolean;
  target: ManageTarget | null;

  // 현재 화면 표시에 쓰는 값들
  displayToteEa: number;
  displayLocation: LocationStatus;
  isMarked: boolean;

  // 입력 상태
  editToteEa: string;
  onChangeEditToteEa: (v: string) => void;

  // actions
  onClose: () => void;
  onToggleMark: () => void;
  onApplyToteStock: () => void;

  /** ✅ 기존 */
  onReplenish1Box: () => void;

  /** ✅ 추가: 토트 보충용 파렛트 호출 버튼 */
  onCallReplenishPallet: () => void;

  // 배지 class 계산은 OrderDetail에서 쓰던거 그대로 재사용
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
  locationBadgeClass,
}: Props) {
  if (!open || !target) return null;

  const hasBoxEa = !!target.boxEa && target.boxEa > 0;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-[920px] max-w-[95vw] overflow-hidden rounded-2xl bg-white shadow-xl"
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
          </div>

          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {/* 본문: 좌(컨트롤) + 우(이미지) */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px]">
          {/* 좌측 컨텐츠 */}
          <div className="space-y-4 p-5">
            {/* 1) 재고부족 마킹 */}
            <section className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">재고부족 마킹</div>
                </div>

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

            {/* 2) 현재 재고 수정 */}
            <section className="rounded-xl border p-4">
              <div className="text-sm font-semibold">현재 재고 수정 (토트)</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  className="w-44 rounded-md border px-3 py-2 text-sm"
                  value={editToteEa}
                  onChange={(e) => onChangeEditToteEa(e.target.value)}
                  placeholder="현재 토트 재고(EA)"
                />
                <button
                  type="button"
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:opacity-90"
                  onClick={onApplyToteStock}
                >
                  수정 적용
                </button>

                <div className="text-[11px] text-gray-500">
                  현재 표시: <b className="text-gray-800">{displayToteEa.toLocaleString()}</b> EA
                </div>
              </div>
            </section>

            {/* 3) 1BOX 보충 호출 */}
            <section className="rounded-xl border p-4">
              <div className="text-sm font-semibold">1BOX 보충 호출 (파렛트 → 토트)</div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-gray-600">
                  1BOX 내품: <b className="text-gray-800">{(target.boxEa ?? 0).toLocaleString()}</b> EA
                  {!hasBoxEa ? (
                    <span className="ml-2 text-red-500">(boxEa 없음 — 데이터에 boxEa/eaPerBox 넣어줘)</span>
                  ) : null}
                </div>

                {/* ✅ 버튼 2개: (왼쪽) 파렛트 호출 / (오른쪽) 1BOX 보충 호출 */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                    onClick={onCallReplenishPallet}
                    disabled={!hasBoxEa}
                  >
                    파렛트 호출
                  </button>

                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                    onClick={onReplenish1Box}
                    disabled={!hasBoxEa}
                  >
                    1BOX 보충
                  </button>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-gray-500">
                보충 후 예상 토트재고:{" "}
                <b className="text-gray-800">{(displayToteEa + (target.boxEa ?? 0)).toLocaleString()}</b> EA
              </div>
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

          {/* 우측 이미지 패널 */}
          <div className="hidden md:flex border-l bg-gray-50 p-6">
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