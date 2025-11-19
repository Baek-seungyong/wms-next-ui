// components/RobotProductCallModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

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
  mode: "manual" | "emergency";

  // 일반 수동 호출(지금은 안내만)
  onConfirmSelection?: (pallets: Pallet[]) => void;

  // 🔥 긴급 호출용 : 여러 상품 전달
  onConfirmEmergency?: (items: { code: string; name: string }[]) => void;
};

/** 🔹 데모용 상품 4개 × 파렛트 4개씩 = 16개 */
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
  mode = "manual",
  onConfirmSelection,
  onConfirmEmergency,
}: Props) {
  // ---------------------- state ----------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [leftChecked, setLeftChecked] = useState<string[]>([]);
  const [rightChecked, setRightChecked] = useState<string[]>([]);
  const [selectedPallets, setSelectedPallets] = useState<Pallet[]>([]);

  // ---------------------- memo values ----------------------
  // 검색 결과
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

  // 상품별 요약 (오른쪽 아래 표시용)
  const productSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        box: number;
        ea: number;
      }
    >();

    selectedPallets.forEach((p) => {
      const current = map.get(p.productName) ?? { box: 0, ea: 0 };
      current.box += p.boxQty;
      current.ea += p.eaQty;
      map.set(p.productName, current);
    });

    // [ [name, {box, ea}], ... ]
    return Array.from(map.entries());
  }, [selectedPallets]);

  // ---------------------- helpers ----------------------
  const resetState = () => {
    setSearchTerm("");
    setHasSearched(false);
    setLeftChecked([]);
    setRightChecked([]);
    setSelectedPallets([]);
  };

  // 모달이 닫힐 때마다 내부 상태 초기화
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

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
        if (!p) return;
        if (!map.has(p.id)) {
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

  // 선택 파렛트 호출
  const handleConfirm = () => {
    if (selectedPallets.length === 0) {
      alert("호출할 파렛트를 선택해 주세요.");
      return;
    }

    if (mode === "emergency" && onConfirmEmergency) {
      // 선택된 파렛트의 상품만 뽑아서 중복 제거
      const productMap = new Map<string, string>();
      selectedPallets.forEach((p) => {
        productMap.set(p.productCode, p.productName);
      });

      const items = Array.from(productMap.entries()).map(([code, name]) => ({
        code,
        name,
      }));

      if (items.length === 0) {
        alert("긴급 호출할 상품이 없습니다.");
        return;
      }

      onConfirmEmergency(items);

      alert(
        `${items[0].name}${
          items.length > 1 ? ` 외 ${items.length - 1}개 품목` : ""
        } 기준으로 긴급출고 주문이 생성됩니다.`,
      );
    } else {
      // 수동 호출: 단순 안내
      onConfirmSelection?.(selectedPallets);
      alert(`선택한 파렛트 ${selectedPallets.length}개를 호출합니다.`);
    }

    resetState();
    onClose();
  };

  // 자동 호출 (검색 결과가 한 상품일 때만)
  const handleAutoCall = () => {
    if (!hasSearched || searchResults.length === 0) {
      alert("먼저 상품을 검색한 후 자동 호출을 사용할 수 있습니다.");
      return;
    }

    const uniqueProducts = Array.from(
      new Set(searchResults.map((p) => p.productCode)),
    );

    if (uniqueProducts.length !== 1) {
      alert(
        "검색 결과에 여러 상품이 섞여 있어 자동 호출을 할 수 없습니다.\n검색어를 더 구체적으로 입력해 주세요.",
      );
      return;
    }

    const target = searchResults[0];

    if (mode === "emergency" && onConfirmEmergency) {
      onConfirmEmergency([
        { code: target.productCode, name: target.productName },
      ]);
      alert(
        `긴급출고로 ${target.productName} 1파렛트(${target.id})를 자동 호출합니다.`,
      );
    } else {
      onConfirmSelection?.([target]);
      alert(`${target.productName} 1파렛트(${target.id})를 자동 호출합니다.`);
    }

    resetState();
    onClose();
  };

  // ✅ 모든 hook 호출 이후에만 open 체크
  if (!open) return null;

  // ---------------------- JSX ----------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[980px] h-[620px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div>
            <h2 className="text-sm font-semibold">
              AMR 수동 호출 · 로봇 / 제품 호출
              {mode === "emergency" && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] bg-red-50 text-red-600 border border-red-100">
                  긴급 호출 모드
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500">
              제품을 검색하여 해당 제품이 적재된 파렛트를 선택하고, 여러
              파렛트를 한 번에 호출할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 text-lg"
            onClick={() => {
              resetState();
              onClose();
            }}
          >
            ×
          </button>
        </div>

        {/* 바디: 좌 / 우 패널 */}
        <div className="flex-1 px-5 py-4 grid grid-cols-[1fr_auto_1fr] gap-4">
          {/* 좌측 : 검색 & 검색 결과 */}
          <div className="flex flex-col border rounded-xl bg-gray-50/60">
            <div className="px-3 py-2 border-b">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-800">검색</p>
                <button
                  type="button"
                  onClick={handleAutoCall}
                  className="px-3 py-1 rounded-full text-[11px] border border-blue-500 text-blue-600 hover:bg-blue-50"
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
                          leftChecked.length === searchResults.length
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
                    <th className="p-1 text-right w-20">낱개(EA)</th>
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
                        상품을 검색하면 해당 상품이 적재된 파렛트 목록이
                        표시됩니다.
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
                      <td className="p-1 align-middle">{p.location}</td>
                      <td className="p-1 align-middle">{p.productName}</td>
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

          {/* 가운데 화살표 버튼 */}
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

          {/* 우측 : 선택된 전체 내역 */}
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
                          rightChecked.length === selectedPallets.length
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
                    <th className="p-1 text-left w-24">파렛트ID</th>
                    <th className="p-1 text-left">파렛트 위치</th>
                    <th className="p-1 text-left">상품명</th>
                    <th className="p-1 text-right w-16">BOX</th>
                    <th className="p-1 text-right w-20">낱개(EA)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPallets.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-3 text-center text-[11px] text-gray-400"
                      >
                        아직 선택된 파렛트가 없습니다. 좌측에서 파렛트를
                        선택하여 추가해 주세요.
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
                                : prev.filter((id) => id !== p.id),
                            );
                          }}
                        />
                      </td>
                      <td className="p-1 align-middle">{p.id}</td>
                      <td className="p-1 align-middle">{p.location}</td>
                      <td className="p-1 align-middle">{p.productName}</td>
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
              <div className="space-y-0.5">
                <p>
                  · 선택된 파렛트 {selectedPallets.length}개 기준, 총{" "}
                  <span className="font-semibold text-gray-800">
                    {totalBox.toLocaleString()}
                  </span>{" "}
                  BOX /{" "}
                  <span className="font-semibold text-gray-800">
                    {totalEa.toLocaleString()}
                  </span>{" "}
                  EA 호출 예정입니다.
                </p>

                {productSummary.length > 0 && (
                  <p>
                    · 상품별 요약:&nbsp;
                    {productSummary.map(([name, { box, ea }], idx) => (
                      <span key={name}>
                        {idx > 0 && " / "}
                        <span className="font-semibold">{name}</span>{" "}
                        {box.toLocaleString()} BOX / {ea.toLocaleString()} EA
                      </span>
                    ))}
                  </p>
                )}

                <p>· 실제 WMS 연동 시 각 파렛트의 위치 정보와 함께 전송됩니다.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
                  onClick={() => {
                    resetState();
                    onClose();
                  }}
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
