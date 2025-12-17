// components/ReceivingModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  WarehouseZonePickerModal,
  type WarehouseFloor,
  type ZoneDef,
} from "./WarehouseZonePickerModal";

type ReceivingModalProps = {
  open: boolean;
  onClose: () => void;
};

type ReceivingItem = {
  id: number;
  code: string;
  name: string;
  qty: number; // 입고/출고 수량
  boxQty?: number; // 현재 박스 수량(출고 탭용)
  totalQty?: number; // 현재 전체 수량 EA(출고 탭용)
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

function normalizeNum(value: string) {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

function findPalletExact(q: string) {
  const t = q.trim().toUpperCase();
  return PALLET_MASTER.find((p) => p.id.toUpperCase() === t) ?? null;
}

/** ✅ 이송 위치 모델 */
type MoveTarget =
  | { kind: "PICKING" }
  | { kind: "2F"; zoneId: string | null }
  | { kind: "3F"; zoneId: string | null };

const formatMoveTarget = (t: MoveTarget) => {
  if (t.kind === "PICKING") return "피킹";
  if (t.kind === "2F")
    return `2층${t.zoneId ? ` - ${t.zoneId.replace("2F-", "")}` : ""}`;
  return `3층${t.zoneId ? ` - ${t.zoneId.replace("3F-", "")}` : ""}`;
};

const ensureZoneSelected = (t: MoveTarget) => {
  if (t.kind === "2F" || t.kind === "3F") return !!t.zoneId;
  return true;
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
  const [targetLocationIn, setTargetLocationIn] = useState<MoveTarget>({
    kind: "PICKING",
  });
  const [selectedProductIn, setSelectedProductIn] =
    useState<ProductMaster | null>(null);
  const [showSuggestionsIn, setShowSuggestionsIn] = useState(false);
  const [showPalletSuggestionsIn, setShowPalletSuggestionsIn] =
    useState(false);

  // ✅ (1) A 분리: 재고 확정 여부
  const [inConfirmed, setInConfirmed] = useState(false);
  const [inError, setInError] = useState<string | null>(null);

  // ----------------- 출고 탭 상태 -----------------
  const [palletQROut, setPalletQROut] = useState("");
  const [selectedPalletOut, setSelectedPalletOut] =
    useState<PalletMaster | null>(null);
  const [itemsOut, setItemsOut] = useState<ReceivingItem[]>([]);
  const [targetLocationOut, setTargetLocationOut] = useState<MoveTarget>({
    kind: "PICKING",
  });
  const [showPalletSuggestionsOut, setShowPalletSuggestionsOut] =
    useState(false);

  // ✅ (4) 출고 리스트 필터
  const [outFilterText, setOutFilterText] = useState("");
  // ✅ (1) A 분리: 출고 재고 확정 여부
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

    // 파렛트가 바뀌면 확정/오류 초기화
    setOutConfirmed(false);
    setOutError(null);

    if (!palletId) {
      setItemsOut([]);
      return;
    }

    const items = buildOutItemsFromStock(palletId);
    setItemsOut(items);

    // 첫 qty로 포커스(UX)
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
    setInConfirmed(false); // 입고 목록 바뀌면 확정 해제

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

    // ✅ (4) 중복 추가 방지: 같은 코드가 이미 있으면 그 행으로 포커스
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
    setItemsIn((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: num } : it)),
    );
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

    // ✅ (1) A 분리: 확정만 하고 모달 유지
    setInConfirmed(true);

    // 데모용 안내(원하면 제거 가능)
    const first = validItems[0];
    if (validItems.length === 1) {
      alert(`(확정) 파렛트 ${palletText}에 ${first.name} ${first.qty}EA 입고 반영`);
    } else {
      const total = validItems.reduce((sum, x) => sum + x.qty, 0);
      alert(
        `(확정) 파렛트 ${palletText}에 ${first.name} 외 ${
          validItems.length - 1
        }개 품목, 총 ${total}EA 입고 반영`,
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

    const summary = validItems
      .map((it) => `${it.name}(${it.code}) ${it.qty}EA`)
      .join("\n");

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
        // ✅ (2) 출고는 최대값 초과 입력 방지(일단 clamp)
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

  /** 🔹 오른쪽 패널의 [출고 확정] 버튼 (출고만 처리, 모달 유지) */
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

    // ✅ (2) 초과 검증(혹시라도 clamp 이전 상태 방지)
    const over = validItems.find(
      (x) => typeof x.totalQty === "number" && x.qty > (x.totalQty ?? 0),
    );
    if (over) {
      setOutError(`출고수량이 현재수량을 초과했습니다: ${over.name}`);
      return;
    }

    setOutConfirmed(true);

    // 데모용 안내
    if (validItems.length === 1) {
      const f = validItems[0];
      alert(`(확정) 파렛트 ${palletTextOut}에서 ${f.name} ${f.qty}EA 출고 반영`);
    } else {
      const lines = validItems.map((it) => `• ${it.name}(${it.code}) ${it.qty}EA`);
      alert(
        [`(확정) 파렛트 ${palletTextOut}에서 아래 제품 출고 반영`, "", ...lines].join(
          "\n",
        ),
      );
    }
  };

  /** 🔹 푸터의 [이송 지시] 버튼 (출고 탭: 출고 확정 + 이송) */
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
          selectedPalletOut
            ? `${selectedPalletOut.id} (${selectedPalletOut.desc})`
            : palletQROut
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

  // 🔹 위치 라벨은 탭 상관없이 항상 "이송 위치"
  const locationLabel = "이송 위치";
  const locationValue = isInTab ? targetLocationIn : targetLocationOut;
  const setLocation = isInTab ? setTargetLocationIn : setTargetLocationOut;

  const displayPalletIn = selectedPalletIn
    ? `${selectedPalletIn.id} (${selectedPalletIn.desc})`
    : palletQRIn || "미입력";

  const displayPalletOut = selectedPalletOut
    ? `${selectedPalletOut.id} (${selectedPalletOut.desc})`
    : palletQROut || "미입력";

  // ✅ (3) 미리보기는 qty>0만 표시
  const previewInItems = useMemo(() => itemsIn.filter((x) => x.qty > 0), [itemsIn]);
  const previewOutItems = useMemo(
    () => itemsOut.filter((x) => x.qty > 0),
    [itemsOut],
  );

  // ✅ (4) 출고 목록 필터 적용(표시만)
  const filteredOutItems = useMemo(() => {
    const q = outFilterText.trim().toLowerCase();
    if (!q) return itemsOut;
    return itemsOut.filter(
      (x) => x.code.toLowerCase().includes(q) || x.name.toLowerCase().includes(q),
    );
  }, [itemsOut, outFilterText]);

  // 버튼 활성/비활성
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
  const canMoveOut =
    canConfirmOut && outConfirmed && ensureZoneSelected(targetLocationOut);

  if (!open) return null;

  // ----------------- JSX -----------------
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[960px] max-h-[90vh] flex flex-col overflow-hidden">
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
              입고
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
              출고
            </button>
          </div>
        </div>

        {/* 본문 */}
        {isInTab ? (
          /* ===================== 입고 탭 ===================== */
          <div className="flex-1 flex px-5 py-4 gap-4 overflow-hidden text-sm">
            {/* 왼쪽: 입력 영역 */}
            <div className="w-[58%] flex flex-col gap-4 min-w-0">
              {/* 파렛트 번호 (입고) */}
              <section className="space-y-1.5">
                <h3 className="text-xs font-semibold text-gray-700">파렛트번호 (QR코드)</h3>
                <div className="flex gap-2">
                  <input
                    ref={palletInRef}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="QR 스캔 또는 직접 입력 (예: PLT-1234)"
                    value={palletQRIn}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPalletQRIn(v);
                      setSelectedPalletIn(null);
                      setShowPalletSuggestionsIn(!!v);
                      setInConfirmed(false);
                      setInError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const exact = findPalletExact(palletQRIn);
                        if (exact) {
                          setSelectedPalletIn(exact);
                          setPalletQRIn(exact.id);
                          setShowPalletSuggestionsIn(false);
                          setTimeout(() => productInRef.current?.focus(), 0);
                        }
                      }
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
                          setInConfirmed(false);
                          setInError(null);
                          setTimeout(() => productInRef.current?.focus(), 0);
                        }}
                        className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
                      >
                        <span className="font-mono">{p.id}</span>
                        <span className="ml-2 text-gray-600 flex-1 truncate">{p.desc}</span>
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
                      <span className="ml-1 text-gray-700">{selectedPalletIn.desc}</span>
                    </>
                  ) : palletQRIn ? (
                    <span className="text-gray-500">
                      직접 입력한 파렛트 번호:{" "}
                      <span className="font-mono font-semibold">{palletQRIn}</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">선택된 파렛트가 없습니다.</span>
                  )}
                </div>
              </section>

              {/* 상품 조회 / 추가 */}
              <section className="space-y-1.5">
                <h3 className="text-xs font-semibold text-gray-700">제품 조회</h3>
                <div className="flex gap-2">
                  <input
                    ref={productInRef}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="제품 코드 또는 이름 (예: P-1001 / PET 500ml)"
                    value={searchTextIn}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearchTextIn(v);
                      setSelectedProductIn(null);
                      setShowSuggestionsIn(!!v);
                      setInConfirmed(false);
                      setInError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddItemIn();
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
                          setInConfirmed(false);
                          setInError(null);

                          const exists = itemsIn.find((x) => x.code === p.code);
                          if (exists) {
                            lastAddedInItemIdRef.current = exists.id;
                            setSearchTextIn("");
                            setSelectedProductIn(null);
                            return;
                          }

                          const newItem: ReceivingItem = {
                            id: Date.now(),
                            code: p.code,
                            name: p.name,
                            qty: 0,
                          };
                          lastAddedInItemIdRef.current = newItem.id;
                          setItemsIn((prev) => [...prev, newItem]);
                          setSearchTextIn("");
                          setSelectedProductIn(null);
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
              <section className="space-y-1.5 flex-1 min-h-[160px] min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-700">입고 품목 목록</h3>
                  {inConfirmed && (
                    <span className="text-[11px] font-semibold text-emerald-700">
                      ✅ 입고 확정 완료
                    </span>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden max-h-[260px]">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-2 py-2 text-left w-28">상품코드</th>
                        <th className="px-2 py-2 text-left">상품명</th>
                        <th className="px-2 py-2 text-center w-28">입고수량(EA)</th>
                        <th className="px-2 py-2 text-center w-16">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsIn.length === 0 ? (
                        <tr>
                          <td className="px-3 py-4 text-center text-gray-400 text-xs" colSpan={4}>
                            아직 추가된 입고 품목이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        itemsIn.map((it) => (
                          <tr key={it.id} className="border-t hover:bg-gray-50 text-[11px]">
                            <td className="px-2 py-2 font-medium text-gray-800">{it.code}</td>
                            <td className="px-2 py-2 text-gray-700">{it.name}</td>
                            <td className="px-2 py-1 text-center">
                              <input
                                ref={(el) => {
                                  qtyInRefs.current[it.id] = el;
                                }}
                                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs text-right"
                                value={it.qty || ""}
                                onChange={(e) => handleChangeQtyIn(it.id, e.target.value)}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <button
                                type="button"
                                className="rounded-full border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100"
                                onClick={() => handleRemoveItemIn(it.id)}
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {inError && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    {inError}
                  </div>
                )}
              </section>
            </div>

            {/* 오른쪽: 입고 미리보기 + 기존 파렛트 재고 + 입고 확정 버튼 */}
            <div className="w-[42%] flex flex-col border-l pl-4 min-w-0">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">이번 입고 지시 미리보기</h3>
              <div className="flex-1 border rounded-lg bg-gray-50 px-3 py-2 overflow-auto text-[11px] text-gray-700 space-y-1">
                <p>
                  파렛트: <span className="font-semibold">{displayPalletIn}</span>
                </p>
                <p>
                  위치(이송 예정):{" "}
                  <span className="font-semibold">{formatMoveTarget(targetLocationIn)}</span>
                </p>
                <hr className="my-1" />

                {/* 기존 파렛트 재고 */}
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

                {/* 오른쪽 아래 [입고 확정] 버튼 */}
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
                      canConfirmIn
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                    onClick={handleReceiveOnlyIn}
                    disabled={!canConfirmIn}
                  >
                    입고 확정
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== 출고 탭 ===================== */
          <div className="flex-1 flex px-5 py-4 gap-4 overflow-hidden text-sm">
            {/* 왼쪽: 출고 입력 */}
            <div className="w-[58%] flex flex-col gap-4 min-w-0">
              {/* 파렛트 번호 (출고) */}
              <section className="space-y-1.5">
                <h3 className="text-xs font-semibold text-gray-700">출고 파렛트번호 (QR코드)</h3>
                <div className="flex gap-2">
                  <input
                    ref={palletOutRef}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="QR 스캔 또는 직접 입력 (예: PLT-1234)"
                    value={palletQROut}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPalletQROut(v);
                      setSelectedPalletOut(null);
                      setShowPalletSuggestionsOut(!!v);
                      setOutConfirmed(false);
                      setOutError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const exact = findPalletExact(palletQROut);
                        if (exact) {
                          setSelectedPalletOut(exact);
                          setPalletQROut(exact.id);
                          setShowPalletSuggestionsOut(false);
                        }
                      }
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
                {showPalletSuggestionsOut && palletSuggestionsOut.length > 0 && (
                  <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px] shadow-sm">
                    {palletSuggestionsOut.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPalletQROut(p.id);
                          setSelectedPalletOut(p);
                          setShowPalletSuggestionsOut(false);
                          setOutConfirmed(false);
                          setOutError(null);
                        }}
                        className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
                      >
                        <span className="font-mono">{p.id}</span>
                        <span className="ml-2 text-gray-600 flex-1 truncate">{p.desc}</span>
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
                      <span className="ml-1 text-gray-700">{selectedPalletOut.desc}</span>
                    </>
                  ) : palletQROut ? (
                    <span className="text-gray-500">
                      직접 입력한 파렛트 번호:{" "}
                      <span className="font-mono font-semibold">{palletQROut}</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">선택된 파렛트가 없습니다.</span>
                  )}
                </div>
              </section>

              {/* 출고 목록 필터 */}
              <section className="space-y-1.5">
                <h3 className="text-xs font-semibold text-gray-700">품목 필터 (코드/이름)</h3>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="예: P-1001 / PET"
                  value={outFilterText}
                  onChange={(e) => setOutFilterText(e.target.value)}
                />
              </section>

              {/* 출고 품목 목록 */}
              <section className="space-y-1.5 flex-1 min-h-[160px] min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-700">출고 품목 목록</h3>
                  {outConfirmed && (
                    <span className="text-[11px] font-semibold text-orange-700">
                      ✅ 출고 확정 완료
                    </span>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden max-h-[260px]">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-2 py-2 text-left w-24">상품코드</th>
                        <th className="px-2 py-2 text-left">상품명</th>
                        <th className="px-2 py-2 text-right w-20">BOX</th>
                        <th className="px-2 py-2 text-right w-24">전체수량(EA)</th>
                        <th className="px-2 py-2 text-center w-28">출고수량(EA)</th>
                        <th className="px-2 py-2 text-center w-16">전량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOutItems.length === 0 ? (
                        <tr>
                          <td className="px-3 py-4 text-center text-gray-400 text-xs" colSpan={6}>
                            표시할 품목이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredOutItems.map((it) => {
                          const max = typeof it.totalQty === "number" ? it.totalQty : 0;
                          const isOver = typeof it.totalQty === "number" && it.qty > max;

                          return (
                            <tr
                              key={it.id}
                              className={`border-t hover:bg-gray-50 text-[11px] ${
                                isOver ? "bg-red-50" : ""
                              }`}
                            >
                              <td className="px-2 py-2 font-medium text-gray-800">{it.code}</td>
                              <td className="px-2 py-2 text-gray-700">{it.name}</td>
                              <td className="px-2 py-2 text-right">
                                {it.boxQty?.toLocaleString() ?? "-"}
                              </td>
                              <td className="px-2 py-2 text-right">
                                {it.totalQty?.toLocaleString() ?? "-"}
                              </td>
                              <td className="px-2 py-1 text-center">
                                <input
                                  ref={(el) => {
                                    qtyOutRefs.current[it.id] = el;
                                  }}
                                  className={`w-20 rounded-md border px-2 py-1 text-xs text-right ${
                                    isOver ? "border-red-300 bg-white" : "border-gray-300 bg-white"
                                  }`}
                                  value={it.qty || ""}
                                  onChange={(e) => handleChangeQtyOut(it.id, e.target.value)}
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-1 text-center">
                                <button
                                  type="button"
                                  className="rounded-full border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100"
                                  onClick={() => handleOutAllRow(it.id)}
                                >
                                  전량
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {outHasOver && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    출고수량이 현재수량을 초과한 품목이 있습니다. (현재수량 이하로 입력해 주세요)
                  </div>
                )}

                {outError && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    {outError}
                  </div>
                )}
              </section>
            </div>

            {/* 오른쪽: 출고 미리보기 + 출고 확정 버튼 */}
            <div className="w-[42%] flex flex-col border-l pl-4 min-w-0">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">
                이번 출고 / 이송 지시 미리보기
              </h3>
              <div className="flex-1 border rounded-lg bg-gray-50 px-3 py-2 overflow-auto text-[11px] text-gray-700 space-y-1">
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
                      canConfirmOut
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                    onClick={handleOutOnly}
                    disabled={!canConfirmOut}
                  >
                    출고 확정
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 푸터: 위치 선택 + 버튼 */}
        <div className="flex items-center justify-end gap-4 px-5 py-3 border-t bg-gray-50">
          {/* 위치 선택 */}
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
                      setLocation((prev) =>
                        prev.kind === "2F" ? prev : { kind: "2F", zoneId: null },
                      );
                      openPicker("2F", forTab);
                    }}
                  >
                    2층
                  </button>

                  <button
                    type="button"
                    className={`${buttonBase} ${is3f ? activeCls : idleCls}`}
                    onClick={() => {
                      setLocation((prev) =>
                        prev.kind === "3F" ? prev : { kind: "3F", zoneId: null },
                      );
                      openPicker("3F", forTab);
                    }}
                  >
                    3층
                  </button>

                  {/* 선택 결과 표시 */}
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

          {/* 버튼들 */}
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
                  canMoveIn
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-white cursor-not-allowed"
                }`}
                onClick={handleMoveIn}
                disabled={!canMoveIn}
              >
                이송 지시
              </button>
            ) : (
              <button
                className={`px-4 py-1.5 rounded-full text-xs ${
                  canMoveOut
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-white cursor-not-allowed"
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
