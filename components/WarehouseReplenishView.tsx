// components/WarehouseReplenishView.tsx
"use client";

import {
  useMemo,
  useState,
  useEffect,
  type ChangeEvent,
} from "react";

type WarehouseId = "피킹 창고" | "2층 잔량 파렛트 창고" | "3층 풀파렛트 창고";

interface ShortageRow {
  id: string;
  warehouse: WarehouseId;
  productCode: string;
  productName: string;
  currentQty: number;
  targetQty: number;
  shortageQty: number;
  suggestedReplenishQty: number;
}

interface UpperPalletRow {
  id: string;
  fromWarehouse: WarehouseId;
  location: string; // 예: 2F / R3-C5
  palletId: string;
  productCode: string;
  productName: string;
  availableQty: number;
  lotNo: string;
}

interface CartRow {
  id: string;
  targetWarehouse: WarehouseId;
  productCode: string;
  productName: string;
  fromWarehouse: WarehouseId;
  location: string;
  palletId: string;
  availableQty: number;
  replenishQty: number;
}

// ---------------------------
// 더미 데이터
// ---------------------------

const MOCK_SHORTAGES: ShortageRow[] = [
  // 피킹 창고 부족 재고
  {
    id: "PK-S1",
    warehouse: "피킹 창고",
    productCode: "P-1001",
    productName: "PET 500ml 투명",
    currentQty: 1200,
    targetQty: 3000,
    shortageQty: 1800,
    suggestedReplenishQty: 1800,
  },
  {
    id: "PK-S2",
    warehouse: "피킹 창고",
    productCode: "P-1002",
    productName: "PET 300ml 밀키",
    currentQty: 500,
    targetQty: 2000,
    shortageQty: 1500,
    suggestedReplenishQty: 1500,
  },
  // 2층 잔량 파렛트 창고 부족 재고 (3층에서 보충 필요)
  {
    id: "2F-S1",
    warehouse: "2층 잔량 파렛트 창고",
    productCode: "P-2001",
    productName: "PET 1L 투명",
    currentQty: 10_000,
    targetQty: 18_000,
    shortageQty: 8000,
    suggestedReplenishQty: 8000,
  },
  {
    id: "2F-S2",
    warehouse: "2층 잔량 파렛트 창고",
    productCode: "P-3001",
    productName: "PET 2L 투명",
    currentQty: 6000,
    targetQty: 10_000,
    shortageQty: 4000,
    suggestedReplenishQty: 4000,
  },
  // 3층 풀파렛트 창고 부족 재고 (실제로는 생산 지시 필요 – 여기선 표기만)
  {
    id: "3F-S1",
    warehouse: "3층 풀파렛트 창고",
    productCode: "P-5001",
    productName: "PET 500ml 신제품 A",
    currentQty: 24_000,
    targetQty: 40_000,
    shortageQty: 16_000,
    suggestedReplenishQty: 16_000,
  },
];

