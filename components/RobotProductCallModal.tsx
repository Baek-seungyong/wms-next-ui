// components/RobotProductCallModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Pallet = {
  id: string; // 파렛트 번호
  productCode: string; // 상품코드
  productName: string; // 상품명
  location: string; // 파렛트 위치
  boxQty: number; // 박스 수량
  eaQty: number; // 낱개 수량(EA)
};

type ToteBox = {
  id: string; // 토트박스 번호
  productCode: string; // 상품코드
  productName: string; // 상품명
  location: string; // 토트 위치(피킹창고 고정 구역)
  boxQty: number; // 박스 수량(토트는 보통 0일 수 있음)
  eaQty: number; // 낱개 수량(EA)
};

// 🔹 호출 위치 타입
type CallDestination =
  | "3층창고"
  | "2층창고"
  | "피킹창고"
  | "생산라인"
  | "입출고라인";

type TabKey = "pallet" | "tote";

type Props = {
  open: boolean;
  onClose: () => void;
  mode: "manual" | "emergency";

  // 일반 수동 호출(지금은 안내만)
  onConfirmSelection?: (pallets: Pallet[]) => void;

  // 🔥 긴급 호출용 : 여러 상품 전달
  onConfirmEmergency?: (items: { code: string; name: string }[]) => void;
};

/** ✅ 데모용 파렛트 */
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

/** ✅ 데모용 토트(피킹창고에서만 존재/작동) */
const ALL_TOTES: ToteBox[] = [
  {
    id: "TOTE-001-01",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    location: "피킹창고 PZ-A-01",
    boxQty: 0,
    eaQty: 120,
  },
  {
    id: "TOTE-001-02",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    location: "피킹창고 PZ-A-02",
    boxQty: 0,
    eaQty: 80,
  },
  {
    id: "TOTE-013-01",
    productCode: "P-013",
    productName: "PET 1L 반투명",
    location: "피킹창고 PZ-B-01",
    boxQty: 0,
    eaQty: 60,
  },
  {
    id: "TOTE-201-01",
    productCode: "C-201",
    productName: "캡 28파이 화이트",
    location: "피킹창고 PZ-C-03",
    boxQty: 0,
    eaQty: 500,
  },
  {
    id: "TOTE-009-01",
    productCode: "L-009",
    productName: "라벨 500ml 화이트",
    location: "피킹창고 PZ-D-02",
    boxQty: 0,
    eaQty: 300,
  },
];

function buildProductMaster(): { code: string; name: string }[] {
  const map = new Map<string, string>();
  ALL_PALLETS.forEach((p) => map.set(p.productCode, p.productName));
  ALL_TOTES.forEach((t) => map.set(t.productCode, t.productName));
  return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
}

const PRODUCT_MASTER = buildProductMaster();

