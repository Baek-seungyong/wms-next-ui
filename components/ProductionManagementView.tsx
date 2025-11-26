// components/ProductionManagementView.tsx
"use client";

import {
  useMemo,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";

// ----------------------
// 타입 정의
// ----------------------

interface Product {
  code: string;
  name: string;
  boxEa: number; // 1 BOX 당 내품 수량
}

interface ProductionRecord {
  id: string;
  productCode: string;
  productName: string;
  boxEa: number;  // 1 BOX 당 내품
  boxes: number;  // 박스 수량
  totalEa: number; // 총 EA
  producedAt: string; // YYYY-MM-DD
  lotNo: string;
  qrData: string;
  remark?: string;
}

type PalletCallMode = "empty" | "loaded";

interface LoadedPallet {
  id: string;
  palletId: string;
  fromWarehouse: string;
  location: string;
  productCode: string;
  productName: string;
  boxQty: number;
}

// ----------------------
// 더미 상품 / 파렛트
// ----------------------

const MOCK_PRODUCTS: Product[] = [
  { code: "P-1001", name: "PET 500ml 투명", boxEa: 100 },
  { code: "P-1002", name: "PET 300ml 밀키", boxEa: 120 },
  { code: "T-0020", name: "T20 트레이 20구", boxEa: 50 },
];

// 2F/3F에 이미 적재된 파렛트 예시 (적재 파렛트 호출용)
const MOCK_LOADED_PALLETS: LoadedPallet[] = [
  {
    id: "LP-1",
    palletId: "PLT-2F-0101",
    fromWarehouse: "2층 잔량 파렛트 창고",
    location: "2F / R3-C5",
    productCode: "P-1001",
    productName: "PET 500ml 투명",
    boxQty: 24,
  },
  {
    id: "LP-2",
    palletId: "PLT-3F-0201",
    fromWarehouse: "3층 풀파렛트 창고",
    location: "3F / X5-Y3",
    productCode: "P-1002",
    productName: "PET 300ml 밀키",
    boxQty: 40,
  },
];

// ----------------------
// 유틸
// ----------------------

function generateLotNo(productCode: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `LOT-${productCode.replace(/[^A-Z0-9]/gi, "")}-${y}${m}${d}-001`;
}

function buildQrData(record: Omit<ProductionRecord, "qrData" | "id">): string {
  return JSON.stringify(
    {
      type: "PRODUCTION_LOT",
      productCode: record.productCode,
      productName: record.productName,
      boxEa: record.boxEa,
      boxes: record.boxes,
      totalEa: record.totalEa,
      producedAt: record.producedAt,
      lotNo: record.lotNo,
      remark: record.remark ?? "",
    },
    null,
    0,
  );
}

// ----------------------
// 메인 컴포넌트
// ----------------------

export default function ProductionManagementView() {
  // ----------------------
  // 생산 등록 영역 상태
  // ----------------------
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inputBoxes, setInputBoxes] = useState<number>(0);
  const [inputDate, setInputDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [inputLotNo, setInputLotNo] = useState<string>("");

  // ----------------------
  // 생산 내역 상태
  // ----------------------
  const [records, setRecords] = useState<ProductionRecord[]>([]); // 샘플 없음
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedRecordId) ?? null,
    [records, selectedRecordId],
  );

  // ----------------------
  // 생산 내역 검색 필터
  // ----------------------
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterFrom && r.producedAt < filterFrom) return false;
      if (filterTo && r.producedAt > filterTo) return false;

      if (filterKeyword.trim().length > 0) {
        const key = filterKeyword.trim().toLowerCase();
        const haystack =
          `${r.productCode} ${r.productName} ${r.lotNo}`.toLowerCase();
        if (!haystack.includes(key)) return false;
      }
      return true;
    });
  }, [records, filterFrom, filterTo, filterKeyword]);

  // ----------------------
  // 파렛트 호출 상태
  // ----------------------
  const [palletCallMode, setPalletCallMode] =
    useState<PalletCallMode>("empty");
  const [emptyPalletFrom, setEmptyPalletFrom] = useState<string>(
    "피킹존 빈파렛트존",
  );
  const [emptyPalletCount, setEmptyPalletCount] = useState<number>(1);

  const [loadedSearch, setLoadedSearch] = useState("");
  const [selectedLoadedPalletId, setSelectedLoadedPalletId] =
    useState<string | null>(null);

  const filteredLoadedPallets = useMemo(() => {
    const key = loadedSearch.trim().toLowerCase();
    if (!key) return MOCK_LOADED_PALLETS;
    return MOCK_LOADED_PALLETS.filter((p) =>
      `${p.productCode} ${p.productName} ${p.palletId}`
        .toLowerCase()
        .includes(key),
    );
  }, [loadedSearch]);

  // ----------------------
  // 파렛트 입고 처리 상태
  // ----------------------
  const [inboundPalletQr, setInboundPalletQr] = useState("");
  const [inboundLabelQr, setInboundLabelQr] = useState("");
  const [inboundTargetRecord, setInboundTargetRecord] =
    useState<ProductionRecord | null>(null);
  const [inboundBoxQty, setInboundBoxQty] = useState<number>(0);
  const [inboundLocation, setInboundLocation] =
    useState<string>("3층 풀파렛트 창고 A라인");

  const inboundTotalEa = inboundTargetRecord
    ? inboundBoxQty * inboundTargetRecord.boxEa
    : 0;

  // ----------------------
  // 이벤트 핸들러 - 생산 등록
  // ----------------------

  const handleProductSearchChange = (
    e: ChangeEvent<HTMLInputElement>,
  ): void => {
    setProductSearch(e.target.value);
  };

  const searchedProducts = useMemo(() => {
    const key = productSearch.trim().toLowerCase();
    if (!key) return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter((p) =>
      `${p.code} ${p.name}`.toLowerCase().includes(key),
    );
  }, [productSearch]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setInputBoxes(0);
    const lot = generateLotNo(p.code);
    setInputLotNo(lot);
  };

  const handleBoxesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
    setInputBoxes(v);
  };

  const handleLotRegenerate = () => {
    if (!selectedProduct) return;
    setInputLotNo(generateLotNo(selectedProduct.code));
  };

  const handleCreateRecord = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert("먼저 상품을 선택해 주세요.");
      return;
    }
    if (!inputBoxes || inputBoxes <= 0) {
      alert("생산 박스 수량을 입력해 주세요.");
      return;
    }
    if (!inputLotNo) {
      alert("LOT 번호 생성 후 등록해 주세요.");
      return;
    }

    const totalEa = inputBoxes * selectedProduct.boxEa;

    const base: Omit<ProductionRecord, "id" | "qrData"> = {
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      boxEa: selectedProduct.boxEa,
      boxes: inputBoxes,
      totalEa,
      producedAt: inputDate,
      lotNo: inputLotNo,
      remark: "",
    };
    const newRecord: ProductionRecord = {
      id: `REC-${Date.now()}`,
      ...base,
      qrData: buildQrData(base),
    };

    setRecords((prev) => [newRecord, ...prev]);
    setSelectedRecordId(newRecord.id);

    alert("생산 내역이 등록되었습니다. (LOT/QR/라벨 정보)");
  };

  const handleRecordEdit = (field: keyof ProductionRecord, value: any) => {
    if (!selectedRecord) return;

    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRecord.id) return r;

        const updated: ProductionRecord = { ...r, [field]: value };

        // boxes, boxEa 변경 시 totalEa 재계산
        const boxEa = field === "boxEa" ? Number(value) || 0 : updated.boxEa;
        const boxes = field === "boxes" ? Number(value) || 0 : updated.boxes;
        updated.boxEa = boxEa;
        updated.boxes = boxes;
        updated.totalEa = boxEa * boxes;

        const baseForQr: Omit<ProductionRecord, "id" | "qrData"> = {
          productCode: updated.productCode,
          productName: updated.productName,
          boxEa: updated.boxEa,
          boxes: updated.boxes,
          totalEa: updated.totalEa,
          producedAt: updated.producedAt,
          lotNo: updated.lotNo,
          remark: updated.remark,
        };
        updated.qrData = buildQrData(baseForQr);
        return updated;
      }),
    );
  };

  // ----------------------
  // 이벤트 핸들러 - 파렛트 호출
  // ----------------------

  const handleEmptyPalletCountChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const v = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
    setEmptyPalletCount(v);
  };

  const handleEmptyPalletCall = () => {
    if (!emptyPalletCount || emptyPalletCount <= 0) {
      alert("호출할 빈 파렛트 수량을 입력해 주세요.");
      return;
    }
    alert(
      `빈 파렛트 호출\n\n출발 위치: ${emptyPalletFrom}\n호출 수량: ${emptyPalletCount} PALLET\n\n(실제 연동 시 AMR 빈파렛트 호출 API 전송)`,
    );
  };

  const handleLoadedPalletCall = () => {
    if (!selectedLoadedPalletId) {
      alert("호출할 적재 파렛트를 선택해 주세요.");
      return;
    }
    const pallet = MOCK_LOADED_PALLETS.find(
      (p) => p.id === selectedLoadedPalletId,
    );
    if (!pallet) return;
    alert(
      `적재 파렛트 호출\n\n파렛트ID: ${pallet.palletId}\n출발창고: ${pallet.fromWarehouse}\n위치: ${pallet.location}\n상품: ${pallet.productName}\nBOX: ${pallet.boxQty}\n\n(실제 연동 시 AMR 수동 호출 API 전송)`,
    );
  };

  // ----------------------
  // 이벤트 핸들러 - 파렛트 입고 처리
  // ----------------------

  const handleLabelQrSearch = () => {
    const key = inboundLabelQr.trim();
    if (!key) {
      alert("라벨 QR(LOT 번호)을 입력해 주세요.");
      return;
    }

    // 가장 단순하게 LOT번호로 조회
    const rec =
      records.find((r) => r.lotNo === key) ??
      records.find((r) => r.lotNo.includes(key));

    if (!rec) {
      alert("해당 LOT 번호의 생산 내역을 찾을 수 없습니다.");
      setInboundTargetRecord(null);
      return;
    }

    setInboundTargetRecord(rec);
    // 기본값으로 생산 박스수량 복사 (필요하면 수정)
    setInboundBoxQty(rec.boxes);
  };

  const handleInboundBoxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
    setInboundBoxQty(v);
  };

  const handleInbound = () => {
    if (!inboundPalletQr.trim()) {
      alert("파렛트 QR을 입력(스캔)해 주세요.");
      return;
    }
    if (!inboundTargetRecord) {
      alert("라벨 QR(LOT)을 조회하여 상품/LOT 정보를 선택해 주세요.");
      return;
    }
    if (!inboundBoxQty || inboundBoxQty <= 0) {
      alert("입고 박스 수량을 입력해 주세요.");
      return;
    }

    const ea = inboundBoxQty * inboundTargetRecord.boxEa;

    alert(
      `파렛트 입고 처리\n\n파렛트QR: ${inboundPalletQr}\n상품: ${inboundTargetRecord.productName}\nLOT: ${inboundTargetRecord.lotNo}\nBOX: ${inboundBoxQty} BOX\nEA: ${ea.toLocaleString()} EA\n입고 위치: ${inboundLocation}\n\n(실제 WMS에서는 해당 위치에 LOT별 재고로 입고 기록 생성)`,
    );

    // 실제라면 여기서 폼 초기화
  };

  // ----------------------
  // 렌더링
  // ----------------------

  const totalEaPreview =
    selectedProduct && inputBoxes
      ? selectedProduct.boxEa * inputBoxes
      : 0;

  return (
    <div className="flex flex-col gap-4 lg:flex-row text-[12px]">
      {/* 좌측: 생산 등록 + 조회 */}
      <section className="flex min-w-[50%] flex-1 flex-col gap-3 rounded-2xl border bg-white p-4">
        {/* 생산 등록 */}
        <div className="rounded-xl border bg-gray-50 p-3">
          <div className="mb-2 text-sm font-semibold">생산 등록</div>
          <p className="mb-3 text-[11px] text-gray-500">
            생산 완료된 제품을 검색하여 박스 수량, LOT 번호를 등록하고 QR
            정보를 생성합니다. (파렛트 호출/입고는 우측 영역에서 처리)
          </p>

          {/* 상품 검색 */}
          <div className="mb-2 flex flex-col gap-2">
            <label className="text-[11px] text-gray-700">
              상품 검색 (코드 또는 상품명)
            </label>
            <input
              type="text"
              value={productSearch}
              onChange={handleProductSearchChange}
              placeholder="예: P-1001, PET 500ml"
              className="h-8 w-full rounded border px-2 text-[11px]"
            />
          </div>

          <div className="mb-3 max-h-32 overflow-auto rounded border bg-white">
            <table className="min-w-[360px] w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">상품코드</th>
                  <th className="border px-2 py-1 text-left">상품명</th>
                  <th className="border px-2 py-1 text-right">BOX당 내품</th>
                </tr>
              </thead>
              <tbody>
                {searchedProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="border px-2 py-2 text-center text-gray-400"
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  searchedProducts.map((p) => (
                    <tr
                      key={p.code}
                      className={`cursor-pointer hover:bg-blue-50 ${
                        selectedProduct?.code === p.code ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleSelectProduct(p)}
                    >
                      <td className="border px-2 py-1 font-mono">{p.code}</td>
                      <td className="border px-2 py-1">{p.name}</td>
                      <td className="border px-2 py-1 text-right">
                        {p.boxEa.toLocaleString()} EA
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 선택된 상품 + 생산 등록 폼 */}
          <form
            onSubmit={handleCreateRecord}
            className="grid grid-cols-1 gap-2 rounded-lg border bg-white p-3 text-[11px] md:grid-cols-2"
          >
            <div className="col-span-1 mb-1 flex items-center justify-between md:col-span-2">
              <span className="font-semibold text-gray-800">
                선택된 상품 정보
              </span>
              {selectedProduct && (
                <span className="font-mono text-gray-600">
                  {selectedProduct.code}
                </span>
              )}
            </div>

            <div className="col-span-1 mb-1 text-[11px] text-gray-600 md:col-span-2">
              {selectedProduct ? (
                <span>{selectedProduct.name}</span>
              ) : (
                <span className="text-gray-400">
                  상품을 선택하면 여기 표시됩니다.
                </span>
              )}
            </div>

            {/* 1행: 박스수량 / 생산일자 */}
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700">생산 박스 수량</label>
              <input
                type="text"
                value={inputBoxes || ""}
                onChange={handleBoxesChange}
                className="h-8 rounded border px-2 text-right"
                placeholder="예: 24"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-gray-700">생산일자</label>
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="h-8 rounded border px-2"
              />
            </div>

            {/* 2행: BOX당 내품 / 총 수량 EA */}
            <div className="flex flex-col">
              <label className="mb-1 text-gray-700">BOX당 내품 수량</label>
              <input
                type="text"
                disabled
                value={
                  selectedProduct
                    ? `${selectedProduct.boxEa.toLocaleString()} EA`
                    : "-"
                }
                className="h-8 rounded border bg-gray-50 px-2 text-right"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-gray-700">총 수량(EA)</label>
              <input
                type="text"
                disabled
                value={
                  totalEaPreview
                    ? totalEaPreview.toLocaleString() + " EA"
                    : "0 EA"
                }
                className="h-8 rounded border bg-gray-50 px-2 text-right"
              />
            </div>

            {/* LOT */}
            <div className="flex flex-col md:col-span-2">
              <label className="mb-1 text-gray-700">
                LOT 번호{" "}
                <span className="text-[10px] text-gray-400">
                  (자동 생성 후 필요 시 수정 가능)
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputLotNo}
                  onChange={(e) => setInputLotNo(e.target.value)}
                  className="h-8 flex-1 rounded border px-2"
                  placeholder="예: LOT-P1001-20251126-001"
                />
                <button
                  type="button"
                  onClick={handleLotRegenerate}
                  className="h-8 rounded bg-slate-700 px-3 text-[11px] text-white hover:bg-slate-800"
                >
                  LOT 자동생성
                </button>
              </div>
            </div>

            <div className="col-span-1 mt-2 flex justify-end md:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-blue-600 px-4 py-1 text-[11px] text-white hover:bg-blue-700"
              >
                생산 내역 등록 (QR 생성)
              </button>
            </div>
          </form>
        </div>

        {/* 생산 내역 조회 */}
        <div className="flex-1 rounded-xl border bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">생산 내역 조회</div>
            <div className="text-[11px] text-gray-500">
              총{" "}
              <span className="font-semibold">
                {filteredRecords.length.toLocaleString()}건
              </span>
            </div>
          </div>

          {/* 필터 */}
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="w-12 text-gray-600">기간</span>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="h-7 rounded border px-2"
              />
              <span>~</span>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="h-7 rounded border px-2"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="w-12 text-gray-600">검색어</span>
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="상품코드 / 상품명 / LOT"
                className="h-7 w-56 rounded border px-2"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setFilterFrom("");
                setFilterTo("");
                setFilterKeyword("");
              }}
              className="ml-auto rounded-full border bg-white px-3 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
            >
              초기화
            </button>
          </div>

          {/* 테이블 */}
          <div className="h-[220px] overflow-auto rounded-lg border bg-white">
            <table className="min-w-[720px] w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">생산일자</th>
                  <th className="border px-2 py-1 text-left">상품코드</th>
                  <th className="border px-2 py-1 text-left">상품명</th>
                  <th className="border px-2 py-1 text-left">LOT번호</th>
                  <th className="border px-2 py-1 text-right">BOX</th>
                  <th className="border px-2 py-1 text-right">총수량(EA)</th>
                  <th className="border px-2 py-1 text-left">비고</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="border px-2 py-4 text-center text-gray-400"
                    >
                      조건에 해당하는 생산 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const isSelected = r.id === selectedRecordId;
                    return (
                      <tr
                        key={r.id}
                        className={`cursor-pointer hover:bg-blue-50 ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedRecordId(r.id)}
                      >
                        <td className="border px-2 py-1">{r.producedAt}</td>
                        <td className="border px-2 py-1 font-mono">
                          {r.productCode}
                        </td>
                        <td className="border px-2 py-1">{r.productName}</td>
                        <td className="border px-2 py-1 font-mono">
                          {r.lotNo}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {r.boxes.toLocaleString()}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {r.totalEa.toLocaleString()}
                        </td>
                        <td className="border px-2 py-1 text-gray-600">
                          {r.remark ?? "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 우측: LOT 상세 + 파렛트 호출 + 입고 */}
      <section className="flex w-[420px] flex-col gap-3 rounded-2xl border bg-white p-4">
        {/* LOT 상세 + 라벨 미리보기 */}
        <div className="rounded-xl border bg-gray-50 p-3">
          <div className="mb-2 text-sm font-semibold">선택된 생산 LOT 상세</div>

          {!selectedRecord ? (
            <div className="flex h-40 items-center justify-center text-[11px] text-gray-400">
              좌측에서 생산 내역을 선택해 주세요.
            </div>
          ) : (
            <>
              <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-700">
                <div className="text-gray-500">상품코드</div>
                <div className="text-right font-mono">
                  {selectedRecord.productCode}
                </div>

                <div className="text-gray-500">상품명</div>
                <div className="text-right">{selectedRecord.productName}</div>

                <div className="text-gray-500">생산일자</div>
                <div className="text-right">{selectedRecord.producedAt}</div>

                <div className="text-gray-500">BOX 당 내품</div>
                <div className="text-right">
                  {selectedRecord.boxEa.toLocaleString()} EA
                </div>

                <div className="text-gray-500">박스 수량</div>
                <div className="text-right">
                  <input
                    type="text"
                    value={selectedRecord.boxes}
                    onChange={(e) =>
                      handleRecordEdit(
                        "boxes",
                        Number(e.target.value.replace(/[^0-9]/g, "")) || 0,
                      )
                    }
                    className="h-6 w-24 rounded border px-1 text-right"
                  />
                </div>

                <div className="text-gray-500">총 수량(EA)</div>
                <div className="text-right">
                  {selectedRecord.totalEa.toLocaleString()} EA
                </div>

                <div className="text-gray-500">LOT 번호</div>
                <div className="text-right">
                  <input
                    type="text"
                    value={selectedRecord.lotNo}
                    onChange={(e) =>
                      handleRecordEdit("lotNo", e.target.value)
                    }
                    className="h-6 w-full rounded border px-1 text-right font-mono"
                  />
                </div>

                <div className="text-gray-500">비고</div>
                <div className="text-right">
                  <input
                    type="text"
                    value={selectedRecord.remark ?? ""}
                    onChange={(e) =>
                      handleRecordEdit("remark", e.target.value)
                    }
                    className="h-6 w-full rounded border px-1 text-right"
                    placeholder="예: 야간조 생산"
                  />
                </div>
              </div>

              {/* 라벨 미리보기 */}
              <div className="mt-2 flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-gray-700">
                  라벨 미리보기 (박스 옆면)
                </div>
                <div className="flex justify-center">
                  <div className="flex h-28 w-64 flex-col justify-between rounded border bg-white px-3 py-2 shadow">
                    <div className="text-[10px] text-gray-500">
                      LOT 라벨 / PROD
                    </div>
                    <div className="text-[13px] font-semibold text-gray-900">
                      {selectedRecord.productName}
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-700">
                      <div>
                        <div>LOT: {selectedRecord.lotNo}</div>
                        <div>DATE: {selectedRecord.producedAt}</div>
                        <div>
                          BOX: {selectedRecord.boxes.toLocaleString()} / EA:{" "}
                          {selectedRecord.totalEa.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-center rounded bg-gray-100 px-2 text-[9px] text-gray-500">
                        QR 코드<br />
                        (미리보기)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "현재 입력된 정보 기준으로 QR 데이터가 재생성되어 라벨에 반영됩니다.",
                      )
                    }
                    className="rounded-full border bg-white px-3 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                  >
                    QR 재생성
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      alert("라벨 출력 명령을 인쇄 서버로 전송했다고 가정합니다.")
                    }
                    className="rounded-full bg-emerald-600 px-4 py-1 text-[11px] text-white hover:bg-emerald-700"
                  >
                    라벨 출력
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 파렛트 호출 */}
        <div className="rounded-xl border bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">파렛트 호출</div>
            <div className="flex overflow-hidden rounded-full border bg-white text-[11px]">
              <button
                type="button"
                onClick={() => setPalletCallMode("empty")}
                className={`px-3 py-1 ${
                  palletCallMode === "empty"
                    ? "bg-slate-700 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                빈 파렛트
              </button>
              <button
                type="button"
                onClick={() => setPalletCallMode("loaded")}
                className={`px-3 py-1 ${
                  palletCallMode === "loaded"
                    ? "bg-slate-700 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                적재 파렛트
              </button>
            </div>
          </div>

          {palletCallMode === "empty" ? (
            <>
              <p className="mb-2 text-[11px] text-gray-500">
                피킹존 또는 생산라인에서 사용할 빈 파렛트를 호출합니다.
              </p>
              <div className="flex flex-col gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-gray-600">출발 위치</span>
                  <select
                    value={emptyPalletFrom}
                    onChange={(e) => setEmptyPalletFrom(e.target.value)}
                    className="h-7 flex-1 rounded border px-2"
                  >
                    <option>피킹존 빈파렛트존</option>
                    <option>1층 빈파렛트 보관존</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-gray-600">호출 수량</span>
                  <input
                    type="text"
                    value={emptyPalletCount || ""}
                    onChange={handleEmptyPalletCountChange}
                    className="h-7 w-24 rounded border px-2 text-right"
                    placeholder="예: 2"
                  />
                  <span>PALLET</span>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleEmptyPalletCall}
                  className="rounded-full bg-blue-600 px-4 py-1 text-[11px] text-white hover:bg-blue-700"
                >
                  빈 파렛트 호출
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-2 text-[11px] text-gray-500">
                2층/3층 파렛트 창고에 적재된 파렛트를 상품으로 검색하여 AMR로
                호출합니다.
              </p>

              <div className="mb-2 flex items-center gap-2 text-[11px]">
                <span className="w-16 text-gray-600">검색</span>
                <input
                  type="text"
                  value={loadedSearch}
                  onChange={(e) => setLoadedSearch(e.target.value)}
                  placeholder="상품코드 / 상품명 / 파렛트ID"
                  className="h-7 flex-1 rounded border px-2"
                />
              </div>

              <div className="mb-2 max-h-32 overflow-auto rounded border bg-white">
                <table className="min-w-[360px] w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1 text-center">선택</th>
                      <th className="border px-2 py-1 text-left">파렛트ID</th>
                      <th className="border px-2 py-1 text-left">위치</th>
                      <th className="border px-2 py-1 text-left">상품명</th>
                      <th className="border px-2 py-1 text-right">BOX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoadedPallets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="border px-2 py-3 text-center text-gray-400"
                        >
                          검색된 파렛트가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredLoadedPallets.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="border px-2 py-1 text-center">
                            <input
                              type="radio"
                              checked={selectedLoadedPalletId === p.id}
                              onChange={() =>
                                setSelectedLoadedPalletId(p.id)
                              }
                            />
                          </td>
                          <td className="border px-2 py-1 font-mono">
                            {p.palletId}
                          </td>
                          <td className="border px-2 py-1">{p.location}</td>
                          <td className="border px-2 py-1">
                            {p.productName}
                          </td>
                          <td className="border px-2 py-1 text-right">
                            {p.boxQty.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleLoadedPalletCall}
                  className="rounded-full bg-blue-600 px-4 py-1 text-[11px] text-white hover:bg-blue-700"
                >
                  선택 파렛트 호출
                </button>
              </div>
            </>
          )}
        </div>

        {/* 파렛트 입고 처리 */}
        <div className="rounded-xl border bg-gray-50 p-3">
          <div className="mb-2 text-sm font-semibold">파렛트 입고 처리</div>
          <p className="mb-2 text-[11px] text-gray-500">
            도착한 파렛트의 QR과 박스 라벨 QR(LOT)을 스캔한 뒤 박스 수량과
            입고 위치를 지정하여 입고 처리합니다.
          </p>

          <div className="mb-2 flex flex-col gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-18 text-gray-600">파렛트 QR</span>
              <input
                type="text"
                value={inboundPalletQr}
                onChange={(e) => setInboundPalletQr(e.target.value)}
                placeholder="파렛트 QR 코드 인식값"
                className="h-7 flex-1 rounded border px-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-18 text-gray-600">라벨 QR / LOT</span>
              <input
                type="text"
                value={inboundLabelQr}
                onChange={(e) => setInboundLabelQr(e.target.value)}
                placeholder="박스 라벨 QR 또는 LOT 번호"
                className="h-7 flex-1 rounded border px-2"
              />
              <button
                type="button"
                onClick={handleLabelQrSearch}
                className="h-7 rounded bg-slate-700 px-3 text-[11px] text-white hover:bg-slate-800"
              >
                조회
              </button>
            </div>
          </div>

          {/* 선택된 LOT 요약 */}
          <div className="mb-2 rounded border bg-white p-2 text-[11px] text-gray-700">
            {!inboundTargetRecord ? (
              <div className="text-gray-400">
                라벨 QR(LOT)을 조회하면 여기 LOT 정보가 표시됩니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="text-gray-500">상품명</div>
                <div className="text-right">
                  {inboundTargetRecord.productName}
                </div>
                <div className="text-gray-500">LOT</div>
                <div className="text-right font-mono">
                  {inboundTargetRecord.lotNo}
                </div>
                <div className="text-gray-500">BOX당 내품</div>
                <div className="text-right">
                  {inboundTargetRecord.boxEa.toLocaleString()} EA
                </div>
              </div>
            )}
          </div>

          {/* 수량/입고 위치 */}
          <div className="mb-2 flex flex-col gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-18 text-gray-600">입고 박스 수량</span>
              <input
                type="text"
                value={inboundBoxQty || ""}
                onChange={handleInboundBoxChange}
                className="h-7 w-24 rounded border px-2 text-right"
                placeholder="예: 10"
              />
              <span>BOX</span>
              <span className="ml-auto text-gray-500">
                총{" "}
                <span className="font-semibold">
                  {inboundTotalEa.toLocaleString()}
                </span>{" "}
                EA
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-18 text-gray-600">입고 위치</span>
              <select
                value={inboundLocation}
                onChange={(e) => setInboundLocation(e.target.value)}
                className="h-7 flex-1 rounded border px-2"
              >
                <option>3층 풀파렛트 창고 A라인</option>
                <option>3층 풀파렛트 창고 B라인</option>
                <option>2층 잔량 파렛트 창고</option>
              </select>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleInbound}
              className="rounded-full bg-emerald-600 px-4 py-1 text-[11px] text-white hover:bg-emerald-700"
            >
              입고
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
