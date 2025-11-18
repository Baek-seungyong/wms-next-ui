// components/RobotProductCallModal.tsx
"use client";

import { useMemo, useState } from "react";

type Mode = "normal" | "emergency";

type Props = {
  open: boolean;
  mode?: Mode; // "normal" | "emergency"
  onClose: () => void;
  // 긴급 모드일 때 선택 완료 시 호출
  onConfirmEmergency?: (productName: string, qty: number) => void;
};

// ─────────────────────────────────────────────
// 🔹 데모용 상품/파렛트 Mock 데이터
// ─────────────────────────────────────────────
type DemoProduct = {
  code: string;
  name: string;
};

type DemoPallet = {
  id: string;
  productCode: string;
  location: string;
  rack: string;
  boxQty: number;
  eaQty: number;
  status: "정상" | "부분";
};

const demoProducts: DemoProduct[] = [
  { code: "P-001", name: "PET 500ml 투명" },
  { code: "P-013", name: "PET 1L 반투명" },
  { code: "C-201", name: "캡 28파이 화이트" },
  { code: "L-009", name: "라벨 500ml 화이트" },
];

const demoPallets: DemoPallet[] = [
  {
    id: "PAL-3F-001",
    productCode: "P-001",
    location: "3층 플랫파렛트",
    rack: "3F-A-01",
    boxQty: 10,
    eaQty: 1200,
    status: "정상",
  },
  {
    id: "PAL-3F-002",
    productCode: "P-013",
    location: "3층 플랫파렛트",
    rack: "3F-B-05",
    boxQty: 8,
    eaQty: 800,
    status: "부분",
  },
  {
    id: "PAL-2F-201",
    productCode: "C-201",
    location: "2층 잔량파렛트",
    rack: "2F-C-12",
    boxQty: 5,
    eaQty: 600,
    status: "정상",
  },
  {
    id: "PAL-2F-202",
    productCode: "L-009",
    location: "2층 잔량파렛트",
    rack: "2F-D-03",
    boxQty: 7,
    eaQty: 900,
    status: "부분",
  },
];

// ─────────────────────────────────────────────