export function RobotProductCallModal({
  open,
  onClose,
  mode = "manual",
  onConfirmSelection,
  onConfirmEmergency,
}: Props) {
  // ---------------------- state ----------------------
  const [tab, setTab] = useState<TabKey>("pallet");

  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [leftChecked, setLeftChecked] = useState<string[]>([]);
  const [rightChecked, setRightChecked] = useState<string[]>([]);

  // 파렛트/토트 각각 선택 리스트
  const [selectedPallets, setSelectedPallets] = useState<Pallet[]>([]);
  const [selectedTotes, setSelectedTotes] = useState<ToteBox[]>([]);

  // 🔹 자동 검색용
  const [selectedProduct, setSelectedProduct] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 🔹 호출 위치 state
  const [callDestination, setCallDestination] =
    useState<CallDestination>("피킹창고");

  // ---------------------- memo values ----------------------
  // 현재 탭 기준 데이터
  const activeRows = useMemo(() => {
    return tab === "pallet" ? ALL_PALLETS : ALL_TOTES;
  }, [tab]);

  // 검색 결과
  const searchResults = useMemo(() => {
    const keyword = selectedProduct?.code ?? searchTerm;
    if (!hasSearched || !keyword.trim()) return [];
    const q = keyword.trim().toLowerCase();

    return activeRows.filter(
      (p: any) =>
        String(p.productCode).toLowerCase().includes(q) ||
        String(p.productName).toLowerCase().includes(q),
    );
  }, [searchTerm, hasSearched, selectedProduct, activeRows]);

  // 자동완성용 상품 리스트
  const productSuggestions = useMemo(() => {
    const q = searchTerm.trim();
    if (!q) return [];
    const upper = q.toUpperCase();
    const lower = q.toLowerCase();

    return PRODUCT_MASTER.filter(
      (p) =>
        p.code.toUpperCase().includes(upper) ||
        p.name.toLowerCase().includes(lower),
    );
  }, [searchTerm]);

  const selectedRowsCount = tab === "pallet" ? selectedPallets.length : selectedTotes.length;

  const totalBox = useMemo(() => {
    const rows = tab === "pallet" ? selectedPallets : selectedTotes;
    return rows.reduce((sum: number, p: any) => sum + (p.boxQty ?? 0), 0);
  }, [tab, selectedPallets, selectedTotes]);

  const totalEa = useMemo(() => {
    const rows = tab === "pallet" ? selectedPallets : selectedTotes;
    return rows.reduce((sum: number, p: any) => sum + (p.eaQty ?? 0), 0);
  }, [tab, selectedPallets, selectedTotes]);

  // 상품별 요약 (오른쪽 아래 표시용)
  const productSummary = useMemo(() => {
    const rows = tab === "pallet" ? selectedPallets : selectedTotes;

    const map = new Map<
      string,
      {
        box: number;
        ea: number;
      }
    >();

    rows.forEach((p: any) => {
      const current = map.get(p.productName) ?? { box: 0, ea: 0 };
      current.box += p.boxQty ?? 0;
      current.ea += p.eaQty ?? 0;
      map.set(p.productName, current);
    });

    return Array.from(map.entries());
  }, [tab, selectedPallets, selectedTotes]);

  // ---------------------- helpers ----------------------
  const resetAllState = () => {
    setSearchTerm("");
    setHasSearched(false);
    setLeftChecked([]);
    setRightChecked([]);
    setSelectedPallets([]);
    setSelectedTotes([]);
    setSelectedProduct(null);
    setShowSuggestions(false);
    setTab("pallet");
    setCallDestination("피킹창고");
  };

  const resetSelectionOnly = () => {
    setLeftChecked([]);
    setRightChecked([]);
    setSelectedPallets([]);
    setSelectedTotes([]);
  };

  // 모달이 닫힐 때마다 내부 상태 초기화
  useEffect(() => {
    if (!open) resetAllState();
  }, [open]);

  // 탭이 토트로 바뀌면 호출 위치는 "피킹창고" 고정
  useEffect(() => {
    if (tab === "tote") {
      setCallDestination("피킹창고");
    }
    // 탭 변경 시 선택 내역은 초기화(혼동 방지)
    resetSelectionOnly();
    // 검색어/선택상품은 유지(원하면 여기서도 reset 가능)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onSearchClick = () => {
    setHasSearched(true);
    setLeftChecked([]);

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const found =
        PRODUCT_MASTER.find((p) => p.code.toLowerCase().startsWith(q)) ??
        PRODUCT_MASTER.find((p) => p.name.toLowerCase().includes(q));

      setSelectedProduct(found ?? null);
    } else {
      setSelectedProduct(null);
    }
    setShowSuggestions(false);
  };

  const getIdColLabel = () => (tab === "pallet" ? "파렛트ID" : "토트ID");
  const getTitleLabel = () => (tab === "pallet" ? "선택된 파렛트 전체 내역" : "선택된 토트 전체 내역");
  const getMoveRightTitle = () => (tab === "pallet" ? "선택 파렛트 추가" : "선택 토트 추가");
  const getMoveLeftTitle = () => (tab === "pallet" ? "선택 파렛트 제거" : "선택 토트 제거");
  const getConfirmBtnLabel = () => {
    if (mode === "emergency") return tab === "pallet" ? "선택 파렛트 긴급 호출" : "선택 토트 긴급 호출";
    return tab === "pallet" ? "선택 파렛트 호출" : "선택 토트 호출";
  };

  // ▶ 좌측(검색결과) → 우측(전체 내역) 이동
  const moveToRight = () => {
    if (leftChecked.length === 0) return;

    if (tab === "pallet") {
      setSelectedPallets((prev) => {
        const map = new Map<string, Pallet>();
        prev.forEach((p) => map.set(p.id, p));

        leftChecked.forEach((id) => {
          const p = (searchResults as Pallet[]).find((x) => x.id === id);
          if (!p) return;
          if (!map.has(p.id)) map.set(p.id, p);
        });

        return Array.from(map.values());
      });
    } else {
      setSelectedTotes((prev) => {
        const map = new Map<string, ToteBox>();
        prev.forEach((t) => map.set(t.id, t));

        leftChecked.forEach((id) => {
          const t = (searchResults as ToteBox[]).find((x) => x.id === id);
          if (!t) return;
          if (!map.has(t.id)) map.set(t.id, t);
        });

        return Array.from(map.values());
      });
    }

    setLeftChecked([]);
  };

  // ◀ 우측 → 제거
  const removeFromRight = () => {
    if (rightChecked.length === 0) return;

    if (tab === "pallet") {
      setSelectedPallets((prev) => prev.filter((p) => !rightChecked.includes(p.id)));
    } else {
      setSelectedTotes((prev) => prev.filter((t) => !rightChecked.includes(t.id)));
    }

    setRightChecked([]);
  };

  // 선택 호출
  const handleConfirm = () => {
    const rows = tab === "pallet" ? selectedPallets : selectedTotes;

    if (rows.length === 0) {
      alert(tab === "pallet" ? "호출할 파렛트를 선택해 주세요." : "호출할 토트를 선택해 주세요.");
      return;
    }

    // 토트 탭은 호출 위치 고정
    const dest: CallDestination = tab === "tote" ? "피킹창고" : callDestination;

    if (mode === "emergency" && onConfirmEmergency) {
      const productMap = new Map<string, string>();
      rows.forEach((p: any) => productMap.set(p.productCode, p.productName));

      const items = Array.from(productMap.entries()).map(([code, name]) => ({ code, name }));

      if (items.length === 0) {
        alert("긴급 호출할 상품이 없습니다.");
        return;
      }

      onConfirmEmergency(items);

      alert(
        `${items[0].name}${
          items.length > 1 ? ` 외 ${items.length - 1}개 품목` : ""
        } 기준으로 ${dest}로 긴급출고 주문이 생성됩니다.`,
      );
    } else {
      if (tab === "pallet") {
        onConfirmSelection?.(rows as Pallet[]);
        alert(`${dest}로 선택한 파렛트 ${rows.length}개를 호출합니다. (지게차로봇)`);
      } else {
        // 토트는 피킹존 내부 동작
        alert(`피킹창고로 선택한 토트 ${rows.length}개를 호출합니다. (피킹존 내부)`);
      }
    }

    resetAllState();
    onClose();
  };

  // 자동 호출 (검색 결과가 한 상품일 때만)
  const handleAutoCall = () => {
    if (!hasSearched || searchResults.length === 0) {
      alert("먼저 상품을 검색한 후 자동 호출을 사용할 수 있습니다.");
      return;
    }

    const uniqueProducts = Array.from(new Set(searchResults.map((p: any) => p.productCode)));

    if (uniqueProducts.length !== 1) {
      alert(
        "검색 결과에 여러 상품이 섞여 있어 자동 호출을 할 수 없습니다.\n검색어를 더 구체적으로 입력해 주세요.",
      );
      return;
    }

    const target: any = searchResults[0];
    const dest: CallDestination = tab === "tote" ? "피킹창고" : callDestination;

    if (mode === "emergency" && onConfirmEmergency) {
      onConfirmEmergency([{ code: target.productCode, name: target.productName }]);
      alert(`긴급출고로 ${target.productName} 1${tab === "pallet" ? "파렛트" : "토트"}(${target.id})를 ${dest}로 자동 호출합니다.`);
    } else {
      if (tab === "pallet") {
        onConfirmSelection?.([target as Pallet]);
        alert(`${target.productName} 1파렛트(${target.id})를 ${dest}로 자동 호출합니다. (지게차로봇)`);
      } else {
        alert(`${target.productName} 1토트(${target.id})를 피킹창고로 자동 호출합니다. (피킹존 내부)`);
      }
    }

    resetAllState();
    onClose();
  };

  // 🔵 빈 파렛트 호출 (파렛트 탭에서만)
  const handleCallEmptyPallet = () => {
    const dest: CallDestination = callDestination;
    alert(`${dest}로 빈 파렛트 호출을 전송했습니다. (데모)`);
  };

  // ✅ open 체크
  if (!open) return null;

  const canAutoCall = hasSearched && searchResults.length > 0;

  // 우측 선택 리스트 (탭에 따라)
  const rightRows: any[] = tab === "pallet" ? selectedPallets : selectedTotes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[980px] h-[620px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">제품 수동 호출</h2>
              {mode === "emergency" && (
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-red-50 text-red-600 border border-red-100">
                  긴급 호출 모드
                </span>
              )}
            </div>

            <p className="mt-1 text-[11px] text-gray-500">
              상품 기반으로 {tab === "pallet" ? "파렛트를 선택" : "토트를 선택"}하여 호출할 수 있습니다.
              {tab === "tote" && " (토트는 피킹창고에서만 작동)"}
            </p>

            {/* ✅ 상단 탭 */}
            <div className="mt-2 flex items-center gap-2">
              <div className="inline-flex rounded-full border bg-gray-50 p-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTab("pallet")}
                  className={`px-3 py-1 rounded-full ${
                    tab === "pallet"
                      ? "bg-white shadow border text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  파렛트
                </button>
                <button
                  type="button"
                  onClick={() => setTab("tote")}
                  className={`px-3 py-1 rounded-full ${
                    tab === "tote"
                      ? "bg-white shadow border text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  토트박스
                </button>
              </div>

              {/* 🔹 호출 위치 선택 UI (토트 탭에서는 고정) */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-sm font-semibold text-gray-800">호출 위치</span>

                {tab === "pallet" ? (
                  <select
                    value={callDestination}
                    onChange={(e) => setCallDestination(e.target.value as CallDestination)}
                    className="rounded-md border border-gray-400 bg-white px-2 py-1 text-[12px]"
                  >
                    <option value="3층창고">3층창고</option>
                    <option value="2층창고">2층창고</option>
                    <option value="피킹창고">피킹창고</option>
                    <option value="생산라인">생산라인</option>
                    <option value="입출고라인">입출고라인</option>
                  </select>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <span className="rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-[12px] text-gray-600">
                      피킹창고 (고정)
                    </span>
                    <span className="text-[11px] text-gray-400">토트는 피킹존 내부에서만 호출됨</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 빈 파렛트 호출 + 닫기 */}
          <div className="flex items-center gap-2">
            {tab === "pallet" && (
              <button
                type="button"
                onClick={handleCallEmptyPallet}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                빈 파렛트 호출
              </button>
            )}

            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 text-lg"
              onClick={() => {
                resetAllState();
                onClose();
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* 바디 */}
        <div className="flex-1 px-5 py-4 grid grid-cols-[1fr_auto_1fr] gap-4">
          {/* 좌측 : 검색 & 검색 결과 */}
          <div className="flex flex-col border rounded-xl bg-gray-50/60">
            <div className="px-3 py-2 border-b">
              <p className="mb-2 text-xs font-semibold text-gray-800">검색</p>

              <div className="flex items-center gap-2">
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearchTerm(v);
                    setHasSearched(false);
                    setSelectedProduct(null);
                    setShowSuggestions(!!v);
                  }}
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

              {/* 자동완성 */}
              {showSuggestions && productSuggestions.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px] shadow-sm">
                  {productSuggestions.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => {
                        setSearchTerm(p.code);
                        setSelectedProduct(p);
                        setHasSearched(true);
                        setLeftChecked([]);
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
                    >
                      <span className="text-gray-800">{p.name}</span>
                      <span className="ml-2 font-mono text-gray-500">{p.code}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 선택된 상품 표시 */}
              <div className="mt-1 text-[11px] text-gray-600">
                {selectedProduct ? (
                  <>
                    선택된 상품:&nbsp;
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[11px] text-blue-700">
                      {selectedProduct.code}
                    </span>
                    <span className="ml-1 text-gray-700">{selectedProduct.name}</span>
                  </>
                ) : (
                  <span className="text-gray-400">선택된 상품이 없습니다. 위에서 상품을 선택해 주세요.</span>
                )}
              </div>

              {/* 자동 호출 버튼 */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleAutoCall}
                  disabled={!canAutoCall}
                  className="px-3 py-1 rounded-full text-[11px] border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:border-gray-200 disabled:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  자동 호출
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-3 py-2">
              <p className="text-[11px] text-gray-500 mb-1">
                검색 결과 {tab === "pallet" ? "파렛트" : "토트"} 목록 ({searchResults.length}개)
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
                          setLeftChecked(e.target.checked ? searchResults.map((p: any) => p.id) : [])
                        }
                      />
                    </th>
                    <th className="p-1 text-left w-24">{getIdColLabel()}</th>
                    <th className="p-1 text-left">위치</th>
                    <th className="p-1 text-left">상품명</th>
                    <th className="p-1 text-right w-16">BOX</th>
                    <th className="p-1 text-right w-20">낱개(EA)</th>
                  </tr>
                </thead>
                <tbody>
                  {hasSearched && searchResults.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-3 text-center text-[11px] text-gray-400">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}

                  {!hasSearched && (
                    <tr>
                      <td colSpan={6} className="p-3 text-center text-[11px] text-gray-400">
                        상품을 검색하면 해당 상품이 적재된 {tab === "pallet" ? "파렛트" : "토트"} 목록이 표시됩니다.
                      </td>
                    </tr>
                  )}

                  {searchResults.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-b-0 hover:bg-white">
                      <td className="p-1 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={leftChecked.includes(p.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setLeftChecked((prev) =>
                              checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                            );
                          }}
                        />
                      </td>
                      <td className="p-1 align-middle">{p.id}</td>
                      <td className="p-1 align-middle">{p.location}</td>
                      <td className="p-1 align-middle">{p.productName}</td>
                      <td className="p-1 align-middle text-right">{Number(p.boxQty ?? 0).toLocaleString()}</td>
                      <td className="p-1 align-middle text-right">{Number(p.eaQty ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 가운데 화살표 */}
          <div className="flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={moveToRight}
              className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shadow hover:bg-blue-700 disabled:bg-gray-300"
              disabled={leftChecked.length === 0}
              title={getMoveRightTitle()}
            >
              ▶
            </button>
            <button
              type="button"
              onClick={removeFromRight}
              className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center hover:bg-gray-300 disabled:bg-gray-100"
              disabled={rightChecked.length === 0}
              title={getMoveLeftTitle()}
            >
              ◀
            </button>
          </div>

          {/* 우측 : 선택된 전체 내역 */}
          <div className="flex flex-col border rounded-xl bg-gray-50/60">
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-800">{getTitleLabel()}</p>
              <p className="text-[11px] text-gray-500">
                {tab === "pallet" ? "파렛트" : "토트"} {selectedRowsCount}개 · 총{" "}
                <span className="font-semibold text-gray-800">{totalBox.toLocaleString()}</span> BOX /{" "}
                <span className="font-semibold text-gray-800">{totalEa.toLocaleString()}</span> EA
              </p>
            </div>

            <div className="flex-1 overflow-auto px-3 py-2">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-gray-50 border-b">
                  <tr>
                    <th className="w-6 p-1 text-center">
                      <input
                        type="checkbox"
                        checked={rightRows.length > 0 && rightChecked.length === rightRows.length}
                        onChange={(e) => setRightChecked(e.target.checked ? rightRows.map((p: any) => p.id) : [])}
                      />
                    </th>
                    <th className="p-1 text-left w-24">{getIdColLabel()}</th>
                    <th className="p-1 text-left">위치</th>
                    <th className="p-1 text-left">상품명</th>
                    <th className="p-1 text-right w-16">BOX</th>
                    <th className="p-1 text-right w-20">낱개(EA)</th>
                  </tr>
                </thead>
                <tbody>
                  {rightRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-3 text-center text-[11px] text-gray-400">
                        아직 선택된 {tab === "pallet" ? "파렛트" : "토트"}가 없습니다. 좌측에서 선택하여 추가해 주세요.
                      </td>
                    </tr>
                  )}

                  {rightRows.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-b-0 hover:bg-white">
                      <td className="p-1 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={rightChecked.includes(p.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setRightChecked((prev) =>
                              checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                            );
                          }}
                        />
                      </td>
                      <td className="p-1 align-middle">{p.id}</td>
                      <td className="p-1 align-middle">{p.location}</td>
                      <td className="p-1 align-middle">{p.productName}</td>
                      <td className="p-1 align-middle text-right">{Number(p.boxQty ?? 0).toLocaleString()}</td>
                      <td className="p-1 align-middle text-right">{Number(p.eaQty ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 하단 요약 & 버튼 */}
            <div className="px-3 py-2 border-t flex items-center justify-between text-[11px] text-gray-600">
              <div className="space-y-0.5">
                <p>
                  · 선택된 {tab === "pallet" ? "파렛트" : "토트"} {selectedRowsCount}개 기준, 총{" "}
                  <span className="font-semibold text-gray-800">{totalBox.toLocaleString()}</span> BOX /{" "}
                  <span className="font-semibold text-gray-800">{totalEa.toLocaleString()}</span> EA 호출 예정
                </p>

                {productSummary.length > 0 && (
                  <p>
                    · 상품별 요약:&nbsp;
                    {productSummary.map(([name, { box, ea }], idx) => (
                      <span key={name}>
                        {idx > 0 && " / "}
                        <span className="font-semibold">{name}</span> {box.toLocaleString()} BOX /{" "}
                        {ea.toLocaleString()} EA
                      </span>
                    ))}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
                  onClick={() => {
                    resetAllState();
                    onClose();
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:bg-gray-300"
                  disabled={rightRows.length === 0}
                  onClick={handleConfirm}
                >
                  {getConfirmBtnLabel()}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* footer 같은건 필요하면 여기 추가 */}
      </div>
    </div>
  );
}