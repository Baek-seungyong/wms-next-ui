// components/PalletDirectTransferModal.tsx
"use client";

import { useMemo, useState } from "react";

type ZoneId = "A" | "B" | "C" | "D";

type Props = {
  open: boolean;
  onClose: () => void;
  productCode?: string;
  productName?: string;
  fromLocation?: string;   // 🔥 이 부분 추가
};

/**
 * 🔹 데모용 파렛트 점유 정보
 *  - true = 이미 파렛트 있음(노란색, 선택 불가)
 *  - false = 빈 자리(흰색, 선택 가능)
 *  - 실제로는 1층 입출고장 위치테이블에서 받아오면 됨
 */
const OCCUPIED_SET = new Set<string>([
  "A-1-1",
  "A-1-2",
  "A-1-3",
  "A-2-1",
  "B-1-1",
  "B-2-1",
  "B-2-2",
  "B-3-1",
]);

const ZONES: ZoneId[] = ["A", "B", "C", "D"];
const ROWS = 4; // 세로
const COLS = 4; // 가로

export function PalletDirectTransferModal({
  open,
  onClose,
  productCode,
  productName,
  fromLocation,
}: Props) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // 모든 위치 리스트
  const slotsByZone = useMemo(() => {
    const result: Record<ZoneId, { id: string; occupied: boolean }[]> =
      { A: [], B: [], C: [], D: [] };

    ZONES.forEach((zone) => {
      for (let r = 1; r <= ROWS; r += 1) {
        for (let c = 1; c <= COLS; c += 1) {
          const id = `${zone}-${r}-${c}`; // 예: A-1-1
          const occupied = OCCUPIED_SET.has(id);
          result[zone].push({ id, occupied });
        }
      }
    });

    return result;
  }, []);

  const handleConfirm = () => {
    if (!selectedSlotId) return;
    // 👉 실제 로직: 3층 → 1층 입출고장 selectedSlotId 로 이송지시 API 호출
    // 예: POST /api/pallet-transfer { from: ..., toLocation: selectedSlotId }

    // 지금은 데모이므로 콘솔만 찍었다고 가정
    console.log("선택된 위치로 이송:", selectedSlotId, productCode, productName);

    onClose();
    setSelectedSlotId(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[520px] w-[760px] flex-col rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">
              지정이송 · 1층 입출고장 파렛트 위치 지정
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500">
              AMR이 선택한 출발 위치(피킹 / 2-1 / 3-1 등)에서 해당 상품을 싣고
              1층 입출고장으로 이동합니다.
            </p>
            {productCode && (
              <p className="mt-0.5 text-[11px] text-gray-600">
                대상 상품:{" "}
                <span className="font-semibold">
                  {productCode} / {productName}
                </span>
              </p>
            )}
          </div>

          {fromLocation && (
            <p className="mt-0.5 text-[11px] text-gray-600">
                출발 위치: <span className="font-semibold">{fromLocation}</span>
            </p>
            )}


          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
          >
            닫기
          </button>
        </div>

        {/* 본문 */}
        <div className="flex flex-1 gap-6 px-5 py-4 text-[11px] overflow-hidden">

        {/* 왼쪽: 존들 (스크롤 가능 + 2×2 grid) */}
        <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-6">
            {ZONES.map((zone) => (
                <div key={zone}>
                <div className="mb-1 font-semibold text-gray-700">{zone} zone</div>

                <div className="inline-grid grid-cols-4 gap-1 rounded-xl bg-gray-50 p-2">
                    {slotsByZone[zone].map(({ id, occupied }) => {
                    const isSelected = id === selectedSlotId;
                    const base =
                        "flex h-7 w-7 items-center justify-center rounded text-[10px]";

                    if (occupied) {
                        return (
                        <div
                            key={id}
                            className={`${base} cursor-default bg-amber-300 text-gray-900`}
                            title={`${id} : 이미 파렛트 있음`}
                        />
                        );
                    }

                    return (
                        <button
                        key={id}
                        type="button"
                        className={`${base} border bg-white hover:bg-amber-50 ${
                            isSelected ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => setSelectedSlotId(id)}
                        title={`${id} : 빈 위치`}
                        />
                    );
                    })}
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* 오른쪽: 설명/선택 영역 */}
        <div className="w-52 flex-shrink-0 rounded-xl border bg-gray-50 p-3 text-[11px] text-gray-600">
            <p className="mb-2 font-semibold text-gray-700">사용 방법</p>
            <ul className="list-disc space-y-1 pl-4">
            <li>노란 칸은 이미 파렛트가 적재된 위치입니다.</li>
            <li>흰색 칸 중 하나를 선택하면 이송 위치로 지정됩니다.</li>
            <li>각 Zone 은 1층 입출고장의 구역(도어/라인)에 대응합니다.</li>
            </ul>

            <p className="mt-4 mb-1 font-semibold text-gray-700">현재 선택</p>
            <p className="rounded bg-white px-2 py-1 text-[11px]">
            {selectedSlotId ? selectedSlotId : "선택된 위치 없음"}
            </p>
        </div>

        </div>


        {/* 푸터 버튼 */}
        <div className="flex items-center justify-between border-t px-5 py-3 text-[11px] text-gray-500">
          <span>선택한 위치로 파렛트 이송 지시를 생성합니다.</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="button"
              disabled={!selectedSlotId}
              onClick={handleConfirm}
              className={`rounded-full px-4 py-1 text-xs ${
                selectedSlotId
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              {selectedSlotId
                ? `${selectedSlotId} 위치로 이송`
                : "위치를 먼저 선택하세요"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
