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
  shortageQty: number; // 부족수량
  planQty: number; // 보충수량
  status: CallStatus;
}

interface PalletRow {
  id: string;
  location: string;
  palletId: string;
  lotNo: string;
  qty: number;
}

// ────────────────────── 더미 데이터 ──────────────────────
const INITIAL_SHORTAGES: ShortageRow[] = [
  // 피킹 창고
  {
    id: "S-PK-1",
    warehouse: "피킹 창고",
    productCode: "P-1001",
    productName: "PET 500ml 투명",
    currentQty: 1200,
    baseQty: 1500,
    targetQty: 3000,
    shortageQty: 1800,
    planQty: 1800,
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
    planQty: 1500,
    status: "대기중",
  },
  // 2층
  {
    id: "S-2F-1",
    warehouse: "2층 잔량 파렛트 창고",
    productCode: "P-2001",
    productName: "PET 1L 투명",
    currentQty: 3000,
    baseQty: 4000,
    targetQty: 6000,
    shortageQty: 3000,
    planQty: 3000,
    status: "대기중",
  },
  {
    id: "S-2F-2",
    warehouse: "2층 잔량 파렛트 창고",
    productCode: "C-2001",
    productName: "캡 28파이 화이트",
    currentQty: 8000,
    baseQty: 9000,
    targetQty: 12000,
    shortageQty: 4000,
    planQty: 4000,
    status: "대기중",
  },
  // 3층
  {
    id: "S-3F-1",
    warehouse: "3층 풀파렛트 창고",
    productCode: "P-3001",
    productName: "PET 2L 투명",
    currentQty: 20000,
    baseQty: 22000,
    targetQty: 30000,
    shortageQty: 10000,
    planQty: 10000,
    status: "대기중",
  },
  {
    id: "S-3F-2",
    warehouse: "3층 풀파렛트 창고",
    productCode: "L-5001",
    productName: "라벨 500ml 화이트",
    currentQty: 15000,
    baseQty: 18000,
    targetQty: 25000,
    shortageQty: 10000,
    planQty: 10000,
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

  if (warehouse === "3층 풀파렛트 창고") {
    return [
      {
        id: "PLT-5",
        location: "생산 완료존 P-01",
        palletId: "PLT-PROD-0001",
        lotNo: "LOT-P-0001",
        qty: 22000,
      },
    ];
  }

  return [];
}

const INITIAL_SHORTAGE_MAP: Record<string, ShortageRow> = INITIAL_SHORTAGES.reduce(
  (acc, row) => {
    acc[row.id] = { ...row };
    return acc;
  },
  {} as Record<string, ShortageRow>,
);

// ────────────────────── 메인 ──────────────────────
export function WarehouseReplenishView() {
  const [activeWarehouse, setActiveWarehouse] =
    useState<WarehouseId>("피킹 창고");
  const [shortages, setShortages] = useState<ShortageRow[]>(INITIAL_SHORTAGES);
  const [markedItems, setMarkedItems] = useState<ReplenishMark[]>([]);
  const [focusedShortageId, setFocusedShortageId] = useState<string | null>(
    INITIAL_SHORTAGES[0]?.id ?? null,
  );
  const [selectedPalletIds, setSelectedPalletIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setMarkedItems(getReplenishMarks());
    } catch {
      setMarkedItems([]);
    }
  }, []);

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
          planQty: 0,
          status: "대기중",
        });
      });
    }

    return base;
  }, [shortages, activeWarehouse, markedItems]);

  const focusedShortage = useMemo(
    () => visibleShortages.find((s) => s.id === focusedShortageId) ?? null,
    [visibleShortages, focusedShortageId],
  );

  const hasPlanChanged = useMemo(() => {
    if (!focusedShortage) return false;
    const original = INITIAL_SHORTAGE_MAP[focusedShortage.id];
    if (!original) return false;
    return (
      original.currentQty !== focusedShortage.currentQty ||
      original.baseQty !== focusedShortage.baseQty ||
      original.targetQty !== focusedShortage.targetQty
    );
  }, [focusedShortage]);

  const upperWarehouseLabel: "2층 잔량 파렛트 창고" | "3층 풀파렛트 창고" | "생산" =
    activeWarehouse === "피킹 창고"
      ? "2층 잔량 파렛트 창고"
      : activeWarehouse === "2층 잔량 파렛트 창고"
      ? "3층 풀파렛트 창고"
      : "생산";

  const palletRows = useMemo(
    () => mockPallets(focusedShortage, activeWarehouse),
    [focusedShortage, activeWarehouse],
  );

  useEffect(() => {
    setFocusedShortageId(
      (prev) =>
        visibleShortages.find((s) => s.id === prev)?.id ??
        visibleShortages[0]?.id ??
        null,
    );
    setSelectedPalletIds([]);
  }, [activeWarehouse, visibleShortages]);

  const handleChangePlanField = (
    rowId: string,
    field: "currentQty" | "baseQty" | "targetQty",
    value: number,
  ) => {
    setShortages((prev) =>
      prev.map((s) => {
        if (s.id !== rowId) return s;
        const next: ShortageRow = { ...s };

        if (field === "currentQty") next.currentQty = value;
        else if (field === "baseQty") next.baseQty = value;
        else next.targetQty = value;

        next.shortageQty = Math.max(0, next.targetQty - next.currentQty);

        if (s.planQty === s.shortageQty || s.planQty === 0) {
          next.planQty = next.shortageQty;
        }
        return next;
      }),
    );
  };

  const handleChangePlanQty = (rowId: string, value: number) => {
    setShortages((prev) =>
      prev.map((s) =>
        s.id === rowId ? { ...s, planQty: Math.max(0, value) } : s,
      ),
    );
  };

  const handleClickComplete = () => {
    if (!focusedShortage) return;
    setShortages((prev) =>
      prev.map((s) =>
        s.id === focusedShortage.id ? { ...s, status: "완료" } : s,
      ),
    );
    alert("해당 품목 보충이 완료된 것으로 처리합니다. (데모)");
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
      `[Tote box 호출]\n\n상품: ${focusedShortage.productCode} / ${focusedShortage.productName}`,
    );
  };

  const handleCallEmptyTote = () => {
    if (!focusedShortage) return;
    alert(
      `[빈 Tote box 호출]\n\n상품: ${focusedShortage.productCode} / ${focusedShortage.productName}`,
    );
  };

  const warehouseTabs: WarehouseId[] = [
    "피킹 창고",
    "2층 잔량 파렛트 창고",
    "3층 풀파렛트 창고",
  ];

  // ────────────────────── 렌더 ──────────────────────
  return (
    <div className="flex h-full w-full flex-col gap-4 text-[13px]">
      {/* 창고 탭 */}
      <div className="flex flex-wrap gap-2 text-[12px]">
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

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">

        {/* ───────── 왼쪽 테이블 ───────── */}
        <section className="overflow-hidden rounded-2xl border bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {activeWarehouse} 부족 재고 / 혼합 관리
              </div>
            </div>
            <div className="text-right text-[12px] text-gray-500">
              품목 수:{" "}
              <span className="font-semibold">
                {visibleShortages.length}개
              </span>
            </div>
          </div>

          <div className="mt-2 overflow-x-auto rounded-xl border bg-gray-50">
            <table className="min-w-[720px] w-full border-collapse text-[12px]">
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
                            className={`inline-block rounded-full border px-2 py-0.5 text-[11px] ${statusColor}`}
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
                            <span className="ml-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
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

        {/* ───────── 오른쪽 패널 ───────── */}
        <section className="flex flex-col overflow-hidden rounded-2xl border bg-white p-4">
          {/* 선택된 품목 타이틀 */}
          <div className="mb-3 text-sm font-semibold">
            {focusedShortage
              ? `${focusedShortage.productCode} · ${focusedShortage.productName}`
              : "보충 대상 품목을 왼쪽에서 선택해 주세요."}
          </div>

          {/* ① 보충 계획 확인 */}
          <div className="mb-3 rounded-xl border bg-gray-50 px-4 py-3 text-[12px]">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-gray-800">
                  보충 계획 확인
                </span>
              </div>
            </div>

            {!focusedShortage ? (
              <div className="text-gray-400">
                왼쪽 부족 재고 리스트에서 품목을 선택하면 보충 계획이 표시됩니다.
              </div>
            ) : (
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">대상 창고</span>
                  <span className="font-medium text-gray-800">
                    {focusedShortage.warehouse}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">상위 창고 / 공급처</span>
                  <span className="font-medium text-gray-800">
                    {upperWarehouseLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">상품코드</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {focusedShortage.productCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">상품명</span>
                  <span className="max-w-[220px] text-right font-semibold text-gray-900">
                    {focusedShortage.productName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">부족 수량</span>
                  <span className="font-semibold text-red-600">
                    {focusedShortage.shortageQty.toLocaleString()} EA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ② Tote box 호출 */}
          <div className="mb-3 rounded-xl border bg-gray-50 px-4 py-3 text-[12px]">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-gray-800">
                  Tote box 호출
                </span>
              </div>
            </div>

            {activeWarehouse !== "피킹 창고" ? (
              <div className="text-[11px] text-gray-500">
                Tote box 호출은 피킹 창고 보충 시에만 사용됩니다.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCallTote}
                  disabled={!focusedShortage}
                  className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[12px] hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                >
                  Tote box 호출
                </button>
                <button
                  type="button"
                  onClick={handleCallEmptyTote}
                  disabled={!focusedShortage}
                  className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[12px] hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                >
                  빈 Tote box 호출
                </button>
              </div>
            )}
          </div>

          {/* ③ 상위 창고 파렛트 호출 */}
          <div className="mb-3 rounded-xl border bg-gray-50 p-3 text-[12px]">
            <div className="mb-2 flex items-center justify-between text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold">
                  파렛트 호출
                </span>
              </div>
              <div className="text-[11px] text-gray-500">
                선택된 파렛트:{" "}
                <span className="font-semibold">
                  {selectedPalletIds.length}개
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="min-w-[520px] w-full border-collapse text-[12px]">
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
                          className={
                            checked ? "bg-blue-50" : "hover:bg-gray-50"
                          }
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
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
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

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleCallSelectedPallets}
                className="rounded-full bg-blue-600 px-4 py-1 text-[12px] text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={
                  !focusedShortage ||
                  upperWarehouseLabel === "생산" ||
                  palletRows.length === 0
                }
              >
                선택 파렛트 호출
              </button>
            </div>
          </div>

          {/* ④ 수량 설정 */}
          <div className="rounded-xl border bg-gray-50 px-4 py-3 text-[12px]">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[13px] font-semibold text-gray-800">
                수량 설정
              </span>
            </div>

            {!focusedShortage ? (
              <div className="text-gray-400">
                보충할 품목을 선택하면 현재수량, 기준수량, 목표수량을 설정할 수
                있습니다.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
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
                  <div>
                    <label className="mb-1 block text-gray-700 font-semibold">
                      보충수량 (EA)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border border-emerald-500 bg-white px-2 py-1 text-right text-[13px] font-semibold text-emerald-700"
                      value={focusedShortage.planQty}
                      onChange={(e) =>
                        handleChangePlanQty(
                          focusedShortage.id,
                          Number(e.target.value || 0),
                        )
                      }
                    />
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-amber-700">
                  ※ 현재수량 / 기준수량 / 목표수량을 수정하면 해당 상품의 기본
                  설정 값도 함께 변경되는 것으로 처리됩니다. (데모 화면)
                </div>
                {hasPlanChanged && (
                  <div className="mt-1 text-[11px] text-amber-600">
                    · 기존 등록값과 다른 수량이 입력되어 있습니다.
                  </div>
                )}
              </>
            )}
          </div>

          {/* 하단: 보충완료 */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={!focusedShortage}
              onClick={handleClickComplete}
              className="rounded-full bg-emerald-600 px-5 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              보충완료
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
