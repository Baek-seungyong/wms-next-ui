// components/WarehouseReplenishView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getReplenishMarks,
  type ReplenishMark,
} from "@/utils/replenishMarkStore";

type WarehouseId = "피킹 창고" | "2층 잔량 파렛트 창고" | "3층 풀파렛트 창고";
type CallStatus = "대기중" | "작업중" | "완료";

interface ShortageRow {
  id: string;
  warehouse: WarehouseId;
  productCode: string;
  productName: string;
  currentQty: number;
  baseQty: number;
  targetQty: number;
  shortageQty: number;
  status: CallStatus; // 호출 상태
}

interface PalletRow {
  id: string;
  location: string;
  palletId: string;
  lotNo: string;
  qty: number;
}

// ────────────────────── 더미 데이터 ──────────────────────
const MOCK_SHORTAGES: ShortageRow[] = [
  {
    id: "S-PK-1",
    warehouse: "피킹 창고",
    productCode: "P-1001",
    productName: "PET 500ml 투명",
    currentQty: 1200,
    baseQty: 1500,
    targetQty: 3000,
    shortageQty: 1800,
    status: "대기중",
  },
  {
    id: "S-PK-2",
    warehouse: "피킹 창고",
    productCode: "P-1002",
    productName: "PET 300ml 밀키",
    currentQty: 500,
    baseQty: 800,
    targetQty: 2000,
    shortageQty: 1500,
    status: "대기중",
  },
];

function mockPallets(
  product: ShortageRow | null,
  warehouse: WarehouseId,
): PalletRow[] {
  if (!product) return [];

  if (warehouse === "피킹 창고") {
    return [
      {
        id: "PLT-1",
        location: "2F / R3-C5",
        palletId: "PLT-2F-0001",
        lotNo: "LOT-2025-01",
        qty: 2400,
      },
      {
        id: "PLT-2",
        location: "2F / R3-C6",
        palletId: "PLT-2F-0002",
        lotNo: "LOT-2025-02",
        qty: 1800,
      },
    ];
  }

  if (warehouse === "2층 잔량 파렛트 창고") {
    return [
      {
        id: "PLT-3",
        location: "3F / X5-Y3",
        palletId: "PLT-3F-1001",
        lotNo: "LOT-3F-0001",
        qty: 10000,
      },
      {
        id: "PLT-4",
        location: "3F / X6-Y3",
        palletId: "PLT-3F-1002",
        lotNo: "LOT-3F-0002",
        qty: 8000,
      },
    ];
  }

  return [];
}

