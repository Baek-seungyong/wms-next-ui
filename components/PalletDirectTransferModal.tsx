// components/PalletDirectTransferModal.tsx
"use client";

import { useMemo, useState } from "react";

type ZoneId = "A" | "B" | "C" | "D";

type TransferStatus = "이송중" | "완료";

// 🔹 이 타입을 밖에서도 쓰고 싶으니까 export
export type TransferInfo = {
  status: TransferStatus;
  fromLocation?: string;
  palletIds: string[];
  destinationSlots: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  productCode?: string;
  productName?: string;

  existingTransfer?: TransferInfo | null;
  onConfirmTransfer?: (info: TransferInfo) => void;
};

/**
 * 🔹 데모용 파렛트 데이터
 *   - 실제로는 API에서 2층/3층 파렛트 목록 조회한 결과를 넣으면 됨
 */
type PalletItem = {
  id: string;
  productCode: string;
  productName: string;
  fromLocation: string; // 예: "3층창고", "2층창고"
  lotNo: string; // 제품 LOT 번호
  boxQty: number; // 박스 수량
  eaQty: number; // 전체 수량(EA)
};

const DEMO_PALLETS: PalletItem[] = [
  {
    id: "PAL-001-01",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    fromLocation: "3층창고",
    lotNo: "LOT-2501-A",
    boxQty: 10,
    eaQty: 1200,
  },
  {
    id: "PAL-001-02",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    fromLocation: "3층창고",
    lotNo: "LOT-2501-B",
    boxQty: 8,
    eaQty: 960,
  },
  {
    id: "PAL-001-03",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    fromLocation: "2층창고",
    lotNo: "LOT-2501-A",
    boxQty: 6,
    eaQty: 720,
  },
  {
    id: "PAL-001-04",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    fromLocation: "2층창고",
    lotNo: "LOT-2501-C",
    boxQty: 4,
    eaQty: 480,
  },
  {
    id: "PAL-013-01",
    productCode: "P-013",
    productName: "PET 1L 반투명",
    fromLocation: "3층창고",
    lotNo: "LOT-2502-A",
    boxQty: 5,
    eaQty: 600,
  },
  {
    id: "PAL-013-02",
    productCode: "P-013",
    productName: "PET 1L 반투명",
    fromLocation: "2층창고",
    lotNo: "LOT-2502-B",
    boxQty: 5,
    eaQty: 600,
  },
];