function mockUpperPallets(
  product: ShortageRow | null,
  activeWarehouse: WarehouseId,
): UpperPalletRow[] {
  if (!product) return [];

  // 피킹 창고 → 2층에서 보충
  if (activeWarehouse === "피킹 창고") {
  if (product.productCode === "P-1001") {
    return [
      {
        id: "PLT-PK-1",
        fromWarehouse: "2층 잔량 파렛트 창고",
        location: "2F / R3-C5",
        palletId: "PLT-2F-0001",
        productCode: "P-1001",
        productName: "PET 500ml 투명",
        availableQty: 2400,
        lotNo: "LOT-2025-001",   // 👈 추가
      },
      {
        id: "PLT-PK-2",
        fromWarehouse: "2층 잔량 파렛트 창고",
        location: "2F / R3-C6",
        palletId: "PLT-2F-0002",
        productCode: "P-1001",
        productName: "PET 500ml 투명",
        availableQty: 1800,
        lotNo: "LOT-2025-002",   // 👈 추가
      },
    ];
  }

  return [
    {
      id: "PLT-PK-3",
      fromWarehouse: "2층 잔량 파렛트 창고",
      location: "2F / R1-C2",
      palletId: "PLT-2F-0101",
      productCode: product.productCode,
      productName: product.productName,
      availableQty: 1200,
      lotNo: "LOT-2025-003",     // 👈 추가
    },
    {
      id: "PLT-PK-4",
      fromWarehouse: "2층 잔량 파렛트 창고",
      location: "2F / R1-C3",
      palletId: "PLT-2F-0102",
      productCode: product.productCode,
      productName: product.productName,
      availableQty: 900,
      lotNo: "LOT-2025-004",     // 👈 추가
    },
  ];
}


  // 2층 잔량 파렛트 창고 → 3층에서 보충
  if (activeWarehouse === "2층 잔량 파렛트 창고") {
  return [
    {
      id: "PLT-2F-1",
      fromWarehouse: "3층 풀파렛트 창고",
      location: "3F / X5-Y3",
      palletId: "PLT-3F-1001",
      productCode: product.productCode,
      productName: product.productName,
      availableQty: 10_000,
      lotNo: "LOT-3F-0001",   // 👈
    },
    {
      id: "PLT-2F-2",
      fromWarehouse: "3층 풀파렛트 창고",
      location: "3F / X6-Y3",
      palletId: "PLT-3F-1002",
      productCode: product.productCode,
      productName: product.productName,
      availableQty: 8000,
      lotNo: "LOT-3F-0002",   // 👈
    },
  ];
}


  // 3층 풀파렛트 창고는 실제로 생산 지시가 필요하므로,
  // 상위 창고 재고는 이 화면에서는 사용하지 않음 (빈 배열)
  return [];
}

// ---------------------------
// 메인 컴포넌트
// ---------------------------

