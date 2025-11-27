"use client";

import { useEffect, useMemo, useState } from "react";

type ReceivingModalProps = {
  open: boolean;
  onClose: () => void;
};

type ReceivingItem = {
  id: number;
  code: string;
  name: string;
  qty: number;
};

type ProductMaster = {
  code: string;
  name: string;
};

/** 🔹 예시용 상품 마스터 (자동완성에 사용) */
const PRODUCT_MASTER: ProductMaster[] = [
  { code: "P-1001", name: "PET 500ml 투명" },
  { code: "P-1002", name: "PET 300ml 밀키" },
  { code: "P-2001", name: "PET 1L 투명" },
  { code: "C-2001", name: "캡 28파이 화이트" },
  { code: "L-5001", name: "라벨 500ml 화이트" },
];

/** 🔹 예시 파렛트 목록 */
const PALLET_MASTER: { id: string; desc: string }[] = [
  { id: "PLT-1001", desc: "3층 플랫파렛트 A-01" },
  { id: "PLT-1002", desc: "3층 플랫파렛트 A-02" },
  { id: "PLT-2001", desc: "2층 잔량파렛트 B-01" },
  { id: "PLT-2002", desc: "2층 잔량파렛트 B-02" },
  { id: "PLT-3001", desc: "1층 입고 대기존 P-01" },
];

