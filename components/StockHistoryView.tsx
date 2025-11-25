// components/StockHistoryView.tsx
"use client";

import { useMemo, useState, ChangeEvent } from "react";

type HistoryType =
  | "입고"
  | "출고"
  | "보충"
  | "조정"
  | "생산투입"
  | "생산완료";

interface HistoryRow {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: HistoryType;
  warehouseLocation: string; // 예: "피킹 창고 / 1F-OUT-01"
  productCode: string;
  productName: string;
  lotNo?: string;
  qty: number;
  orderNo?: string;
  note: string; // 비고
}

// ----------------------
// 더미 데이터
// ----------------------
const MOCK_HISTORY: HistoryRow[] = [
  {
    id: "H-001",
    date: "2025-11-25",
    time: "09:15",
    type: "출고",
    warehouseLocation: "피킹 창고 / 1F-OUT-01",
    productCode: "P-1001",
    productName: "PET 500ml 투명",
    lotNo: "LOT-2025-001",
    qty: -1200,
    orderNo: "ORD-20251125-001",
    note: "[주문관리] 주문서 출고 처리 (AMR 피킹 후 출고)",
  },
  {
    id: "H-002",
    date: "2025-11-25",
    time: "09:05",
    type: "보충",
    warehouseLocation: "피킹 창고 / 1F-IN-01",
    productCode: "P-1001",
    productName: "PET 500ml 투명",
    lotNo: "LOT-2025-001",
    qty: 1800,
    note: "[재고관리] 2층 잔량 파렛트 → 피킹 창고 보충",
  },
  {
    id: "H-003",
    date: "2025-11-25",
    time: "08:50",
    type: "보충",
    warehouseLocation: "2층 잔량 파렛트 창고 / 2F-R3-C5",
    productCode: "P-1001",
    productName: "PET 500ml 투명",
    lotNo: "LOT-2025-001",
    qty: -1800,
    note: "[재고관리] 피킹 창고 보충에 따른 잔량 파렛트 차감",
  },
  {
    id: "H-004",
    date: "2025-11-24",
    time: "16:20",
    type: "입고",
    warehouseLocation: "3층 풀파렛트 창고 / 3F-A1-01",
    productCode: "P-5001",
    productName: "PET 500ml 신제품 A",
    lotNo: "LOT-2025-NEW01",
    qty: 24000,
    note: "[생산관리] 사출/블로우 생산완료 풀파렛트 입고",
  },
  {
    id: "H-005",
    date: "2025-11-24",
    time: "14:10",
    type: "조정",
    warehouseLocation: "피킹 창고 / 1F-PK-03",
    productCode: "P-3001",
    productName: "PET 2L 투명",
    lotNo: "LOT-2025-010",
    qty: -20,
    note: "[재고관리] 파손/불량에 따른 수동 재고 조정",
  },
];