export function WarehouseReplenishView() {
  // 어떤 창고의 부족 재고를 볼지
  const [activeWarehouse, setActiveWarehouse] =
    useState<WarehouseId>("피킹 창고");

  const [shortages] = useState<ShortageRow[]>(MOCK_SHORTAGES);

  // 창고별로 필터링된 부족 재고
  const visibleShortages = useMemo(
    () => shortages.filter((s) => s.warehouse === activeWarehouse),
    [shortages, activeWarehouse],
  );

  // 왼쪽 테이블에서 체크된 품목들 (다중 선택)
  const [checkedShortageIds, setCheckedShortageIds] = useState<string[]>([]);

  // ✅ 현재 포커스된 품목 (파란 배경 + 오른쪽 보충 계획)
  const [focusedShortageId, setFocusedShortageId] = useState<string | null>(
    null,
  );

  // 오른쪽 파렛트 리스트에서 체크된 파렛트들
  const [checkedPalletIds, setCheckedPalletIds] = useState<string[]>([]);

  // 보충 계획(보충 내역) 모음
  const [cartRows, setCartRows] = useState<CartRow[]>([]);

  // 창고 탭 바뀔 때 선택/체크 초기화
  useEffect(() => {
    setCheckedShortageIds([]);
    setCheckedPalletIds([]);
  }, [activeWarehouse]);

  // 창고의 visibleShortages가 바뀔 때마다 포커스 기본값을 첫 번째 행으로
  useEffect(() => {
    setFocusedShortageId(visibleShortages[0]?.id ?? null);
  }, [visibleShortages]);

  // 포커스된 품목 객체
  const focusedShortage: ShortageRow | null = useMemo(
    () => visibleShortages.find((s) => s.id === focusedShortageId) ?? null,
    [visibleShortages, focusedShortageId],
  );

  // 상위 창고 라벨
  const upperWarehouseLabel: WarehouseId | "생산" =
    activeWarehouse === "피킹 창고"
      ? "2층 잔량 파렛트 창고"
      : activeWarehouse === "2층 잔량 파렛트 창고"
      ? "3층 풀파렛트 창고"
      : "생산";

  // 상단 오른쪽 파렛트 목록
  const upperPallets = useMemo(
    () => mockUpperPallets(focusedShortage, activeWarehouse),
    [focusedShortage, activeWarehouse],
  );

  // ---------------------------
  // 왼쪽 테이블 체크박스
  // ---------------------------

  const toggleShortageChecked = (rowId: string) => {
    setCheckedShortageIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId],
    );
  };

  const allShortagesChecked =
    visibleShortages.length > 0 &&
    visibleShortages.every((row) => checkedShortageIds.includes(row.id));

  const toggleShortageAll = () => {
    if (allShortagesChecked) {
      setCheckedShortageIds([]);
    } else {
      setCheckedShortageIds(visibleShortages.map((s) => s.id));
    }
  };

  // ---------------------------
  // 파렛트 체크박스
  // ---------------------------

  const togglePalletChecked = (palletId: string) => {
    setCheckedPalletIds((prev) =>
      prev.includes(palletId)
        ? prev.filter((id) => id !== palletId)
        : [...prev, palletId],
    );
  };

  const allPalletsChecked =
    upperPallets.length > 0 &&
    upperPallets.every((p) => checkedPalletIds.includes(p.id));

  const togglePalletAll = () => {
    if (allPalletsChecked) {
      setCheckedPalletIds([]);
    } else {
      setCheckedPalletIds(upperPallets.map((p) => p.id));
    }
  };

  // ---------------------------
  // 보충 내역 로직
  // ---------------------------

  const handleAddSelectedPalletsToCart = () => {
    if (!focusedShortage) {
      alert("먼저 부족 품목을 선택해 주세요.");
      return;
    }

    if (upperWarehouseLabel === "생산") {
      alert("3층 풀파렛트 창고는 생산 지시와 연동되어야 합니다. (추후 구현)");
      return;
    }

    const selectedPallets = upperPallets.filter((p) =>
      checkedPalletIds.includes(p.id),
    );
    if (selectedPallets.length === 0) {
      alert("파렛트를 선택해 주세요.");
      return;
    }

    let remainingShortage = focusedShortage.shortageQty;
    const newRows: CartRow[] = [];

    selectedPallets.forEach((pallet) => {
      const defaultQty = Math.min(remainingShortage, pallet.availableQty);
      remainingShortage = Math.max(0, remainingShortage - defaultQty);

      const cartId = `${focusedShortage.id}-${pallet.id}`;

      if (cartRows.find((row) => row.id === cartId)) return;

      newRows.push({
        id: cartId,
        targetWarehouse: focusedShortage.warehouse,
        productCode: focusedShortage.productCode,
        productName: focusedShortage.productName,
        fromWarehouse: pallet.fromWarehouse,
        location: pallet.location,
        palletId: pallet.palletId,
        availableQty: pallet.availableQty,
        replenishQty: defaultQty || 0,
      });
    });

    if (newRows.length === 0) {
      alert("이미 보충 내역에 담겨 있는 파렛트입니다.");
      return;
    }

    setCartRows((prev) => [...prev, ...newRows]);
  };

  const handleBulkRecommendToCart = () => {
    const selectedShortages = visibleShortages.filter((s) =>
      checkedShortageIds.includes(s.id),
    );

    if (selectedShortages.length === 0) {
      alert("먼저 부족 품목을 선택해 주세요.");
      return;
    }

    const newRows: CartRow[] = [];

    selectedShortages.forEach((s, index) => {
      const cartId = `AUTO-${activeWarehouse}-${s.productCode}-${index}`;
      if (cartRows.find((row) => row.id === cartId)) return;

      const fromWarehouse: WarehouseId =
        activeWarehouse === "피킹 창고"
          ? "2층 잔량 파렛트 창고"
          : "3층 풀파렛트 창고";

      newRows.push({
        id: cartId,
        targetWarehouse: s.warehouse,
        productCode: s.productCode,
        productName: s.productName,
        fromWarehouse,
        location: "추천 계획",
        palletId: `AUTO-PLT-${index + 1}`,
        availableQty: s.suggestedReplenishQty,
        replenishQty: s.suggestedReplenishQty,
      });
    });

    if (newRows.length === 0) {
      alert("선택된 품목이 이미 보충 내역에 있습니다.");
      return;
    }

    setCartRows((prev) => [...prev, ...newRows]);
  };

  const handleCartQtyChange = (
    id: string,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
    setCartRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, replenishQty: value } : row,
      ),
    );
  };

  const handleRemoveCartRow = (id: string) => {
    setCartRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleCartAmrCall = () => {
    if (cartRows.length === 0) {
      alert("보충 내역이 없습니다.");
      return;
    }

    const msgLines = cartRows.map(
      (row) =>
        `· [${row.targetWarehouse}] ${row.productCode} ${row.productName} ${row.replenishQty}EA (${row.fromWarehouse} ${row.location})`,
    );
    alert(
      `다음 보충 내역에 대해 AMR 호출 지시를 전송합니다.\n\n${msgLines.join(
        "\n",
      )}`,
    );
  };

  const handleCartComplete = () => {
    if (cartRows.length === 0) {
      alert("입출고 완료 처리할 보충 내역이 없습니다.");
      return;
    }

    alert(
      `보충 내역 ${cartRows.length}건을 '입출고 완료' 처리했다고 가정합니다.`,
    );
    setCartRows([]);
  };

  const totalCartItems = cartRows.length;

  const warehouseTabs: WarehouseId[] = [
    "피킹 창고",
    "2층 잔량 파렛트 창고",
    "3층 풀파렛트 창고",
  ];

  // ---------------------------
  // 렌더링
  // ---------------------------

  return (
    <div className="flex flex-col gap-4 text-[12px]">
      {/* 창고 탭 (피킹 / 2층 / 3층) */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {warehouseTabs.map((wh) => (
          <button
            key={wh}
            type="button"
            onClick={() => setActiveWarehouse(wh)}
            className={`rounded-full px-3 py-1 border ${
              activeWarehouse === wh
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {wh}
          </button>
        ))}
      </div>

        {/* 상단: 왼쪽 부족 재고 / 오른쪽 보충 계획(+보충 내역 요약) */}
        <div className="flex flex-col lg:flex-row gap-4">
        {/* 왼쪽 : 부족 재고 현황 */}
        <section className="flex-1 min-w-[50%] rounded-2xl border bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {activeWarehouse} 부족 재고 현황
              </div>
              <div className="text-[11px] text-gray-500">
                목표 재고 대비 부족한 품목만 표시합니다. 행을 선택하면 우측에서
                보충 계획을 설정할 수 있습니다.
              </div>
            </div>

            <div className="text-right text-[11px] text-gray-500">
              부족 품목:{" "}
              <span className="font-semibold">{visibleShortages.length}개</span>
              <br />
              선택:{" "}
              <span className="font-semibold">
                {checkedShortageIds.length}개
              </span>
            </div>
          </div>

          {/* 추천량 기반 일괄 계획 (3층 제외) */}
          {activeWarehouse !== "3층 풀파렛트 창고" && (
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={handleBulkRecommendToCart}
                className="rounded-full bg-blue-600 px-3 py-1 text-[11px] text-white hover:bg-blue-700"
              >
                선택 품목 AMR(추천량) 일괄 호출
              </button>
            </div>
          )}

          <div className="overflow-auto rounded-xl border bg-gray-50">
            <table className="min-w-[680px] w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">
                    <input
                      type="checkbox"
                      checked={allShortagesChecked}
                      onChange={toggleShortageAll}
                    />
                  </th>
                  <th className="border px-2 py-1 text-left">상품코드</th>
                  <th className="border px-2 py-1 text-left">상품명</th>
                  <th className="border px-2 py-1 text-right">현재수량</th>
                  <th className="border px-2 py-1 text-right">목표수량</th>
                  <th className="border px-2 py-1 text-right text-red-600">
                    부족수량
                  </th>
                  <th className="border px-2 py-1 text-right text-blue-600">
                    추천보충
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
                      {activeWarehouse}의 부족 재고가 없습니다.
                    </td>
                  </tr>
                ) : (
                  visibleShortages.map((row) => {
                    const isChecked = checkedShortageIds.includes(row.id);
                    const isFocused = focusedShortageId === row.id;

                    return (
                      <tr
                        key={row.id}
                        className={`cursor-pointer ${
                          isFocused ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        // ✅ 행 클릭: 포커스만 변경 (체크박스 토글 없음)
                        onClick={() => setFocusedShortageId(row.id)}
                      >
                        <td
                          className="border px-2 py-1 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleShortageChecked(row.id)}
                          />
                        </td>
                        <td className="border px-2 py-1 font-mono">
                          {row.productCode}
                        </td>
                        <td className="border px-2 py-1">{row.productName}</td>
                        <td className="border px-2 py-1 text-right">
                          {row.currentQty.toLocaleString()}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {row.targetQty.toLocaleString()}
                        </td>
                        <td className="border px-2 py-1 text-right text-red-600">
                          {row.shortageQty.toLocaleString()}
                        </td>
                        <td className="border px-2 py-1 text-right text-blue-600">
                          {row.suggestedReplenishQty.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 오른쪽 : 보충 계획 + 보충 내역(같은 컬럼 안에 세로로) */}
        <section className="flex flex-col flex-1 min-w-[50%] gap-3 rounded-2xl border bg-white p-4">
          {/* 보충 계획 */}
          <div className="flex-1 rounded-xl border bg-gray-50 p-3">
            <div className="mb-2 text-sm font-semibold">보충 계획</div>

            {!focusedShortage ? (
              <div className="flex h-32 items-center justify-center text-[11px] text-gray-400">
                좌측에서 부족 품목을 선택해 주세요.
              </div>
            ) : (
              <>
                {/* 선택된 품목 정보 */}
                <div className="mb-3 rounded-lg border bg-white p-3 text-[11px] text-gray-700">
                  <div className="mb-1 font-semibold text-gray-800">
                    선택된 품목
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="text-gray-500">대상 창고</div>
                    <div className="text-right">
                      {focusedShortage.warehouse}
                    </div>

                    <div className="text-gray-500">상품코드</div>
                    <div className="text-right font-mono">
                      {focusedShortage.productCode}
                    </div>

                    <div className="text-gray-500">상품명</div>
                    <div className="text-right">
                      {focusedShortage.productName}
                    </div>

                    <div className="text-gray-500">현재 / 목표</div>
                    <div className="text-right">
                      {focusedShortage.currentQty.toLocaleString()} /{" "}
                      {focusedShortage.targetQty.toLocaleString()} EA
                    </div>

                    <div className="text-gray-500">부족 수량</div>
                    <div className="text-right text-red-600">
                      {focusedShortage.shortageQty.toLocaleString()} EA
                    </div>

                    <div className="text-gray-500">추천 보충</div>
                    <div className="text-right text-blue-600">
                      {focusedShortage.suggestedReplenishQty.toLocaleString()} EA
                    </div>
                  </div>
                </div>

                {/* 상위 창고 재고 / 생산 안내 */}
                {upperWarehouseLabel === "생산" ? (
                  <div className="rounded-lg border bg-white p-3 text-[11px] text-gray-700">
                    <div className="mb-1 font-semibold text-gray-800">
                      3층 풀파렛트 창고 보충 방식
                    </div>
                    <p className="text-[11px] text-gray-600">
                      3층 풀파렛트 창고의 부족 재고는 상위 창고에서 가져오는
                      것이 아니라{" "}
                      <span className="font-semibold">생산 지시</span>와 직접
                      연결해야 합니다. 추후 생산 계획/실적 화면과 연동하여 이
                      영역에서 생산 지시를 생성할 수 있도록 설계하면 좋습니다.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-white p-3 text-[11px] text-gray-700">
                    <div className="mb-1 font-semibold text-gray-800">
                      {upperWarehouseLabel} 재고 (해당 품목)
                    </div>
                    <div className="mb-2 text-[11px] text-gray-500">
                      파렛트를 선택한 뒤{" "}
                      <span className="font-semibold">[선택 파렛트 담기]</span>
                      를 누르면 아래 보충 내역에 계획이 추가됩니다.
                      (보충수량은 보충 내역에서 입력/수정)
                    </div>

                    <div className="overflow-auto rounded-lg border bg-gray-50">
                      <table className="min-w-[420px] w-full border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border px-2 py-1">
                              <input
                                type="checkbox"
                                checked={allPalletsChecked}
                                onChange={togglePalletAll}
                              />
                            </th>
                            <th className="border px-2 py-1 text-left">위치</th>
                            <th className="border px-2 py-1 text-left">파렛트ID</th>
                            {/* 👇 추가 */}
                            <th className="border px-2 py-1 text-left">LOT 번호</th>
                            <th className="border px-2 py-1 text-right">현재재고(EA)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upperPallets.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="border px-2 py-3 text-center text-gray-400"
                              >
                                {upperWarehouseLabel}에 해당 품목 재고가
                                없습니다.
                              </td>
                            </tr>
                          ) : (
                            upperPallets.map((p) => {
                              const checked = checkedPalletIds.includes(p.id);
                              return (
                                <tr
                                  key={p.id}
                                  className={checked ? "bg-blue-50" : "hover:bg-gray-50"}
                                >
                                  <td className="border px-2 py-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => togglePalletChecked(p.id)}
                                    />
                                  </td>
                                  <td className="border px-2 py-1">{p.location}</td>
                                  <td className="border px-2 py-1 font-mono">{p.palletId}</td>
                                  {/* 👇 LOT 번호 표시 */}
                                  <td className="border px-2 py-1 font-mono">{p.lotNo}</td>
                                  <td className="border px-2 py-1 text-right">
                                    {p.availableQty.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleAddSelectedPalletsToCart}
                        className="rounded-full bg-slate-700 px-3 py-1 text-[11px] text-white hover:bg-slate-800"
                      >
                        선택 파렛트 담기
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 보충 내역 (보충 계획 모음) */}
          <div className="rounded-xl border bg-gray-50 p-3 text-[11px]">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">보충 내역</div>
                <div className="text-[11px] text-gray-500">
                  위에서 추가한 보충 계획이 이곳에 모입니다. 각 행의{" "}
                  <span className="font-semibold">보충수량(EA)</span>
                  을 조정한 뒤, 아래 버튼으로 AMR 호출 또는 입출고 완료
                  처리를 할 수 있습니다.
                </div>
              </div>
              <div className="text-right text-[11px] text-gray-500">
                품목 수: <span className="font-semibold">{totalCartItems}건</span>
              </div>
            </div>

            <div className="overflow-auto rounded-lg border bg-white">
              <table className="min-w-[760px] w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">대상창고</th>
                    <th className="border px-2 py-1 text-left">상품코드</th>
                    <th className="border px-2 py-1 text-left">상품명</th>
                    <th className="border px-2 py-1 text-left">상위창고</th>
                    <th className="border px-2 py-1 text-left">
                      위치 / 파렛트ID
                    </th>
                    <th className="border px-2 py-1 text-right">
                      현재재고(EA)
                    </th>
                    <th className="border px-2 py-1 text-right text-blue-600">
                      보충수량(EA)
                    </th>
                    <th className="border px-2 py-1 text-center">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {cartRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="border px-2 py-4 text-center text-gray-400"
                      >
                        담긴 보충 내역이 없습니다. 상단에서 부족 품목과
                        파렛트를 선택한 후 &quot;선택 파렛트 담기&quot;를
                        눌러 추가하세요.
                      </td>
                    </tr>
                  ) : (
                    cartRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="border px-2 py-1">
                          {row.targetWarehouse}
                        </td>
                        <td className="border px-2 py-1 font-mono">
                          {row.productCode}
                        </td>
                        <td className="border px-2 py-1">{row.productName}</td>
                        <td className="border px-2 py-1">{row.fromWarehouse}</td>
                        <td className="border px-2 py-1">
                          {row.location} /{" "}
                          <span className="font-mono">{row.palletId}</span>
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {row.availableQty.toLocaleString()}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          <input
                            type="text"
                            value={row.replenishQty || ""}
                            onChange={(e) => handleCartQtyChange(row.id, e)}
                            className="h-7 w-24 rounded border px-1 text-right"
                          />
                        </td>
                        <td className="border px-2 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCartRow(row.id)}
                            className="rounded bg-gray-200 px-2 py-0.5 text-[10px] text-gray-700 hover:bg-gray-300"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleCartAmrCall}
                className="rounded-full bg-blue-600 px-4 py-1 text-[11px] text-white hover:bg-blue-700"
              >
                AMR 일괄 호출
              </button>
              <button
                type="button"
                onClick={handleCartComplete}
                className="rounded-full bg-emerald-600 px-4 py-1 text-[11px] text-white hover:bg-emerald-700"
              >
                입출고 일괄 완료
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
