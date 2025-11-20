"use client";

import React, { useMemo, useState } from "react";

type Zone = "3F_FULL" | "2F_REMAIN" | "2F_PICKING";

type StockItem = {
  slotName?: string;
  palletCode?: string;
  toteCode?: string;
  productCode?: string;
  productName?: string;
  lot?: string;
  qty?: number;
  unit?: string;
};

type Location = {
  id: string;
  floorZone: Zone;
  rack: string;
  level: number; // 1 = 가장 아래층
  maxSlots: number;
  items: StockItem[];
};

// 🔹 데모용 더미 데이터 (나중에 WMS DB / API 연동)
const demoLocations: Location[] = [
  // 3층 풀파렛트
  {
    id: "3F_FULL_R1_L1",
    floorZone: "3F_FULL",
    rack: "R1",
    level: 1,
    maxSlots: 2,
    items: [
      {
        slotName: "파렛트1",
        palletCode: "PLT0001",
        productCode: "P-1001",
        productName: "PET 500ml 투명",
        lot: "LOT20251101",
        qty: 1200,
        unit: "EA",
      },
      {
        slotName: "파렛트2",
        palletCode: "PLT0002",
        productCode: "P-1002",
        productName: "PET 300ml 밀키",
        lot: "LOT20251102",
        qty: 800,
        unit: "EA",
      },
    ],
  },
  {
    id: "3F_FULL_R1_L2",
    floorZone: "3F_FULL",
    rack: "R1",
    level: 2,
    maxSlots: 2,
    items: [
      {
        slotName: "파렛트1",
        palletCode: "PLT0003",
        productCode: "P-1003",
        productName: "PP 캡 28파이",
        lot: "LOT20251015",
        qty: 3000,
        unit: "EA",
      },
    ],
  },

  // 2층 잔량파렛트
  {
    id: "2F_REMAIN_R1_L1",
    floorZone: "2F_REMAIN",
    rack: "R1",
    level: 1,
    maxSlots: 2,
    items: [
      {
        slotName: "파렛트1",
        palletCode: "PLT0101",
        productCode: "P-2001",
        productName: "PET 2L 생수용기",
        lot: "LOT20240930",
        qty: 300,
        unit: "BOX",
      },
    ],
  },

  // 2층 피킹존 (6단 토트 예시 일부)
  {
    id: "2F_PICKING_R1_L1",
    floorZone: "2F_PICKING",
    rack: "PK1",
    level: 1,
    maxSlots: 1,
    items: [
      {
        slotName: "토트1 (1단)",
        toteCode: "TOTE0001",
        productCode: "P-3001",
        productName: "샘플용기 20ml",
        lot: "LOT20251120",
        qty: 45,
        unit: "EA",
      },
    ],
  },
  {
    id: "2F_PICKING_R1_L2",
    floorZone: "2F_PICKING",
    rack: "PK1",
    level: 2,
    maxSlots: 1,
    items: [],
  },
  {
    id: "2F_PICKING_R1_L3",
    floorZone: "2F_PICKING",
    rack: "PK1",
    level: 3,
    maxSlots: 1,
    items: [
      {
        slotName: "토트1 (3단)",
        toteCode: "TOTE0002",
        productCode: "P-1001",
        productName: "PET 500ml 투명",
        lot: "LOT20251101",
        qty: 12,
        unit: "EA",
      },
    ],
  },
];

