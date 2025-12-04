// components/ReceivingModal.tsx
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
  qty: number;        // 입고/출고 수량
  boxQty?: number;    // 현재 박스 수량(출고 탭용)
  totalQty?: number;  // 현재 전체 수량 EA(출고 탭용)
};

type ProductMaster = {
  code: string;
  name: string;
};

type PalletMaster = {
  id: string;
  desc: string;
};

type PalletStock = {
  palletId: string;
  code: string;
  name: string;
  boxQty: number;
  eaQty: number;
};

/** 🔹 예시 상품 마스터 */
const PRODUCT_MASTER: ProductMaster[] = [
  { code: "P-1001", name: "PET 500ml 투명" },
  { code: "P-1002", name: "PET 300ml 밀키" },
  { code: "P-2001", name: "PET 1L 투명" },
  { code: "C-2001", name: "캡 28파이 화이트" },
  { code: "L-5001", name: "라벨 500ml 화이트" },
];

/** 🔹 예시 파렛트 마스터 */
const PALLET_MASTER: PalletMaster[] = [
  { id: "PLT-1001", desc: "3층 플랫파렛트 A-01" },
  { id: "PLT-1002", desc: "3층 플랫파렛트 A-02" },
  { id: "PLT-2001", desc: "2층 잔량파렛트 B-01" },
  { id: "PLT-2002", desc: "2층 잔량파렛트 B-02" },
  { id: "PLT-3001", desc: "1층 출고 대기존 S-01" },
];

/** 🔹 예시 파렛트 현재 적재 재고 */
const PALLET_STOCK: PalletStock[] = [
  {
    palletId: "PLT-1001",
    code: "P-1001",
    name: "PET 500ml 투명",
    boxQty: 10,
    eaQty: 1200,
  },
  {
    palletId: "PLT-1001",
    code: "C-2001",
    name: "캡 28파이 화이트",
    boxQty: 8,
    eaQty: 960,
  },
  {
    palletId: "PLT-2001",
    code: "P-2001",
    name: "PET 1L 투명",
    boxQty: 5,
    eaQty: 600,
  },
];

const getPalletStock = (palletId: string): PalletStock[] =>
  PALLET_STOCK.filter((s) => s.palletId === palletId);

const buildOutItemsFromStock = (palletId: string): ReceivingItem[] => {
  const now = Date.now();
  const stock = getPalletStock(palletId);
  return stock.map((s, idx) => ({
    id: now + idx,
    code: s.code,
    name: s.name,
    qty: 0,
    boxQty: s.boxQty,
    totalQty: s.eaQty,
  }));
};

