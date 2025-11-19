// components/StockManualAdjustModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  code: string;
  name: string;
  currentStock: number; // 현재 재고(EA)
};

type InboundSelected = {
  id: string;
  code: string;
  name: string;
  inboundQty: number;
};

type PalletItem = {
  id: string;
  palletId: string;
  productId: string;
  code: string;
  name: string;
  qty: number; // 파렛트 내 수량(EA)
};

type OutboundSelected = {
  id: string;
  palletId: string;
  productId: string;
  code: string;
  name: string;
  palletQty: number;
  outboundQty: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

// 데모용 마스터 상품
const MASTER_PRODUCTS: Product[] = [
  { id: "PRD-001", code: "P-001", name: "PET 500ml 투명", currentStock: 1200 },
  { id: "PRD-002", code: "P-013", name: "PET 1L 반투명", currentStock: 800 },
  { id: "PRD-003", code: "C-201", name: "캡 28파이 화이트", currentStock: 5000 },
  { id: "PRD-004", code: "L-009", name: "라벨 500ml 화이트", currentStock: 3000 },
];

// 데모용 파렛트별 적재 정보 (출고용)
const PALLET_ITEMS: PalletItem[] = [
  {
    id: "PL-001-1",
    palletId: "PAL-001-A",
    productId: "PRD-001",
    code: "P-001",
    name: "PET 500ml 투명",
    qty: 600,
  },
  {
    id: "PL-001-2",
    palletId: "PAL-001-B",
    productId: "PRD-001",
    code: "P-001",
    name: "PET 500ml 투명",
    qty: 600,
  },
  {
    id: "PL-013-1",
    palletId: "PAL-013-A",
    productId: "PRD-002",
    code: "P-013",
    name: "PET 1L 반투명",
    qty: 720,
  },
  {
    id: "PL-201-1",
    palletId: "PAL-201-A",
    productId: "PRD-003",
    code: "C-201",
    name: "캡 28파이 화이트",
    qty: 2000,
  },
  {
    id: "PL-009-1",
    palletId: "PAL-009-A",
    productId: "PRD-004",
    code: "L-009",
    name: "라벨 500ml 화이트",
    qty: 3000,
  },
];

export function StockManualAdjustModal({ open, onClose }: Props) {
  // 공통: 탭 / 파렛트 QR / 창고 위치
  const [tab, setTab] = useState<"inbound" | "outbound">("inbound");
  const [palletQr, setPalletQr] = useState("");
  const [location, setLocation] = useState<string>("2층 피킹창고 A라인");

  // 공통 재고 상태
  const [inventory, setInventory] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    MASTER_PRODUCTS.forEach((p) => {
      init[p.id] = p.currentStock;
    });
    return init;
  });

  // ====== 입고 탭 상태 ======
  const [searchTermIn, setSearchTermIn] = useState("");
  const [hasSearchedIn, setHasSearchedIn] = useState(false);
  const [leftCheckedIn, setLeftCheckedIn] = useState<string[]>([]);
  const [rightCheckedIn, setRightCheckedIn] = useState<string[]>([]);
  const [selectedIn, setSelectedIn] = useState<InboundSelected[]>([]);

  // 입고 검색 결과
  const inboundResults = useMemo(() => {
    if (!hasSearchedIn || !searchTermIn.trim()) return [];
    const q = searchTermIn.trim().toLowerCase();

    return MASTER_PRODUCTS.filter(
      (p) =>
        p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [searchTermIn, hasSearchedIn]);

  // 입고 합계
  const totalInboundEa = useMemo(
    () => selectedIn.reduce((sum, p) => sum + (p.inboundQty || 0), 0),
    [selectedIn],
  );

  // 상품별 요약 (입고)
  const inboundSummary = useMemo(() => {
    const map = new Map<string, number>();
    selectedIn.forEach((p) => {
      if (!p.inboundQty) return;
      map.set(p.name, (map.get(p.name) ?? 0) + p.inboundQty);
    });
    return Array.from(map.entries());
  }, [selectedIn]);

  // ====== 출고 탭 상태 ======
  const [hasSearchedOut, setHasSearchedOut] = useState(false);
  const [leftCheckedOut, setLeftCheckedOut] = useState<string[]>([]);
  const [rightCheckedOut, setRightCheckedOut] = useState<string[]>([]);
  const [selectedOut, setSelectedOut] = useState<OutboundSelected[]>([]);

  // 출고 검색 결과 (파렛트 QR 기준)
  const outboundResults = useMemo(() => {
    if (!hasSearchedOut || !palletQr.trim()) return [];
    const q = palletQr.trim().toLowerCase();

    return PALLET_ITEMS.filter((p) =>
      p.palletId.toLowerCase().includes(q),
    );
  }, [palletQr, hasSearchedOut]);

  const totalOutboundEa = useMemo(
    () => selectedOut.reduce((sum, p) => sum + (p.outboundQty || 0), 0),
    [selectedOut],
  );

  const outboundSummary = useMemo(() => {
    const map = new Map<string, number>();
    selectedOut.forEach((p) => {
      if (!p.outboundQty) return;
      map.set(p.name, (map.get(p.name) ?? 0) + p.outboundQty);
    });
    return Array.from(map.entries());
  }, [selectedOut]);

  // ---------- 공통 리셋 ----------
  const resetState = () => {
    setTab("inbound");
    setPalletQr("");
    setLocation("2층 피킹창고 A라인");

    setSearchTermIn("");
    setHasSearchedIn(false);
    setLeftCheckedIn([]);
    setRightCheckedIn([]);
    setSelectedIn([]);

    setHasSearchedOut(false);
    setLeftCheckedOut([]);
    setRightCheckedOut([]);
    setSelectedOut([]);
  };

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  // ---------- 입고 핸들러 ----------
  const handleSearchInbound = () => {
    setHasSearchedIn(true);
    setLeftCheckedIn([]);
  };

  const moveToRightInbound = () => {
    if (leftCheckedIn.length === 0) return;

    setSelectedIn((prev) => {
      const map = new Map<string, InboundSelected>();
      prev.forEach((p) => map.set(p.id, p));

      leftCheckedIn.forEach((id) => {
        const product = MASTER_PRODUCTS.find((p) => p.id === id);
        if (!product) return;
        if (!map.has(product.id)) {
          map.set(product.id, {
            id: product.id,
            code: product.code,
            name: product.name,
            inboundQty: 0,
          });
        }
      });

      return Array.from(map.values());
    });

    setLeftCheckedIn([]);
  };

  const removeFromRightInbound = () => {
    if (rightCheckedIn.length === 0) return;
    setSelectedIn((prev) =>
      prev.filter((p) => !rightCheckedIn.includes(p.id)),
    );
    setRightCheckedIn([]);
  };

  const handleInbound = () => {
    if (selectedIn.length === 0) {
      alert("입고할 상품을 선택해 주세요.");
      return;
    }

    const hasQty = selectedIn.some((p) => p.inboundQty > 0);
    if (!hasQty) {
      alert("입고 수량(EA)을 1개 이상 입력해 주세요.");
      return;
    }

    setInventory((prev) => {
      const next = { ...prev };
      selectedIn.forEach((p) => {
        if (p.inboundQty <= 0) return;
        next[p.id] = (next[p.id] ?? 0) + p.inboundQty;
      });
      return next;
    });

    const summaryText = selectedIn
      .filter((p) => p.inboundQty > 0)
      .map((p) => `${p.name} ${p.inboundQty.toLocaleString()}EA`)
      .join(", ");

    alert(`다음 상품이 입고 처리되었습니다.\n\n${summaryText}`);

    setSelectedIn([]);
    setRightCheckedIn([]);
  };

  // ---------- 출고 핸들러 ----------
  const handleSearchOutbound = () => {
    setHasSearchedOut(true);
    setLeftCheckedOut([]);
  };

  const moveToRightOutbound = () => {
    if (leftCheckedOut.length === 0) return;

    setSelectedOut((prev) => {
      const map = new Map<string, OutboundSelected>();
      prev.forEach((p) => map.set(p.id, p));

      leftCheckedOut.forEach((id) => {
        const item = PALLET_ITEMS.find((p) => p.id === id);
        if (!item) return;
        if (!map.has(item.id)) {
          map.set(item.id, {
            id: item.id,
            palletId: item.palletId,
            productId: item.productId,
            code: item.code,
            name: item.name,
            palletQty: item.qty,
            outboundQty: item.qty, // 기본값: 파렛트 그대로 출고
          });
        }
      });

      return Array.from(map.values());
    });

    setLeftCheckedOut([]);
  };

  const removeFromRightOutbound = () => {
    if (rightCheckedOut.length === 0) return;
    setSelectedOut((prev) =>
      prev.filter((p) => !rightCheckedOut.includes(p.id)),
    );
    setRightCheckedOut([]);
  };

  const handleOutbound = () => {
    if (selectedOut.length === 0) {
      alert("출고할 파렛트를 선택해 주세요.");
      return;
    }

    const hasQty = selectedOut.some((p) => p.outboundQty > 0);
    if (!hasQty) {
      alert("출고 수량(EA)을 1개 이상 입력해 주세요.");
      return;
    }

    // 재고 차감
    setInventory((prev) => {
      const next = { ...prev };
      selectedOut.forEach((p) => {
        if (p.outboundQty <= 0) return;
        const before = next[p.productId] ?? 0;
        const after = Math.max(0, before - p.outboundQty);
        next[p.productId] = after;
      });
      return next;
    });

    const summaryText = selectedOut
      .filter((p) => p.outboundQty > 0)
      .map((p) => `${p.name} ${p.outboundQty.toLocaleString()}EA`)
      .join(", ");

    alert(`다음 상품이 출고 처리되었습니다.\n\n${summaryText}`);

    setSelectedOut([]);
    setRightCheckedOut([]);
  };

  // ---------- 공통: 이송 ----------
  const handleMove = () => {
    if (!location.trim()) {
      alert("창고 위치를 선택해 주세요.");
      return;
    }

    const modeLabel = tab === "inbound" ? "입고 완료 파렛트" : "출고 대상 파렛트";

    alert(
      `${modeLabel}를 ${location} 으로 이송합니다.\n\n(데모 화면에서는 실제 이동 대신 안내만 표시합니다.)`,
    );
  };

  // 모든 hook 호출 후 open 체크
  if (!open) return null;

  // -------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[1000px] h-[640px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-semibold">파렛트 입출고 관리</h2>
              <p className="mt-0.5 text-[11px] text-gray-500">
                파렛트 QR을 기준으로 상품을 입고 / 출고하고, 창고 위치로 AMR
                이송까지 시뮬레이션합니다.
              </p>
            </div>
            {/* 탭: 입고 / 출고 */}
            <div className="flex items-center bg-gray-100 rounded-full p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setTab("inbound")}
                className={`px-3 py-1 rounded-full ${
                  tab === "inbound"
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500"
                }`}
              >
                입고
              </button>
              <button
                type="button"
                onClick={() => setTab("outbound")}
                className={`px-3 py-1 rounded-full ${
                  tab === "outbound"
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500"
                }`}
              >
                출고
              </button>
            </div>
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

        {/* 바디 */}
        <div className="flex-1 px-5 py-4 flex flex-col gap-3">
          {/* 상단: 탭별 내용 */}
          {tab === "inbound" ? (
            // ===== 입고 화면 =====
            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-4 min-h-0">
              {/* 왼쪽: 상품 조회 */}
              <div className="flex flex-col border rounded-xl bg-gray-50/60">
                <div className="px-3 py-2 border-b space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      파렛트
                    </p>
                    <input
                      value={palletQr}
                      onChange={(e) => setPalletQr(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      placeholder="파렛트 QR 코드를 스캔하거나 직접 입력"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-800">
                        상품조회
                      </p>
                      <button
                        type="button"
                        onClick={handleSearchInbound}
                        className="px-3 py-1 rounded-md bg-gray-800 text-white text-xs"
                      >
                        조회
                      </button>
                    </div>
                    <input
                      value={searchTermIn}
                      onChange={(e) => setSearchTermIn(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      placeholder="상품코드 또는 상품명 (예: P-001, PET 500ml)"
                    />
                    <p className="mt-1 text-[11px] text-gray-400">
                      파렛트 QR 스캔 후 상품을 입력하고 조회하면 아래에 상품
                      리스트가 표시됩니다.
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-auto px-3 py-2">
                  <p className="text-[11px] text-gray-500 mb-1">
                    상품 조회 리스트 ({inboundResults.length}개)
                  </p>
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-gray-50 border-b">
                      <tr>
                        <th className="w-6 p-1 text-center">
                          <input
                            type="checkbox"
                            checked={
                              inboundResults.length > 0 &&
                              leftCheckedIn.length === inboundResults.length
                            }
                            onChange={(e) =>
                              setLeftCheckedIn(
                                e.target.checked
                                  ? inboundResults.map((p) => p.id)
                                  : [],
                              )
                            }
                          />
                        </th>
                        <th className="p-1 text-left w-20">상품코드</th>
                        <th className="p-1 text-left">상품명</th>
                        <th className="p-1 text-right w-24">현재재고(EA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!hasSearchedIn && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-3 text-center text-[11px] text-gray-400"
                          >
                            상품을 조회하면 이 영역에 리스트가 표시됩니다.
                          </td>
                        </tr>
                      )}
                      {hasSearchedIn && inboundResults.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-3 text-center text-[11px] text-gray-400"
                          >
                            조회 결과가 없습니다.
                          </td>
                        </tr>
                      )}
                      {inboundResults.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b last:border-b-0 hover:bg-white"
                        >
                          <td className="p-1 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={leftCheckedIn.includes(p.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setLeftCheckedIn((prev) =>
                                  checked
                                    ? [...prev, p.id]
                                    : prev.filter((id) => id !== p.id),
                                );
                              }}
                            />
                          </td>
                          <td className="p-1 align-middle">{p.code}</td>
                          <td className="p-1 align-middle">{p.name}</td>
                          <td className="p-1 align-middle text-right">
                            {(inventory[p.id] ?? p.currentStock).toLocaleString()}
                          </td>
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
                  onClick={moveToRightInbound}
                  className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shadow hover:bg-blue-700 disabled:bg-gray-300"
                  disabled={leftCheckedIn.length === 0}
                  title="선택 상품 추가"
                >
                  ▶
                </button>
                <button
                  type="button"
                  onClick={removeFromRightInbound}
                  className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center hover:bg-gray-300 disabled:bg-gray-100"
                  disabled={rightCheckedIn.length === 0}
                  title="선택 상품 제거"
                >
                  ◀
                </button>
              </div>

              {/* 오른쪽: 선택된 상품 + 입고 */}
              <div className="flex flex-col border rounded-xl bg-gray-50/60">
                <div className="px-3 py-2 border-b flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-800">
                    선택된 상품 리스트 (입고)
                  </p>
                  <p className="text-[11px] text-gray-500">
                    총 입고 예정{" "}
                    <span className="font-semibold text-gray-800">
                      {totalInboundEa.toLocaleString()}
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
                              selectedIn.length > 0 &&
                              rightCheckedIn.length === selectedIn.length
                            }
                            onChange={(e) =>
                              setRightCheckedIn(
                                e.target.checked
                                  ? selectedIn.map((p) => p.id)
                                  : [],
                              )
                            }
                          />
                        </th>
                        <th className="p-1 text-left w-20">상품코드</th>
                        <th className="p-1 text-left">상품명</th>
                        <th className="p-1 text-right w-20">입고수량(EA)</th>
                        <th className="p-1 text-right w-24">
                          입고 후 재고(EA)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIn.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-3 text-center text-[11px] text-gray-400"
                          >
                            아직 선택된 상품이 없습니다. 좌측에서 상품을 선택해
                            주세요.
                          </td>
                        </tr>
                      )}
                      {selectedIn.map((p) => {
                        const baseStock =
                          inventory[p.id] ??
                          MASTER_PRODUCTS.find((m) => m.id === p.id)
                            ?.currentStock ??
                          0;
                        const afterStock = baseStock + (p.inboundQty || 0);

                        return (
                          <tr
                            key={p.id}
                            className="border-b last:border-b-0 hover:bg-white"
                          >
                            <td className="p-1 text-center align-middle">
                              <input
                                type="checkbox"
                                checked={rightCheckedIn.includes(p.id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setRightCheckedIn((prev) =>
                                    checked
                                      ? [...prev, p.id]
                                      : prev.filter((id) => id !== p.id),
                                  );
                                }}
                              />
                            </td>
                            <td className="p-1 align-middle">{p.code}</td>
                            <td className="p-1 align-middle">{p.name}</td>
                            <td className="p-1 align-middle text-right">
                              <input
                                type="number"
                                min={0}
                                value={p.inboundQty}
                                onChange={(e) => {
                                  const value = Number(e.target.value || 0);
                                  setSelectedIn((prev) =>
                                    prev.map((sp) =>
                                      sp.id === p.id
                                        ? { ...sp, inboundQty: value }
                                        : sp,
                                    ),
                                  );
                                }}
                                className="w-20 border border-gray-300 rounded px-1 py-0.5 text-right text-[11px]"
                              />
                            </td>
                            <td className="p-1 align-middle text-right">
                              {afterStock.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-3 py-2 border-t flex items-center justify-between text-[11px] text-gray-600">
                  <div className="space-y-0.5">
                    {inboundSummary.length > 0 && (
                      <p>
                        · 상품별 입고 요약:&nbsp;
                        {inboundSummary.map(([name, ea], idx) => (
                          <span key={name}>
                            {idx > 0 && " / "}
                            <span className="font-semibold">{name}</span>{" "}
                            {ea.toLocaleString()} EA
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleInbound}
                    className="px-4 py-1.5 rounded-full bg-green-600 text-white text-xs hover:bg-green-700 disabled:bg-gray-300"
                    disabled={selectedIn.length === 0}
                  >
                    입고
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // ===== 출고 화면 =====
            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-4 min-h-0">
              {/* 왼쪽: 파렛트 QR → 적재 내역 조회 */}
              <div className="flex flex-col border rounded-xl bg-gray-50/60">
                <div className="px-3 py-2 border-b space-y-2">
                  <div className="flex items-end justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-800">
                        파렛트 QR
                      </p>
                      <input
                        value={palletQr}
                        onChange={(e) => setPalletQr(e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                        placeholder="파렛트 QR 코드를 스캔하면 해당 파렛트 적재 내역이 조회됩니다."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchOutbound}
                      className="px-3 py-1 rounded-md bg-gray-800 text-white text-xs mb-0.5"
                    >
                      조회
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    조회 후 아래 리스트에서 출고할 파렛트를 선택하세요.
                  </p>
                </div>

                <div className="flex-1 overflow-auto px-3 py-2">
                  <p className="text-[11px] text-gray-500 mb-1">
                    파렛트 적재 상품 ({outboundResults.length}개)
                  </p>
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-gray-50 border-b">
                      <tr>
                        <th className="w-6 p-1 text-center">
                          <input
                            type="checkbox"
                            checked={
                              outboundResults.length > 0 &&
                              leftCheckedOut.length ===
                                outboundResults.length
                            }
                            onChange={(e) =>
                              setLeftCheckedOut(
                                e.target.checked
                                  ? outboundResults.map((p) => p.id)
                                  : [],
                              )
                            }
                          />
                        </th>
                        <th className="p-1 text-left w-24">파렛트ID</th>
                        <th className="p-1 text-left w-20">상품코드</th>
                        <th className="p-1 text-left">상품명</th>
                        <th className="p-1 text-right w-24">파렛트 수량(EA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!hasSearchedOut && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-3 text-center text-[11px] text-gray-400"
                          >
                            파렛트 QR을 조회하면 이 영역에 적재 내역이 표시됩니다.
                          </td>
                        </tr>
                      )}
                      {hasSearchedOut && outboundResults.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-3 text-center text-[11px] text-gray-400"
                          >
                            조회 결과가 없습니다.
                          </td>
                        </tr>
                      )}
                      {outboundResults.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b last:border-b-0 hover:bg-white"
                        >
                          <td className="p-1 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={leftCheckedOut.includes(p.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setLeftCheckedOut((prev) =>
                                  checked
                                    ? [...prev, p.id]
                                    : prev.filter((id) => id !== p.id),
                                );
                              }}
                            />
                          </td>
                          <td className="p-1 align-middle">{p.palletId}</td>
                          <td className="p-1 align-middle">{p.code}</td>
                          <td className="p-1 align-middle">{p.name}</td>
                          <td className="p-1 align-middle text-right">
                            {p.qty.toLocaleString()}
                          </td>
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
                  onClick={moveToRightOutbound}
                  className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shadow hover:bg-blue-700 disabled:bg-gray-300"
                  disabled={leftCheckedOut.length === 0}
                  title="출고 내역에 추가"
                >
                  ▶
                </button>
                <button
                  type="button"
                  onClick={removeFromRightOutbound}
                  className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center hover:bg-gray-300 disabled:bg-gray-100"
                  disabled={rightCheckedOut.length === 0}
                  title="출고 내역에서 제거"
                >
                  ◀
                </button>
              </div>

              {/* 오른쪽: 출고 내역 */}
              <div className="flex flex-col border rounded-xl bg-gray-50/60">
                <div className="px-3 py-2 border-b flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-800">
                    출고 내역 리스트
                  </p>
                  <p className="text-[11px] text-gray-500">
                    총 출고 예정{" "}
                    <span className="font-semibold text-gray-800">
                      {totalOutboundEa.toLocaleString()}
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
                              selectedOut.length > 0 &&
                              rightCheckedOut.length === selectedOut.length
                            }
                            onChange={(e) =>
                              setRightCheckedOut(
                                e.target.checked
                                  ? selectedOut.map((p) => p.id)
                                  : [],
                              )
                            }
                          />
                        </th>
                        <th className="p-1 text-left w-24">파렛트ID</th>
                        <th className="p-1 text-left w-20">상품코드</th>
                        <th className="p-1 text-left">상품명</th>
                        <th className="p-1 text-right w-24">출고수량(EA)</th>
                        <th className="p-1 text-right w-24">
                          출고 후 재고(EA)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOut.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-3 text-center text-[11px] text-gray-400"
                          >
                            아직 출고 내역이 없습니다. 좌측에서 파렛트를
                            선택해 주세요.
                          </td>
                        </tr>
                      )}
                      {selectedOut.map((p) => {
                        const baseStock =
                          inventory[p.productId] ??
                          MASTER_PRODUCTS.find((m) => m.id === p.productId)
                            ?.currentStock ??
                          0;
                        const afterStock = Math.max(
                          0,
                          baseStock - (p.outboundQty || 0),
                        );

                        return (
                          <tr
                            key={p.id}
                            className="border-b last:border-b-0 hover:bg-white"
                          >
                            <td className="p-1 text-center align-middle">
                              <input
                                type="checkbox"
                                checked={rightCheckedOut.includes(p.id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setRightCheckedOut((prev) =>
                                    checked
                                      ? [...prev, p.id]
                                      : prev.filter((id) => id !== p.id),
                                  );
                                }}
                              />
                            </td>
                            <td className="p-1 align-middle">{p.palletId}</td>
                            <td className="p-1 align-middle">{p.code}</td>
                            <td className="p-1 align-middle">{p.name}</td>
                            <td className="p-1 align-middle text-right">
                              <input
                                type="number"
                                min={0}
                                max={p.palletQty}
                                value={p.outboundQty}
                                onChange={(e) => {
                                  const value = Number(e.target.value || 0);
                                  setSelectedOut((prev) =>
                                    prev.map((sp) =>
                                      sp.id === p.id
                                        ? {
                                            ...sp,
                                            outboundQty: Math.min(
                                              Math.max(0, value),
                                              p.palletQty,
                                            ),
                                          }
                                        : sp,
                                    ),
                                  );
                                }}
                                className="w-24 border border-gray-300 rounded px-1 py-0.5 text-right text-[11px]"
                              />
                            </td>
                            <td className="p-1 align-middle text-right">
                              {afterStock.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-3 py-2 border-t flex items-center justify-between text-[11px] text-gray-600">
                  <div className="space-y-0.5">
                    {outboundSummary.length > 0 && (
                      <p>
                        · 상품별 출고 요약:&nbsp;
                        {outboundSummary.map(([name, ea], idx) => (
                          <span key={name}>
                            {idx > 0 && " / "}
                            <span className="font-semibold">{name}</span>{" "}
                            {ea.toLocaleString()} EA
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleOutbound}
                    className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs hover:bg-red-700 disabled:bg-gray-300"
                    disabled={selectedOut.length === 0}
                  >
                    출고
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 하단: 공통 창고 위치 + 이송 버튼 */}
          <div className="border-t pt-2 flex items-center justify-between text-[11px] text-gray-700">
            <div className="text-gray-500">
              {tab === "inbound"
                ? "· 입고 처리 후 창고 위치로 파렛트를 이송하는 시나리오입니다."
                : "· 출고 대상 파렛트를 선택한 후 창고 위치로 이송하는 시나리오입니다."}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">창고 위치</span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-xs"
              >
                <option>2층 피킹창고 A라인</option>
                <option>2층 피킹창고 B라인</option>
                <option>3층 플랫파렛트 존</option>
                <option>2층 잔량창고</option>
              </select>
              <button
                type="button"
                onClick={handleMove}
                className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700"
              >
                이송
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