export function WarehouseMapView() {
  const [zone, setZone] = useState<Zone>("3F_FULL");
  const [search, setSearch] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
  );

  const currentLocations = useMemo(
    () => demoLocations.filter((l) => l.floorZone === zone),
    [zone],
  );

  // 렉 단위로 그룹
  const racks = useMemo(() => {
    const map: Record<string, Location[]> = {};
    currentLocations.forEach((loc) => {
      if (!map[loc.rack]) map[loc.rack] = [];
      map[loc.rack].push(loc);
    });
    return map;
  }, [currentLocations]);

  // 검색어에 맞는 위치 하이라이트
  const highlightIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return new Set<string>();
    const set = new Set<string>();

    demoLocations.forEach((loc) => {
      loc.items.forEach((item) => {
        const t = [
          item.productCode,
          item.productName,
          item.lot,
          item.palletCode,
          item.toteCode,
        ]
          .join(" ")
          .toLowerCase();
        if (t.includes(q)) {
          set.add(loc.id);
        }
      });
    });

    return set;
  }, [search]);

  const selectedLocation =
    currentLocations.find((l) => l.id === selectedLocationId) ?? null;
  const summaryItems = selectedLocation?.items ?? [];
  const selectedItem =
    selectedItemIndex != null ? summaryItems[selectedItemIndex] ?? null : null;

  const handleClickSlot = (loc: Location) => {
    setSelectedLocationId(loc.id);
    setSelectedItemIndex(null);
  };

  return (
    <div className="flex h-full min-h-[600px] gap-4">
      {/* 왼쪽: 도면 */}
      <div className="flex flex-1 flex-col rounded-md border bg-white p-3">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
          <span>창고 도면</span>
          <span className="text-[11px] text-gray-500">
            연한 초록: 재고 있음 / 주황 테두리: 검색 위치
          </span>
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm">
          <select
            className="rounded border px-2 py-1"
            value={zone}
            onChange={(e) => {
              const z = e.target.value as Zone;
              setZone(z);
              setSelectedLocationId(null);
              setSelectedItemIndex(null);
            }}
          >
            <option value="3F_FULL">3층 풀파렛트 창고</option>
            <option value="2F_REMAIN">2층 잔량파렛트 창고</option>
            <option value="2F_PICKING">2층 피킹존(토트박스)</option>
          </select>

          <input
            className="flex-1 rounded border px-2 py-1 text-sm"
            placeholder="상품코드 / 상품명 / LOT / 파렛트코드 / 토트코드 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearch("");
            }}
          />
        </div>

        <div className="flex-1 overflow-auto rounded border bg-slate-50 p-2">
          {Object.keys(racks).length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              현재 존에 설정된 위치 데이터가 없습니다. (데모 데이터 추가 필요)
            </div>
          ) : (
            <div className="flex items-end gap-4">
              {Object.entries(racks).map(([rackId, locs]) => {
                const maxLevel = Math.max(...locs.map((l) => l.level));

                return (
                  <div
                    key={rackId}
                    className="flex flex-col items-center gap-1"
                  >
                    {/* 렉 본체 (아래에서 위로 쌓이게) */}
                    <div className="flex flex-col-reverse gap-1">
                      {Array.from({ length: maxLevel }).map((_, idx) => {
                        const level = idx + 1;
                        const loc =
                          locs.find((l) => l.level === level) ?? null;
                        const hasStock = !!(loc && loc.items.length > 0);
                        const isHighlight =
                          !!loc && highlightIds.has(loc.id);
                        const isSelected =
                          !!loc && loc.id === selectedLocationId;

                        const baseClass =
                          "flex h-8 w-12 items-center justify-center rounded border text-[10px]";
                        const stockClass = hasStock
                          ? "bg-emerald-50"
                          : "bg-white opacity-40";
                        const selectedClass = isSelected
                          ? "ring-2 ring-blue-500"
                          : "";
                        const highlightClass = isHighlight
                          ? "border-orange-400 ring-2 ring-orange-400"
                          : "";

                        if (!loc) {
                          return (
                            <div
                              key={level}
                              className={`${baseClass} bg-white opacity-20`}
                            />
                          );
                        }

                        return (
                          <button
                            key={level}
                            type="button"
                            className={`${baseClass} ${stockClass} ${selectedClass} ${highlightClass}`}
                            onClick={() => handleClickSlot(loc)}
                          >
                            {level}층
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-700">
                      {rackId}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽: 정보 패널 */}
      <div className="flex min-w-[340px] flex-1 flex-col rounded-md border bg-white p-3">
        <div className="mb-1 text-sm font-semibold">위치 / 재고 정보</div>
        <div className="mb-2 text-xs text-gray-600">
          {selectedLocation ? (
            <>
              선택 위치:{" "}
              <span className="font-semibold">
                {selectedLocation.floorZone} / 렉 {selectedLocation.rack} / 레벨{" "}
                {selectedLocation.level}
              </span>
            </>
          ) : (
            <>왼쪽 도면에서 칸을 선택해주세요.</>
          )}
        </div>

        {/* ① 위치별 요약 */}
        <div className="mb-1 mt-1 text-xs font-semibold">① 위치별 요약</div>
        <div className="flex-1 overflow-auto rounded border">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-2 py-1">#</th>
                <th className="border px-2 py-1">구분</th>
                <th className="border px-2 py-1">상품코드</th>
                <th className="border px-2 py-1">상품명</th>
                <th className="border px-2 py-1">LOT</th>
                <th className="border px-2 py-1">수량</th>
              </tr>
            </thead>
            <tbody>
              {selectedLocation && summaryItems.length > 0 ? (
                summaryItems.map((item, idx) => {
                  const isActive = selectedItemIndex === idx;
                  return (
                    <tr
                      key={idx}
                      className={`cursor-pointer ${
                        isActive ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedItemIndex(idx)}
                    >
                      <td className="border px-2 py-1 text-center">
                        {idx + 1}
                      </td>
                      <td className="border px-2 py-1">
                        {item.slotName ?? ""}
                      </td>
                      <td className="border px-2 py-1">
                        {item.productCode ?? ""}
                      </td>
                      <td className="border px-2 py-1">
                        {item.productName ?? ""}
                      </td>
                      <td className="border px-2 py-1">{item.lot ?? ""}</td>
                      <td className="border px-2 py-1">
                        {item.qty != null ? `${item.qty}${item.unit ?? ""}` : ""}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="border px-2 py-3 text-center text-xs text-gray-500"
                  >
                    선택된 위치가 없거나 재고가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ② 상세 정보 */}
        <div className="mb-1 mt-3 text-xs font-semibold">② 선택 제품 상세</div>
        <div className="rounded border">
          {selectedItem ? (
            <table className="min-w-full border-collapse text-xs">
              <tbody>
                {selectedItem.palletCode && (
                  <tr>
                    <th className="w-28 border px-2 py-1 text-left">
                      파렛트코드
                    </th>
                    <td className="border px-2 py-1">
                      {selectedItem.palletCode}
                    </td>
                  </tr>
                )}
                {selectedItem.toteCode && (
                  <tr>
                    <th className="w-28 border px-2 py-1 text-left">
                      토트박스코드
                    </th>
                    <td className="border px-2 py-1">
                      {selectedItem.toteCode}
                    </td>
                  </tr>
                )}
                <tr>
                  <th className="border px-2 py-1 text-left">상품코드</th>
                  <td className="border px-2 py-1">
                    {selectedItem.productCode ?? ""}
                  </td>
                </tr>
                <tr>
                  <th className="border px-2 py-1 text-left">상품명</th>
                  <td className="border px-2 py-1">
                    {selectedItem.productName ?? ""}
                  </td>
                </tr>
                <tr>
                  <th className="border px-2 py-1 text-left">LOT</th>
                  <td className="border px-2 py-1">
                    {selectedItem.lot ?? ""}
                  </td>
                </tr>
                <tr>
                  <th className="border px-2 py-1 text-left">수량</th>
                  <td className="border px-2 py-1">
                    {selectedItem.qty != null
                      ? `${selectedItem.qty}${selectedItem.unit ?? ""}`
                      : ""}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="px-3 py-4 text-center text-xs text-gray-500">
              상세 보기를 위해 위의 요약 리스트에서 행을 선택하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
