// components/RobotProductCallModal.tsx
"use client";

import { useMemo, useState } from "react";

type Pallet = {
  id: string;          // 파렛트 번호
  productCode: string; // 상품코드
  productName: string; // 상품명
  location: string;    // 파렛트 위치
  boxQty: number;      // 박스 수량
  eaQty: number;       // 낱개 수량(EA)
};

type Props = {
  open: boolean;
  onClose: () => void;

  // 일반 호출 / 긴급 호출 구분
  mode: "manual" | "emergency";

  // 선택 완료 후 상위로 넘길 때 사용
  onConfirmSelection?: (pallets: Pallet[]) => void;

  // ✅ 긴급 호출용 콜백 (page.tsx에서 받는 그대로)
  onConfirmEmergency?: (productName: string, qty: number) => void;
};

// 🔹 데모용 상품 4개 × 파렛트 4개 = 16개
const ALL_PALLETS: Pallet[] = [
  // P-001 : PET 500ml 투명
  {
    id: "PAL-001-01",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    location: "3층 플랫파렛트 3F-A-01",
    boxQty: 10,
    eaQty: 1200,
  },
  {
    id: "PAL-001-02",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    location: "3층 플랫파렛트 3F-A-02",
    boxQty: 8,
    eaQty: 960,
  },
  {
    id: "PAL-001-03",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    location: "2층 잔량파렛트 2F-B-01",
    boxQty: 5,
    eaQty: 600,
  },
  {
    id: "PAL-001-04",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    location: "2층 잔량파렛트 2F-B-02",
    boxQty: 4,
    eaQty: 480,
  },

  // P-013 : PET 1L 반투명
  {
    id: "PAL-013-01",
    productCode: "P-013",
    productName: "PET 1L 반투명",
    location: "3층 플랫파렛트 3F-C-01",
    boxQty: 6,
    eaQty: 720,
  },
  {
    id: "PAL-013-02",
    productCode: "P-013",
    productName: "PET 1L 반투명",
    location: "3층 플랫파렛트 3F-C-02",
    boxQty: 6,
    eaQty: 720,
  },
  {
    id: "PAL-013-03",
    productCode: "P-013",
    productName: "PET 1L 반투명",
    location: "2층 잔량파렛트 2F-D-01",
    boxQty: 3,
    eaQty: 360,
  },
  {
    id: "PAL-013-04",
    productCode: "P-013",
    productName: "PET 1L 반투명",
    location: "2층 잔량파렛트 2F-D-02",
    boxQty: 2,
    eaQty: 240,
  },

  // C-201 : 캡 28파이 화이트
  {
    id: "PAL-201-01",
    productCode: "C-201",
    productName: "캡 28파이 화이트",
    location: "3층 소형파렛트 3F-E-01",
    boxQty: 20,
    eaQty: 4000,
  },
  {
    id: "PAL-201-02",
    productCode: "C-201",
    productName: "캡 28파이 화이트",
    location: "3층 소형파렛트 3F-E-02",
    boxQty: 15,
    eaQty: 3000,
  },
  {
    id: "PAL-201-03",
    productCode: "C-201",
    productName: "캡 28파이 화이트",
    location: "2층 소형파렛트 2F-F-01",
    boxQty: 12,
    eaQty: 2400,
  },
  {
    id: "PAL-201-04",
    productCode: "C-201",
    productName: "캡 28파이 화이트",
    location: "2층 소형파렛트 2F-F-02",
    boxQty: 10,
    eaQty: 2000,
  },

  // L-009 : 라벨 500ml 화이트
  {
    id: "PAL-009-01",
    productCode: "L-009",
    productName: "라벨 500ml 화이트",
    location: "3층 라벨파렛트 3F-G-01",
    boxQty: 30,
    eaQty: 6000,
  },
  {
    id: "PAL-009-02",
    productCode: "L-009",
    productName: "라벨 500ml 화이트",
    location: "3층 라벨파렛트 3F-G-02",
    boxQty: 25,
    eaQty: 5000,
  },
  {
    id: "PAL-009-03",
    productCode: "L-009",
    productName: "라벨 500ml 화이트",
    location: "2층 라벨파렛트 2F-H-01",
    boxQty: 18,
    eaQty: 3600,
  },
  {
    id: "PAL-009-04",
    productCode: "L-009",
    productName: "라벨 500ml 화이트",
    location: "2층 라벨파렛트 2F-H-02",
    boxQty: 12,
    eaQty: 2400,
  },
];

