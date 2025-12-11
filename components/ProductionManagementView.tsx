// components/ProductionManagementView.tsx
"use client";

import { useMemo, useState } from "react";
import QRCode from "react-qr-code";

type Product = {
  code: string;
  name: string;
  boxEa: number;
};

type BoxLabelRecord = {
  id: string;
  productCode: string;
  productName: string;
  boxEa: number;
  boxSpec: string; // 🔸 박스 규격
  lotNo: string;
  date: string;
  memo?: string;
};

const productMaster: Product[] = [
  { code: "P-1001", name: "PET 500ml 투명", boxEa: 100 },
  { code: "P-1002", name: "PET 300ml 밀키", boxEa: 120 },
  { code: "T-0020", name: "T20 트레이 20구", boxEa: 50 },
];

// 🔸 박스 규격 선택 옵션
const BOX_SPEC_OPTIONS = [
  "소 박스",
  "중 박스",
  "대 박스",
  "특대 박스",
  "5호 박스",
  "4호 박스",
  "3호 박스",
  "3-1호 박스",
  "3-2호 박스",
  "3-3호 박스",
  "2호 박스",
  "2-1호 박스",
  "2-2호 박스",
  "2-3호 박스",
  "2-4호 박스",
  "A-0 박스",
  "A-1 박스",
  "A-2 박스",
  "A-3 박스",
  "A-4 박스",
  "A-5 박스",
  "A-6 박스",
  "A-7 박스",
  "A-8 박스",
  "A-9 박스",
];

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ProductionManagementView() {
  // ───── 상품/입력 상태 ─────
  const [searchProductText, setSearchProductText] = useState("");
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(
    null,
  );
  const [boxSpecInput, setBoxSpecInput] = useState<string>(""); // 🔸 박스 규격
  const [boxEaInput, setBoxEaInput] = useState<number | "">("");
  const [prodDateInput, setProdDateInput] = useState<string>(todayStr());
  const [lotNoInput, setLotNoInput] = useState<string>("");

  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // 라벨 내역/선택
  const [labels, setLabels] = useState<BoxLabelRecord[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);

  // 모달
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    id: string;
    productCode: string;
    productName: string;
    boxEa: number;
    boxSpec: string;
    lotNo: string;
    date: string;
    memo?: string;
  } | null>(null);

  // ───── 라벨 내역 검색 필터 ─────
  const [historySearch, setHistorySearch] = useState(""); // 코드/상품명/LOT
  const [historyDate, setHistoryDate] = useState(""); // 생산일자

  // ───── 파생 값 ─────
  const selectedProduct = useMemo(
    () => productMaster.find((p) => p.code === selectedProductCode) ?? null,
    [selectedProductCode],
  );

  const filteredProducts = useMemo(() => {
    const q = searchProductText.trim().toLowerCase();
    if (!q) return productMaster;
    return productMaster.filter(
      (p) =>
        p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [searchProductText]);

  // ■■■ 라벨 내역 필터링: 생산일자 + 코드/상품명/LOT ■■■
  const filteredLabels = useMemo(() => {
    let result = labels;

    // 날짜 필터
    if (historyDate) {
      result = result.filter((l) => l.date === historyDate);
    }

    // 텍스트 필터
    const q = historySearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (l) =>
          l.productCode.toLowerCase().includes(q) ||
          l.productName.toLowerCase().includes(q) ||
          l.lotNo.toLowerCase().includes(q),
      );
    }

    return result;
  }, [labels, historyDate, historySearch]);

  const selectedLabel = useMemo(
    () => labels.find((l) => l.id === selectedLabelId) ?? null,
    [labels, selectedLabelId],
  );

  const qrPayload = selectedLabel
    ? JSON.stringify({
        type: "BOX_LABEL",
        productCode: selectedLabel.productCode,
        productName: selectedLabel.productName,
        boxEa: selectedLabel.boxEa,
        boxSpec: selectedLabel.boxSpec,
        date: selectedLabel.date,
        lotNo: selectedLabel.lotNo,
        memo: selectedLabel.memo ?? "",
      })
    : "";

  // ───── 핸들러: 상품 선택/검색 ─────
  const handleSearchProductChange = (value: string) => {
    setSearchProductText(value);
    setShowProductDropdown(!!value.trim());
  };

  const handleSelectProduct = (code: string) => {
    setSelectedProductCode(code);
    const prod = productMaster.find((p) => p.code === code);

    if (prod) {
      setSearchProductText(prod.code);
      setBoxEaInput(prod.boxEa);
    } else {
      setBoxEaInput("");
    }

    // 박스 규격은 상품 선택 시에는 초기화만 (필요하면 나중에 상품별 기본값도 매핑 가능)
    setBoxSpecInput("");

    // LOT 자동 생성
    const dateCompact = prodDateInput.replace(/-/g, "");
    const seq = (
      labels.filter((l) => l.productCode === code).length + 1
    )
      .toString()
      .padStart(3, "0");
    const lotNo = `LOT-${code}-${dateCompact}-${seq}`;
    setLotNoInput(lotNo);

    setShowProductDropdown(false);
  };

  // ───── 라벨 생성 ─────
  const handleCreateLabel = () => {
    if (!selectedProduct) {
      alert("상품을 먼저 선택해 주세요.");
      return;
    }
    if (!boxSpecInput) {
      alert("박스 규격을 선택해 주세요.");
      return;
    }
    if (boxEaInput === "" || Number(boxEaInput) <= 0) {
      alert("BOX당 내품 수량을 입력해 주세요.");
      return;
    }
    if (!prodDateInput) {
      alert("생산일자를 선택해 주세요.");
      return;
    }
    if (!lotNoInput) {
      alert("LOT 번호가 없습니다. 상품 선택 시 자동 생성됩니다.");
      return;
    }

    const newLabel: BoxLabelRecord = {
      id: `${Date.now()}`,
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      boxEa: Number(boxEaInput),
      boxSpec: boxSpecInput,
      lotNo: lotNoInput,
      date: prodDateInput,
    };

    setLabels((prev) => [...prev, newLabel]);
    setSelectedLabelId(newLabel.id);
    setLabelModalOpen(true);
  };

  // ───── 라벨 히스토리 행 클릭 ─────
  const handleClickRow = (labelId: string) => {
    setSelectedLabelId(labelId);
  };

  // ───── 행별 라벨 출력 ─────
  const handlePrintRow = (label: BoxLabelRecord) => {
    setSelectedLabelId(label.id);
    setLabelModalOpen(true);
  };

  const handlePrintLabel = () => {
    if (!selectedLabel) {
      alert("라벨을 출력할 내역을 먼저 선택해 주세요.");
      return;
    }
    setLabelModalOpen(true);
  };

  // ───── 수정 모달 관련 ─────
  const openEditModal = (label: BoxLabelRecord) => {
    setEditForm({
      id: label.id,
      productCode: label.productCode,
      productName: label.productName,
      boxEa: label.boxEa,
      boxSpec: label.boxSpec,
      lotNo: label.lotNo,
      date: label.date,
      memo: label.memo,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;

    setLabels((prev) =>
      prev.map((l) =>
        l.id === editForm.id
          ? {
              ...l,
              boxEa: editForm.boxEa,
              boxSpec: editForm.boxSpec,
              lotNo: editForm.lotNo,
              date: editForm.date,
              memo: editForm.memo,
            }
          : l,
      ),
    );

    setEditModalOpen(false);
  };

  // ───── 렌더 ─────
  return (
    <div className="flex min-h-[600px] flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {/* ─ left : 박스 라벨 생성 ─ */}
        <section className="flex flex-col rounded-2xl border bg-white p-4 text-sm">
          <h2 className="mb-3 text-base font-semibold">박스 라벨 생성</h2>

          {/* 상품 검색 */}
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
                if (searchProductText.trim()) setShowProductDropdown(true);
              }}
            />

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

          {/* 선택된 상품 + 라벨 정보 */}
          <div className="mt-2 rounded-xl border bg-gray-50 px-4 py-3 text-[12px]">
            <div className="mb-1 text-[11px] font-semibold text-gray-700">
              라벨 정보
            </div>

            {selectedProduct ? (
              <>
                <div className="mb-2">
                  <span className="inline-block w-24 text-gray-500">
                    상품명
                  </span>
                  <span className="font-semibold">
                    {selectedProduct.name} ({selectedProduct.code})
                  </span>
                </div>

                {/* 🔸 박스 규격 (BOX당 내품수량 위) */}
                <div className="mb-2">
                  <label className="mb-1 inline-block w-24 text-[11px] text-gray-600">
                    박스 규격
                  </label>
                  <select
                    className="w-40 rounded-md border px-2 py-1 text-[12px]"
                    value={boxSpecInput}
                    onChange={(e) => setBoxSpecInput(e.target.value)}
                  >
                    <option value="">선택</option>
                    {BOX_SPEC_OPTIONS.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="mb-1 inline-block w-24 text-[11px] text-gray-600">
                    BOX당 내품수량
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-40 rounded-md border px-2 py-1 text-right text-[12px]"
                    value={boxEaInput === "" ? "" : boxEaInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") setBoxEaInput("");
                      else setBoxEaInput(Number(v));
                    }}
                  />
                  <span className="ml-1 text-[11px] text-gray-500">EA</span>
                </div>

                <div className="mb-2">
                  <label className="mb-1 inline-block w-24 text-[11px] text-gray-600">
                    생산일자
                  </label>
                  <input
                    type="date"
                    className="w-40 rounded-md border px-2 py-1 text-[12px]"
                    value={prodDateInput}
                    onChange={(e) => setProdDateInput(e.target.value)}
                  />
                </div>

                <div className="mb-2">
                  <label className="mb-1 inline-block w-24 text-[11px] text-gray-600">
                    LOT 번호
                  </label>
                  <input
                    className="w-60 rounded-md border px-2 py-1 text-[12px]"
                    placeholder="LOT-코드-날짜-001"
                    value={lotNoInput}
                    onChange={(e) => setLotNoInput(e.target.value)}
                  />
                  <div className="mt-1 text-[10px] text-gray-400">
                    ※ 상품 선택 시 자동 생성되며, 필요하면 수정할 수 있습니다.
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateLabel}
                    className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    QR 생성 및 라벨 저장
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 text-[12px] text-gray-400">
                상품을 검색하여 선택하면 라벨 정보를 입력할 수 있습니다.
              </div>
            )}
          </div>
        </section>

        {/* ─ right : 박스 라벨 내역 ─ */}
        <section className="flex flex-col rounded-2xl border bg-white p-4 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">박스 라벨 내역</h2>
            <div className="flex items-center gap-2">
              {/* 생산일자 검색 */}
              <input
                type="date"
                className="w-40 rounded-md border px-2 py-1 text-[12px]"
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
              />
              {/* 코드 / 상품명 / LOT 검색 */}
              <input
                className="w-52 rounded-md border px-2 py-1 text-[12px]"
                placeholder="상품코드 / 상품명 / LOT 검색"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border bg-gray-50">
            <table className="min-w-full border-collapse text-[12px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b px-3 py-2 text-left">생산일자</th>
                  <th className="border-b px-3 py-2 text-left">상품코드</th>
                  <th className="border-b px-3 py-2 text-left">상품명</th>
                  <th className="border-b px-3 py-2 text-left">박스 규격</th>
                  <th className="border-b px-3 py-2 text-right">
                    BOX당 내품수량(EA)
                  </th>
                  <th className="border-b px-3 py-2 text-left">LOT번호</th>
                  <th className="border-b px-3 py-2 text-center">수정</th>
                  <th className="border-b px-3 py-2 text-center">
                    라벨 출력
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLabels.map((label) => {
                  const selected = label.id === selectedLabelId;
                  return (
                    <tr
                      key={label.id}
                      className={`cursor-pointer ${
                        selected ? "bg-blue-50" : "bg-white"
                      } hover:bg-blue-50`}
                      onClick={() => handleClickRow(label.id)}
                    >
                      <td className="border-t px-3 py-2">{label.date}</td>
                      <td className="border-t px-3 py-2 font-mono">
                        {label.productCode}
                      </td>
                      <td className="border-t px-3 py-2">
                        {label.productName}
                      </td>
                      <td className="border-t px-3 py-2">{label.boxSpec}</td>
                      <td className="border-t px-3 py-2 text-right">
                        {label.boxEa.toLocaleString()}
                      </td>
                      <td className="border-t px-3 py-2 font-mono">
                        {label.lotNo}
                      </td>

                      {/* 수정 버튼 */}
                      <td
                        className="border-t px-3 py-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-100"
                          onClick={() => openEditModal(label)}
                        >
                          수정
                        </button>
                      </td>

                      {/* 라벨 출력 버튼 */}
                      <td
                        className="border-t px-3 py-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-100"
                          onClick={() => handlePrintRow(label)}
                        >
                          라벨 출력
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredLabels.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="border-t px-3 py-4 text-center text-[12px] text-gray-400"
                    >
                      조건에 맞는 라벨 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ─ 라벨 미리보기 모달 ─ */}
      {labelModalOpen && selectedLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[340px] rounded-2xl bg-white p-4 text-[12px] shadow-2xl">
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

            <div
              id="label-print-area"
              className="mx-auto mb-4 w-[260px] border border-gray-900 bg-white px-3 py-2 text-[11px]"
            >
              <div className="mb-2 border-b border-gray-300 pb-1 text-[12px] font-semibold">
                박스 라벨 / BOX
              </div>

              <div className="mb-1 flex">
                <span className="inline-block w-20 text-gray-500">
                  상품명
                </span>
                <span className="font-semibold">
                  {selectedLabel.productName}
                </span>
              </div>
              <div className="mb-1 flex">
                <span className="inline-block w-20 text-gray-500">
                  박스 규격
                </span>
                <span>{selectedLabel.boxSpec}</span>
              </div>
              <div className="mb-1 flex">
                <span className="inline-block w-20 text-gray-500">
                  상품코드
                </span>
                <span className="font-mono">{selectedLabel.productCode}</span>
              </div>
              <div className="mb-1 flex">
                <span className="inline-block w-20 text-gray-500">
                  BOX당 내품
                </span>
                <span>{selectedLabel.boxEa.toLocaleString()} EA</span>
              </div>
              <div className="mb-1 flex">
                <span className="inline-block w-20 text-gray-500">
                  DATE
                </span>
                <span>{selectedLabel.date}</span>
              </div>
              <div className="mb-2 flex">
                <span className="inline-block w-20 text-gray-500">
                  LOT
                </span>
                <span className="font-mono">{selectedLabel.lotNo}</span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-gray-600">QR 코드</span>
                <div className="rounded border border-gray-300 bg-white p-1">
                  <QRCode value={qrPayload} size={80} />
                </div>
              </div>
            </div>

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
                onClick={() => window.print()}
                className="rounded-full bg-gray-900 px-4 py-1 text-xs font-semibold text-white hover:bg-black"
              >
                인쇄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─ 라벨 수정 모달 ─ */}
      {editModalOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] rounded-2xl bg-white p-4 text-[12px] shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">라벨 정보 수정</h2>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-200"
              >
                닫기
              </button>
            </div>

            <div className="mb-3 rounded-xl bg-gray-50 px-3 py-2">
              <div className="mb-1">
                <span className="inline-block w-20 text-gray-500">
                  상품명
                </span>
                <span className="font-semibold">
                  {editForm.productName} ({editForm.productCode})
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {/* 🔸 수정 모달 안 박스 규격 셀렉트 */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-600">
                  박스 규격
                </label>
                <select
                  className="w-full rounded-md border px-2 py-1 text-[12px]"
                  value={editForm.boxSpec}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, boxSpec: e.target.value } : prev,
                    )
                  }
                >
                  <option value="">선택</option>
                  {BOX_SPEC_OPTIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-gray-600">
                  BOX당 내품수량(EA)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-md border px-2 py-1 text-right text-[12px]"
                  value={editForm.boxEa}
                  onChange={(e) => {
                    const v = Number(e.target.value || 0);
                    setEditForm((prev) =>
                      prev ? { ...prev, boxEa: v } : prev,
                    );
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
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, date: e.target.value } : prev,
                    )
                  }
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