// ────────────────────── 메인 컴포넌트 ──────────────────────
export function WarehouseReplenishView() {
  const [activeWarehouse, setActiveWarehouse] =
    useState<WarehouseId>("피킹 창고");

  const [shortages, setShortages] = useState<ShortageRow[]>(MOCK_SHORTAGES);
  const [markedItems, setMarkedItems] = useState<ReplenishMark[]>([]);

  const [focusedShortageId, setFocusedShortageId] = useState<string | null>(
    MOCK_SHORTAGES[0]?.id ?? null,
  );

  const [selectedPalletIds, setSelectedPalletIds] = useState<string[]>([]);

  // 주문화면 별표(재고부족 마킹) 불러오기
  useEffect(() => {
    try {
      setMarkedItems(getReplenishMarks());
    } catch {
      setMarkedItems([]);
    }
  }, []);

  // 창고별 부족 리스트 + 주문화면 별표 상품 추가
  const visibleShortages = useMemo(() => {
    const base: ShortageRow[] = shortages.filter(
      (s) => s.warehouse === activeWarehouse,
    );

    if (activeWarehouse === "피킹 창고" && markedItems.length > 0) {
      const existed = new Set(base.map((b) => b.productCode));
      markedItems.forEach((m, idx) => {
        const code = (m as any).productCode ?? (m as any).code ?? "";
        if (!code || existed.has(code)) return;
        const name =
          (m as any).productName ?? (m as any).name ?? "(상품명 미지정)";

        base.push({
          id: `MARK-${code}-${idx}`,
          warehouse: "피킹 창고",
          productCode: code,
          productName: name,
          currentQty: 0,
          baseQty: 0,
          targetQty: 0,
          shortageQty: 0,
          status: "대기중",
        });
      });
    }

    return base;
  }, [shortages, activeWarehouse, markedItems]);

  // 포커스된 품목
  const focusedShortage = useMemo(
    () => visibleShortages.find((s) => s.id === focusedShortageId) ?? null,
    [visibleShortages, focusedShortageId],
  );

  // 해당 상품이 올라가 있는 상위창고(또는 생산) 텍스트
  const upperWarehouseLabel: "2층 잔량 파렛트 창고" | "3층 풀파렛트 창고" | "생산" =
    activeWarehouse === "피킹 창고"
      ? "2층 잔량 파렛트 창고"
      : activeWarehouse === "2층 잔량 파렛트 창고"
      ? "3층 풀파렛트 창고"
      : "생산";

  // 우측 파렛트 목록
  const palletRows = useMemo(
    () => mockPallets(focusedShortage, activeWarehouse),
    [focusedShortage, activeWarehouse],
  );

  // 창고 탭 바뀔 때 선택 초기화
  useEffect(() => {
    setFocusedShortageId(
      (prev) =>
        visibleShortages.find((s) => s.id === prev)?.id ?? // 이전 선택 유지 시도
        visibleShortages[0]?.id ??
        null,
    );
    setSelectedPalletIds([]);
  }, [activeWarehouse, visibleShortages]);

  // ────────────────────── 수량 수정 핸들러 (현재/기준/목표) ──────────────────────
  const handleChangePlanField = (
    rowId: string,
    field: "currentQty" | "baseQty" | "targetQty",
    value: number,
  ) => {
    setShortages((prev) =>
      prev.map((s) => {
        if (s.id !== rowId) return s;

        const next: ShortageRow = { ...s };
        if (field === "currentQty") {
          next.currentQty = value;
        } else if (field === "baseQty") {
          next.baseQty = value;
        } else {
          next.targetQty = value;
        }

        // 부족 수량은 목표 - 현재 기준으로 다시 계산
        next.shortageQty = Math.max(0, next.targetQty - next.currentQty);
        return next;
      }),
    );
  };

  // ────────────────────── 기타 핸들러 ──────────────────────
  const handleClickComplete = () => {
    if (!focusedShortage) return;
    setShortages((prev) =>
      prev.map((s) =>
        s.id === focusedShortage.id
          ? {
              ...s,
              status: "완료",
            }
          : s,
      ),
    );
    alert("해당 품목 보충이 완료된 것으로 처리합니다. (더미)");
  };

  const handleTogglePallet = (id: string) => {
    setSelectedPalletIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleTogglePalletAll = () => {
    if (selectedPalletIds.length === palletRows.length) {
      setSelectedPalletIds([]);
    } else {
      setSelectedPalletIds(palletRows.map((p) => p.id));
    }
  };

  const handleCallSelectedPallets = () => {
    if (!focusedShortage) {
      alert("먼저 왼쪽에서 상품을 선택해 주세요.");
      return;
    }
    if (upperWarehouseLabel === "생산") {
      alert("3층 풀파렛트 창고 부족분은 생산 지시와 연동해야 합니다.");
      return;
    }
    if (selectedPalletIds.length === 0) {
      alert("호출할 파렛트를 선택해 주세요.");
      return;
    }

    const selected = palletRows.filter((p) =>
      selectedPalletIds.includes(p.id),
    );
    const msg = selected
      .map(
        (p) =>
          `${p.location} / ${p.palletId} (${p.lotNo})  ->  ${focusedShortage.warehouse}`,
      )
      .join("\n");

    alert(
      `다음 파렛트에 대해 AMR 호출 지시(더미)를 전송합니다.\n\n${msg}`,
    );
  };

  const handleCallTote = () => {
    if (!focusedShortage) return;
    alert(
      `[Tote box 호출] \n\n상품: ${focusedShortage.productCode} / ${focusedShortage.productName}`,
    );
  };

  const handleCallEmptyTote = () => {
    if (!focusedShortage) return;
    alert(
      `[빈 Tote box 호출] \n\n상품: ${focusedShortage.productCode} / ${focusedShortage.productName}`,
    );
  };

  const warehouseTabs: WarehouseId[] = [
    "피킹 창고",
    "2층 잔량 파렛트 창고",
    "3층 풀파렛트 창고",
  ];

  // ────────────────────── 렌더 ──────────────────────
  return (
    <div className="flex h-full w-full flex-col gap-4 text-[12px]">
      {/* 창고 탭 */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {warehouseTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveWarehouse(tab)}
            className={`rounded-full border px-3 py-1 ${
              activeWarehouse === tab
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 좌/우 그리드 레이아웃  */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* ───────── 왼쪽 : 부족 재고 / 혼합 관리 ───────── */}
        <section className="overflow-hidden rounded-2xl border bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {activeWarehouse} 부족 재고 / 혼합 관리
              </div>
            </div>
            <div className="text-right text-[11px] text-gray-500">
              품목 수:{" "}
              <span className="font-semibold">
                {visibleShortages.length}개
              </span>
            </div>
          </div>

          <div className="mt-2 overflow-x-auto rounded-xl border bg-gray-50">
            <table className="min-w-[720px] w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">상태</th>
                  <th className="border px-2 py-1 text-left">상품코드</th>
                  <th className="border px-2 py-1 text-left">상품명</th>
                  <th className="border px-2 py-1 text-right">현재수량</th>
                  <th className="border px-2 py-1 text-right">기준수량</th>
                  <th className="border px-2 py-1 text-right">목표수량</th>
                  <th className="border px-2 py-1 text-right text-red-600">
                    부족수량
                  </th>
                  {/* 👉 행별 호출 버튼 컬럼 제거됨 */}
                </tr>
              </thead>
              <tbody>
                {visibleShortages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="border px-2 py-4 text-center text-gray-400"
                    >
                      부족 재고 또는 재고부족 마킹된 품목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  visibleShortages.map((row) => {
                    const isFocused = row.id === focusedShortageId;

                    const isMarkedOnly =
                      row.currentQty === 0 &&
                      row.baseQty === 0 &&
                      row.targetQty === 0 &&
                      row.shortageQty === 0;

                    const statusColor =
                      row.status === "작업중"
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : row.status === "완료"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : "bg-gray-100 text-gray-600 border-gray-300";

                    return (
                      <tr
                        key={row.id}
                        className={`cursor-pointer ${
                          isFocused ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setFocusedShortageId(row.id)}
                      >
                        <td className="border px-2 py-1">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] ${statusColor}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="border px-2 py-1 font-mono">
                          {row.productCode}
                        </td>
                        <td className="border px-2 py-1">
                          {row.productName}
                          {isMarkedOnly && (
                            <span className="ml-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                              주문화면 별표
                            </span>
                          )}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {isMarkedOnly
                            ? "-"
                            : row.currentQty.toLocaleString()}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {isMarkedOnly
                            ? "-"
                            : row.baseQty.toLocaleString()}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {isMarkedOnly
                            ? "-"
                            : row.targetQty.toLocaleString()}
                        </td>
                        <td className="border px-2 py-1 text-right text-red-600">
                          {isMarkedOnly
                            ? "-"
                            : row.shortageQty.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ───────── 오른쪽 : 보충 계획 + 파렛트 호출 ───────── */}
        <section className="flex flex-col overflow-hidden rounded-2xl border bg-white p-4">
          {/* 상단 : 선택 품목 정보 + Tote 버튼 */}
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">보충 계획</div>
              {!focusedShortage ? (
                <div className="mt-2 text-[12px] text-gray-400">
                  왼쪽에서 상품을 선택하면 보충 계획이 표시됩니다.
                </div>
              ) : (
                <div className="mt-2 text-[12px] text-gray-700">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-gray-500">대상 창고</span>
                    <span className="text-right font-medium">
                      {focusedShortage.warehouse}
                    </span>

                    <span className="text-gray-500">상품코드</span>
                    <span className="text-right font-mono font-semibold">
                      {focusedShortage.productCode}
                    </span>

                    <span className="text-gray-500">상품명</span>
                    <span className="text-right font-semibold">
                      {focusedShortage.productName}
                    </span>

                    <span className="text-gray-500">부족 수량</span>
                    <span className="text-right text-red-600 font-semibold">
                      {focusedShortage.shortageQty.toLocaleString()} EA
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 피킹 창고에서만 Tote 버튼 노출 */}
            {activeWarehouse === "피킹 창고" && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCallTote}
                    disabled={!focusedShortage}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-200"
                  >
                    Tote box 호출
                  </button>
                  <button
                    type="button"
                    onClick={handleCallEmptyTote}
                    disabled={!focusedShortage}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-200"
                  >
                    빈 Tote box 호출
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 현재수량 / 기준수량 / 목표수량 입력 영역 */}
          {focusedShortage && (
            <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3 text-[12px]">
              <div className="mb-2 text-[12px] font-semibold text-gray-800">
                피킹 수량 기준 설정
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-gray-600">
                    현재수량 (EA)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border px-2 py-1 text-right"
                    value={focusedShortage.currentQty}
                    onChange={(e) =>
                      handleChangePlanField(
                        focusedShortage.id,
                        "currentQty",
                        Number(e.target.value || 0),
                      )
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-gray-600">
                    기준수량 (EA)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border px-2 py-1 text-right"
                    value={focusedShortage.baseQty}
                    onChange={(e) =>
                      handleChangePlanField(
                        focusedShortage.id,
                        "baseQty",
                        Number(e.target.value || 0),
                      )
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-gray-600">
                    목표수량 (EA)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border px-2 py-1 text-right"
                    value={focusedShortage.targetQty}
                    onChange={(e) =>
                      handleChangePlanField(
                        focusedShortage.id,
                        "targetQty",
                        Number(e.target.value || 0),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* 하단 : 파렛트 리스트 + 버튼 */}
          <div className="flex-1 rounded-xl border bg-gray-50 p-3 text-[11px]">
            <div className="mb-2 text-gray-700">
              <div className="font-semibold">해당 상품 적재 파렛트</div>
            </div>
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="min-w-[520px] w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={
                          palletRows.length > 0 &&
                          selectedPalletIds.length === palletRows.length
                        }
                        onChange={handleTogglePalletAll}
                      />
                    </th>
                    <th className="border px-2 py-1 text-left">위치</th>
                    <th className="border px-2 py-1 text-left">파렛트ID</th>
                    <th className="border px-2 py-1 text-left">LOT번호</th>
                    <th className="border px-2 py-1 text-right">
                      현재재고(EA)
                    </th>
                    <th className="border px-2 py-1 text-center">호출상태</th>
                  </tr>
                </thead>
                <tbody>
                  {!focusedShortage ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border px-2 py-4 text-center text-gray-400"
                      >
                        왼쪽에서 상품을 선택해 주세요.
                      </td>
                    </tr>
                  ) : palletRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border px-2 py-4 text-center text-gray-400"
                      >
                        {upperWarehouseLabel === "생산"
                          ? "이 품목은 상위 창고가 아니라 생산 지시로 보충해야 합니다."
                          : `${upperWarehouseLabel}에 해당 상품이 적재된 파렛트가 없습니다.`}
                      </td>
                    </tr>
                  ) : (
                    palletRows.map((p) => {
                      const checked = selectedPalletIds.includes(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={checked ? "bg-blue-50" : "hover:bg-gray-50"}
                        >
                          <td className="border px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleTogglePallet(p.id)}
                            />
                          </td>
                          <td className="border px-2 py-1">{p.location}</td>
                          <td className="border px-2 py-1 font-mono">
                            {p.palletId}
                          </td>
                          <td className="border px-2 py-1 font-mono">
                            {p.lotNo}
                          </td>
                          <td className="border px-2 py-1 text-right">
                            {p.qty.toLocaleString()}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                              대기
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 하단 버튼 : 선택 파렛트 호출 + 보충완료 */}
            <div className="mt-3 flex flex-col items-end gap-2 text-[11px] text-gray-600">
              <div>
                선택된 파렛트:{" "}
                <span className="font-semibold">
                  {selectedPalletIds.length}개
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={handleCallSelectedPallets}
                  className="rounded-full bg-blue-600 px-4 py-1 text-[11px] text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  disabled={
                    !focusedShortage ||
                    upperWarehouseLabel === "생산" ||
                    palletRows.length === 0
                  }
                >
                  선택 파렛트 호출
                </button>
                <button
                  type="button"
                  disabled={!focusedShortage}
                  onClick={handleClickComplete}
                  className="rounded-full bg-emerald-600 px-4 py-1 text-[11px] text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  보충완료
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
