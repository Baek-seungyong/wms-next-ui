"use client";

import type { Order, OrderItem } from "./types";
import { statusBadgeClass } from "./types";
import { useMemo, useState } from "react";

type LineType = "피킹" | "2-1" | "3-1";

type Props = {
  order: Order;
  items: OrderItem[];
  // ✅ 여러 라인을 한 번에 넘기도록 변경
  onCallRobotForItem?: (item: OrderItem, lines: LineType[]) => void;
};

export function OrderDetail({ order, items, onCallRobotForItem }: Props) {
  const hasLowStock = useMemo(() => items.some((i) => i.lowStock), [items]);

  // 각 상품코드별로 선택된 라인들을 배열로 관리
  const [selectedLines, setSelectedLines] = useState<Record<string, LineType[]>>(
    {},
  );

  return (
    <div className="bg-white shadow-sm rounded-2xl border border-gray-200 h-full text-sm">
      <div className="p-5 h-full flex flex-col gap-4">
        {/* 상단 주문 정보 */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">주문 상세 및 출고 지시</h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p>
                주문번호:{" "}
                <span className="font-medium text-gray-900">{order.id}</span>
              </p>
              <p>
                고객명:{" "}
                <span className="font-medium text-gray-900">
                  {order.customer}
                </span>
              </p>
              <p>
                납기일:{" "}
                <span className="font-medium text-gray-900">
                  {order.dueDate}
                </span>
              </p>
              <p>
                출고위치:{" "}
                <span className="font-medium text-gray-900">
                  2층 피킹라인 (고정)
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs ${statusBadgeClass(
                  order.status,
                )}`}
              >
                상태: {order.status}
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                주문 기준 UI 예시
              </span>
            </div>
            {hasLowStock && (
              <span className="mt-1 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs">
                ⚠ 피킹창고 재고 부족 상품 있음
              </span>
            )}
          </div>
        </div>

        {/* 테이블 영역 */}
        <div className="border rounded-xl overflow-hidden flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 text-sm font-semibold">
              <tr>
                <th className="p-3 border-b w-28 text-left">상품코드</th>
                <th className="p-3 border-b w-[220px] text-left">상품명</th>
                <th className="p-3 border-b w-24 text-center">주문수량</th>
                <th className="p-3 border-b w-24 text-center">피킹창고 재고</th>
                <th className="p-3 border-b w-28 text-center">상태</th>
                <th className="p-3 border-b w-44 text-center">AMR 호출</th>
                <th className="p-3 border-b w-52 text-center">메모</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const lack = it.stockQty < it.orderQty;
                const currentLines = selectedLines[it.code] ?? [];
                const isSelected = (line: LineType) =>
                  currentLines.includes(line);

                return (
                  <tr key={it.code} className="hover:bg-gray-50">
                    <td className="p-3 border-t align-middle">{it.code}</td>
                    <td className="p-3 border-t align-middle">{it.name}</td>

                    <td className="p-3 border-t text-center align-middle">
                      {it.orderQty.toLocaleString()} EA
                    </td>

                    <td className="p-3 border-t text-center align-middle">
                      <span
                        className={
                          lack
                            ? "text-red-600 font-semibold"
                            : "text-gray-900 font-medium"
                        }
                      >
                        {it.stockQty.toLocaleString()} EA
                      </span>
                    </td>

                    <td className="p-3 border-t text-center align-middle">
                      {lack ? (
                        <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs">
                          피킹창고 부족
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs">
                          피킹창고 충분
                        </span>
                      )}
                    </td>

                    {/* AMR 호출 선택 + 호출 버튼 */}
                    <td className="p-3 border-t text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {(["피킹", "2-1", "3-1"] as const).map((line) => (
                          <button
                            key={line}
                            type="button"
                            onClick={() =>
                              setSelectedLines((prev) => {
                                const before = prev[it.code] ?? [];
                                const exists = before.includes(line);
                                return {
                                  ...prev,
                                  [it.code]: exists
                                    ? (before.filter(
                                        (l) => l !== line,
                                      ) as LineType[])
                                    : ([...before, line] as LineType[]),
                                };
                              })
                            }
                            className={`px-2 py-1 rounded-full text-xs border inline-flex items-center justify-center whitespace-nowrap min-w-[40px]
                              ${
                                isSelected(line)
                                  ? "bg-blue-600 text-white border-blue-700"
                                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                              }`}
                          >
                            {line}
                          </button>
                        ))}

                        <button
                          type="button"
                          className="px-3 py-1 rounded-full text-xs bg-gray-800 text-white hover:bg-gray-700"
                          onClick={() => {
                            if (currentLines.length === 0) {
                              alert(
                                "먼저 피킹 / 2-1 / 3-1 중에서 하나 이상 선택해주세요.",
                              );
                              return;
                            }
                            // ✅ 선택된 라인 배열을 한 번에 전달
                            onCallRobotForItem?.(it, currentLines);
                          }}
                        >
                          호출
                        </button>
                      </div>
                    </td>

                    <td className="p-3 border-t text-center align-middle text-xs text-gray-600">
                      {lack
                        ? "AMR 수동 호출로 3-1 / 2-1에서 보충 필요"
                        : "피킹창고 재고 내에서 출고 가능"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 하단 안내 / 버튼 */}
        <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
          <div>
            <p>· 이 화면은 피킹라인 작업자 기준 출고 UI 예시입니다.</p>
            <p>· 피킹창고 부족 상품은 상단 AMR 수동 호출 버튼으로 3-1 / 2-1 창고에서 보충합니다.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs">
              송장 출력 (예시)
            </button>
            <button className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs">
              거래명세표 출력 (예시)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
