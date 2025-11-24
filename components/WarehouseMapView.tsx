// components/WarehouseMapView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ZoneId = "3F" | "2F" | "PICKING";
type RackType = "single" | "double"; // 단층 / 복층

interface RackCell {
  id: string;
  zone: ZoneId;
  line: number; // 세로 줄(0부터 시작)
  col: number; // 가로 칸(0부터 시작)
  type: RackType;
  levels: number; // 표시되는 층 수 (3F/2F: 2, PICKING: 6)
  occupiedLevels: number[]; // 재고가 있는 층 번호(1부터 시작)
}

// 선택된 위치의 재고/LOT 정보
interface CellInventoryRow {
  level: number;
  productCode: string;
  productName: string;
  lot: string;
  qty: number;
}

// 검색용 더미 상품 리스트
interface ProductInfo {
  code: string;
  name: string;
}

const MOCK_PRODUCTS: ProductInfo[] = [
  { code: "P-1001", name: "PET 500ml 투명" },
  { code: "P-1002", name: "PET 300ml 밀키" },
  { code: "P-2001", name: "PET 1L 투명" },
];

// 기본 랙 격자 크기
const RACK_LINES = 8;
const RACK_COLS = 10;

// ------------------------------------------------------------------
// 더미 데이터 생성
// ------------------------------------------------------------------
function createRandomRackMap(): Record<ZoneId, RackCell[]> {
  const result: Record<ZoneId, RackCell[]> = {
    "3F": [],
    "2F": [],
    PICKING: [],
  };

  (["3F", "2F", "PICKING"] as ZoneId[]).forEach((zone) => {
    const cells: RackCell[] = [];

    for (let line = 0; line < RACK_LINES; line += 1) {
      for (let col = 0; col < RACK_COLS; col += 1) {
        const type: RackType =
          zone === "PICKING" || (col !== 0 && col !== RACK_COLS - 1)
            ? "double"
            : "single";

        const levels = zone === "PICKING" ? 6 : 2;

        const occupiedLevels: number[] = [];

        if (zone === "PICKING") {
          // 피킹창고(6층) : 랜덤으로 몇 층만 채움
          for (let lv = 1; lv <= 6; lv += 1) {
            if (Math.random() < 0.5) occupiedLevels.push(lv);
          }
        } else {
          // 2층 / 3층 파렛트창고
          if (type === "single") {
            // 단층 렉: 1층만 사용
            if (Math.random() < 0.7) occupiedLevels.push(1);
          } else {
            // 복층 렉: 0~2층 랜덤
            const r = Math.random();
            if (r < 0.3) {
              // 빈 렉
            } else if (r < 0.6) {
              occupiedLevels.push(1);
            } else if (r < 0.9) {
              occupiedLevels.push(2);
            } else {
              occupiedLevels.push(1, 2);
            }
          }
        }

        cells.push({
          id: `${zone}-l${line}-c${col}`,
          zone,
          line,
          col,
          type,
          levels,
          occupiedLevels,
        });
      }
    }

    result[zone] = cells;
  });

  return result;
}

// 특정 상품이 어떤 셀에 있다고 가정할지(데모용 규칙)
function cellHasProduct(productCode: string, cell: RackCell): boolean {
  const key = cell.line + cell.col;

  if (productCode === "P-1001") {
    return key % 3 === 0;
  }
  if (productCode === "P-1002") {
    return key % 3 === 1;
  }
  if (productCode === "P-2001") {
    return key % 4 === 0;
  }
  return false;
}

// 선택된 셀에 대한 가짜 재고 데이터 생성
function buildFakeInventory(
  cell: RackCell,
  product: ProductInfo | null,
): CellInventoryRow[] {
  const p = product ?? MOCK_PRODUCTS[0];
  const maxLevels =
    cell.zone === "PICKING" ? 6 : cell.type === "single" ? 1 : 2;

  const rows: CellInventoryRow[] = [];

  for (let lv = 1; lv <= maxLevels; lv += 1) {
    rows.push({
      level: lv,
      productCode: p.code,
      productName: p.name,
      lot: `LOT-${cell.zone}-${(cell.line + 1)
        .toString()
        .padStart(2, "0")}-${(cell.col + 1)
        .toString()
        .padStart(2, "0")}-${lv}`,
      qty: 1200 - (lv - 1) * 100,
    });
  }

  return rows;
}

function zoneLabel(zone: ZoneId): string {
  if (zone === "3F") return "3층 풀파렛트 창고";
  if (zone === "2F") return "2층 잔량 파렛트 창고";
  return "2층 피킹창고";
}