export function StockHistoryView() {
  // ----------------------
  // 필터 상태
  // ----------------------
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [keyword, setKeyword] = useState<string>(""); // ✅ 통합 검색어

  const handleDateChange =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
    };

  const handleQuickRange = (days: number) => {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);

    if (days === 0) {
      setDateFrom(to);
      setDateTo(to);
      return;
    }

    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - days + 1);
    const from = fromDate.toISOString().slice(0, 10);

    setDateFrom(from);
    setDateTo(to);
  };

  const handleResetFilter = () => {
    setDateFrom("");
    setDateTo("");
    setKeyword("");
  };

  // ----------------------
  // 필터링된 히스토리
  // ----------------------
  const filteredRows = useMemo(() => {
    const tokens =
      keyword
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 0)
        .map((t) => t.toLowerCase()) ?? [];

    return MOCK_HISTORY.filter((row) => {
      // 기간 필터
      if (dateFrom && row.date < dateFrom) return false;
      if (dateTo && row.date > dateTo) return false;

      // 통합 검색어 필터
      if (tokens.length > 0) {
        const haystack = [
          row.productCode,
          row.productName,
          row.lotNo ?? "",
          row.warehouseLocation,
          row.orderNo ?? "",
          row.type,
          row.note,
        ]
          .join(" ")
          .toLowerCase();

        // 모든 토큰이 포함되어야 함(AND 검색)
        const allMatched = tokens.every((tk) => haystack.includes(tk));
        if (!allMatched) return false;
      }

      return true;
    }).sort((a, b) => {
      const aKey = `${a.date} ${a.time}`;
      const bKey = `${b.date} ${b.time}`;
      return aKey < bKey ? 1 : -1; // 최신순
    });
  }, [dateFrom, dateTo, keyword]);

  const totalIn = filteredRows
    .filter((r) => r.qty > 0)
    .reduce((sum, r) => sum + r.qty, 0);

  const totalOut = filteredRows
    .filter((r) => r.qty < 0)
    .reduce((sum, r) => sum + Math.abs(r.qty), 0);

  // ----------------------
  // 렌더링
  // ----------------------
  return (
    <div className="flex flex-col gap-4 text-[12px]">
      {/* 상단 필터 영역 */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">입출고 히스토리 조회</div>
            <div className="text-[11px] text-gray-500">
              주문관리 · 재고관리 · 생산관리에서 발생한 모든 입출고 내역을
              기간 / 통합 검색어 기준으로 조회합니다.
            </div>
          </div>
          <div className="text-right text-[11px] text-gray-500">
            조회 건수:{" "}
            <span className="font-semibold">
              {filteredRows.length.toLocaleString()}건
            </span>
            <br />
            입고 합계:{" "}
            <span className="font-semibold text-blue-600">
              {totalIn.toLocaleString()} EA
            </span>{" "}
            / 출고 합계:{" "}
            <span className="font-semibold text-red-600">
              {totalOut.toLocaleString()} EA
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-gray-50 p-3">
          {/* 1행: 기간 필터 */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="w-20 text-gray-600">기간</div>
            <input
              type="date"
              value={dateFrom}
              onChange={handleDateChange(setDateFrom)}
              className="h-7 rounded border px-2 text-[11px]"
              placeholder="연도-월-일"
            />
            <span>~</span>
            <input
              type="date"
              value={dateTo}
              onChange={handleDateChange(setDateTo)}
              className="h-7 rounded border px-2 text-[11px]"
              placeholder="연도-월-일"
            />

            <div className="ml-2 flex gap-1">
              <button
                type="button"
                onClick={() => handleQuickRange(0)}
                className="rounded-full border bg-white px-2 py-0.5 text-[11px] hover:bg-gray-100"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange(7)}
                className="rounded-full border bg-white px-2 py-0.5 text-[11px] hover:bg-gray-100"
              >
                최근 7일
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange(30)}
                className="rounded-full border bg-white px-2 py-0.5 text-[11px] hover:bg-gray-100"
              >
                최근 30일
              </button>
            </div>
          </div>

          {/* 2행: 통합 검색어 */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="w-20 text-gray-600">검색어</div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="예: P-1001 LOT-2025-001 출고 피킹 ORD-2025"
              className="h-7 w-full flex-1 rounded border px-2 text-[11px]"
            />
            <div className="flex flex-1 justify-end gap-2">
              <button
                type="button"
                onClick={handleResetFilter}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
              >
                초기화
              </button>
            </div>
          </div>

          <div className="text-[10px] text-gray-500">
            · 공백으로 여러 키워드를 입력하면 AND 조건으로 필터됩니다. (예:
            <span className="font-mono">
              {" "}
              P-1001 출고 LOT-2025 피킹
            </span>
            )
          </div>
        </div>
      </section>

      {/* 히스토리 테이블 */}
      <section className="flex-1 rounded-2xl border bg-white p-4">
        <div className="mb-2 text-sm font-semibold">입출고 히스토리</div>
        <div className="overflow-auto rounded-xl border bg-gray-50">
          <table className="min-w-[900px] w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-left">일시</th>
                <th className="border px-2 py-1 text-left">작업유형</th>
                <th className="border px-2 py-1 text-left">창고위치</th>
                <th className="border px-2 py-1 text-left">상품코드</th>
                <th className="border px-2 py-1 text-left">상품명</th>
                <th className="border px-2 py-1 text-left">LOT번호</th>
                <th className="border px-2 py-1 text-right">수량(EA)</th>
                <th className="border px-2 py-1 text-left">주문번호</th>
                <th className="border px-2 py-1 text-left">비고</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="border px-2 py-4 text-center text-gray-400"
                  >
                    조건에 해당하는 입출고 히스토리가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">
                      {row.date} {row.time}
                    </td>
                    <td className="border px-2 py-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          row.type === "입고"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : row.type === "출고"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : row.type === "보충"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : row.type === "조정"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="border px-2 py-1">
                      {row.warehouseLocation}
                    </td>
                    <td className="border px-2 py-1 font-mono">
                      {row.productCode}
                    </td>
                    <td className="border px-2 py-1">{row.productName}</td>
                    <td className="border px-2 py-1 font-mono">
                      {row.lotNo ?? "-"}
                    </td>
                    <td
                      className={`border px-2 py-1 text-right ${
                        row.qty < 0 ? "text-red-600" : "text-blue-600"
                      }`}
                    >
                      {row.qty.toLocaleString()}
                    </td>
                    <td className="border px-2 py-1 font-mono">
                      {row.orderNo ?? "-"}
                    </td>
                    <td className="border px-2 py-1 text-gray-700">
                      {row.note}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
