// components/OrderDetail.tsx
"use client";

import type { Order, OrderItem } from "./types";
import { statusBadgeClass } from "./types";
import { useMemo } from "react";

type Props = {
  order: Order;
  items: OrderItem[];
  onChangeStatus?: (status: Order["status"]) => void;
  onComplete?: (newItems: OrderItem[]) => void;
};

export function OrderDetail({
  order,
  items,
  onChangeStatus,
  onComplete,
}: Props) {
  const hasLowStock = useMemo(() => items.some((i) => i.lowStock), [items]);

  // ⭐ 긴급출고 판단 로직 (EMG-로 시작)
  const isEmergency = !!order.isEmergency;

const emergencyTitle =
  items.length <= 1
    ? items[0]?.name ?? ""
    : `${items[0].name} 외`;

  // 수량 입력 Ref 처리 없이 간단하게 input 값을 읽도록 설계
  const handleCompleteEmergency = () => {
    if (!onComplete) return;

    const updated = items.map((it) => {
      const el = document.getElementById(`qty-${it.code}`) as HTMLInputElement;
      return {
        ...it,
        orderQty: Number(el?.value ?? it.orderQty),
      };
    });

    onComplete(updated);
  };

  return (
    <div className="bg-white shadow-sm rounded-2xl border border-gray-200 h-full">
      <div className="p-4 h-full flex flex-col gap-3">
        {/* 상단 정보 */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">주문 상세 및 출고 지시</h2>

            <div className="text-xs text-gray-600 space-y-0.5">
              <p>
                주문번호:{" "}
                <span className="font-medium text-gray-900">{order.id}</span>
              </p>
              {isEmergency ? (
                <>
                  <p>
                    상품명(긴급):{" "}
                    <span className="font-medium text-gray-900">
                      {emergencyTitle}
                    </span>
                  </p>
                  <p>
                    납기일: <span className="font-medium text-gray-900">긴급</span>
                  </p>
                </>
              ) : (
                <p>
                  납기일:{" "}
                  <span className="font-medium text-gray-900">{order.dueDate}</span>
                </p>
              )}
              <p>
                출고위치:{" "}
                <span className="font-medium text-gray-900">
                  2층 피킹라인 (고정)
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] ${statusBadgeClass(
                  order.status,
                )}`}
              >
                상태: {order.status}
              </span>

              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px]">
                주문 기준 UI 예시
              </span>
            </div>

            {!isEmergency && hasLowStock && (
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px]">
                ⚠ 피킹창고 재고 부족 상품 있음
              </span>
            )}
          </div>
        </div>

        {/* 테이블 */}
        <div className="border rounded-xl overflow-hidden text-xs flex-1">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 border-b w-32 text-left">상품코드</th>
                <th className="p-2 border-b text-left">상품명</th>
                <th className="p-2 border-b w-24 text-center">주문수량</th>

                {/* ❌ 긴급출고에서는 재고·상태·AMR 출력 안 함 */}
                {!isEmergency && (
                  <>
                    <th className="p-2 border-b w-28 text-center">
                      피킹창고 재고
                    </th>
                    <th className="p-2 border-b w-28 text-center">상태</th>
                    <th className="p-2 border-b w-32 text-center">AMR 호출</th>
                  </>
                )}

                <th className="p-2 border-b w-48 text-center">메모</th>
              </tr>
            </thead>

            <tbody>
              {items.map((it) => {
                const lack = it.stockQty < it.orderQty;

                return (
                  <tr key={it.code} className="hover:bg-gray-50">
                    <td className="p-2 border-t">{it.code}</td>
                    <td className="p-2 border-t">{it.name}</td>

                    {/* 🔸 긴급출고: 수량 직접 입력 */}
                    <td className="p-2 border-t text-center">
                      {isEmergency ? (
                        <input
                          id={`qty-${it.code}`}
                          type="number"
                          min={0}
                          defaultValue={it.orderQty}
                          className="w-20 border border-gray-300 rounded px-1 py-0.5 text-xs text-right"
                        />
                      ) : (
                        `${it.orderQty.toLocaleString()} EA`
                      )}
                    </td>

                    {/* 일반 주문에서만 표시 */}
                    {!isEmergency && (
                      <>
                        <td className="p-2 border-t text-center">
                          {it.stockQty} EA
                        </td>
                        <td className="p-2 border-t text-center">
                          {lack ? (
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-[11px]">
                              피킹창고 부족
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[11px]">
                              피킹창고 충분
                            </span>
                          )}
                        </td>
                        <td className="p-2 border-t text-center">
                          <div className="inline-flex items-center gap-1">
                            <select className="border rounded px-2 py-0.5 text-[11px]">
                              <option>피킹</option>
                              <option>2-1</option>
                              <option>3-1</option>
                            </select>
                            <button className="px-2 py-0.5 bg-gray-900 text-white rounded-full text-[11px]">
                              호출
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {/* 메모 */}
                    <td className="p-2 border-t text-center text-[11px] text-gray-600">
                      {isEmergency
                        ? "긴급출고(수량 입력 후 출고완료)"
                        : lack
                        ? "AMR 수동 호출로 보충 필요"
                        : "피킹창고 재고 내에서 출고 가능"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 하단 안내 & 버튼 */}
        <div className="flex items-center justify-between text-[11px] text-gray-600">
          <div>
            {!isEmergency ? (
              <>
                <p>· 이 화면은 피킹라인 작업자 기준 출고 UI 예시입니다.</p>
                <p>
                  · 피킹창고 부족 상품은 상단 AMR 수동 호출 버튼으로 보충합니다.
                </p>
              </>
            ) : (
              <>
                <p>· 긴급출고는 한 품목의 출고 수량을 직접 입력 후 완료합니다.</p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {/* ❗ 긴급출고일 때 비활성화 */}
            <button
              disabled={isEmergency}
              className={`px-3 py-1.5 rounded-full text-xs ${
                isEmergency
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
            >
              송장 출력 (예시)
            </button>

            <button
              disabled={isEmergency}
              className={`px-3 py-1.5 rounded-full text-xs ${
                isEmergency
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
            >
              거래명세표 출력 (예시)
            </button>

            {/* 🔥 긴급출고일 때만 동작하는 출고완료 버튼 */}
            <button
              onClick={handleCompleteEmergency}
              className="px-4 py-1.5 rounded-full bg-green-500 text-white text-xs"
            >
              출고 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