export function ReceivingModal({ open, onClose }: ReceivingModalProps) {
  /** 🔹 공통: 활성 탭 (입고 / 출고) */
  const [activeTab, setActiveTab] = useState<"IN" | "OUT">("IN");

  // ----------------- 입고 탭 상태 -----------------
  const [palletQRIn, setPalletQRIn] = useState("");
  const [selectedPalletIn, setSelectedPalletIn] =
    useState<PalletMaster | null>(null);
  const [searchTextIn, setSearchTextIn] = useState("");
  const [itemsIn, setItemsIn] = useState<ReceivingItem[]>([]);
  const [targetLocationIn, setTargetLocationIn] =
    useState<"피킹" | "2-1" | "3-1">("피킹");
  const [selectedProductIn, setSelectedProductIn] =
    useState<ProductMaster | null>(null);
  const [showSuggestionsIn, setShowSuggestionsIn] = useState(false);

  // 👉 파렛트 자동완성(입고)
  const [showPalletSuggestionsIn, setShowPalletSuggestionsIn] =
    useState(false);

  // ----------------- 출고 탭 상태 -----------------
  const [palletQROut, setPalletQROut] = useState("");
  const [selectedPalletOut, setSelectedPalletOut] =
    useState<PalletMaster | null>(null);
  const [itemsOut, setItemsOut] = useState<ReceivingItem[]>([]);
  const [targetLocationOut, setTargetLocationOut] =
    useState<"피킹" | "2-1" | "3-1">("피킹");

  // 👉 파렛트 자동완성(출고)
  const [showPalletSuggestionsOut, setShowPalletSuggestionsOut] =
    useState(false);

  // ----------------- 공통 초기화 -----------------
  const resetAll = () => {
    setActiveTab("IN");
    // 입고
    setPalletQRIn("");
    setSelectedPalletIn(null);
    setSearchTextIn("");
    setItemsIn([]);
    setTargetLocationIn("피킹");
    setSelectedProductIn(null);
    setShowSuggestionsIn(false);
    setShowPalletSuggestionsIn(false);
    // 출고
    setPalletQROut("");
    setSelectedPalletOut(null);
    setItemsOut([]);
    setTargetLocationOut("피킹");
    setShowPalletSuggestionsOut(false);
  };

  /** 🔹 모달 닫힐 때 내부 상태 초기화 */
  useEffect(() => {
    if (!open) {
      resetAll();
    }
  }, [open]);

  /** 🔹 입고: 검색어 기준 자동완성 리스트 (제품) */
  const productSuggestionsIn = useMemo(() => {
    const q = searchTextIn.trim();
    if (!q) return [];
    const upper = q.toUpperCase();
    const lower = q.toLowerCase();
    return PRODUCT_MASTER.filter(
      (p) =>
        p.code.toUpperCase().includes(upper) ||
        p.name.toLowerCase().includes(lower),
    );
  }, [searchTextIn]);

  /** 🔹 입고: 파렛트 자동완성 리스트 */
  const palletSuggestionsIn = useMemo(() => {
    const q = palletQRIn.trim();
    if (!q) return [];
    const upper = q.toUpperCase();
    const lower = q.toLowerCase();
    return PALLET_MASTER.filter(
      (p) =>
        p.id.toUpperCase().includes(upper) ||
        p.desc.toLowerCase().includes(lower),
    );
  }, [palletQRIn]);

  /** 🔹 출고: 파렛트 자동완성 리스트 */
  const palletSuggestionsOut = useMemo(() => {
    const q = palletQROut.trim();
    if (!q) return [];
    const upper = q.toUpperCase();
    const lower = q.toLowerCase();
    return PALLET_MASTER.filter(
      (p) =>
        p.id.toUpperCase().includes(upper) ||
        p.desc.toLowerCase().includes(lower),
    );
  }, [palletQROut]);

  /** 🔹 입고: 선택된 파렛트의 현재 적재 목록 */
  const currentInStock = useMemo(() => {
    if (!selectedPalletIn) return [];
    return getPalletStock(selectedPalletIn.id);
  }, [selectedPalletIn]);

  /** 🔹 출고: 파렛트 선택/입력 시 자동으로 현재 재고를 품목 목록으로 세팅 */
  useEffect(() => {
    let palletId: string | null = null;

    if (selectedPalletOut) {
      palletId = selectedPalletOut.id;
    } else if (palletQROut.trim()) {
      palletId = palletQROut.trim();
    }

    if (!palletId) {
      setItemsOut([]);
      return;
    }

    const items = buildOutItemsFromStock(palletId);
    setItemsOut(items);
  }, [selectedPalletOut, palletQROut]);

  if (!open) return null;

  // ----------------- 입고 탭 로직 -----------------
  const handleAddItemIn = () => {
    if (!searchTextIn.trim() && !selectedProductIn) return;

    const baseProduct =
      selectedProductIn ??
      PRODUCT_MASTER.find((p) => {
        const t = searchTextIn.trim().toLowerCase();
        return (
          p.code.toLowerCase() === t ||
          p.code.toLowerCase().startsWith(t) ||
          p.name.toLowerCase().includes(t)
        );
      }) ?? {
        code: searchTextIn.trim(),
        name: searchTextIn.trim(),
      };

    const newItem: ReceivingItem = {
      id: Date.now(),
      code: baseProduct.code,
      name: baseProduct.name,
      qty: 0,
    };

    setItemsIn((prev) => [...prev, newItem]);
    setSearchTextIn("");
    setSelectedProductIn(null);
    setShowSuggestionsIn(false);
  };

  const handleChangeQtyIn = (id: number, value: string) => {
    const num = Number(value.replace(/[^0-9]/g, "")) || 0;
    setItemsIn((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: num } : it)),
    );
  };

  /** 🔹 오른쪽 패널의 [입고] 버튼 */
  const handleReceiveOnlyIn = () => {
    const validItems = itemsIn.filter((it) => it.qty > 0);
    if (!selectedPalletIn && !palletQRIn.trim()) {
      alert("파렛트 번호(QR)를 먼저 선택해 주세요.");
      return;
    }
    if (validItems.length === 0) {
      alert("입고 수량이 입력된 품목이 없습니다.");
      return;
    }

    const palletText =
      selectedPalletIn?.id ?? palletQRIn.trim() ?? "(파렛트 미지정)";
    const first = validItems[0];

    if (validItems.length === 1) {
      alert(
        `파렛트 ${palletText}에 ${first.name} 제품이 ${first.qty}개 입고 되었습니다.`,
      );
    } else {
      const total = validItems.reduce((sum, x) => sum + x.qty, 0);
      alert(
        `파렛트 ${palletText}에 ${first.name} 외 ${
          validItems.length - 1
        }개 품목이 총 ${total}개 입고 되었습니다.`,
      );
    }
  };

  /** 🔹 푸터의 [이송 지시] 버튼 (입고 탭) */
  const handleMoveIn = () => {
    const validItems = itemsIn.filter((it) => it.qty > 0);
    if (!selectedPalletIn && !palletQRIn.trim()) {
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

    const palletTextIn = selectedPalletIn
      ? `${selectedPalletIn.id} (${selectedPalletIn.desc})`
      : palletQRIn;

    alert(
      [
        `[입고 후 AMR 이송 지시]`,
        `파렛트: ${palletTextIn}`,
        `입고 위치: ${targetLocationIn}`,
        "",
        "입고 품목:",
        summary,
      ].join("\n"),
    );

    resetAll();
    onClose();
  };

  // ----------------- 출고 탭 로직 -----------------
  const handleChangeQtyOut = (id: number, value: string) => {
    const num = Number(value.replace(/[^0-9]/g, "")) || 0;
    setItemsOut((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: num } : it)),
    );
  };

  const handleSubmitOut = () => {
    const validItems = itemsOut.filter((it) => it.qty > 0);
    if (!selectedPalletOut && !palletQROut.trim()) {
      alert("출고할 파렛트 번호(QR)를 입력해주세요.");
      return;
    }
    if (validItems.length === 0) {
      alert("출고 수량이 입력된 품목이 없습니다.");
      return;
    }

    const palletTextOut = selectedPalletOut
      ? `${selectedPalletOut.id} (${selectedPalletOut.desc})`
      : palletQROut;

    // 🔔 요구사항: 수량 입력된 품목들만 모두 표시
    if (validItems.length === 1) {
      const f = validItems[0];
      alert(
        `파렛트 ${palletTextOut}에서 ${f.name} 제품이 ${f.qty}개 출고 되었습니다.\n이동 위치: ${targetLocationOut}`,
      );
    } else {
      const lines = validItems.map(
        (it) => `• ${it.name}(${it.code}) ${it.qty}EA`,
      );
      alert(
        [
          `파렛트 ${palletTextOut}에서 아래 제품들이 출고 되었습니다.`,
          `이동 위치: ${targetLocationOut}`,
          "",
          ...lines,
        ].join("\n"),
      );
    }

    resetAll();
    onClose();
  };

  // ----------------- 공통 렌더링용 변수 -----------------
  const isInTab = activeTab === "IN";

  const locationLabel = isInTab ? "입고 위치" : "이동 / 반납 위치";
  const locationValue = isInTab ? targetLocationIn : targetLocationOut;
  const setLocation = isInTab ? setTargetLocationIn : setTargetLocationOut;

  const displayPalletIn = selectedPalletIn
    ? `${selectedPalletIn.id} (${selectedPalletIn.desc})`
    : palletQRIn || "미입력";

  const displayPalletOut = selectedPalletOut
    ? `${selectedPalletOut.id} (${selectedPalletOut.desc})`
    : palletQROut || "미입력";

  // ----------------- JSX -----------------
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[960px] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">
              재고 입고 · 파렛트 단위 입고 / 보충 · 출고
            </h2>
          </div>
          <button
            className="text-xs text-gray-500 hover:text-gray-800"
            onClick={() => {
              resetAll();
              onClose();
            }}
          >
            닫기 ✕
          </button>
        </div>

        {/* 탭 */}
        <div className="px-5 pt-3 border-b bg-gray-50">
          <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("IN")}
              className={`px-4 py-1 rounded-full ${
                isInTab
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              입고
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("OUT")}
              className={`px-4 py-1 rounded-full ${
                !isInTab
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              출고
            </button>
          </div>
        </div>

        {/* 본문 */}
        {isInTab ? (
          /* ===================== 입고 탭 ===================== */
          <div className="flex-1 flex px-5 py-4 gap-4 overflow-hidden text-sm">
            {/* 왼쪽: 입력 영역 */}
            <div className="w-[58%] flex flex-col gap-4">
              {/* 파렛트 번호 (입고) */}
              <section className="space-y-1.5">
                <h3 className="text-xs font-semibold text-gray-700">
                  파렛트번호 (QR코드)
                </h3>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="QR 스캔 또는 직접 입력 (예: PLT-1234)"
                    value={palletQRIn}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPalletQRIn(v);
                      setSelectedPalletIn(null);
                      setShowPalletSuggestionsIn(!!v);
                    }}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
                    onClick={() => {
                      alert("QR 스캔 기능은 추후 연동 예정입니다. (데모)");
                    }}
                  >
                    QR 스캔
                  </button>
                </div>

                {/* 파렛트 자동완성 리스트 (입고) */}
                {showPalletSuggestionsIn && palletSuggestionsIn.length > 0 && (
                  <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px] shadow-sm">
                    {palletSuggestionsIn.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPalletQRIn(p.id);
                          setSelectedPalletIn(p);
                          setShowPalletSuggestionsIn(false);
                        }}
                        className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
                      >
                        <span className="font-mono">{p.id}</span>
                        <span className="ml-2 text-gray-600 flex-1 truncate">
                          {p.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 선택된 파렛트 표시 */}
                <div className="mt-1 text-[11px] text-gray-600">
                  {selectedPalletIn ? (
                    <>
                      선택된 파렛트:&nbsp;
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-800 border border-slate-200">
                        {selectedPalletIn.id}
                      </span>
                      <span className="ml-1 text-gray-700">
                        {selectedPalletIn.desc}
                      </span>
                    </>
                  ) : palletQRIn ? (
                    <span className="text-gray-500">
                      직접 입력한 파렛트 번호:{" "}
                      <span className="font-mono font-semibold">
                        {palletQRIn}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      선택된 파렛트가 없습니다.
                    </span>
                  )}
                </div>
              </section>

              {/* 상품 조회 / 추가 */}
              <section className="space-y-1.5">
                <h3 className="text-xs font-semibold text-gray-700">
                  제품 조회
                </h3>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="제품 코드 또는 이름 (예: P-1001 / PET 500ml)"
                    value={searchTextIn}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearchTextIn(v);
                      setSelectedProductIn(null);
                      setShowSuggestionsIn(!!v);
                    }}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
                    onClick={handleAddItemIn}
                  >
                    추가
                  </button>
                </div>

                {/* 자동완성 리스트 (제품) */}
                {showSuggestionsIn && productSuggestionsIn.length > 0 && (
                  <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px] shadow-sm">
                    {productSuggestionsIn.map((p) => (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => {
                          setSearchTextIn(p.code);
                          setSelectedProductIn(p);
                          setShowSuggestionsIn(false);
                          const newItem: ReceivingItem = {
                            id: Date.now(),
                            code: p.code,
                            name: p.name,
                            qty: 0,
                          };
                          setItemsIn((prev) => [...prev, newItem]);
                        }}
                        className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
                      >
                        <span className="font-mono">{p.code}</span>
                        <span className="ml-2 text-gray-500">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* 입고 품목 목록 */}
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
                      {itemsIn.length === 0 ? (
                        <tr>
                          <td
                            className="px-3 py-4 text-center text-gray-400 text-xs"
                            colSpan={3}
                          >
                            아직 추가된 입고 품목이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        itemsIn.map((it) => (
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
                                  handleChangeQtyIn(it.id, e.target.value)
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
            </div>

            {/* 오른쪽: 입고 미리보기 + 기존 파렛트 재고 + 입고 버튼 */}
            <div className="w-[42%] flex flex-col border-l pl-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">
                이번 입고 지시 미리보기
              </h3>
              <div className="flex-1 border rounded-lg bg-gray-50 px-3 py-2 overflow-auto text-[11px] text-gray-700 space-y-1">
                <p>
                  파렛트:{" "}
                  <span className="font-semibold">{displayPalletIn}</span>
                </p>
                <p>
                  위치(이송 예정):{" "}
                  <span className="font-semibold">{targetLocationIn}</span>
                </p>
                <hr className="my-1" />

                {/* 기존 파렛트 재고 */}
                <p className="font-semibold mb-1">현재 파렛트 적재 품목</p>
                {currentInStock.length === 0 ? (
                  <p className="text-gray-400 mb-2">
                    선택된 파렛트의 기존 적재 품목이 없습니다.
                  </p>
                ) : (
                  <ul className="mb-2 list-disc pl-4 space-y-0.5">
                    {currentInStock.map((s) => (
                      <li key={`${s.palletId}-${s.code}`}>
                        {s.name}({s.code}) – BOX{" "}
                        <span className="font-semibold">
                          {s.boxQty.toLocaleString()}
                        </span>
                        , 총{" "}
                        <span className="font-semibold">
                          {s.eaQty.toLocaleString()}
                        </span>{" "}
                        EA
                      </li>
                    ))}
                  </ul>
                )}

                <hr className="my-1" />
                <p className="font-semibold mb-1">입고 품목</p>
                {itemsIn.length === 0 ? (
                  <p className="text-gray-400">아직 추가된 품목이 없습니다.</p>
                ) : (
                  itemsIn.map((it) => (
                    <p key={it.id}>
                      • {it.name}({it.code}){" "}
                      <span className="font-semibold">{it.qty} EA</span>
                    </p>
                  ))
                )}

                {/* 오른쪽 아래 [입고] 버튼 */}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    onClick={handleReceiveOnlyIn}
                  >
                    입고
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== 출고 탭 ===================== */
          <div className="flex-1 flex px-5 py-4 gap-4 overflow-hidden text-sm">
            {/* 왼쪽: 출고 입력 */}
            <div className="w-[58%] flex flex-col gap-4">
              {/* 파렛트 번호 (출고) */}
              <section className="space-y-1.5">
                <h3 className="text-xs font-semibold text-gray-700">
                  출고 파렛트번호 (QR코드)
                </h3>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="QR 스캔 또는 직접 입력 (예: PLT-1234)"
                    value={palletQROut}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPalletQROut(v);
                      setSelectedPalletOut(null);
                      setShowPalletSuggestionsOut(!!v);
                    }}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
                    onClick={() => {
                      alert("QR 스캔 기능은 추후 연동 예정입니다. (데모)");
                    }}
                  >
                    QR 스캔
                  </button>
                </div>

                {/* 파렛트 자동완성 리스트 (출고) */}
                {showPalletSuggestionsOut &&
                  palletSuggestionsOut.length > 0 && (
                    <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px] shadow-sm">
                      {palletSuggestionsOut.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPalletQROut(p.id);
                            setSelectedPalletOut(p);
                            setShowPalletSuggestionsOut(false);
                          }}
                          className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
                        >
                          <span className="font-mono">{p.id}</span>
                          <span className="ml-2 text-gray-600 flex-1 truncate">
                            {p.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                {/* 선택된 파렛트 표시 (출고) */}
                <div className="mt-1 text-[11px] text-gray-600">
                  {selectedPalletOut ? (
                    <>
                      선택된 파렛트:&nbsp;
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-800 border border-slate-200">
                        {selectedPalletOut.id}
                      </span>
                      <span className="ml-1 text-gray-700">
                        {selectedPalletOut.desc}
                      </span>
                    </>
                  ) : palletQROut ? (
                    <span className="text-gray-500">
                      직접 입력한 파렛트 번호:{" "}
                      <span className="font-mono font-semibold">
                        {palletQROut}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      선택된 파렛트가 없습니다.
                    </span>
                  )}
                </div>
              </section>

              {/* 출고 품목 목록 (현재 파렛트 적재 + 박스/전체수량 + 출고수량 입력) */}
              <section className="space-y-1.5 flex-1 min-h-[160px]">
                <h3 className="text-xs font-semibold text-gray-700">
                  출고 품목 목록
                </h3>
                <div className="border rounded-lg overflow-hidden max-h-[260px]">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-2 py-2 text-left w-24">상품코드</th>
                        <th className="px-2 py-2 text-left">상품명</th>
                        <th className="px-2 py-2 text-right w-20">BOX</th>
                        <th className="px-2 py-2 text-right w-24">
                          전체수량(EA)
                        </th>
                        <th className="px-2 py-2 text-center w-28">
                          출고수량(EA)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsOut.length === 0 ? (
                        <tr>
                          <td
                            className="px-3 py-4 text-center text-gray-400 text-xs"
                            colSpan={5}
                          >
                            현재 파렛트에 적재된 품목이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        itemsOut.map((it) => (
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
                            <td className="px-2 py-2 text-right">
                              {it.boxQty?.toLocaleString() ?? "-"}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {it.totalQty?.toLocaleString() ?? "-"}
                            </td>
                            <td className="px-2 py-1 text-center">
                              <input
                                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs text-right"
                                value={it.qty || ""}
                                onChange={(e) =>
                                  handleChangeQtyOut(it.id, e.target.value)
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
            </div>

            {/* 오른쪽: 출고 미리보기 */}
            <div className="w-[42%] flex flex-col border-l pl-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">
                이번 출고 / 이송 지시 미리보기
              </h3>
              <div className="flex-1 border rounded-lg bg-gray-50 px-3 py-2 overflow-auto text-[11px] text-gray-700 space-y-1">
                <p>
                  출고 파렛트:{" "}
                  <span className="font-semibold">{displayPalletOut}</span>
                </p>
                <p>
                  이동 위치:{" "}
                  <span className="font-semibold">{targetLocationOut}</span>
                </p>
                <hr className="my-1" />
                <p className="font-semibold mb-1">출고 품목</p>
                {itemsOut.length === 0 ? (
                  <p className="text-gray-400">
                    아직 출고 가능한 품목이 없습니다.
                  </p>
                ) : (
                  itemsOut.map((it) => (
                    <p key={it.id}>
                      • {it.name}({it.code}) – 현재{" "}
                      {it.totalQty?.toLocaleString() ?? "-"} EA 중{" "}
                      <span className="font-semibold">{it.qty} EA</span> 출고
                      예정
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 푸터: 위치 선택 + 버튼 */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
          {/* 위치 선택 */}
          <div className="flex items-center gap-3 text-xs text-gray-800">
            <span className="font-semibold">{locationLabel}</span>
            {(["피킹", "2-1", "3-1"] as const).map((loc) => (
              <label key={loc} className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  className="h-3 w-3"
                  checked={locationValue === loc}
                  onChange={() => setLocation(loc)}
                />
                <span>{loc}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-full bg-white border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
              onClick={() => {
                resetAll();
                onClose();
              }}
            >
              취소
            </button>
            {isInTab ? (
              <button
                className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700"
                onClick={handleMoveIn}
              >
                이송 지시
              </button>
            ) : (
              <button
                className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700"
                onClick={handleSubmitOut}
              >
                이송 지시 (출고)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