function formatCellLocation(cell: RackCell): string {
  return `${cell.zone} / R${cell.line + 1} - C${cell.col + 1}`;
}

// ------------------------------------------------------------------
// 메인 컴포넌트
// ------------------------------------------------------------------
export function WarehouseMapView() {
  const [activeZone, setActiveZone] = useState<ZoneId>("3F");
  const [rackMap, setRackMap] = useState<Record<ZoneId, RackCell[]>>({
    "3F": [],
    "2F": [],
    PICKING: [],
  });

  // 검색 관련 상태
  const [searchText, setSearchText] = useState("");
  const [activeProduct, setActiveProduct] = useState<ProductInfo | null>(null);
  const [highlightedCellIds, setHighlightedCellIds] = useState<string[]>([]);

  // 선택된 위치 / 재고
  const [selectedCell, setSelectedCell] = useState<RackCell | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<
    CellInventoryRow[]
  >([]);

  useEffect(() => {
    const data = createRandomRackMap();
    setRackMap(data);
  }, []);

  // 존 변경 시 검색 하이라이트는 초기화
  useEffect(() => {
    setHighlightedCellIds([]);
  }, [activeZone]);

  const cells = rackMap[activeZone] ?? [];
  const isPickingZone = activeZone === "PICKING";
  const isSearchMode = highlightedCellIds.length > 0;

  // 검색어 입력 시 자동 완성 리스트
  const suggestions = useMemo(() => {
    const q = searchText.trim();
    if (!q) return [];
    const upper = q.toUpperCase();
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.code.toUpperCase().includes(upper) ||
        p.name.toLowerCase().includes(q.toLowerCase()),
    );
  }, [searchText]);

  const handleSearch = () => {
    const keyword = searchText.trim();
    if (!keyword) {
      setActiveProduct(null);
      setHighlightedCellIds([]);
      return;
    }

    const upper = keyword.toUpperCase();
    const product =
      MOCK_PRODUCTS.find((p) => p.code.toUpperCase() === upper) ??
      MOCK_PRODUCTS.find(
        (p) =>
          p.code.toUpperCase().includes(upper) ||
          p.name.toLowerCase().includes(keyword.toLowerCase()),
      );

    if (!product) {
      setActiveProduct(null);
      setHighlightedCellIds([]);
      alert("해당 상품을 찾을 수 없습니다.");
      return;
    }

    setActiveProduct(product);

    const matchedIds = (rackMap[activeZone] ?? [])
      .filter((c) => cellHasProduct(product.code, c))
      .map((c) => c.id);

    if (matchedIds.length === 0) {
      setHighlightedCellIds([]);
      alert("현재 존에서 해당 상품이 적재된 위치가 없습니다.");
      return;
    }

    setHighlightedCellIds(matchedIds);
    setSelectedCell(null);
    setSelectedInventory([]);
  };

  const handleClickCell = (cell: RackCell) => {
    // 검색 중일 때는 검색 결과(노란칸)만 클릭 가능하게 하려면 아래 조건 해제
    // if (isSearchMode && !highlightedCellIds.includes(cell.id)) return;

    setSelectedCell(cell);
    const inventory = buildFakeInventory(cell, activeProduct);
    setSelectedInventory(inventory);
  };

  const handleCall = () => {
    if (!selectedCell || selectedInventory.length === 0) {
      alert("호출할 위치와 상품을 먼저 선택해 주세요.");
      return;
    }
    const first = selectedInventory[0];
    const loc = formatCellLocation(selectedCell);
    alert(
      `${zoneLabel(selectedCell.zone)}\n${loc} 위치의 ${first.productCode} / ${first.productName}를 호출합니다.`,
    );
  };

  // ----------------------------------------------------------------
  // 개별 랙(큰 네모 한 칸) 렌더링
  // ----------------------------------------------------------------
  const renderRackCell = (cell: RackCell) => {
    const isPickingCell = cell.zone === "PICKING";

    // 테두리 색(단층 = 파란색, 복층 = 진한 검정, 피킹 = 진한 검정)
    let borderClass = "border-gray-400";
    if (isPickingCell || cell.type === "double") {
      borderClass = "border-gray-950";
    } else if (cell.type === "single") {
      borderClass = "border-blue-700";
    }

    const isMatch = highlightedCellIds.includes(cell.id);

    // 층(칸)별 배경색
    const levelSquares = [];
    const totalLevels = cell.levels; // 2 또는 6

    for (let lv = 1; lv <= totalLevels; lv += 1) {
      let bgClass = "bg-white";

      if (isSearchMode) {
        // 검색 모드일 때: 매칭된 셀은 노란색, 나머지는 전부 흰색
        bgClass = isMatch ? "bg-amber-300" : "bg-white";
      } else {
        // 기본 모드: 재고 있는 층만 하늘색
        const filled = cell.occupiedLevels.includes(lv);
        bgClass = filled ? "bg-sky-300" : "bg-white";
      }

      levelSquares.push(
        <div key={lv} className={`border border-white ${bgClass}`} />,
      );
    }

    const gridClass = isPickingCell
      ? "grid grid-cols-2 grid-rows-3"
      : "grid grid-cols-1 grid-rows-2";

    const titleParts: string[] = [];
    titleParts.push(zoneLabel(cell.zone));
    titleParts.push(cell.type === "single" ? "단층 렉" : "복층 렉");
    titleParts.push(`위치: ${formatCellLocation(cell)}`);

    return (
      <button
        type="button"
        key={cell.id}
        onClick={() => handleClickCell(cell)}
        className={`flex-1 aspect-square min-w-[28px] max-w-[80px] rounded-[4px] border-2 ${borderClass} ${
          isMatch ? "ring-2 ring-amber-300" : ""
        }`}
        title={titleParts.join(" / ")}
      >
        <div className={`${gridClass} h-full w-full`}>{levelSquares}</div>
      </button>
    );
  };

  const getLineCells = (line: number) =>
    cells.filter((c) => c.line === line).sort((a, b) => a.col - b.col);

  return (
    <div className="flex w-full min-h-screen flex-col gap-4 lg:flex-row">
      {/* 왼쪽: 창고 도면 카드 */}
      <div className="flex flex-1 flex-col rounded-2xl border bg-white p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold">창고 도면</div>
            <div className="text-[11px] text-gray-500">
              위에서 바라본 창고 평면도입니다. 각 칸(층)에 하늘색으로 적재
              상태가 표시됩니다.
            </div>
          </div>
        </div>

        {/* 존 선택 버튼 */}
        <div className="mt-2 mb-3 flex gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveZone("3F")}
            className={`rounded-full px-3 py-1 ${
              activeZone === "3F"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            3층 풀파렛트 창고
          </button>
          <button
            type="button"
            onClick={() => setActiveZone("2F")}
            className={`rounded-full px-3 py-1 ${
              activeZone === "2F"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            2층 잔량 파렛트 창고
          </button>
          <button
            type="button"
            onClick={() => setActiveZone("PICKING")}
            className={`rounded-full px-3 py-1 ${
              activeZone === "PICKING"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            2층 피킹창고
          </button>
        </div>

        {/* 도면 영역 */}
        <div className="flex-1 rounded-2xl bg-slate-50 p-4">
          <div className="flex h-full flex-col justify-center space-y-4 rounded-xl bg-slate-100 px-4 py-4">
            {/* 0: 위쪽 1줄 */}
            <div className="flex w-full gap-1">
              {getLineCells(0).map(renderRackCell)}
            </div>

            {/* 1~2, 3~4, 5~6 : 각 2줄짜리 렉 */}
            <div className="space-y-1">
              <div className="flex w-full gap-1">
                {getLineCells(1).map(renderRackCell)}
              </div>
              <div className="flex w-full gap-1">
                {getLineCells(2).map(renderRackCell)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex w-full gap-1">
                {getLineCells(3).map(renderRackCell)}
              </div>
              <div className="flex w-full gap-1">
                {getLineCells(4).map(renderRackCell)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex w-full gap-1">
                {getLineCells(5).map(renderRackCell)}
              </div>
              <div className="flex w-full gap-1">
                {getLineCells(6).map(renderRackCell)}
              </div>
            </div>

            {/* 7: 맨 아래 1줄 */}
            <div className="flex w-full gap-1">
              {getLineCells(7).map(renderRackCell)}
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽: 검색 + 위치/재고 정보 패널 */}
      <div className="w-[420px] rounded-2xl border bg-white p-4 text-[12px]">
        {/* 상품 검색 */}
        <div className="mb-3 rounded-xl border bg-gray-50 p-3">
          <div className="mb-1 text-sm font-semibold">상품 검색</div>
          <div className="mb-1 text-[11px] text-gray-500">
            상품코드 또는 상품명을 입력하면 해당 상품이 적재된 위치를 노란색으로
            표시합니다.
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="h-8 flex-1 rounded border px-2 text-[11px]"
              placeholder="예: P-1001, PET 500ml..."
            />
            <button
              type="button"
              onClick={handleSearch}
              className="h-8 rounded bg-blue-600 px-3 text-[11px] text-white hover:bg-blue-700"
            >
              검색
            </button>
          </div>

          {/* 자동완성 리스트 */}
          {suggestions.length > 0 && (
            <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px]">
              {suggestions.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => {
                    setSearchText(p.code);
                    setActiveProduct(p);
                  }}
                  className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
                >
                  <span className="font-mono">{p.code}</span>
                  <span className="text-gray-500">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-1 text-[11px] text-gray-600">
            현재 존: <span className="font-semibold">{zoneLabel(activeZone)}</span>
            {activeProduct && (
              <>
                {" / 현재 검색 상품: "}
                <span className="font-mono font-semibold">
                  {activeProduct.code}
                </span>{" "}
                <span> / {activeProduct.name}</span>
              </>
            )}
          </div>
        </div>

        {/* 위치 / 재고 정보 */}
        <div className="flex flex-1 flex-col rounded-xl border bg-gray-50 p-3 text-[11px] text-gray-700">
          <div className="mb-2 text-sm font-semibold">위치 / 재고 정보</div>
          <div className="mb-2 text-[11px] text-gray-500">
            도면에서 칸(렉/단)을 클릭하면 해당 위치의 층별 LOT/수량 정보가
            표시됩니다.
          </div>

          {/* 선택 위치 표시 */}
          <div className="mb-2 rounded border bg-white px-2 py-1">
            {selectedCell ? (
              <>
                선택 위치:{" "}
                <span className="font-semibold">
                  {formatCellLocation(selectedCell)}
                </span>{" "}
                (
                {selectedCell.type === "single"
                  ? "단층 렉"
                  : isPickingZone
                    ? "피킹랙(6층)"
                    : "복층 렉"}
                )
              </>
            ) : (
              "선택된 위치가 없습니다."
            )}
          </div>

          {/* ① 위치별 요약 */}
          <div className="mb-2 rounded border bg-white p-2">
            <div className="mb-1 font-semibold text-gray-700">
              ① 위치별 요약
            </div>
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-1 py-1 text-left">층</th>
                  <th className="border px-1 py-1 text-left">상품코드</th>
                  <th className="border px-1 py-1 text-left">상품명</th>
                  <th className="border px-1 py-1 text-left">LOT</th>
                  <th className="border px-1 py-1 text-right">수량</th>
                </tr>
              </thead>
              <tbody>
                {selectedInventory.length === 0 ? (
                  <tr>
                    <td
                      className="border px-1 py-2 text-center text-gray-400"
                      colSpan={5}
                    >
                      선택된 위치의 재고 정보가 없습니다.
                    </td>
                  </tr>
                ) : (
                  selectedInventory.map((row) => (
                    <tr key={row.level}>
                      <td className="border px-1 py-1">{row.level}층</td>
                      <td className="border px-1 py-1 font-mono">
                        {row.productCode}
                      </td>
                      <td className="border px-1 py-1">{row.productName}</td>
                      <td className="border px-1 py-1">{row.lot}</td>
                      <td className="border px-1 py-1 text-right">
                        {row.qty.toLocaleString()}EA
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ② 선택 제품 상세 */}
          <div className="flex flex-1 flex-col justify-between rounded border bg-white p-2">
            <div>
              <div className="mb-1 font-semibold text-gray-700">
                ② 선택 제품 상세
              </div>
              {selectedInventory.length > 0 ? (
                (() => {
                  const first = selectedInventory[0];
                  return (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div className="text-gray-500">파렛트 위치</div>
                      <div className="text-right font-mono">
                        {selectedCell && formatCellLocation(selectedCell)}
                      </div>
                      <div className="text-gray-500">상품코드</div>
                      <div className="text-right font-mono">
                        {first.productCode}
                      </div>
                      <div className="text-gray-500">상품명</div>
                      <div className="text-right">{first.productName}</div>
                      <div className="text-gray-500">LOT</div>
                      <div className="text-right font-mono">{first.lot}</div>
                      <div className="text-gray-500">수량</div>
                      <div className="text-right font-mono">
                        {first.qty.toLocaleString()}EA
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-[11px] text-gray-400">
                  선택된 제품 정보가 없습니다.
                </div>
              )}
            </div>

            {/* 호출하기 버튼 */}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleCall}
                className="rounded-full bg-emerald-600 px-4 py-1 text-[11px] text-white hover:bg-emerald-700"
              >
                호출하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
