// components/OrderDetail.tsx
"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import type { Order, OrderItem, OrderStatus } from "./types";
import { statusBadgeClass } from "./types";
import { PalletDirectTransferModal } from "./PalletDirectTransferModal";

type Props = {
  order: Order | null;
  items: OrderItem[];
  onChangeStatus?: (status: OrderStatus) => void;
  // 🔹 page.tsx의 handleCompleteOrder(newItems: OrderItem[]) 와 맞추기
  onComplete?: (newItems: OrderItem[]) => void;
};


export function OrderDetail({
  order,
  items,
  onChangeStatus,
  onComplete,
}: Props): ReactElement | null {
  if (!order) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border bg-white text-sm text-gray-500">
        주문을 선택하면 상세 정보가 표시됩니다.
      </div>
    );
  }

  // 피킹창고 부족 여부
  const hasLowStock = useMemo(
    () => items.some((i) => (i as any).lowStock),
    [items],
  );

  // 🔹 행별 AMR 출발 위치 (피킹 / 2-1 / 3-1 등) 저장
  const [amrRouteMap, setAmrRouteMap] = useState<Record<string, string>>({});

  // 🔹 지정이송 모달 상태
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{
    code: string;
    name: string;
    route: string;
  } | null>(null);

  // 🔹 피킹에서 지정이송 시 메시지
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClickComplete = () => {
  if (onComplete) {
    onComplete(items); // 🔹 선택된 주문의 아이템 목록을 넘겨줌
  }
};


  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white p-4 text-sm">
      {/* 에러 안내 (피킹 선택 후 지정이송 시) */}
      {errorMsg && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-100 px-3 py-2 text-[12px] text-red-700">
          {errorMsg}
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="float-right text-[11px] text-red-700 underline"
          >
            닫기
          </button>
        </div>
      )}

      {/* 헤더 정보 */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">주문 상세 및 출고 지시</div>
          <div className="mt-0.5 text-[13px] font-semibold">
            주문번호: {order.id}
          </div>
          <div className="mt-0.5 text-[11px] text-gray-500">
            납기일:{" "}
            <span className="font-medium text-gray-700">
              {(order as any).dueDate}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-gray-500">
            출고위치:{" "}
            <span className="font-medium text-gray-700">
              {(order as any).shipLocation ?? "2층 피킹라인 (고정)"}
            </span>
          </div>
        </div>

        <div className="text-right text-[11px] text-gray-500">
          <div>
            상태:{" "}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${statusBadgeClass(
                (order as any).status,
              )}`}
            >
              {(order as any).statusLabel ?? (order as any).status}
            </span>
          </div>
          {hasLowStock && (
            <div className="mt-1 text-[11px] text-red-500">
              ⚠ 피킹창고 재고 부족 상품 있음
            </div>
          )}
        </div>
      </div>

      {/* 아이템 테이블 */}
      <div className="flex-1 overflow-auto rounded-2xl border bg-gray-50">
        <table className="min-w-full border-collapse text-[12px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b px-3 py-2 text-left">상품코드</th>
              <th className="border-b px-3 py-2 text-left">상품명</th>
              <th className="border-b px-3 py-2 text-right">주문수량</th>
              <th className="border-b px-3 py-2 text-right">피킹창고 재고</th>
              <th className="border-b px-3 py-2 text-center">상태</th>
              <th className="border-b px-3 py-2 text-center">AMR 호출</th>
              <th className="border-b px-3 py-2 text-left">메모</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const key = (it as any).code ?? (it as any).itemCode ?? "";
              const routeValue = amrRouteMap[key] ?? "피킹";
              const lowStock = (it as any).lowStock;
              const pickingStock = (it as any).pickingStock ?? 0;
              const qty = (it as any).qty ?? (it as any).orderQty ?? 0;
              const memo = (it as any).memo ?? "";

              return (
                <tr key={key} className="bg-white">
                  <td className="border-t px-3 py-2 font-mono text-[12px]">
                    {key}
                  </td>
                  <td className="border-t px-3 py-2 text-[12px]">
                    {(it as any).name}
                  </td>
                  <td className="border-t px-3 py-2 text-right">
                    {qty} EA
                  </td>
                  <td className="border-t px-3 py-2 text-right">
                    {pickingStock} EA
                  </td>
                  <td className="border-t px-3 py-2 text-center">
                    {lowStock ? (
                      <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] text-red-600">
                        피킹창고 부족
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600">
                        피킹창고 충분
                      </span>
                    )}
                  </td>

                  {/* AMR 호출 / 지정이송 */}
                  <td className="border-t px-3 py-2 text-center">
                    <div className="inline-flex items-center gap-1">
                      <select
                        className="rounded border px-2 py-0.5 text-[11px]"
                        value={routeValue}
                        onChange={(e) =>
                          setAmrRouteMap((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                      >
                        <option value="피킹">피킹</option>
                        <option value="2-1">2-1</option>
                        <option value="3-1">3-1</option>
                      </select>

                      {/* 기존 AMR 호출 버튼 (동작은 나중에 연결) */}
                      <button
                        type="button"
                        className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] text-white"
                      >
                        호출
                      </button>

                      {/* 🔹 지정이송 버튼 */}
                      <button
                        type="button"
                        className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 hover:bg-amber-100"
                        onClick={() => {
                          if (routeValue === "피킹") {
                            setErrorMsg(
                              "피킹창고에서는 지정이송을 할 수 없습니다.",
                            );
                            return;
                          }

                          setTransferTarget({
                            code: key,
                            name: (it as any).name,
                            route: routeValue,
                          });
                          setTransferOpen(true);
                        }}
                      >
                        지정이송
                      </button>
                    </div>
                  </td>

                  <td className="border-t px-3 py-2 text-[11px] text-gray-600">
                    {memo}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 하단 안내 + 버튼 */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
        <div className="space-y-1">
          <p>· 이 화면은 피킹라인 작업자 기준 출고 UI 예시입니다.</p>
          <p>· 피킹창고 부족 상품은 상단 AMR 수동 호출 버튼으로 보충합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            송장 출력 (예시)
          </button>
          <button
            type="button"
            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            거래명세표 출력 (예시)
          </button>
          <button
            type="button"
            onClick={handleClickComplete}
            className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            출고 완료
          </button>
        </div>
      </div>

      {/* 🔹 지정이송 모달 */}
      <PalletDirectTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        productCode={transferTarget?.code}
        productName={transferTarget?.name}
        fromLocation={transferTarget?.route}
      />
    </div>
  );
}
