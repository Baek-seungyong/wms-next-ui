// components/WarehouseMapView.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type ZoneId = "3F" | "2F" | "PICKING";
type RackType = "single" | "double";

interface RackCell {
  id: string;
  zone: ZoneId;
  line: number;
  col: number;
  type: RackType;
  levels: number;
  occupiedLevels: number[];
  isStorage: boolean;
}

interface CellInventoryRow {
  level: number;
  productCode: string;
  productName: string;
  lot: string;
  qty: number;
}

interface ProductInfo {
  code: string;
  name: string;
}

const MOCK_PRODUCTS: ProductInfo[] = [
  { code: "P-1001", name: "PET 500ml 투명" },
  { code: "P-1002", name: "PET 300ml 밀키" },
  { code: "P-2001", name: "PET 1L 투명" },
];

const ZONE_LAYOUT: Record<ZoneId, { lines: number; cols: number }> = {
  "3F": { lines: 7, cols: 18 },
  "2F": { lines: 8, cols: 10 },
  PICKING: { lines: 8, cols: 10 },
};

// -----------------------------
// 더미 데이터
// -----------------------------
function createRandomRackMap(): Record<ZoneId, RackCell[]> {
  const result: Record<ZoneId, RackCell[]> = {
    "3F": [],
    "2F": [],
    PICKING: [],
  };

  (["3F", "2F", "PICKING"] as ZoneId[]).forEach((zone) => {
    const cells: RackCell[] = [];
    const { lines, cols } = ZONE_LAYOUT[zone];

    for (let line = 0; line < lines; line += 1) {
      for (let col = 0; col < cols; col += 1) {
        let isStorage = true;
        if (zone === "3F" && col >= 13 && line >= lines - 3) {
          isStorage = false; // 3층 오른쪽 아래 사용 안 하는 구역
        }

        const isPickingZone = zone === "PICKING";
        const type: RackType =
          isPickingZone || (col !== 0 && col !== cols - 1)
            ? "double"
            : "single";
        const levels = isPickingZone ? 6 : 2;
        const occupiedLevels: number[] = [];

        if (isStorage) {
          if (zone === "PICKING") {
            for (let lv = 1; lv <= 6; lv += 1) {
              if (Math.random() < 0.5) occupiedLevels.push(lv);
            }
          } else {
            if (type === "single") {
              if (Math.random() < 0.7) occupiedLevels.push(1);
            } else {
              const r = Math.random();
              if (r < 0.3) {
                // 비움
              } else if (r < 0.6) {
                occupiedLevels.push(1);
              } else if (r < 0.9) {
                occupiedLevels.push(2);
              } else {
                occupiedLevels.push(1, 2);
              }
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
          isStorage,
        });
      }
    }

    result[zone] = cells;
  });

  return result;
}

function cellHasProduct(productCode: string, cell: RackCell): boolean {
  if (!cell.isStorage) return false;
  const key = cell.line + cell.col;

  if (productCode === "P-1001") return key % 3 === 0;
  if (productCode === "P-1002") return key % 3 === 1;
  if (productCode === "P-2001") return key % 4 === 0;
  return false;
}

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
  const { lines } = ZONE_LAYOUT[cell.zone];
  const yLabel = lines - cell.line; // line 0 → Y7, 6 → Y1
  const xLabel = cell.col + 1; // col 0 → X1
  return `${cell.zone} / X${xLabel} - Y${yLabel}`;
}