export function RobotProductCallModal({
  open,
  onClose,
  mode,
  onConfirmSelection,
  onConfirmEmergency,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [leftChecked, setLeftChecked] = useState<string[]>([]);
  const [rightChecked, setRightChecked] = useState<string[]>([]);
  const [selectedPallets, setSelectedPallets] = useState<Pallet[]>([]);


  /** 상태 초기화 함수 – 창 닫힐 때마다 호출 */
  const resetState = () => {
    setSearchTerm("");
    setHasSearched(false);
    setLeftChecked([]);
    setRightChecked([]);
    setSelectedPallets([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // 🔍 검색 결과 – 검색하기 전에는 항상 빈 배열
  const searchResults = useMemo(() => {
    if (!hasSearched || !searchTerm.trim()) return [];
    const q = searchTerm.trim().toLowerCase();

    return ALL_PALLETS.filter(
      (p) =>
        p.productCode.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q),
    );
  }, [searchTerm, hasSearched]);

  // 우측 전체 내역 합계
  const totalBox = useMemo(
    () => selectedPallets.reduce((sum, p) => sum + p.boxQty, 0),
    [selectedPallets],
  );
  const totalEa = useMemo(
    () => selectedPallets.reduce((sum, p) => sum + p.eaQty, 0),
    [selectedPallets],
  );

  // 우측 상품별 요약 (상품명 기준 집계)
  const productSummary = useMemo(() => {
    const map = new Map<
      string,
      { name: string; box: number; ea: number }
    >();

    selectedPallets.forEach((p) => {
      const key = `${p.productCode}|${p.productName}`;
      const prev = map.get(key) ?? {
        name: p.productName,
        box: 0,
        ea: 0,
      };
      prev.box += p.boxQty;
      prev.ea += p.eaQty;
      map.set(key, prev);
    });

    return Array.from(map.values());
  }, [selectedPallets]);

  const onSearchClick = () => {
    setHasSearched(true);
    setLeftChecked([]);
  };

  // ▶ 좌측(검색결과) → 우측(전체 내역) 이동
  const moveToRight = () => {
    if (leftChecked.length === 0) return;

    setSelectedPallets((prev) => {
      const map = new Map<string, Pallet>();
      prev.forEach((p) => map.set(p.id, p));

      leftChecked.forEach((id) => {
        const p = searchResults.find((x) => x.id === id);
        if (p && !map.has(p.id)) {
          map.set(p.id, p);
        }
      });

      return Array.from(map.values());
    });

    setLeftChecked([]);
  };

  // ◀ 우측 → 제거
  const removeFromRight = () => {
    if (rightChecked.length === 0) return;
    setSelectedPallets((prev) =>
      prev.filter((p) => !rightChecked.includes(p.id)),
    );
    setRightChecked([]);
  };

  /** ✅ 선택 파렛트 호출 버튼 */
  const handleConfirm = () => {
    if (selectedPallets.length === 0) return;

    onConfirmSelection?.(selectedPallets);

    alert(
      `AMR ${
        mode === "emergency" ? "긴급" : "수동"
      } 호출: 파렛트 ${selectedPallets.length}개, 총 ${totalBox.toLocaleString()} BOX / ${totalEa.toLocaleString()} EA가 호출됩니다.`,
    );

    resetState();
    onClose();
  };

  /** ✅ 자동 호출 버튼 – 검색 결과가 한 종류의 상품일 때만 */
  const handleAutoCall = () => {
    if (!hasSearched || searchResults.length === 0) {
      alert("먼저 상품을 검색해 주세요.");
      return;
    }

    // 검색 결과 내 상품 종류 수 체크
    const productKeys = Array.from(
      new Set(
        searchResults.map(
          (p) => `${p.productCode}|${p.productName}`,
        ),
      ),
    );

    if (productKeys.length !== 1) {
      alert(
        "검색 결과에 여러 종류의 상품이 포함되어 있어 자동 호출을 할 수 없습니다.\n상품코드 등을 조금 더 구체적으로 입력해 주세요.",
      );
      return;
    }

    // "가장 가까운" 파렛트 1개 – 일단 첫 번째로 간주
    const target = searchResults[0];

    onConfirmSelection?.([target]);

    alert(
      `AMR 자동 호출: ${target.productName} 1파렛트(${target.id})가 호출됩니다.`,
    );

    resetState();
    onClose();
  };


  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[980px] h-[620px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div>
            <h2 className="text-sm font-semibold">
              AMR 수동 호출 · 로봇 / 제품 호출
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500">
              제품을 검색하여 해당 제품이 적재된 파렛트를 선택하고, 여러
              파렛트를 한 번에 호출할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 text-lg"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        {/* 바디: 좌 / 우 패널 */}
        <div className="flex-1 px-5 py-4 grid grid-cols-[1fr_auto_1fr] gap-4">
          {/* 🔹 좌측 : 검색 & 검색 결과(파렛트 목록) */}
          <div className="flex flex-col border rounded-xl bg-gray-50/60">
            {/* 검색 영역 */}
            <div className="px-3 py-2 border-b">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-800">
                  검색
                </p>
                <button
                  type="button"
                  onClick={handleAutoCall}
                  className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-[11px] hover:bg-orange-600"
                >
                  자동 호출
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs"
                  placeholder="상품 코드 또는 상품명으로 검색 (예: P-001, PET 500ml)"
                />
                <button
                  type="button"
                  onClick={onSearchClick}
                  className="px-3 py-1 rounded-md bg-gray-800 text-white text-xs"
                >
                  검색
                </button>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                검색 후 해당 상품이 적재된 파렛트 목록이 아래에 표시됩니다.
              </p>
            </div>

            {/* 검색 결과 목록 */}
            <div className="flex-1 overflow-auto px-3 py-2">
              <p className="text-[11px] text-gray-500 mb-1">
                검색 결과 파렛트 목록 ({searchResults.length}개)
              </p>

              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-gray-50 border-b">
                  <tr>
                    <th className="w-6 p-1 text-center">
                      <input
                        type="checkbox"
                        checked={
                          searchResults.length > 0 &&
                          leftChecked.length ===
                            searchResults.length
                        }
                        onChange={(e) =>
                          setLeftChecked(
                            e.target.checked
                              ? searchResults.map((p) => p.id)
                              : [],
                          )
                        }
                      />
                    </th>
                    <th className="p-1 text-left w-24">파렛트ID</th>
                    <th className="p-1 text-left">파렛트 위치</th>
                    <th className="p-1 text-left">상품명</th>
                    <th className="p-1 text-right w-16">BOX</th>
                    <th className="p-1 text-right w-20">
                      낱개(EA)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hasSearched && searchResults.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-3 text-center text-[11px] text-gray-400"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}

                  {!hasSearched && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-3 text-center text-[11px] text-gray-400"
                      >
                        상품을 검색하면 해당 상품이 적재된 파렛트
                        목록이 표시됩니다.
                      </td>
                    </tr>
                  )}

                  {searchResults.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b last:border-b-0 hover:bg-white"
                    >
                      <td className="p-1 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={leftChecked.includes(p.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setLeftChecked((prev) =>
                              checked
                                ? [...prev, p.id]
                                : prev.filter((id) => id !== p.id),
                            );
                          }}
                        />
                      </td>
                      <td className="p-1 align-middle">{p.id}</td>
                      <td className="p-1 align-middle">
                        {p.location}
                      </td>
                      <td className="p-1 align-middle">
                        {p.productName}
                      </td>
                      <td className="p-1 align-middle text-right">
                        {p.boxQty.toLocaleString()}
                      </td>
                      <td className="p-1 align-middle text-right">
                        {p.eaQty.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 🔸 가운데 : 화살표 버튼 */}
          <div className="flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={moveToRight}
              className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shadow hover:bg-blue-700 disabled:bg-gray-300"
              disabled={leftChecked.length === 0}
              title="선택 파렛트 추가"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={removeFromRight}
              className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center hover:bg-gray-300 disabled:bg-gray-100"
              disabled={rightChecked.length === 0}
              title="선택 파렛트 제거"
            >
              ◀
            </button>
          </div>

          {/* 🔹 우측 : 선택된 전체 내역 */}
          <div className="flex flex-col border rounded-xl bg-gray-50/60">
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-800">
                선택된 파렛트 전체 내역
              </p>
              <p className="text-[11px] text-gray-500">
                파렛트 {selectedPallets.length}개 · 총{" "}
                <span className="font-semibold text-gray-800">
                  {totalBox.toLocaleString()}
                </span>{" "}
                BOX /{" "}
                <span className="font-semibold text-gray-800">
                  {totalEa.toLocaleString()}
                </span>{" "}
                EA
              </p>
            </div>

            <div className="flex-1 overflow-auto px-3 py-2">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-gray-50 border-b">
                  <tr>
                    <th className="w-6 p-1 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedPallets.length > 0 &&
                          rightChecked.length ===
                            selectedPallets.length
                        }
                        onChange={(e) =>
                          setRightChecked(
                            e.target.checked
                              ? selectedPallets.map((p) => p.id)
                              : [],
                          )
                        }
                      />
                    </th>
                    <th className="p-1 text-left w-24">
                      파렛트ID
                    </th>
                    <th className="p-1 text-left">파렛트 위치</th>
                    <th className="p-1 text-left">상품명</th>
                    <th className="p-1 text-right w-16">BOX</th>
                    <th className="p-1 text-right w-20">
                      낱개(EA)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPallets.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-3 text-center text-[11px] text-gray-400"
                      >
                        아직 선택된 파렛트가 없습니다. 좌측에서
                        파렛트를 선택하여 추가해 주세요.
                      </td>
                    </tr>
                  )}

                  {selectedPallets.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b last:border-b-0 hover:bg-white"
                    >
                      <td className="p-1 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={rightChecked.includes(p.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setRightChecked((prev) =>
                              checked
                                ? [...prev, p.id]
                                : prev.filter(
                                    (id) => id !== p.id,
                                  ),
                            );
                          }}
                        />
                      </td>
                      <td className="p-1 align-middle">{p.id}</td>
                      <td className="p-1 align-middle">
                        {p.location}
                      </td>
                      <td className="p-1 align-middle">
                        {p.productName}
                      </td>
                      <td className="p-1 align-middle text-right">
                        {p.boxQty.toLocaleString()}
                      </td>
                      <td className="p-1 align-middle text-right">
                        {p.eaQty.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 하단 요약 & 버튼 */}
            <div className="px-3 py-2 border-t flex items-center justify-between text-[11px] text-gray-600">
              <div>
                <p>
                  · 선택된 파렛트 {selectedPallets.length}개 기준,
                  총{" "}
                  <span className="font-semibold text-gray-800">
                    {totalBox.toLocaleString()}
                  </span>{" "}
                  BOX /{" "}
                  <span className="font-semibold text-gray-800">
                    {totalEa.toLocaleString()}
                  </span>{" "}
                  EA 호출 예정입니다.
                </p>
                {productSummary.length > 0 ? (
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    {productSummary.map((s) => (
                      <li key={s.name}>
                        {s.name}:{" "}
                        {s.box.toLocaleString()} BOX /{" "}
                        {s.ea.toLocaleString()} EA
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1">
                    · 선택된 상품이 없습니다.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
                  onClick={handleClose}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:bg-gray-300"
                  disabled={selectedPallets.length === 0}
                  onClick={handleConfirm}
                >
                  {mode === "emergency"
                    ? "선택 파렛트 긴급 호출"
                    : "선택 파렛트 호출"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
