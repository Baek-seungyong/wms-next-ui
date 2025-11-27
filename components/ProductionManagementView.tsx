// components/ProductionManagementView.tsx
"use client";

import { useMemo, useState } from "react";
import QRCode from "react-qr-code"; // ← npm i react-qr-code

type Product = {
  code: string;
  name: string;
  boxEa: number; // 1BOX 당 내품 수량
};

type ProductionLot = {
  id: string;
  productCode: string;
  productName: string;
  boxEa: number;
  boxCount: number;
  totalEa: number;
  lotNo: string;
  date: string; // YYYY-MM-DD
  memo?: string;
};

const productMaster: Product[] = [
  { code: "P-1001", name: "PET 500ml 투명", boxEa: 100 },
  { code: "P-1002", name: "PET 300ml 밀키", boxEa: 120 },
  { code: "T-0020", name: "T20 트레이 20구", boxEa: 50 },
];

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ProductionManagementView() {
  // ───────────────── 상태: 상품 선택/입력 ─────────────────
  const [searchProductText, setSearchProductText] = useState("");
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(
    null,
  );

  const [boxCountInput, setBoxCountInput] = useState<number | "">("");
  const [prodDateInput, setProdDateInput] = useState<string>(todayStr());
  const [lotNoInput, setLotNoInput] = useState<string>("");

  // 🔹 상품 자동완성 드롭다운 표시 여부
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // 생산 내역
  const [lots, setLots] = useState<ProductionLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  // 라벨 미리보기 모달
  const [labelModalOpen, setLabelModalOpen] = useState(false);

  // 수정 모달
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    id: string;
    date: string;
    boxCount: number;
    boxEa: number;
    lotNo: string;
    memo?: string;
    productCode: string;
    productName: string;
  } | null>(null);

  // ───────────────── 파생 값 ─────────────────
  const selectedProduct = useMemo(
    () => productMaster.find((p) => p.code === selectedProductCode) ?? null,
    [selectedProductCode],
  );

  // 🔹 자동완성용 필터
  const filteredProducts = useMemo(() => {
    const q = searchProductText.trim().toLowerCase();
    if (!q) return productMaster;
    return productMaster.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q),
    );
  }, [searchProductText]);

  const selectedLot = useMemo(
    () => lots.find((l) => l.id === selectedLotId) ?? null,
    [lots, selectedLotId],
  );

  const totalEa =
    selectedProduct && boxCountInput !== ""
      ? selectedProduct.boxEa * boxCountInput
      : 0;

  // QR에 넣을 payload (선택된 LOT 전체정보)
  const qrPayload = selectedLot
    ? JSON.stringify({
        lotNo: selectedLot.lotNo,
        productCode: selectedLot.productCode,
        productName: selectedLot.productName,
        date: selectedLot.date,
        boxEa: selectedLot.boxEa,
        boxCount: selectedLot.boxCount,
        totalEa: selectedLot.totalEa,
        memo: selectedLot.memo ?? "",
      })
    : "";

  // ───────────────── 핸들러 ─────────────────
  const handleSearchProductChange = (value: string) => {
    setSearchProductText(value);
    setShowProductDropdown(!!value.trim());
  };

  const handleSelectProduct = (code: string) => {
    setSelectedProductCode(code);
    setBoxCountInput("");
    setLotNoInput("");

    const prod = productMaster.find((p) => p.code === code);
    // 선택하면 입력창에는 코드만 표시 (원하면 `${prod.code} ${prod.name}` 로 바꿔도 됨)
    if (prod) {
      setSearchProductText(prod.code);
    }
    setShowProductDropdown(false);
  };

  const handleGenerateLot = () => {
    if (!selectedProduct) {
      alert("상품을 먼저 선택해 주세요.");
      return;
    }
    const dateCompact = prodDateInput.replace(/-/g, "");
    const seq = (lots.filter((l) => l.productCode === selectedProduct.code)
      .length + 1)
      .toString()
      .padStart(3, "0");

    const lotNo = `LOT-${selectedProduct.code}-${dateCompact}-${seq}`;
    setLotNoInput(lotNo);
  };

  const handleRegister = () => {
    if (!selectedProduct) {
      alert("상품을 선택해 주세요.");
      return;
    }
    if (boxCountInput === "" || boxCountInput <= 0) {
      alert("생산 BOX 수량을 입력해 주세요.");
      return;
    }
    if (!lotNoInput) {
      alert("LOT 번호를 먼저 생성해 주세요.");
      return;
    }

    const newLot: ProductionLot = {
      id: `${Date.now()}`,
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      boxEa: selectedProduct.boxEa,
      boxCount: boxCountInput,
      totalEa,
      lotNo: lotNoInput,
      date: prodDateInput,
    };

    setLots((prev) => [...prev, newLot]);
    setSelectedLotId(newLot.id);
  };

  // 생산 내역 검색 (간단 버전)
  const [historySearch, setHistorySearch] = useState("");
  const filteredLots = useMemo(() => {
    if (!historySearch.trim()) return lots;
    const q = historySearch.trim().toLowerCase();
    return lots.filter(
      (l) =>
        l.productCode.toLowerCase().includes(q) ||
        l.productName.toLowerCase().includes(q) ||
        l.lotNo.toLowerCase().includes(q),
    );
  }, [lots, historySearch]);

  const handleClickRow = (lotId: string) => {
    setSelectedLotId(lotId);
  };

  const handlePrintLabel = () => {
    if (!selectedLot) {
      alert("라벨을 출력할 LOT를 먼저 선택해 주세요.");
      return;
    }
    setLabelModalOpen(true);
  };

  const openEditModal = (lot: ProductionLot) => {
    setEditForm({
      id: lot.id,
      date: lot.date,
      boxCount: lot.boxCount,
      boxEa: lot.boxEa,
      lotNo: lot.lotNo,
      memo: lot.memo,
      productCode: lot.productCode,
      productName: lot.productName,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;

    const newTotalEa = editForm.boxEa * editForm.boxCount;

    setLots((prev) =>
      prev.map((l) =>
        l.id === editForm.id
          ? {
              ...l,
              date: editForm.date,
              boxCount: editForm.boxCount,
              totalEa: newTotalEa,
              lotNo: editForm.lotNo,
              memo: editForm.memo,
            }
          : l,
      ),
    );

    setEditModalOpen(false);
  };

  // ───────────────── 렌더 ─────────────────
  return (
    <div className="flex min-h-[600px] flex-col gap-4">
      {/* 1:1 레이아웃 - 좌: 생산 등록 / 우: 생산 내역 조회 */}
      <div className="grid grid-cols-2 gap-4">
        {/* ───────────── 좌측 : 생산 등록 ───────────── */}
        <section className="flex flex-col rounded-2xl border bg-white p-4 text-sm">
          <h2 className="mb-3 text-base font-semibold">생산 등록</h2>
          <p className="mb-3 text-[11px] text-gray-500">
            생산 완료된 제품을 검색하여 BOX 수량, LOT 번호를 등록하고 QR 정보를
            생성합니다.
          </p>

          {/* 상품 검색 + 자동완성 */}
          <div className="relative mb-3">
            <label className="mb-1 block text-[11px] text-gray-600">
              상품 검색 (코드 또는 상품명)
            </label>
            <input
              className="w-full rounded-md border px-3 py-1.5 text-[12px]"
              placeholder="예: P-1001, PET 500ml"
              value={searchProductText}
              onChange={(e) => handleSearchProductChange(e.target.value)}
              onFocus={() => {
                if (searchProductText.trim()) {
                  setShowProductDropdown(true);
                }
              }}
            />

            {/* 🔽 자동완성 리스트 (기존 테이블 대신) */}
            {showProductDropdown && filteredProducts.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white text-[12px] shadow-lg">
                {filteredProducts.map((p) => (
                  <li
                    key={p.code}
                    className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                    onClick={() => handleSelectProduct(p.code)}
                  >
                    <span className="font-mono">{p.code}</span> — {p.name}{" "}
                    <span className="text-[11px] text-gray-400">
                      ({p.boxEa} EA/BOX)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ✅ 기존: 선택된 상품 정보 + 입력 영역 (그대로 유지) */}
          <div className="mt-2 rounded-xl border bg-gray-50 px-4 py-3 text-[12px]">
            <div className="mb-1 text-[11px] font-semibold text-gray-700">
              선택된 상품 정보
            </div>
            {selectedProduct ? (
              <>
                <div className="mb-1">
                  <span className="inline-block w-20 text-gray-500">
                    상품명
                  </span>
                  <span className="font-semibold">
                    {selectedProduct.name} ({selectedProduct.code})
                  </span>
                </div>

                <div className="mb-1">
                  <span className="inline-block w-20 text-gray-500">
                    BOX당 내품
                  </span>
                  <span>{selectedProduct.boxEa} EA</span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-600">
                      생산 BOX 수량
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-md border px-2 py-1 text-[12px]"
                      value={boxCountInput === "" ? "" : boxCountInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") setBoxCountInput("");
                        else setBoxCountInput(Number(v));
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-600">
                      생산일자
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border px-2 py-1 text-[12px]"
                      value={prodDateInput}
                      onChange={(e) => setProdDateInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-600">
                      총 수량(EA)
                    </label>
                    <input
                      disabled
                      className="w-full rounded-md border bg-gray-100 px-2 py-1 text-right text-[12px]"
                      value={totalEa ? `${totalEa} EA` : ""}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-600">
                      LOT 번호 (자동 생성 후 필요 시 수정 가능)
                    </label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-md border px-2 py-1 text-[12px]"
                        placeholder="LOT-코드-날짜-001"
                        value={lotNoInput}
                        onChange={(e) => setLotNoInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="rounded-md bg-gray-900 px-3 py-1 text-[11px] text-white hover:bg-black"
                        onClick={handleGenerateLot}
                      >
                        LOT 자동생성
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleRegister}
                    className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    생산 내역 등록 (QR 생성)
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 text-[12px] text-gray-400">
                상품을 검색 후 선택하면 상세 정보와 입력 영역이 표시됩니다.
              </div>
            )}
          </div>
        </section>

        {/* ───────────── 우측 : 생산 내역 조회 ───────────── */}
        <section className="flex flex-col rounded-2xl border bg-white p-4 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">생산 내역 조회</h2>
              <p className="mt-1 text-[11px] text-gray-500">
                등록된 생산 LOT 내역을 조회하고 선택한 LOT에 대해 라벨 출력 및
                정보 수정을 할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                className="w-44 rounded-md border px-2 py-1 text-[12px]"
                placeholder="상품코드 / LOT 검색"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
              <button
                type="button"
                onClick={handlePrintLabel}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                라벨 출력
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border bg-gray-50">
            <table className="min-w-full border-collapse text-[12px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b px-3 py-2 text-left">생산일자</th>
                  <th className="border-b px-3 py-2 text-left">상품코드</th>
                  <th className="border-b px-3 py-2 text-left">상품명</th>
                  <th className="border-b px-3 py-2 text-left">LOT번호</th>
                  <th className="border-b px-3 py-2 text-right">BOX</th>
                  <th className="border-b px-3 py-2 text-right">총수량(EA)</th>
                  <th className="border-b px-3 py-2 text-center">수정</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map((lot) => {
                  const selected = lot.id === selectedLotId;
                  return (
                    <tr
                      key={lot.id}
                      className={`cursor-pointer ${
                        selected ? "bg-blue-50" : "bg-white"
                      } hover:bg-blue-50`}
                      onClick={() => handleClickRow(lot.id)}
                    >
                      <td className="border-t px-3 py-2">{lot.date}</td>
                      <td className="border-t px-3 py-2 font-mono">
                        {lot.productCode}
                      </td>
                      <td className="border-t px-3 py-2">{lot.productName}</td>
                      <td className="border-t px-3 py-2 font-mono">
                        {lot.lotNo}
                      </td>
                      <td className="border-t px-3 py-2 text-right">
                        {lot.boxCount}
                      </td>
                      <td className="border-t px-3 py-2 text-right">
                        {lot.totalEa}
                      </td>
                      <td
                        className="border-t px-3 py-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="rounded-full border border-gray-300 bg.white px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-100"
                          onClick={() => openEditModal(lot)}
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredLots.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="border-t px-3 py-4 text-center text-[12px] text-gray-400"
                    >
                      등록된 생산 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ───────────── 라벨 미리보기 모달 (QR 포함) ───────────── */}
      {labelModalOpen && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[340px] rounded-2xl bg-white p-4 shadow-2xl text-[12px]">
            {/* 헤더 */}
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">라벨 미리보기</h2>
              <button
                type="button"
                onClick={() => setLabelModalOpen(false)}
                className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-200"
              >
                닫기
              </button>
            </div>

            {/* 라벨 카드 영역 */}
            <div
              id="label-print-area"
              className="mx-auto mb-4 w-[260px] border border-gray-900 bg-white px-3 py-2 text-[11px]"
            >
              <div className="mb-2 border-b border-gray-300 pb-1 text-[12px] font-semibold">
                제품 라벨 / PROD
              </div>

              <div className="mb-1 flex">
                <span className="inline-block w-18 text-gray-500">
                  상품명
                </span>
                <span className="font-semibold">
                  {selectedLot.productName}
                </span>
              </div>
              <div className="mb-1 flex">
                <span className="inline-block w-18 text-gray-500">상품코드</span>
                <span className="font-mono">{selectedLot.productCode}</span>
              </div>
              <div className="mb-1 flex">
                <span className="inline-block w-18 text-gray-500">LOT</span>
                <span className="font-mono">{selectedLot.lotNo}</span>
              </div>
              <div className="mb-1 flex">
                <span className="inline-block w-18 text-gray-500">DATE</span>
                <span>{selectedLot.date}</span>
              </div>
              <div className="mb-1 flex">
                <span className="inline-block w-18 text-gray-500">BOX</span>
                <span>{selectedLot.boxCount} BOX</span>
              </div>
              <div className="mb-2 flex">
                <span className="inline-block w-18 text-gray-500">총 수량</span>
                <span>{selectedLot.totalEa} EA</span>
              </div>

              {/* QR 코드 영역 */}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-gray-600">QR 코드</span>
                <div className="rounded border border-gray-300 bg.white p-1">
                  <QRCode value={qrPayload} size={80} />
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setLabelModalOpen(false)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="rounded-full bg-gray-900 px-4 py-1 text-xs font-semibold text-white hover:bg-black"
              >
                인쇄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── 생산 내역 수정 모달 ───────────── */}
      {editModalOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] rounded-2xl bg-white p-4 shadow-2xl text-[12px]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">생산 내역 수정</h2>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-200"
              >
                닫기
              </button>
            </div>

            {/* 읽기전용 상품 정보 */}
            <div className="mb-3 rounded-xl bg-gray-50 px-3 py-2">
              <div className="mb-1">
                <span className="inline-block w-18 text-gray-500">
                  상품명
                </span>
                <span className="font-semibold">
                  {editForm.productName} ({editForm.productCode})
                </span>
              </div>
              <div>
                <span className="inline-block w-18 text-gray-500">
                  BOX당 내품
                </span>
                <span>{editForm.boxEa} EA</span>
              </div>
            </div>

            {/* 수정 가능한 항목 */}
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-[11px] text-gray-600">
                  생산일자
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border px-2 py-1 text-[12px]"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, date: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] text-gray-600">
                    BOX 수량
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md border px-2 py-1 text-[12px]"
                    value={editForm.boxCount}
                    onChange={(e) => {
                      const v = Number(e.target.value || 0);
                      setEditForm((prev) =>
                        prev ? { ...prev, boxCount: v } : prev,
                      );
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-600">
                    LOT 번호
                  </label>
                  <input
                    className="w-full rounded-md border px-2 py-1 text-[12px]"
                    value={editForm.lotNo}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, lotNo: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-gray-600">
                  메모
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border px-2 py-1 text-[12px]"
                  value={editForm.memo ?? ""}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, memo: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-gray-600">
                  총 수량(EA)
                </label>
                <input
                  disabled
                  className="w-full rounded-md border bg-gray-100 px-2 py-1 text-right text-[12px]"
                  value={`${editForm.boxEa * editForm.boxCount} EA`}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