// -----------------------------
// 메인 컴포넌트
// -----------------------------
export function WarehouseMapView() {
  const [activeZone, setActiveZone] = useState<ZoneId>("3F");
  const [rackMap, setRackMap] = useState<Record<ZoneId, RackCell[]>>({
    "3F": [],
    "2F": [],
    PICKING: [],
  });

  const [searchText, setSearchText] = useState("");
  const [activeProduct, setActiveProduct] = useState<ProductInfo | null>(null);
  const [highlightedCellIds, setHighlightedCellIds] = useState<string[]>([]);
  const [selectedCell, setSelectedCell] = useState<RackCell | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<CellInventoryRow[]>([]);

  // 🔹 추천 리스트를 보여줄지 여부
  const [showSuggestions, setShowSuggestions] = useState(false);


  // ✅ 첫 화면 축소 상태 (3층은 CAD 이미지라 작게 시작)
  const [zoom, setZoom] = useState(0.2);
  const zoomRef = useRef(zoom);

  // 스크롤 컨테이너(뷰포트) ref
  const viewportRef = useRef<HTMLDivElement | null>(null);
  // ✅ 실제 도면 콘텐츠 래퍼 ref (auto-fit용)
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const data = createRandomRackMap();
    setRackMap(data);
  }, []);

  useEffect(() => {
    setHighlightedCellIds([]);
    setSelectedCell(null);
    setSelectedInventory([]);
  }, [activeZone]);

  // zoom 상태를 ref에도 동기화 (전역 wheel 핸들러에서 최신 값 사용)
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const cells = rackMap[activeZone] ?? [];
  const isPickingZone = activeZone === "PICKING";
  const isSearchMode = highlightedCellIds.length > 0;
  const { lines: zoneLines } = ZONE_LAYOUT[activeZone];

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

  const handleSearch = (keywordFromClick?: string) => {
    const keyword = (keywordFromClick ?? searchText).trim();

    // 입력값을 동기화
    setSearchText(keyword);

    if (!keyword) {
      setActiveProduct(null);
      setHighlightedCellIds([]);
      setShowSuggestions(false);
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
      setShowSuggestions(false);
      alert("해당 상품을 찾을 수 없습니다.");
      return;
    }

    setActiveProduct(product);

    const matchedIds = (rackMap[activeZone] ?? [])
      .filter((c) => cellHasProduct(product.code, c))
      .map((c) => c.id);

    if (matchedIds.length === 0) {
      setHighlightedCellIds([]);
      setShowSuggestions(false);
      alert("현재 존에서 해당 상품이 적재된 위치가 없습니다.");
      return;
    }

    setHighlightedCellIds(matchedIds);
    setSelectedCell(null);
    setSelectedInventory([]);
    setShowSuggestions(false);  // 🔹 검색이 끝나면 리스트 닫기
  };


  const handleClickCell = (cell: RackCell) => {
    if (!cell.isStorage) return;
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

  // -----------------------------
  // ✅ 존 변경 시 줌 초기값 조정
  //  - 3F: CAD 이미지라 기본 0.2 배
  //  - 2F / PICKING: auto-fit 에서 다시 계산하므로 일단 1로
  // -----------------------------
  useEffect(() => {
    if (activeZone === "3F") {
      setZoom(0.2);
      zoomRef.current = 0.2;
    } else {
      setZoom(1);
      zoomRef.current = 1;
    }
  }, [activeZone]);

  // -----------------------------
  // 🔥 전역 wheel 리스너 (3F 전용)
  // -----------------------------
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (activeZone !== "3F") return;

      const viewport = viewportRef.current;
      if (!viewport) return;

      // 휠 이벤트가 viewport 바깥에서 난 경우 무시
      if (!viewport.contains(e.target as Node)) return;

      // 브라우저 기본 스크롤 막기 (윈도우 같이 안 내려가게)
      e.preventDefault();

      const rect = viewport.getBoundingClientRect();

      // 뷰포트 안에서의 마우스 위치
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const scrollLeft = viewport.scrollLeft;
      const scrollTop = viewport.scrollTop;

      const currentZoom = zoomRef.current;
      const delta = e.deltaY > 0 ? -0.05 : 0.05; // 아래 = 축소, 위 = 확대
      let nextZoom = currentZoom + delta;
      if (nextZoom < 0.1) nextZoom = 0.1;
      if (nextZoom > 2) nextZoom = 2;
      if (nextZoom === currentZoom) return;

      // 마우스가 가리키는 도면상의 좌표 (scale 적용 전 기준)
      const mouseContentX = (scrollLeft + offsetX) / currentZoom;
      const mouseContentY = (scrollTop + offsetY) / currentZoom;

      // 새 줌에서 같은 지점을 같은 화면 위치에 보이게 스크롤 조정
      const newScrollLeft = mouseContentX * nextZoom - offsetX;
      const newScrollTop = mouseContentY * nextZoom - offsetY;

      setZoom(nextZoom);
      zoomRef.current = nextZoom;

      window.requestAnimationFrame(() => {
        if (!viewportRef.current) return;
        viewportRef.current.scrollLeft = newScrollLeft;
        viewportRef.current.scrollTop = newScrollTop;
      });
    };

    window.addEventListener("wheel", handler, { passive: false });

    return () => {
      window.removeEventListener("wheel", handler);
    };
  }, [activeZone]);

  // -----------------------------
  // ✅ 2F / PICKING 자동 확대 (창 크기에 맞추기)
  //  - viewport / content 크기를 비교해서 zoom 계산
  //  - 윈도우 리사이즈 / 존 변경 시 자동 반응
  // -----------------------------
  useEffect(() => {
    if (activeZone === "3F") return; // 3층은 사용자가 수동 줌

    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const fitToViewport = () => {
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      const cw = content.offsetWidth;
      const ch = content.offsetHeight;

      if (!cw || !ch || !vw || !vh) return;

      // 도면 전체가 보이도록 비율 계산 (조금 여유 0.9)
      let next = Math.min(vw / cw, vh / ch) * 0.9;
      if (next > 2) next = 2;
      if (next < 0.2) next = 0.2;

      setZoom(next);
      zoomRef.current = next;
    };

    fitToViewport();

    const ro = new ResizeObserver(fitToViewport);
    ro.observe(viewport);
    ro.observe(content);

    return () => {
      ro.disconnect();
    };
  }, [activeZone, cells.length]);

  // -----------------------------
  // 렉 한 칸 (2F / PICKING 용)
  // -----------------------------
  const renderRackCell = (cell: RackCell) => {
    if (!cell.isStorage) {
      return (
        <div
          key={cell.id}
          className="h-8 w-8 flex-none rounded-[4px] border-2 border-dashed border-slate-300 bg-slate-200/60"
          title="창고로 사용하지 않는 영역"
        />
      );
    }

    const isMatch = highlightedCellIds.includes(cell.id);
    const is3F = cell.zone === "3F";
    const isPickingCell = cell.zone === "PICKING";

    let borderClass = "border-gray-400";
    if (isPickingCell || cell.type === "double") {
      borderClass = "border-gray-950";
    } else if (cell.type === "single") {
      borderClass = "border-blue-700";
    }

    if (is3F) {
      // 3F는 지금 도면 이미지만 사용하니까 여기서는 단순 버튼
      return (
        <button
          type="button"
          key={cell.id}
          onClick={() => handleClickCell(cell)}
          className={`h-8 w-8 flex-none rounded-[4px] border-2 ${borderClass} ${
            isMatch ? "ring-2 ring-amber-300" : ""
          }`}
          title={formatCellLocation(cell)}
        />
      );
    }

    const levelSquares = [];
    const totalLevels = cell.levels;
    for (let lv = 1; lv <= totalLevels; lv += 1) {
      let bgClass = "bg-white";

      if (isSearchMode) {
        bgClass = isMatch ? "bg-amber-300" : "bg-white";
      } else {
        const filled = cell.occupiedLevels.includes(lv);
        bgClass = filled ? "bg-sky-300" : "bg-white";
      }

      levelSquares.push(
        <div key={lv} className={`border border-white ${bgClass}`} />,
      );
    }

    const gridClass =
      cell.zone === "PICKING"
        ? "grid grid-cols-2 grid-rows-3"
        : "grid grid-cols-1 grid-rows-2";

    return (
      <button
        type="button"
        key={cell.id}
        onClick={() => handleClickCell(cell)}
        className={`h-8 w-8 flex-none rounded-[4px] border-2 ${borderClass} ${
          isMatch ? "ring-2 ring-amber-300" : ""
        }`}
        title={formatCellLocation(cell)}
      >
        <div className={`${gridClass} h-full w-full`}>{levelSquares}</div>
      </button>
    );
  };

  const getLineCells = (line: number) =>
    cells.filter((c) => c.line === line).sort((a, b) => a.col - b.col);

  const mapContainerClass =
    "flex-1 rounded-xl bg-slate-100 overflow-auto" +
    (activeZone === "3F" ? " overscroll-contain" : "");

  // -----------------------------
  // 렌더링
  // -----------------------------
  return (
    <div className="flex w-full min-h-screen flex-col gap-4 lg:flex-row">
      {/* 왼쪽 패널 */}
      <div className="w-[420px] rounded-2xl border bg-white p-4 text-[12px]">
        {/* ───── 상품 검색 ───── */}
        <div className="mb-3 rounded-xl border bg-gray-50 p-3">
          <div className="mb-1 text-sm font-semibold">상품 검색</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setShowSuggestions(true); // 🔹 입력하면 추천 리스트 열기
              }}
              onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handleSearch();
                  setShowSuggestions(false); // 🔹 엔터 검색 후 닫기
                }
              }}
              className="h-8 flex-1 rounded border px-2 text-[11px]"
              placeholder="예: P-1001, PET 500ml..."
            />
            <button
              type="button"
              onClick={() => {
                handleSearch();
                setShowSuggestions(false);   // 🔹 버튼 검색 후 닫기
              }}
              className="h-8 rounded bg-blue-600 px-3 text-[11px] text-white hover:bg-blue-700"
            >
              검색
            </button>
          </div>

          {/* 🔹 추천 리스트: showSuggestions 가 true일 때만 렌더링 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px]">
              {suggestions.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => {
                    // 클릭하면 그 상품으로 바로 검색 실행
                    handleSearch(p.code);
                    setShowSuggestions(false);   // 🔹 리스트 즉시 닫기
                  }}
                  className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
                >
                  <span className="font-mono">{p.code}</span>
                  <span className="text-gray-500">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* 현재 존 / 현재 검색 상품 표시 */}
          <div className="mt-2 text-[11px] text-gray-600">
            현재 존:&nbsp;
            <span className="font-semibold">{zoneLabel(activeZone)}</span>
          </div>

          {activeProduct ? (
            <div className="mt-2 rounded-lg border border-blue-600 bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-800 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-700 px-2 py-0.5 font-mono text-[11px] text-white">
                  {activeProduct.code}
                </span>
                <span className="text-[12px]">{activeProduct.name}</span>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-gray-400">
              현재 검색 중인 상품이 없습니다.
            </div>
          )}
        </div>

        {/* 위치 / 재고 정보 */}
        <div className="flex flex-1 flex-col rounded-xl border bg-gray-50 p-3 text-[11px] text-gray-700">
          <div className="mb-2 text-sm font-semibold">위치 / 재고 정보</div>
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

      {/* 오른쪽: 창고 도면 */}
      <div className="flex flex-1 flex-col rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold">창고 도면</div>
          </div>
        </div>

        <div className="mt-2 mb-3 flex flex-wrap gap-2 text-[11px]">
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

        <div ref={viewportRef} className={mapContainerClass}>
          <div
            ref={contentRef} // ✅ auto-fit 대상
            className="relative m-4 inline-block origin-top-left"
            style={{ transform: `scale(${zoom})` }}
          >
            {activeZone === "3F" ? (
              <div className="relative inline-block">
                <img
                  src="/maps/3f-warehouse.png"
                  alt="3층 창고 도면"
                  className="block max-w-none"
                />

                {/* 오버레이 (필요하면 나중에 렉/파렛트 표시 넣기) */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="grid h-full w-full grid-rows-7 grid-cols-18">
                    {Array.from({ length: zoneLines }, (_, line) => (
                      <div key={line} className="contents">
                        {getLineCells(line).map((cell) => (
                          <div key={cell.id} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative flex flex-col">
                {Array.from({ length: zoneLines }, (_, line) => (
                  <div key={line} className="flex">
                    {getLineCells(line).map(renderRackCell)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
