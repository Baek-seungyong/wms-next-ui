"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  WarehouseZonePickerModal,
  type WarehouseFloor,
  type ZoneDef,
} from "./WarehouseZonePickerModal";
import Image from "next/image";

import type {
  MoveTarget,
  PalletMaster,
  ReceivingItem,
  ProductMaster,
} from "./receiving/types";

import { PRODUCT_MASTER, PALLET_MASTER } from "./receiving/mockData";
import {
  buildOutItemsFromStock,
  ensureZoneSelected,
  findPalletExact,
  formatMoveTarget,
  getPalletStock,
  normalizeNum,
} from "./receiving/utils";

import { ReceivingRightPanel } from "./receiving/ReceivingRightPanel";
import { ReceivingTabInView } from "./receiving/ReceivingTabInView";
import { ReceivingTabOutView } from "./receiving/ReceivingTabOutView";

type ReceivingModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ReceivingModal({ open, onClose }: ReceivingModalProps) {
  /** 🔹 공통: 활성 탭 (입고 / 출고) */
  const [activeTab, setActiveTab] = useState<"IN" | "OUT">("IN");

  // ----------------- 입고 탭 상태 -----------------
  const [palletQRIn, setPalletQRIn] = useState("");
  const [selectedPalletIn, setSelectedPalletIn] = useState<PalletMaster | null>(null);
  const [searchTextIn, setSearchTextIn] = useState("");
  const [itemsIn, setItemsIn] = useState<ReceivingItem[]>([]);
  const [targetLocationIn, setTargetLocationIn] = useState<MoveTarget>({ kind: "PICKING" });
  const [selectedProductIn, setSelectedProductIn] = useState<ProductMaster | null>(null);
  const [showSuggestionsIn, setShowSuggestionsIn] = useState(false);
  const [showPalletSuggestionsIn, setShowPalletSuggestionsIn] = useState(false);

  // ✅ 재고 확정 여부
  const [inConfirmed, setInConfirmed] = useState(false);
  const [inError, setInError] = useState<string | null>(null);

  // ----------------- 출고 탭 상태 -----------------
  const [palletQROut, setPalletQROut] = useState("");
  const [selectedPalletOut, setSelectedPalletOut] = useState<PalletMaster | null>(null);
  const [itemsOut, setItemsOut] = useState<ReceivingItem[]>([]);
  const [targetLocationOut, setTargetLocationOut] = useState<MoveTarget>({ kind: "PICKING" });
  const [showPalletSuggestionsOut, setShowPalletSuggestionsOut] = useState(false);

  // ✅ 출고 리스트 필터
  const [outFilterText, setOutFilterText] = useState("");
  // ✅ 출고 재고 확정 여부
  const [outConfirmed, setOutConfirmed] = useState(false);
  const [outError, setOutError] = useState<string | null>(null);

  // ✅ 구역 선택 모달
  const [zonePickerOpen, setZonePickerOpen] = useState(false);
  const [zonePickerFloor, setZonePickerFloor] = useState<WarehouseFloor>("2F");
  const [zonePickerFor, setZonePickerFor] = useState<"IN" | "OUT">("IN");

  const openPicker = (floor: WarehouseFloor, forTab: "IN" | "OUT") => {
    setZonePickerFloor(floor);
    setZonePickerFor(forTab);
    setZonePickerOpen(true);
  };

  // ----------------- 포커스 refs -----------------
  const palletInRef = useRef<HTMLInputElement | null>(null);
  const productInRef = useRef<HTMLInputElement | null>(null);
  const palletOutRef = useRef<HTMLInputElement | null>(null);

  const lastAddedInItemIdRef = useRef<number | null>(null);
  const qtyInRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const qtyOutRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // ----------------- 공통 초기화 -----------------
  const resetAll = () => {
    setActiveTab("IN");

    // 입고
    setPalletQRIn("");
    setSelectedPalletIn(null);
    setSearchTextIn("");
    setItemsIn([]);
    setTargetLocationIn({ kind: "PICKING" });
    setSelectedProductIn(null);
    setShowSuggestionsIn(false);
    setShowPalletSuggestionsIn(false);
    setInConfirmed(false);
    setInError(null);

    // 출고
    setPalletQROut("");
    setSelectedPalletOut(null);
    setItemsOut([]);
    setTargetLocationOut({ kind: "PICKING" });
    setShowPalletSuggestionsOut(false);
    setOutFilterText("");
    setOutConfirmed(false);
    setOutError(null);

    // zone picker
    setZonePickerOpen(false);
    setZonePickerFloor("2F");
    setZonePickerFor("IN");

    // focus ref map cleanup
    qtyInRefs.current = {};
    qtyOutRefs.current = {};
    lastAddedInItemIdRef.current = null;
  };

  /** 🔹 모달 닫힐 때 내부 상태 초기화 */
  useEffect(() => {
    if (!open) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** 🔹 입고: 검색어 기준 자동완성 리스트 (제품) */
  const productSuggestionsIn = useMemo(() => {
    const q = searchTextIn.trim();
    if (!q) return [];
    const upper = q.toUpperCase();
    const lower = q.toLowerCase();
    return PRODUCT_MASTER.filter(
      (p) => p.code.toUpperCase().includes(upper) || p.name.toLowerCase().includes(lower),
    );
  }, [searchTextIn]);

  /** 🔹 입고: 파렛트 자동완성 리스트 */
  const palletSuggestionsIn = useMemo(() => {
    const q = palletQRIn.trim();
    if (!q) return [];
    const upper = q.toUpperCase();
    const lower = q.toLowerCase();
    return PALLET_MASTER.filter(
      (p) => p.id.toUpperCase().includes(upper) || p.desc.toLowerCase().includes(lower),
    );
  }, [palletQRIn]);

  /** 🔹 출고: 파렛트 자동완성 리스트 */
  const palletSuggestionsOut = useMemo(() => {
    const q = palletQROut.trim();
    if (!q) return [];
    const upper = q.toUpperCase();
    const lower = q.toLowerCase();
    return PALLET_MASTER.filter(
      (p) => p.id.toUpperCase().includes(upper) || p.desc.toLowerCase().includes(lower),
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

    if (selectedPalletOut) palletId = selectedPalletOut.id;
    else if (palletQROut.trim()) palletId = palletQROut.trim();

    // 파렛트가 바뀌면 확정/오류 초기화
    setOutConfirmed(false);
    setOutError(null);

    if (!palletId) {
      setItemsOut([]);
      return;
    }

    const items = buildOutItemsFromStock(palletId);
    setItemsOut(items);

    setTimeout(() => {
      if (items[0]?.id && qtyOutRefs.current[items[0].id]) {
        qtyOutRefs.current[items[0].id]?.focus();
      }
    }, 0);
  }, [selectedPalletOut, palletQROut]);

  // 입고: 아이템 추가 후 마지막 행 qty 포커스
  useEffect(() => {
    const lastId = lastAddedInItemIdRef.current;
    if (!lastId) return;

    setTimeout(() => {
      qtyInRefs.current[lastId]?.focus();
      lastAddedInItemIdRef.current = null;
    }, 0);
  }, [itemsIn.length]);

  // ----------------- 입고 탭 로직 -----------------
  const handleAddItemIn = () => {
    setInError(null);
    setInConfirmed(false);

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
      }) ?? { code: searchTextIn.trim(), name: searchTextIn.trim() };

    const exists = itemsIn.find((x) => x.code === baseProduct.code);
    if (exists) {
      lastAddedInItemIdRef.current = exists.id;
      setSearchTextIn("");
      setSelectedProductIn(null);
      setShowSuggestionsIn(false);
      return;
    }

    const newItem: ReceivingItem = {
      id: Date.now(),
      code: baseProduct.code,
      name: baseProduct.name,
      qty: 0,
    };

    lastAddedInItemIdRef.current = newItem.id;
    setItemsIn((prev) => [...prev, newItem]);
    setSearchTextIn("");
    setSelectedProductIn(null);
    setShowSuggestionsIn(false);
  };

  const handleRemoveItemIn = (id: number) => {
    setInError(null);
    setInConfirmed(false);
    setItemsIn((prev) => prev.filter((x) => x.id !== id));
  };

  const handleChangeQtyIn = (id: number, value: string) => {
    setInError(null);
    setInConfirmed(false);
    const num = normalizeNum(value);
    setItemsIn((prev) => prev.map((it) => (it.id === id ? { ...it, qty: num } : it)));
  };

  /** 🔹 오른쪽 패널의 [입고 확정] 버튼 */
  const handleReceiveOnlyIn = () => {
    setInError(null);

    const validItems = itemsIn.filter((it) => it.qty > 0);
    const palletText = selectedPalletIn?.id ?? palletQRIn.trim() ?? "";

    if (!palletText) {
      setInError("파렛트 번호(QR)를 먼저 선택/입력해 주세요.");
      palletInRef.current?.focus();
      return;
    }
    if (validItems.length === 0) {
      setInError("입고 수량이 입력된 품목이 없습니다.");
      return;
    }

    setInConfirmed(true);

    const first = validItems[0];
    if (validItems.length === 1) {
      alert(`(확정) 파렛트 ${palletText}에 ${first.name} ${first.qty}EA 입고 반영`);
    } else {
      const total = validItems.reduce((sum, x) => sum + x.qty, 0);
      alert(
        `(확정) 파렛트 ${palletText}에 ${first.name} 외 ${validItems.length - 1}개 품목, 총 ${total}EA 입고 반영`,
      );
    }
  };

  /** 🔹 푸터의 [이송 지시] 버튼 (입고 탭) */
  const handleMoveIn = () => {
    setInError(null);

    const validItems = itemsIn.filter((it) => it.qty > 0);
    const palletTextIn = selectedPalletIn?.id ?? palletQRIn.trim();

    if (!palletTextIn) {
      setInError("파렛트 번호(QR)를 입력해주세요.");
      palletInRef.current?.focus();
      return;
    }
    if (validItems.length === 0) {
      setInError("입고 수량이 입력된 품목이 없습니다.");
      return;
    }
    if (!inConfirmed) {
      setInError("먼저 [입고 확정]을 눌러 재고 반영을 완료해 주세요.");
      return;
    }
    if (!ensureZoneSelected(targetLocationIn)) {
      setInError("이송 위치(2층/3층)의 구역을 먼저 선택해 주세요.");
      return;
    }

    const summary = validItems.map((it) => `${it.name}(${it.code}) ${it.qty}EA`).join("\n");

    const palletTextPretty = selectedPalletIn
      ? `${selectedPalletIn.id} (${selectedPalletIn.desc})`
      : palletQRIn;

    alert(
      [
        `[입고 후 AMR 이송 지시]`,
        `파렛트: ${palletTextPretty}`,
        `이송 위치: ${formatMoveTarget(targetLocationIn)}`,
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
    setOutError(null);
    setOutConfirmed(false);

    const num = normalizeNum(value);
    setItemsOut((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const max = typeof it.totalQty === "number" ? it.totalQty : undefined;
        const next = max != null ? Math.min(num, max) : num;
        return { ...it, qty: next };
      }),
    );
  };

  const handleOutAllRow = (id: number) => {
    setOutError(null);
    setOutConfirmed(false);

    setItemsOut((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const max = typeof it.totalQty === "number" ? it.totalQty : 0;
        return { ...it, qty: max };
      }),
    );
  };

  /** 🔹 오른쪽 패널의 [출고 확정] 버튼 */
  const handleOutOnly = () => {
    setOutError(null);

    const palletTextOut = selectedPalletOut?.id ?? palletQROut.trim();
    if (!palletTextOut) {
      setOutError("출고할 파렛트 번호(QR)를 입력해주세요.");
      palletOutRef.current?.focus();
      return;
    }

    const validItems = itemsOut.filter((it) => it.qty > 0);
    if (validItems.length === 0) {
      setOutError("출고 수량이 입력된 품목이 없습니다.");
      return;
    }

    const over = validItems.find(
      (x) => typeof x.totalQty === "number" && x.qty > (x.totalQty ?? 0),
    );
    if (over) {
      setOutError(`출고수량이 현재수량을 초과했습니다: ${over.name}`);
      return;
    }

    setOutConfirmed(true);

    if (validItems.length === 1) {
      const f = validItems[0];
      alert(`(확정) 파렛트 ${palletTextOut}에서 ${f.name} ${f.qty}EA 출고 반영`);
    } else {
      const lines = validItems.map((it) => `• ${it.name}(${it.code}) ${it.qty}EA`);
      alert([`(확정) 파렛트 ${palletTextOut}에서 아래 제품 출고 반영`, "", ...lines].join("\n"));
    }
  };

  /** 🔹 푸터의 [이송 지시] 버튼 (출고 탭) */
  const handleSubmitOut = () => {
    setOutError(null);

    const palletTextOut = selectedPalletOut?.id ?? palletQROut.trim();
    if (!palletTextOut) {
      setOutError("출고할 파렛트 번호(QR)를 입력해주세요.");
      palletOutRef.current?.focus();
      return;
    }

    const validItems = itemsOut.filter((it) => it.qty > 0);
    if (validItems.length === 0) {
      setOutError("출고 수량이 입력된 품목이 없습니다.");
      return;
    }

    const over = validItems.find(
      (x) => typeof x.totalQty === "number" && x.qty > (x.totalQty ?? 0),
    );
    if (over) {
      setOutError(`출고수량이 현재수량을 초과했습니다: ${over.name}`);
      return;
    }

    if (!outConfirmed) {
      setOutError("먼저 [출고 확정]을 눌러 재고 반영을 완료해 주세요.");
      return;
    }

    if (!ensureZoneSelected(targetLocationOut)) {
      setOutError("이송 위치(2층/3층)의 구역을 먼저 선택해 주세요.");
      return;
    }

    const lines = validItems.map((it) => `• ${it.name}(${it.code}) ${it.qty}EA`);

    alert(
      [
        `[출고 후 AMR 이송 지시]`,
        `파렛트: ${
          selectedPalletOut ? `${selectedPalletOut.id} (${selectedPalletOut.desc})` : palletQROut
        }`,
        `이송 위치: ${formatMoveTarget(targetLocationOut)}`,
        "",
        "출고 품목:",
        ...lines,
      ].join("\n"),
    );

    resetAll();
    onClose();
  };

  // ----------------- 공통 렌더링용 변수 -----------------
  const isInTab = activeTab === "IN";

  const locationLabel = "이송 위치";
  const locationValue = isInTab ? targetLocationIn : targetLocationOut;
  const setLocation = isInTab ? setTargetLocationIn : setTargetLocationOut;

  const displayPalletIn = selectedPalletIn
    ? `${selectedPalletIn.id} (${selectedPalletIn.desc})`
    : palletQRIn || "미입력";

  const displayPalletOut = selectedPalletOut
    ? `${selectedPalletOut.id} (${selectedPalletOut.desc})`
    : palletQROut || "미입력";

  const previewInItems = useMemo(() => itemsIn.filter((x) => x.qty > 0), [itemsIn]);
  const previewOutItems = useMemo(() => itemsOut.filter((x) => x.qty > 0), [itemsOut]);

  const filteredOutItems = useMemo(() => {
    const q = outFilterText.trim().toLowerCase();
    if (!q) return itemsOut;
    return itemsOut.filter(
      (x) => x.code.toLowerCase().includes(q) || x.name.toLowerCase().includes(q),
    );
  }, [itemsOut, outFilterText]);

  const inPalletOk = Boolean((selectedPalletIn?.id ?? palletQRIn.trim()) || "");
  const outPalletOk = Boolean((selectedPalletOut?.id ?? palletQROut.trim()) || "");

  const inHasQty = previewInItems.length > 0;
  const outHasQty = previewOutItems.length > 0;

  const outHasOver = previewOutItems.some(
    (x) => typeof x.totalQty === "number" && x.qty > (x.totalQty ?? 0),
  );

  const canConfirmIn = inPalletOk && inHasQty;
  const canMoveIn = canConfirmIn && inConfirmed && ensureZoneSelected(targetLocationIn);

  const canConfirmOut = outPalletOk && outHasQty && !outHasOver;
  const canMoveOut = canConfirmOut && outConfirmed && ensureZoneSelected(targetLocationOut);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      {/* ✅ 모달 폭 확장 */}
      <div className="bg-white rounded-2xl shadow-xl w-[1200px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">재고 입고 · 파렛트 단위 입고 / 보충 · 출고</h2>
            <div className="text-[11px] text-gray-500">
              {isInTab ? (
                <span>
                  1) <span className="font-semibold text-emerald-700">입고 확정</span> → 2){" "}
                  <span className="font-semibold text-blue-700">이송 지시</span>
                </span>
              ) : (
                <span>
                  1) <span className="font-semibold text-orange-700">출고 확정</span> → 2){" "}
                  <span className="font-semibold text-blue-700">이송 지시</span>
                </span>
              )}
            </div>
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
              onClick={() => {
                setActiveTab("IN");
                setInError(null);
                setOutError(null);
                setTimeout(() => palletInRef.current?.focus(), 0);
              }}
              className={`px-4 py-1 rounded-full ${
                isInTab
                  ? "bg-white shadow text-emerald-700 font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Image
                  src="/images/warehouse/in.jpg"
                  alt="입고"
                  width={20}
                  height={20}
                  className="rounded pointer-events-none select-none"
                />
                입고
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("OUT");
                setInError(null);
                setOutError(null);
                setTimeout(() => palletOutRef.current?.focus(), 0);
              }}
              className={`px-4 py-1 rounded-full ${
                !isInTab
                  ? "bg-white shadow text-orange-700 font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Image
                  src="/images/warehouse/out.jpg"
                  alt="출고"
                  width={20}
                  height={20}
                  className="rounded pointer-events-none select-none"
                />
                출고
              </span>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 flex px-5 py-4 gap-4 overflow-hidden text-sm">
          {isInTab ? (
            <>
              {/* 왼쪽(입고 입력) */}
              <ReceivingTabInView
                palletInRef={palletInRef}
                productInRef={productInRef}
                qtyInRefs={qtyInRefs}
                lastAddedInItemIdRef={lastAddedInItemIdRef}
                palletQRIn={palletQRIn}
                setPalletQRIn={setPalletQRIn}
                selectedPalletIn={selectedPalletIn}
                setSelectedPalletIn={setSelectedPalletIn}
                searchTextIn={searchTextIn}
                setSearchTextIn={setSearchTextIn}
                selectedProductIn={selectedProductIn}
                setSelectedProductIn={setSelectedProductIn}
                showSuggestionsIn={showSuggestionsIn}
                setShowSuggestionsIn={setShowSuggestionsIn}
                showPalletSuggestionsIn={showPalletSuggestionsIn}
                setShowPalletSuggestionsIn={setShowPalletSuggestionsIn}
                itemsIn={itemsIn}
                setItemsIn={setItemsIn}
                inConfirmed={inConfirmed}
                setInConfirmed={setInConfirmed}
                inError={inError}
                setInError={setInError}
                productSuggestionsIn={productSuggestionsIn}
                palletSuggestionsIn={palletSuggestionsIn}
                currentInStock={currentInStock}
                findPalletExact={findPalletExact}
                handleAddItemIn={handleAddItemIn}
                handleRemoveItemIn={handleRemoveItemIn}
                handleChangeQtyIn={handleChangeQtyIn}
              />

              {/* 오른쪽(입고 내역 + 이미지 오른쪽) */}
              <ReceivingRightPanel title="입고 내역" imageSrc="/images/warehouse/in.jpg" imageAlt="입고 안내">
                <p>
                  파렛트: <span className="font-semibold">{displayPalletIn}</span>
                </p>
                <p>
                  위치(이송 예정):{" "}
                  <span className="font-semibold">{formatMoveTarget(targetLocationIn)}</span>
                </p>
                <hr className="my-1" />

                <p className="font-semibold mb-1">현재 파렛트 적재 품목</p>
                {currentInStock.length === 0 ? (
                  <p className="text-gray-400 mb-2">선택된 파렛트의 기존 적재 품목이 없습니다.</p>
                ) : (
                  <ul className="mb-2 list-disc pl-4 space-y-0.5">
                    {currentInStock.map((s) => (
                      <li key={`${s.palletId}-${s.code}`}>
                        {s.name}({s.code}) – BOX{" "}
                        <span className="font-semibold">{s.boxQty.toLocaleString()}</span>, 총{" "}
                        <span className="font-semibold">{s.eaQty.toLocaleString()}</span> EA
                      </li>
                    ))}
                  </ul>
                )}

                <hr className="my-1" />
                <p className="font-semibold mb-1">입고 품목</p>
                {previewInItems.length === 0 ? (
                  <p className="text-gray-400">수량이 입력된 품목이 없습니다.</p>
                ) : (
                  previewInItems.map((it) => (
                    <p key={it.id}>
                      • {it.name}({it.code}) <span className="font-semibold">{it.qty} EA</span>
                    </p>
                  ))
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-gray-500">
                    {inConfirmed ? (
                      <span className="font-semibold text-emerald-700">✅ 재고 반영 완료</span>
                    ) : (
                      <span>① 재고 반영 후 ② 이송 지시 가능</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`rounded-full px-4 py-1 text-xs font-semibold text-white ${
                      canConfirmIn ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 cursor-not-allowed"
                    }`}
                    onClick={handleReceiveOnlyIn}
                    disabled={!canConfirmIn}
                  >
                    입고 확정
                  </button>
                </div>
              </ReceivingRightPanel>
            </>
          ) : (
            <>
              {/* 왼쪽(출고 입력) */}
              <ReceivingTabOutView
                palletOutRef={palletOutRef}
                qtyOutRefs={qtyOutRefs}
                palletQROut={palletQROut}
                setPalletQROut={setPalletQROut}
                selectedPalletOut={selectedPalletOut}
                setSelectedPalletOut={setSelectedPalletOut}
                showPalletSuggestionsOut={showPalletSuggestionsOut}
                setShowPalletSuggestionsOut={setShowPalletSuggestionsOut}
                outFilterText={outFilterText}
                setOutFilterText={setOutFilterText}
                itemsOut={itemsOut}
                filteredOutItems={filteredOutItems}
                outConfirmed={outConfirmed}
                setOutConfirmed={setOutConfirmed}
                outError={outError}
                setOutError={setOutError}
                outHasOver={outHasOver}
                findPalletExact={findPalletExact}
                handleChangeQtyOut={handleChangeQtyOut}
                handleOutAllRow={handleOutAllRow}
                palletSuggestionsOut={palletSuggestionsOut}
              />

              {/* 오른쪽(출고 내역 + 이미지 오른쪽) */}
              <ReceivingRightPanel title="출고 내역" imageSrc="/images/warehouse/out.jpg" imageAlt="출고 안내">
                <p>
                  출고 파렛트: <span className="font-semibold">{displayPalletOut}</span>
                </p>
                <p>
                  이송 위치:{" "}
                  <span className="font-semibold">{formatMoveTarget(targetLocationOut)}</span>
                </p>
                <hr className="my-1" />

                <p className="font-semibold mb-1">출고 품목</p>
                {previewOutItems.length === 0 ? (
                  <p className="text-gray-400">수량이 입력된 출고 품목이 없습니다.</p>
                ) : (
                  previewOutItems.map((it) => (
                    <p key={it.id}>
                      • {it.name}({it.code}) – 현재 {it.totalQty?.toLocaleString() ?? "-"} EA 중{" "}
                      <span className="font-semibold">{it.qty} EA</span> 출고 예정
                    </p>
                  ))
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-gray-500">
                    {outConfirmed ? (
                      <span className="font-semibold text-orange-700">✅ 재고 반영 완료</span>
                    ) : (
                      <span>① 재고 반영 후 ② 이송 지시 가능</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`rounded-full px-4 py-1 text-xs font-semibold text-white ${
                      canConfirmOut ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-300 cursor-not-allowed"
                    }`}
                    onClick={handleOutOnly}
                    disabled={!canConfirmOut}
                  >
                    출고 확정
                  </button>
                </div>
              </ReceivingRightPanel>
            </>
          )}
        </div>

        {/* 푸터: 위치 선택 + 버튼 */}
        <div className="flex items-center justify-end gap-4 px-5 py-3 border-t bg-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-800">
            <span className="font-semibold">{locationLabel}</span>

            {(() => {
              const t = locationValue;
              const forTab: "IN" | "OUT" = isInTab ? "IN" : "OUT";

              const isPicking = t.kind === "PICKING";
              const is2f = t.kind === "2F";
              const is3f = t.kind === "3F";

              const buttonBase = "px-3 py-1.5 rounded-full border text-xs transition";
              const activeCls = "bg-blue-600 border-blue-600 text-white shadow-sm";
              const idleCls = "bg-white border-gray-300 text-gray-700 hover:bg-gray-100";

              return (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`${buttonBase} ${isPicking ? activeCls : idleCls}`}
                    onClick={() => setLocation({ kind: "PICKING" })}
                  >
                    피킹
                  </button>

                  <button
                    type="button"
                    className={`${buttonBase} ${is2f ? activeCls : idleCls}`}
                    onClick={() => {
                      setLocation((prev) => (prev.kind === "2F" ? prev : { kind: "2F", zoneId: null }));
                      openPicker("2F", forTab);
                    }}
                  >
                    2층
                  </button>

                  <button
                    type="button"
                    className={`${buttonBase} ${is3f ? activeCls : idleCls}`}
                    onClick={() => {
                      setLocation((prev) => (prev.kind === "3F" ? prev : { kind: "3F", zoneId: null }));
                      openPicker("3F", forTab);
                    }}
                  >
                    3층
                  </button>

                  <div className="ml-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] text-gray-700">
                    선택: <span className="font-semibold">{formatMoveTarget(t) || "-"}</span>
                    {(t.kind === "2F" || t.kind === "3F") && !t.zoneId && (
                      <span className="ml-2 text-red-600">구역 미선택</span>
                    )}
                  </div>
                </div>
              );
            })()}
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
                className={`px-4 py-1.5 rounded-full text-xs ${
                  canMoveIn ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-white cursor-not-allowed"
                }`}
                onClick={handleMoveIn}
                disabled={!canMoveIn}
              >
                이송 지시
              </button>
            ) : (
              <button
                className={`px-4 py-1.5 rounded-full text-xs ${
                  canMoveOut ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-white cursor-not-allowed"
                }`}
                onClick={handleSubmitOut}
                disabled={!canMoveOut}
              >
                이송 지시
              </button>
            )}
          </div>
        </div>

        {/* ✅ 구역 선택 모달 */}
        <WarehouseZonePickerModal
          open={zonePickerOpen}
          floor={zonePickerFloor}
          onClose={() => setZonePickerOpen(false)}
          onSelect={(zone: ZoneDef) => {
            setZonePickerOpen(false);

            if (zonePickerFor === "IN") {
              setTargetLocationIn(() => {
                if (zonePickerFloor === "2F") return { kind: "2F", zoneId: zone.id };
                return { kind: "3F", zoneId: zone.id };
              });
            } else {
              setTargetLocationOut(() => {
                if (zonePickerFloor === "2F") return { kind: "2F", zoneId: zone.id };
                return { kind: "3F", zoneId: zone.id };
              });
            }
          }}
        />
      </div>
    </div>
  );
}
