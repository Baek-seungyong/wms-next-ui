"use client";

import { useMemo, useState } from "react";

type ShortageRow = {
  id: number;
  status: "대기중" | "진행중" | "완료";
  productCode: string;
  productName: string;
  currentQty: number;
  baseQty: number;
  targetQty: number;
};

type PalletRow = {
  id: number;
  location: string;
  palletId: string;
  lotNo: string;
  stockEa: number;
  dispatchStatus: "대기" | "호출중" | "완료";
};

// 🔹 데모용 데이터
const shortageRowsMock: ShortageRow[] = [
  {
    id: 1,
    status: "대기중",
    productCode: "P-1001",
    productName: "PET 500ml 투명",
    currentQty: 1200,
    baseQty: 1500,
    targetQty: 3000,
  },
  {
    id: 2,
    status: "대기중",
    productCode: "P-1002",
    productName: "PET 300ml 밀키",
    currentQty: 500,
    baseQty: 800,
    targetQty: 2000,
  },
];

const palletRowsMock: PalletRow[] = [
  {
    id: 1,
    location: "2F / R3-C5",
    palletId: "PLT-2F-0001",
    lotNo: "LOT-2025-01",
    stockEa: 2400,
    dispatchStatus: "대기",
  },
  {
    id: 2,
    location: "2F / R3-C6",
    palletId: "PLT-2F-0002",
    lotNo: "LOT-2025-02",
    stockEa: 1800,
    dispatchStatus: "대기",
  },
];