/**
 * 🔹 데모용 파렛트 점유 정보
 *  - true = 이미 파렛트 있음(노란색, 선택 불가)
 *  - false = 빈 자리(흰색, 선택 가능)
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
const ROWS = 4;
const COLS = 4;

export function PalletDirectTransferModal({
  open,
  onClose,
  productCode,
  productName,
  existingTransfer,
  onConfirmTransfer,
}: Props) {
  // ---------- 공통 슬롯 정보 ----------
  const slotsByZone = useMemo(() => {
    const result: Record<ZoneId, { id: string; occupied: boolean }[]> = {
      A: [],
      B: [],
      C: [],
      D: [],
    };

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

  const isStatusMode = !!existingTransfer;

  // 🔹 현황 모드에서, 이송중 파렛트의 상세 정보 (상품명/EA) 찾기
  const statusPalletDetails = useMemo(() => {
    if (!existingTransfer) return [];
    return existingTransfer.palletIds
      .map((id) => DEMO_PALLETS.find((p) => p.id === id) || null)
      .filter((p): p is PalletItem => p !== null);
  }, [existingTransfer]);

  // ---------- 설정 모드용 상태 (새 지정이송 생성) ----------
  const [selectedPalletIds, setSelectedPalletIds] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // 선택한 상품의 파렛트 리스트
  const palletsForProduct = useMemo(() => {
    if (!productCode) return DEMO_PALLETS;
    return DEMO_PALLETS.filter((p) => p.productCode === productCode);
  }, [productCode]);

  const canConfirm =
    !isStatusMode &&
    selectedPalletIds.length > 0 &&
    selectedSlots.length === selectedPalletIds.length;

  const resetState = () => {
    setSelectedPalletIds([]);
    setSelectedSlots([]);
  };

  const handleTogglePallet = (id: string, checked: boolean) => {
    setSelectedPalletIds((prev) => {
      const next = checked ? [...prev, id] : prev.filter((x) => x !== id);

      // 파렛트 개수가 줄어들면 슬롯 개수도 맞춰주기 (뒤에서부터 제거)
      if (selectedSlots.length > next.length) {
        setSelectedSlots((prevSlots) => prevSlots.slice(0, next.length));
      }

      return next;
    });
  };

  const handleToggleSlot = (id: string) => {
    // 이미 선택된 슬롯이면 해제
    if (selectedSlots.includes(id)) {
      setSelectedSlots((prev) => prev.filter((x) => x !== id));
      return;
    }

    // 선택할 수 있는 최대 개수 = 선택된 파렛트 개수
    if (selectedPalletIds.length === 0) {
      alert("먼저 이송할 파렛트를 선택해 주세요.");
      return;
    }

    if (selectedSlots.length >= selectedPalletIds.length) {
      alert(
        `현재 선택된 파렛트는 ${selectedPalletIds.length}개입니다.\n위치도 동일한 개수만 선택할 수 있습니다.`,
      );
      return;
    }

    setSelectedSlots((prev) => [...prev, id]);
  };

  const handleConfirm = () => {
    if (!canConfirm) return;

    const uniqueZones = Array.from(
      new Set(selectedSlots.map((slotId) => slotId.split("-")[0])),
    );
    const mainZone = uniqueZones[0];
    const nameForAlert = productName ?? productCode ?? "해당 상품";

    // 👉 실제로는 여기서 API 호출 (AMR 이송 명령)
    console.log("지정이송 실행");
    console.log("선택 파렛트:", selectedPalletIds);
    console.log("도착 위치:", selectedSlots);

    alert(
      `${nameForAlert}의 ${selectedPalletIds.length}개 파렛트를 ${mainZone}${
        uniqueZones.length > 1
          ? ` 외 ${uniqueZones.length - 1}개 구역으로`
          : " 구역으로"
      } 이동합니다.`,
    );

    const transferInfo: TransferInfo = {
      status: "이송중",
      fromLocation: "2,3층 파렛트존", // 실제 운영에서는 호출한 쪽에서 넘겨주면 됨
      palletIds: selectedPalletIds,
      destinationSlots: selectedSlots,
    };

    onConfirmTransfer?.(transferInfo);
    resetState();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[700px] w-[980px] flex-col rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">
              지정이송 · 1층 입출고장 파렛트 위치 지정
              {isStatusMode && (
                <span className="ml-2 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                  이송 현황
                </span>
              )}
            </h2>
            {productCode && (
              <p className="mt-0.5 text-[11px] text-gray-600">
                대상 상품:{" "}
                <span className="font-semibold">
                  {productCode} / {productName}
                </span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
          >
            닫기
          </button>
        </div>

        {/* 본문 */}
        <div className="flex flex-1 gap-4 overflow-hidden px-5 py-4 text-[11px]">
          {/* 왼쪽: 설정 모드일 때 파렛트 목록 + 존 선택, 현황 모드일 때는 존만 표시 */}
          <div className="flex flex-1 flex-col gap-3 overflow-hidden">
            {!isStatusMode && (
              <div className="flex flex-1 flex-col rounded-xl border bg-gray-50/80 p-3">
                <p className="mb-2 text-xs font-semibold text-gray-800">
                  이송할 파렛트 선택
                </p>
                <div className="flex-1 overflow-auto rounded-lg bg-white">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 border-b bg-gray-50 text-[11px]">
                      <tr>
                        <th className="w-8 p-1 text-center">
                          <input
                            type="checkbox"
                            checked={
                              palletsForProduct.length > 0 &&
                              selectedPalletIds.length ===
                                palletsForProduct.length
                            }
                            onChange={(e) =>
                              setSelectedPalletIds(
                                e.target.checked
                                  ? palletsForProduct.map((p) => p.id)
                                  : [],
                              )
                            }
                          />
                        </th>
                        <th className="w-24 px-2 py-1 text-left">파렛트ID</th>
                        <th className="px-2 py-1 text-left">상품명</th>
                        <th className="w-28 px-2 py-1 text-left">LOT 번호</th>
                        <th className="w-24 px-2 py-1 text-left">출발 위치</th>
                        <th className="w-16 px-2 py-1 text-right">BOX</th>
                        <th className="w-24 px-2 py-1 text-right">
                          전체 수량(EA)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {palletsForProduct.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-3 text-center text-gray-400"
                          >
                            선택된 상품에 대한 파렛트가 없습니다.
                          </td>
                        </tr>
                      )}
                      {palletsForProduct.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b text-[11px] last:border-b-0 hover:bg-gray-50"
                        >
                          <td className="p-1 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={selectedPalletIds.includes(p.id)}
                              onChange={(e) =>
                                handleTogglePallet(p.id, e.target.checked)
                              }
                            />
                          </td>
                          {/* 파렛트ID */}
                          <td className="px-2 py-1 align-middle">{p.id}</td>
                          {/* 상품명 */}
                          <td className="px-2 py-1 align-middle">
                            {p.productName}
                          </td>
                          {/* LOT 번호 */}
                          <td className="px-2 py-1 align-middle">{p.lotNo}</td>
                          {/* 출발 위치 */}
                          <td className="px-2 py-1 align-middle">
                            {p.fromLocation}
                          </td>
                          {/* BOX 수량 */}
                          <td className="px-2 py-1 text-right align-middle">
                            {p.boxQty.toLocaleString()}
                          </td>
                          {/* 전체 수량 EA */}
                          <td className="px-2 py-1 text-right align-middle">
                            {p.eaQty.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  선택된 파렛트:{" "}
                  <span className="font-semibold text-gray-800">
                    {selectedPalletIds.length}
                  </span>{" "}
                  개
                </p>
              </div>
            )}

            {/* 🔽 파렛트 선택 → 도착 위치 선택 방향 화살표 (설정 모드에서만 표시) */}
            {!isStatusMode && (
              <div className="flex items-center justify-center text-gray-300">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="h-px w-10 bg-gray-300" />
                  <span className="text-xl text-gray-500 leading-none">↓</span>
                  <span className="h-px w-10 bg-gray-300" />
                </div>
              </div>
            )}

            {/* 존 / 위치 선택 or 표시 */}
            <div className="flex-1 overflow-y-auto rounded-xl border bg-gray-50/80 p-3">
              <p className="mb-2 text-xs font-semibold text-gray-800">
                {isStatusMode ? "도착 위치 (이송중)" : "도착 위치 선택"}
              </p>
              <div className="grid grid-cols-2 gap-6">
                {ZONES.map((zone) => (
                  <div key={zone}>
                    <div className="mb-1 font-semibold text-gray-700">
                      {zone} zone
                    </div>

                    <div className="inline-grid grid-cols-4 gap-2 rounded-xl bg-gray-50 p-3">
                      {slotsByZone[zone].map(({ id, occupied }) => {
                        const base =
                          "flex h-9 w-9 items-center justify-center rounded-md";

                        // 현황 모드: 기존 이송 목적지 하이라이트
                        if (isStatusMode && existingTransfer) {
                          const isDest =
                            existingTransfer.destinationSlots.includes(id);

                          if (occupied && !isDest) {
                            return (
                              <div
                                key={id}
                                className={`${base} cursor-default border border-amber-300 bg-amber-300`}
                              />
                            );
                          }

                          if (isDest) {
                            return (
                              <div
                                key={id}
                                className={`${base} cursor-default border border-blue-500 bg-blue-500/90`}
                                title={`${id} : 이송 예정 위치`}
                              />
                            );
                          }

                          return (
                            <div
                              key={id}
                              className={`${base} border border-gray-200 bg-white/80`}
                            />
                          );
                        }

                        // 설정 모드
                        const isSelected = selectedSlots.includes(id);

                        if (occupied) {
                          return (
                            <div
                              key={id}
                              className={`${base} cursor-default border border-amber-300 bg-amber-300`}
                              title={`${id} : 이미 파렛트 있음`}
                            />
                          );
                        }

                        return (
                          <button
                            key={id}
                            type="button"
                            className={`${base} border border-gray-300 bg-white hover:bg-amber-50 ${
                              isSelected ? "ring-2 ring-blue-500" : ""
                            }`}
                            onClick={() => handleToggleSlot(id)}
                            title={`${id} : 빈 위치`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 현황/안내 패널 */}
          <div className="w-60 flex-shrink-0 rounded-xl border bg-gray-50 p-3 text-[11px] text-gray-700">
            {isStatusMode && existingTransfer ? (
              <>
                <p className="mb-2 text-xs font-semibold text-gray-800">
                  지정이송 현황
                </p>
                <p className="mb-1">
                  · 현재 상태:{" "}
                  <span className="font-semibold text-blue-700">
                    {existingTransfer.status}
                  </span>
                </p>
                <p className="mb-1">
                  · 출발 위치:{" "}
                  <span className="font-semibold">
                    {existingTransfer.fromLocation ?? "2·3층 창고"}
                  </span>
                </p>

                <p className="mt-2 mb-1 font-semibold">이송중 파렛트</p>
                <ul className="mb-2 max-h-28 list-none space-y-1 overflow-auto pl-0">
                  {statusPalletDetails.map((p) => (
                    <li key={p.id} className="rounded-md bg-white px-2 py-1">
                      <div className="font-medium">{p.id}</div>
                      <div className="ml-1 text-gray-600">
                        {p.productName} / {p.eaQty.toLocaleString()} EA
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="mt-2 mb-1 font-semibold">도착 위치</p>
                <ul className="max-h-20 list-disc space-y-0.5 overflow-auto pl-4">
                  {existingTransfer.destinationSlots.map((slot) => (
                    <li key={slot}>{slot}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="mb-2 text-xs font-semibold text-gray-800">
                  지정이송 안내
                </p>
                <ul className="list-disc space-y-1 pl-4 text-gray-600">
                  <li>왼쪽에서 2·3층에 있는 파렛트를 선택합니다.</li>
                  <li>
                    아래 A/B/C/D zone에서 빈 칸을
                    <br />
                    선택해 1층 입출고 위치를 지정합니다.
                  </li>
                  <li>
                    선택한 파렛트 개수와 위치 개수가
                    <br />
                    동일해야 이송 버튼이 활성화됩니다.
                  </li>
                </ul>
                <p className="mt-3 text-[11px] text-gray-500">
                  선택된 파렛트 {selectedPalletIds.length}개 / 선택된 위치{" "}
                  {selectedSlots.length}개
                </p>
              </>
            )}
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div className="flex items-center justify-between border-t px-5 py-3 text-[11px] text-gray-500">
          <span />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                resetState();
                onClose();
              }}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              {isStatusMode ? "닫기" : "취소"}
            </button>
            {!isStatusMode && (
              <button
                type="button"
                disabled={!canConfirm}
                onClick={handleConfirm}
                className={`rounded-full px-4 py-1 text-xs ${
                  canConfirm
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                이송
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