export function RobotProductCallModal({
  open,
  mode = "normal",
  onClose,
  onConfirmEmergency,
}: Props) {
  if (!open) return null;

  const isEmergency = mode === "emergency";

  const [search, setSearch] = useState("");
  const [searchedProduct, setSearchedProduct] = useState<DemoProduct | null>(null);
  const [visiblePallets, setVisiblePallets] = useState<DemoPallet[]>([]);
  const [selectedPalletIds, setSelectedPalletIds] = useState<string[]>([]);

  // 선택된 파렛트 수 / 합계
  const selectedPallets = useMemo(
    () => visiblePallets.filter((p) => selectedPalletIds.includes(p.id)),
    [visiblePallets, selectedPalletIds],
  );

  const selectedPalletCount = selectedPallets.length;

  const totalBox = selectedPallets.reduce((sum, p) => sum + p.boxQty, 0);
  const totalEa = selectedPallets.reduce((sum, p) => sum + p.eaQty, 0);

  // 🔍 검색 버튼 클릭
  const handleSearch = () => {
    const keyword = search.trim();
    if (!keyword) {
      window.alert("상품 코드나 이름을 입력해 주세요.");
      return;
    }

    const product =
      demoProducts.find(
        (p) =>
          p.code.toLowerCase().includes(keyword.toLowerCase()) ||
          p.name.toLowerCase().includes(keyword.toLowerCase()),
      ) ?? null;

    if (!product) {
      setSearchedProduct(null);
      setVisiblePallets([]);
      setSelectedPalletIds([]);
      window.alert("검색 결과가 없습니다. (데모용 4개 상품만 등록됨)");
      return;
    }

    setSearchedProduct(product);
    const pallets = demoPallets.filter((p) => p.productCode === product.code);
    setVisiblePallets(pallets);
    setSelectedPalletIds([]);
  };

  // 개별 체크박스
  const togglePallet = (id: string) => {
    setSelectedPalletIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  // 전체 선택
  const toggleAll = () => {
    if (selectedPalletIds.length === visiblePallets.length) {
      setSelectedPalletIds([]);
    } else {
      setSelectedPalletIds(visiblePallets.map((p) => p.id));
    }
  };

  // 호출 버튼 (일반 / 긴급 공용)
  const handleCallClick = () => {
  const productName =
    searchedProduct?.name || search.trim() || "긴급출고 상품";

  if (selectedPallets.length === 0 && !isEmergency) {
    // 일반 수동 호출일 때는 파렛트 선택 필수
    window.alert("호출할 파렛트를 선택해 주세요.");
    return;
  }

  if (isEmergency && onConfirmEmergency) {
    // 🔥 수량은 여기서 정하지 않음. 주문 상세 화면에서 입력.
    const qty = 0;

    onConfirmEmergency(productName, qty);
    window.alert(
      "선택한 파렛트로 AMR를 긴급 호출하고, 긴급출고 주문을 생성합니다. (데모)",
    );
  } else {
    window.alert(
      `선택한 파렛트 ${selectedPalletCount}개에 대해 AMR를 호출합니다. (데모)`,
    );
  }

  onClose();
};


  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[980px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">
              {isEmergency ? "긴급 호출 · 로봇 / 제품 호출" : "AMR 수동 호출 · 로봇 / 제품 호출"}
            </h2>
            {isEmergency && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px]">
                긴급출고 주문 생성
              </span>
            )}
          </div>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 text-sm"
            onClick={onClose}
          >
            닫기 ✕
          </button>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-hidden flex divide-x">
          {/* 좌측: 상품 검색 + 선택 정보 */}
          <div className="w-[360px] flex flex-col p-4 gap-3">
            <div>
              <p className="text-[11px] text-gray-500 mb-1">
                특정 제품을 기준으로 3층 플랫파렛트 / 2층 잔량파렛트를 조회하고, 호출할 파렛트를 선택합니다.
              </p>
              <label className="block text-[11px] text-gray-700 mb-1">상품 검색</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs"
                  placeholder="제품 코드 또는 이름 (예: P-001 / PET 500ml)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-1 rounded-md bg-gray-900 text-white text-xs"
                  onClick={handleSearch}
                >
                  검색
                </button>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                예시 상품: P-001, P-013, C-201, L-009 (또는 이름 일부로 검색)
              </p>
            </div>

            <div className="flex-1 border rounded-lg p-3 bg-gray-50">
              <p className="text-[11px] font-semibold mb-1">선택된 상품</p>
              {searchedProduct ? (
                <div className="space-y-1 text-[11px]">
                  <p>
                    코드:{" "}
                    <span className="font-semibold">{searchedProduct.code}</span>
                  </p>
                  <p>
                    상품명:{" "}
                    <span className="font-semibold">{searchedProduct.name}</span>
                  </p>
                  <p className="mt-1 text-gray-500">
                    아래 파렛트 목록은 이 상품이 적재된 파렛트만 표시됩니다.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500">
                  아직 선택된 상품이 없습니다. 상품을 검색해 주세요.
                </p>
              )}
            </div>

            <div className="border rounded-lg p-3 bg-gray-50">
              <p className="text-[11px] font-semibold mb-2">선택된 파렛트 합계</p>
              <p className="text-[11px] text-gray-500">
                전체 박스: <span className="font-semibold">{totalBox} BOX</span>
              </p>
              <p className="text-[11px] text-gray-500">
                전체 수량: <span className="font-semibold">{totalEa} EA</span>
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                여러 파렛트를 동시에 선택해서 호출할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 우측: 파렛트 목록 */}
          <div className="flex-1 flex flex-col p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-gray-500">
                3층 플랫파렛트와 2층 잔량파렛트를 한 화면에서 조회하고, 호출할 파렛트를 선택합니다.
              </p>
              <p className="text-[11px] text-gray-500">
                선택된 파렛트 수:{" "}
                <span className="font-semibold">{selectedPalletCount}개</span>
              </p>
            </div>

            <div className="flex-1 border rounded-lg overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-[11px] text-gray-500">
                  <tr>
                    <th className="p-2 border-b w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={toggleAll}
                        checked={
                          visiblePallets.length > 0 &&
                          selectedPalletIds.length === visiblePallets.length
                        }
                      />
                    </th>
                    <th className="p-2 border-b text-left w-32">파렛트ID</th>
                    <th className="p-2 border-b text-left w-40">위치</th>
                    <th className="p-2 border-b text-left w-40">랙 / 상세위치</th>
                    <th className="p-2 border-b text-center w-28">박스수량</th>
                    <th className="p-2 border-b text-center w-28">낱개 수량</th>
                    <th className="p-2 border-b text-center w-28">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePallets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-4 text-center text-[11px] text-gray-400"
                      >
                        상품을 검색하면 해당 상품이 적재된 파렛트 목록이 표시됩니다. (데모용
                        4개 파렛트)
                      </td>
                    </tr>
                  ) : (
                    visiblePallets.map((p) => {
                      const checked = selectedPalletIds.includes(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={checked ? "bg-blue-50" : "hover:bg-gray-50"}
                        >
                          <td className="p-2 border-t text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePallet(p.id)}
                            />
                          </td>
                          <td className="p-2 border-t">{p.id}</td>
                          <td className="p-2 border-t">{p.location}</td>
                          <td className="p-2 border-t">{p.rack}</td>
                          <td className="p-2 border-t text-center">
                            {p.boxQty.toLocaleString()} BOX
                          </td>
                          <td className="p-2 border-t text-center">
                            {p.eaQty.toLocaleString()} EA
                          </td>
                          <td className="p-2 border-t text-center">
                            {p.status === "정상" ? (
                              <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[11px]">
                                재고 정상
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-[11px]">
                                부분 잔량
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 하단 버튼 */}
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-[11px] hover:bg-gray-200"
                onClick={() => setSelectedPalletIds([])}
              >
                선택 해제
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-[11px] hover:bg-gray-800"
                  onClick={handleCallClick}
                >
                  {isEmergency ? "선택 파렛트 긴급 호출" : "선택 파렛트 호출"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