export function ReceivingModal({ open, onClose }: ReceivingModalProps) {
  const [palletQR, setPalletQR] = useState("");
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState<ReceivingItem[]>([]);
  const [targetLocation, setTargetLocation] = useState<"피킹" | "2-1" | "3-1">(
    "피킹",
  );
  const [selectedProduct, setSelectedProduct] = useState<ProductMaster | null>(
    null,
  );
  const [showSuggestions, setShowSuggestions] = useState(false);

  /** 🔹 모달 닫힐 때 내부 상태 전체 초기화 */
  useEffect(() => {
    if (!open) {
      setPalletQR("");
      setSearchText("");
      setItems([]);
      setTargetLocation("피킹");
      setSelectedProduct(null);
      setShowSuggestions(false);
    }
  }, [open]);

  /** 🔹 검색어 기준 상품 자동완성 리스트 */
  const productSuggestions = useMemo(() => {
    const q = searchText.trim();
    if (!q) return [];
    const upper = q.toUpperCase();
    const lower = q.toLowerCase();

    return PRODUCT_MASTER.filter(
      (p) =>
        p.code.toUpperCase().includes(upper) ||
        p.name.toLowerCase().includes(lower),
    );
  }, [searchText]);

  /** 🔹 파렛트 번호 자동완성 리스트 */
  const palletSuggestions = useMemo(() => {
    const q = palletQR.trim();
    if (!q) return [];
    const upper = q.toUpperCase();

    return PALLET_MASTER.filter(
      (p) =>
        p.id.toUpperCase().includes(upper) ||
        p.desc.toLowerCase().includes(q.toLowerCase()),
    );
  }, [palletQR]);

  if (!open) return null;

  /** 🔹 입고 품목 목록에 한 줄 추가 */
  const handleAddItem = (productFromSuggestion?: ProductMaster) => {
    const trimmed = searchText.trim();

    // 1) 자동완성에서 클릭한 상품이 넘어온 경우 최우선
    let base:
      | ProductMaster
      | {
          code: string;
          name: string;
        }
      | null = null;

    if (productFromSuggestion) {
      base = productFromSuggestion;
    } else if (selectedProduct) {
      // 2) 선택된 상품이 있는 경우
      base = selectedProduct;
    } else if (trimmed) {
      // 3) 입력값으로 마스터 검색
      const t = trimmed.toLowerCase();
      base =
        PRODUCT_MASTER.find(
          (p) =>
            p.code.toLowerCase() === t ||
            p.code.toLowerCase().startsWith(t) ||
            p.name.toLowerCase().includes(t),
        ) ?? {
          code: trimmed,
          name: trimmed,
        };
    }

    if (!base) return; // 아무 정보도 없으면 추가 안 함

    const newItem: ReceivingItem = {
      id: Date.now(),
      code: base.code,
      name: base.name,
      qty: 0,
    };

    setItems((prev) => [...prev, newItem]);

    // 입력창 정리
    setSearchText("");
    setShowSuggestions(false);

    // 선택된 상품 표시용은 항상 최신 상품으로 유지
    if (productFromSuggestion) {
      setSelectedProduct(productFromSuggestion);
    } else {
      setSelectedProduct(
        "code" in base && "name" in base ? { code: base.code, name: base.name } : null,
      );
    }
  };

  const handleChangeQty = (id: number, value: string) => {
    const num = Number(value.replace(/[^0-9]/g, ""));
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: num || 0 } : it)),
    );
  };

  const handleSubmit = () => {
    const validItems = items.filter((it) => it.qty > 0);
    if (!palletQR.trim()) {
      alert("파렛트 번호(QR)를 입력해주세요.");
      return;
    }
    if (validItems.length === 0) {
      alert("입고 수량이 입력된 품목이 없습니다.");
      return;
    }

    const summary = validItems
      .map((it) => `${it.name}(${it.code}) ${it.qty}EA`)
      .join("\n");

    alert(
      [
        `입고 파렛트: ${palletQR}`,
        `위치: ${targetLocation}`,
        "",
        "입고 품목:",
        summary,
      ].join("\n"),
    );

    // 데모이므로 성공 후 폼 초기화
    setItems([]);
    setPalletQR("");
    setTargetLocation("피킹");
    setSelectedProduct(null);
    setSearchText("");
    setShowSuggestions(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[960px] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold">
              재고 입고 · 파렛트 단위 입고 / 보충
            </h2>
          </div>
          <button
            className="text-xs text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            닫기 ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 flex px-5 py-4 gap-4 overflow-hidden text-sm">
          {/* 왼쪽: 입력 영역 */}
          <div className="w-[58%] flex flex-col gap-4">
            {/* 파렛트 번호 */}
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-700">
                파렛트번호 (QR코드)
              </h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="QR 스캔 또는 직접 입력 (예: PLT-1234)"
                  value={palletQR}
                  onChange={(e) => setPalletQR(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
                >
                  QR 스캔
                </button>
              </div>

              {/* 🔽 파렛트 자동완성 리스트 */}
              {palletSuggestions.length > 0 && (
                <div className="mt-1 border rounded-md bg-white shadow p-2 max-h-40 overflow-auto text-xs">
                  {palletSuggestions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setPalletQR(p.id)}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                    >
                      <span className="font-mono font-semibold">{p.id}</span>
                      <span className="ml-2 text-gray-600">{p.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            {/* 상품 조회 / 추가 */}
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-700">제품 조회</h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="제품 코드 또는 이름 (예: P-1001 / PET 500ml)"
                  value={searchText}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearchText(v);
                    setShowSuggestions(!!v);
                  }}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
                  onClick={() => handleAddItem()}
                >
                  추가
                </button>
              </div>

              {/* 자동완성 리스트 */}
              {showSuggestions && productSuggestions.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px] shadow-sm">
                  {productSuggestions.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handleAddItem(p)}
                      className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
                    >
                      <span className="font-mono">{p.code}</span>
                      <span className="ml-2 text-gray-500">{p.name}</span>
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
                    <span className="ml-1 text-gray-700">
                      {selectedProduct.name}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">
                    선택된 상품이 없습니다. 위에서 상품을 선택하거나 추가해
                    주세요.
                  </span>
                )}
              </div>
            </section>
            {/* 추가된 상품 목록 */}
            <section className="space-y-1.5 flex-1 min-h-[160px]">
              <h3 className="text-xs font-semibold text-gray-700">
                입고 품목 목록
              </h3>
              <div className="border rounded-lg overflow-hidden max-h-[260px]">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 py-2 text-left w-28">상품코드</th>
                      <th className="px-2 py-2 text-left">상품명</th>
                      <th className="px-2 py-2 text-center w-28">
                        입고수량(EA)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-gray-400 text-xs"
                          colSpan={3}
                        >
                          아직 추가된 입고 품목이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      items.map((it) => (
                        <tr
                          key={it.id}
                          className="border-t hover:bg-gray-50 text-[11px]"
                        >
                          <td className="px-2 py-2 font-medium text-gray-800">
                            {it.code}
                          </td>
                          <td className="px-2 py-2 text-gray-700">
                            {it.name}
                          </td>
                          <td className="px-2 py-1 text-center">
                            <input
                              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs text-right"
                              value={it.qty || ""}
                              onChange={(e) =>
                                handleChangeQty(it.id, e.target.value)
                              }
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 위치 지정 */}
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-700">
                입고 위치
              </h3>
              <div className="flex gap-3 text-xs text-gray-800">
                {(["피킹", "2-1", "3-1"] as const).map((loc) => (
                  <label key={loc} className="inline-flex items-center gap-1.5">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      checked={targetLocation === loc}
                      onChange={() => setTargetLocation(loc)}
                    />
                    <span>{loc}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* 오른쪽: 간단 로그 / 설명 */}
          <div className="w-[42%] flex flex-col border-l pl-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">
              이번 입고 지시 미리보기
            </h3>
            <div className="flex-1 border rounded-lg bg-gray-50 px-3 py-2 overflow-auto text-[11px] text-gray-700 space-y-1">
              <p>
                파렛트:{" "}
                <span className="font-semibold">{palletQR || "미입력"}</span>
              </p>
              <p>
                위치: <span className="font-semibold">{targetLocation}</span>
              </p>
              <hr className="my-1" />
              <p className="font-semibold mb-1">입고 품목</p>
              {items.length === 0 ? (
                <p className="text-gray-400">아직 추가된 품목이 없습니다.</p>
              ) : (
                items.map((it) => (
                  <p key={it.id}>
                    • {it.name}({it.code}){" "}
                    <span className="font-semibold">{it.qty} EA</span>
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
          <p className="text-[11px] text-gray-500">
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-full bg-white border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
              onClick={onClose}
            >
              취소
            </button>
            <button
              className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700"
              onClick={handleSubmit}
            >
              입고 / 이송 지시
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