export function WarehouseReplenishView() {
  const [shortageRows, setShortageRows] = useState<ShortageRow[]>(shortageRowsMock);

  // 선택된 부족 재고 품목 (왼쪽 리스트)
  const [activeShortageId, setActiveShortageId] = useState<number | null>(
    shortageRowsMock[0]?.id ?? null,
  );

  const activeShortage = useMemo(
    () => shortageRows.find((r) => r.id === activeShortageId) ?? shortageRows[0],
    [shortageRows, activeShortageId],
  );

  // 🔹 현재/기준/목표 수량 입력 값 (상품별로 관리할 수 있게 map 형태로)
  const [planInputs, setPlanInputs] = useState<
    Record<
      number,
      {
        currentQty: number;
        baseQty: number;
        targetQty: number;
      }
    >
  >(() => {
    const obj: Record<number, { currentQty: number; baseQty: number; targetQty: number }> = {};
    shortageRowsMock.forEach((row) => {
      obj[row.id] = {
        currentQty: row.currentQty,
        baseQty: row.baseQty,
        targetQty: row.targetQty,
      };
    });
    return obj;
  });

  const currentPlan = activeShortage
    ? planInputs[activeShortage.id] ??
      {
        currentQty: activeShortage.currentQty,
        baseQty: activeShortage.baseQty,
        targetQty: activeShortage.targetQty,
      }
    : null;

  const handleChangePlanField = (field: "currentQty" | "baseQty" | "targetQty", value: number) => {
    if (!activeShortage) return;
    setPlanInputs((prev) => ({
      ...prev,
      [activeShortage.id]: {
        ...(prev[activeShortage.id] ?? {
          currentQty: activeShortage.currentQty,
          baseQty: activeShortage.baseQty,
          targetQty: activeShortage.targetQty,
        }),
        [field]: value,
      },
    }));
  };

  // 🔹 파렛트 리스트 + 선택 체크박스
  const [palletRows] = useState<PalletRow[]>(palletRowsMock);
  const [selectedPalletIds, setSelectedPalletIds] = useState<number[]>([]);

  const togglePallet = (id: number) => {
    setSelectedPalletIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAllPallets = () => {
    if (selectedPalletIds.length === palletRows.length) {
      setSelectedPalletIds([]);
    } else {
      setSelectedPalletIds(palletRows.map((p) => p.id));
    }
  };

  // 🔹 버튼 동작 (현재는 데모용 로그만)
  const handleCallSelectedPallets = () => {
    if (!activeShortage) return;
    console.log("선택 파렛트 호출", selectedPalletIds, "대상 상품:", activeShortage);
    alert("선택된 파렛트를 호출했다고 가정합니다. (데모용)");
  };

  const handleCompleteReplenish = () => {
    if (!activeShortage) return;

    const plan = currentPlan;
    console.log("보충 완료 처리", {
      product: activeShortage,
      plan,
      selectedPalletIds,
    });

    // 예시: 해당 품목 상태를 완료로 바꾸기
    setShortageRows((prev) =>
      prev.map((row) =>
        row.id === activeShortage.id ? { ...row, status: "완료" } : row,
      ),
    );
    alert("보충 완료 처리했다고 가정합니다. (데모용)");
  };

  const handleCallTote = () => {
    if (!activeShortage) return;
    console.log("Tote box 호출", activeShortage);
    alert("Tote box 호출 (데모용)");
  };

  const handleCallEmptyTote = () => {
    if (!activeShortage) return;
    console.log("빈 Tote box 호출", activeShortage);
    alert("빈 Tote box 호출 (데모용)");
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* ───────────────────── 좌측 : 피킹 창고 부족 재고 / 혼합 관리 ───────────────────── */}
      <section className="flex flex-col rounded-2xl border bg-white p-4 text-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">피킹 창고 부족 재고 / 혼합 관리</h2>
          <div className="text-[11px] text-gray-400">
            품목 수: <span className="font-semibold">{shortageRows.length}개</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded-xl border bg-gray-50">
          <table className="min-w-full border-collapse text-[13px]">
            <thead className="bg-gray-100 text-xs text-gray-600">
              <tr>
                <th className="border-b px-3 py-2 text-left w-20">상태</th>
                <th className="border-b px-3 py-2 text-left w-32">상품코드</th>
                <th className="border-b px-3 py-2 text-left">상품명</th>
                <th className="border-b px-3 py-2 text-right w-28">현재수량</th>
                <th className="border-b px-3 py-2 text-right w-28">기준수량</th>
                <th className="border-b px-3 py-2 text-right w-28">목표수량</th>
                <th className="border-b px-3 py-2 text-right w-28">부족수량</th>
              </tr>
            </thead>
            <tbody>
              {shortageRows.map((row) => {
                const isActive = row.id === activeShortage?.id;
                const shortageEa = Math.max(0, row.targetQty - row.currentQty);
                const statusBadgeClass =
                  row.status === "완료"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : row.status === "진행중"
                    ? "bg-sky-50 text-sky-700 border-sky-100"
                    : "bg-gray-50 text-gray-600 border-gray-200";

                return (
                  <tr
                    key={row.id}
                    className={`cursor-pointer text-[13px] ${
                      isActive ? "bg-blue-50" : "bg-white"
                    } hover:bg-blue-50`}
                    onClick={() => setActiveShortageId(row.id)}
                  >
                    <td className="border-t px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${statusBadgeClass}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="border-t px-3 py-2 font-mono">{row.productCode}</td>
                    <td className="border-t px-3 py-2">{row.productName}</td>
                    <td className="border-t px-3 py-2 text-right">
                      {row.currentQty.toLocaleString()} EA
                    </td>
                    <td className="border-t px-3 py-2 text-right">
                      {row.baseQty.toLocaleString()} EA
                    </td>
                    <td className="border-t px-3 py-2 text-right">
                      {row.targetQty.toLocaleString()} EA
                    </td>
                    <td className="border-t px-3 py-2 text-right text-red-500">
                      {shortageEa.toLocaleString()} EA
                    </td>
                  </tr>
                );
              })}
              {shortageRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="border-t px-3 py-4 text-center text-xs text-gray-400"
                  >
                    부족 재고 품목이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────────────────── 우측 : 보충 계획 + 파렛트 선택 ───────────────────── */}
      <section className="flex flex-col rounded-2xl border bg-white p-4 text-sm">
        {/* 헤더 + 상단 정보 */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">보충 계획</h2>
            {activeShortage && (
              <div className="mt-1 space-y-0.5 text-[12px] text-gray-600">
                <div>
                  <span className="inline-block w-16 text-gray-500">대상 창고</span>
                  <span className="font-semibold text-gray-800">피킹 창고</span>
                </div>
                <div>
                  <span className="inline-block w-16 text-gray-500">상품코드</span>
                  <span className="font-mono font-semibold text-gray-800">
                    {activeShortage.productCode}
                  </span>
                </div>
                <div>
                  <span className="inline-block w-16 text-gray-500">상품명</span>
                  <span className="font-semibold text-gray-800">
                    {activeShortage.productName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 🔹 피킹창고 전용 : Tote box 호출 버튼 2개 */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCallTote}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50"
              >
                Tote box 호출
              </button>
              <button
                type="button"
                onClick={handleCallEmptyTote}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50"
              >
                빈 Tote box 호출
              </button>
            </div>
          </div>
        </div>

        {/* 현재/기준/목표 수량 입력 영역 */}
        <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3">
          <div className="mb-2 text-[12px] font-semibold text-gray-800">
            피킹 창고 수량 설정
          </div>
          {currentPlan && (
            <div className="grid grid-cols-3 gap-4 text-[12px]">
              <div>
                <label className="mb-1 block text-gray-600">현재수량 (EA)</label>
                <input
                  type="number"
                  className="w-full rounded-md border px-2 py-1 text-right"
                  value={currentPlan.currentQty}
                  onChange={(e) => handleChangePlanField("currentQty", Number(e.target.value || 0))}
                />
              </div>
              <div>
                <label className="mb-1 block text-gray-600">기준수량 (EA)</label>
                <input
                  type="number"
                  className="w-full rounded-md border px-2 py-1 text-right"
                  value={currentPlan.baseQty}
                  onChange={(e) => handleChangePlanField("baseQty", Number(e.target.value || 0))}
                />
              </div>
              <div>
                <label className="mb-1 block text-gray-600">목표수량 (EA)</label>
                <input
                  type="number"
                  className="w-full rounded-md border px-2 py-1 text-right"
                  value={currentPlan.targetQty}
                  onChange={(e) =>
                    handleChangePlanField("targetQty", Number(e.target.value || 0))
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* 파렛트 선택 테이블 */}
        <div className="flex-1 overflow-auto rounded-xl border bg-gray-50">
          <table className="min-w-full border-collapse text-[13px]">
            <thead className="bg-gray-100 text-xs text-gray-600">
              <tr>
                <th className="border-b px-3 py-2 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      palletRows.length > 0 &&
                      selectedPalletIds.length === palletRows.length
                    }
                    onChange={handleSelectAllPallets}
                  />
                </th>
                <th className="border-b px-3 py-2 text-left w-40">위치</th>
                <th className="border-b px-3 py-2 text-left w-36">파렛트ID</th>
                <th className="border-b px-3 py-2 text-left w-32">LOT번호</th>
                <th className="border-b px-3 py-2 text-right w-40">현재재고(EA)</th>
                <th className="border-b px-3 py-2 text-center w-24">출고상태</th>
              </tr>
            </thead>
            <tbody>
              {palletRows.map((row) => {
                const checked = selectedPalletIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className="bg-white text-[13px] hover:bg-blue-50"
                  >
                    <td className="border-t px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePallet(row.id)}
                      />
                    </td>
                    <td className="border-t px-3 py-2">{row.location}</td>
                    <td className="border-t px-3 py-2 font-mono">
                      {row.palletId}
                    </td>
                    <td className="border-t px-3 py-2 font-mono">{row.lotNo}</td>
                    <td className="border-t px-3 py-2 text-right">
                      {row.stockEa.toLocaleString()}
                    </td>
                    <td className="border-t px-3 py-2 text-center">
                      <span className="inline-flex rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-700">
                        {row.dispatchStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {palletRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="border-t px-3 py-4 text-center text-xs text-gray-400"
                  >
                    사용할 수 있는 파렛트가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 버튼 : 선택 파렛트 호출 + 보충완료 */}
        <div className="mt-3 flex flex-col items-end gap-2 text-[12px] text-gray-600">
          <div>
            선택된 파렛트:{" "}
            <span className="font-semibold">
              {selectedPalletIds.length}개
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCallSelectedPallets}
              disabled={selectedPalletIds.length === 0}
              className={`rounded-full px-4 py-1 text-xs ${
                selectedPalletIds.length === 0
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              선택 파렛트 호출
            </button>
            <button
              type="button"
              onClick={handleCompleteReplenish}
              className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              보충완료
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
