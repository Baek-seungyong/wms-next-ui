// components/OrderDetail.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import type { ReactElement } from "react";
import type { Order, OrderItem, OrderStatus } from "./types";
import { statusBadgeClass } from "./types";
import { PalletDirectTransferModal } from "./PalletDirectTransferModal";
import {
  getReplenishMarks,
  toggleReplenishMark,
  type ReplenishMark,
} from "@/utils/replenishMarkStore";

// 🔹 상품별 이미지 경로 매핑 (예시)
//   실제 파일은 public/images/products 폴더 아래에 넣어두면 됨.
const PRODUCT_IMAGE_MAP: Record<string, { main: string }> = {
  "P-001": { main: "/images/products/P-001.png" },
  "P-013": { main: "/images/products/P-013.png" },
  "C-201": { main: "/images/products/C-201.png" },
  "L-009": { main: "/images/products/L-009.png" },
};

type Props = {
  order: Order | null;
  items: OrderItem[];
  onChangeStatus?: (status: OrderStatus) => void;
  // 🔹 page.tsx의 handleCompleteOrder(newItems: OrderItem[]) 와 맞추기
  onComplete?: (newItems: OrderItem[]) => void;
};

type LocationStatus = "창고" | "입고중" | "작업중" | "출고중";

const locationBadgeClass = (loc: LocationStatus) => {
  switch (loc) {
    case "창고":
      return "bg-gray-100 text-gray-700";
    case "입고중":
      return "bg-sky-50 text-sky-700";
    case "작업중":
      return "bg-amber-50 text-amber-700";
    case "출고중":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
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

  // 🔹 행별 위치 상태 (창고 / 입고중 / 작업중 / 출고중)
  const [locationMap, setLocationMap] = useState<Record<string, LocationStatus>>(
    {
      "P-001": "창고",
      "P-013": "입고중",
      "C-201": "작업중",
      "L-009": "출고중",
    },
  );

  // 🔹 보충 마킹 상태 (localStorage 연동)
  const [markedList, setMarkedList] = useState<ReplenishMark[]>([]);

  useEffect(() => {
    setMarkedList(getReplenishMarks());
  }, []);

  const handleToggleMark = (code: string, name: string) => {
    const next = toggleReplenishMark(code, name);
    setMarkedList(next);
  };

  const isProductMarked = (code: string) =>
    markedList.some((m) => m.code === code);

  // 🔹 지정이송 모달 상태
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{
    code: string;
    name: string;
    route: string;
  } | null>(null);

  // 🔹 상품 이미지 모달 상태
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalCode, setImageModalCode] = useState<string | null>(null);

  const handleClickComplete = () => {
    if (onComplete) {
      onComplete(items); // 🔹 선택된 주문의 아이템 목록을 넘겨줌
    }
  };

  const currentImageInfo =
    imageModalCode && PRODUCT_IMAGE_MAP[imageModalCode]
      ? PRODUCT_IMAGE_MAP[imageModalCode]
      : null;

  const currentImageItem =
    imageModalCode &&
    (items.find(
      (it) =>
        ((it as any).code ?? (it as any).itemCode ?? "") === imageModalCode,
    ) as any | undefined);

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white p-4 text-sm">
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
          {/* 보충 마킹 개수 간단 표시 */}
          <div className="mt-1 text-[11px] text-gray-500">
            보충 마킹된 품목:{" "}
            <span className="ml-1 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
              {markedList.length}개
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
              <th className="border-b px-3 py-2 text-center">위치</th>
              {/* 🔹 맨 오른쪽에 마킹 컬럼 */}
              <th className="border-b px-3 py-2 text-center">재고부족</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const key = (it as any).code ?? (it as any).itemCode ?? "";
              const routeValue = amrRouteMap[key] ?? "피킹";
              const lowStock = (it as any).lowStock;
              const pickingStock = (it as any).pickingStock ?? 0;
              const qty = (it as any).qty ?? (it as any).orderQty ?? 0;

              const location: LocationStatus = locationMap[key] ?? "창고";
              const marked = isProductMarked(key);
              const hasImage = !!PRODUCT_IMAGE_MAP[key];

              return (
                <tr key={key} className="bg-white">
                  {/* 상품코드 */}
                  <td className="border-t px-3 py-2 font-mono text-[12px]">
                    {key}
                  </td>

                  {/* 상품명 + 이미지 버튼 */}
                  <td className="border-t px-3 py-2 text-[12px]">
                    <div className="flex items-center gap-2">
                      <span>{(it as any).name}</span>
                      {hasImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setImageModalCode(key);
                            setImageModalOpen(true);
                          }}
                          className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100"
                        >
                          이미지
                        </button>
                      )}
                    </div>
                  </td>

                  {/* 주문수량 */}
                  <td className="border-t px-3 py-2 text-right">{qty} EA</td>

                  {/* 피킹창고 재고 */}
                  <td className="border-t px-3 py-2 text-right">
                    {pickingStock} EA
                  </td>

                  {/* 상태 */}
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

                      <button
                        type="button"
                        className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] text-white"
                        onClick={() =>
                          setLocationMap((prev) => ({
                            ...prev,
                            [key]: "입고중",
                          }))
                        }
                      >
                        호출
                      </button>

                      <button
                        type="button"
                        className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 hover:bg-amber-100"
                        onClick={() => {
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

                  {/* 위치 */}
                  <td className="border-t px-3 py-2 text-center">
                    <span
                      className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-0.5 text-[11px] ${locationBadgeClass(
                        location,
                      )}`}
                    >
                      {location}
                    </span>
                  </td>

                  {/* 🔹 맨 오른쪽: 마킹 버튼 (☆ / ★ 토글) */}
                  <td className="border-t px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleMark(key, (it as any).name ?? "")
                      }
                      className={`mx-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] border transition
                        ${
                          marked
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      title={
                        marked
                          ? "마킹 해제"
                          : "나중에 재고 보충이 필요하면 눌러두세요"
                      }
                    >
                      <span className="text-[13px] leading-none">
                        {marked ? "★" : "☆"}
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 하단 안내 + 버튼 */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
        <div className="space-y-1" />
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

      {/* 🔹 상품 이미지 모달 */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[520px] max-w-[90vw] rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">
                상품 이미지 확인
              </div>
              <button
                className="text-xs text-gray-500 hover:text-gray-800"
                onClick={() => setImageModalOpen(false)}
              >
                닫기 ✕
              </button>
            </div>

            {currentImageInfo ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <img
                    src={currentImageInfo.main}
                    alt={currentImageItem?.name ?? imageModalCode ?? "상품 이미지"}
                    className="max-h-[360px] w-full rounded-lg border border-gray-200 bg-white object-contain"
                  />
                </div>
                <div className="text-center text-[12px] text-gray-700">
                  {currentImageItem?.name ?? "상품명 미등록"}{" "}
                  {imageModalCode && (
                    <span className="font-mono text-gray-500">
                      ({imageModalCode})
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-[12px] text-gray-500">
                등록된 이미지가 없습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
