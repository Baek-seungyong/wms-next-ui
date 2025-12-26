// components/OrderDetail.tsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import type {
  Order,
  OrderItem,
  OrderStatus,
  TransferInfo,
  ResidualTransferInfo,
  ResidualTransferPayload,
} from "./types";
import { statusBadgeClass } from "./types";
import { PalletDirectTransferModal } from "./PalletDirectTransferModal";
import {
  getReplenishMarks,
  toggleReplenishMark,
  type ReplenishMark,
} from "@/utils/replenishMarkStore";
import { OutboundResidualPrepModal } from "./OutboundResidualPrepModal";
import { ResidualTransferModal } from "./ResidualTransferModal";

type Props = {
  order: Order | null;
  items: OrderItem[];
  onChangeStatus?: (status: OrderStatus) => void;
  onComplete?: (newItems: OrderItem[]) => void;
  onSelectItemForPreview?: (item: OrderItem) => void;
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

/** ✅ 잔량 프로세스 단계 */
type ResidualStep = "NONE" | "PREP_CALLING" | "PACKING" | "DONE";

/** ✅ 잔량 프로세스 임시 저장(draft) - 2단계/3단계 이어가기용 */
type ResidualDraft = {
  calledPallets: Record<string, boolean>;
  calledTotes: Record<string, boolean>;
  emptyPalletId: string;

  palletPickMap: Record<string, number>;
  totePickMap: Record<string, number>;
  packedLines: any[]; // PackedLine 타입이 types에 있으면 그걸로 바꿔도 됨

  destSlot: string | null;
};

export function OrderDetail({
  order,
  items,
  onChangeStatus,
  onComplete,
  onSelectItemForPreview,
}: Props): ReactElement | null {
  /* ================= 재고/경고 ================= */
  const hasLowStock = useMemo(
    () => items.some((i) => (i as any).lowStock),
    [items],
  );

  /* ================= AMR/위치 상태 ================= */
  const [amrRouteMap, setAmrRouteMap] = useState<Record<string, string>>({});
  const [locationMap, setLocationMap] = useState<Record<string, LocationStatus>>(
    {
      "P-001": "창고",
      "P-013": "입고중",
      "C-201": "작업중",
      "L-009": "출고중",
    },
  );

  /* ================= 지정이송/잔량이송 상태 ================= */
  const [transferInfoMap, setTransferInfoMap] = useState<
    Record<string, TransferInfo | undefined>
  >({});

  const [residualInfoMap, setResidualInfoMap] = useState<
    Record<string, ResidualTransferInfo | undefined>
  >({});

  /** ✅ 잔량 단계/임시저장(닫고 나가도 이어가기) */
  const [residualStepMap, setResidualStepMap] = useState<
    Record<string, ResidualStep | undefined>
  >({});
  const [residualDraftMap, setResidualDraftMap] = useState<
    Record<string, ResidualDraft | undefined>
  >({});

  const [residualStatusOpen, setResidualStatusOpen] = useState(false);
  const [residualStatusTargetCode, setResidualStatusTargetCode] =
    useState<string | null>(null);

  /* ================= 재고 보충 마킹 ================= */
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

  /* ================= 모달 상태 ================= */
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{
    code: string;
    name: string;
    orderEaQty: number;
  } | null>(null);

  const [residualOpen, setResidualOpen] = useState(false);
  const [residualTarget, setResidualTarget] = useState<{
    code: string;
    name: string;
    remainingEaQty: number;
    existingDestinationSlots?: string[];
  } | null>(null);

  /* ================= 무한루프 방지: 첫 아이템 프리뷰 ================= */
  const lastPreviewKeyRef = useRef<string>("");

  useEffect(() => {
    if (!onSelectItemForPreview) return;
    if (!order) return;
    if (items.length === 0) return;

    const first = items[0];
    const previewKey = `${order.id}::${(first as any).code ?? ""}`;

    if (lastPreviewKeyRef.current === previewKey) return;
    lastPreviewKeyRef.current = previewKey;

    onSelectItemForPreview(first);
  }, [order?.id, items, onSelectItemForPreview, order]);

  if (!order) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border bg-white text-sm text-gray-500">
        주문을 선택하면 상세 정보가 표시됩니다.
      </div>
    );
  }

  const handleClickComplete = () => {
    onComplete?.(items);
  };

  const handleHoldOrder = () => {
    onChangeStatus?.("보류" as OrderStatus);
  };

  /** ✅ 잔량 프로세스 모달 열기(현재 저장된 step/draft 기반) */
  const openResidualFlow = (code: string, name: string, remainEa: number) => {
    const transferInfo = transferInfoMap[code];
    const existingSlots = transferInfo?.destinationSlots ?? [];

    setResidualTarget({
      code,
      name,
      remainingEaQty: remainEa,
      existingDestinationSlots: existingSlots,
    });

    setResidualOpen(true);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white p-4 text-sm">
      {/* 헤더 */}
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
              {(order as any).shipLocation ?? "2층 피킹라인"}
            </span>
          </div>
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

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleHoldOrder}
              className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
            >
              주문 보류
            </button>
          </div>
        </div>
      </div>

      {/* 아이템 테이블 */}
      <div className="flex-1 overflow-auto rounded-2xl border bg-gray-50">
        <table className="min-w-full border-collapse text-[12px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b px-3 py-2 text-left">상품명</th>
              <th className="border-b px-3 py-2 text-right">주문수량</th>
              <th className="border-b px-3 py-2 text-right">피킹창고 재고</th>
              <th className="border-b px-3 py-2 text-center">상태</th>
              <th className="border-b px-3 py-2 text-center">AMR 호출</th>
              <th className="border-b px-3 py-2 text-center">지정이송</th>
              <th className="border-b px-3 py-2 text-center">위치</th>
              <th className="border-b px-3 py-2 text-center">재고부족</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => {
              const key = (it as any).code ?? (it as any).itemCode ?? "";
              const name = (it as any).name ?? "";
              const qty = (it as any).qty ?? (it as any).orderQty ?? 0;
              const pickingStock =
                (it as any).pickingStock ?? (it as any).stockQty ?? 0;
              const lowStock = (it as any).lowStock;

              const routeValue = amrRouteMap[key] ?? "피킹";
              const location: LocationStatus = locationMap[key] ?? "창고";
              const marked = isProductMarked(key);

              const transferInfo = transferInfoMap[key];
              const isTransferring = transferInfo?.status === "이송중";

              // ✅ 잔량 계산(지정이송 잔량 - 잔량출고 누적)
              const baseRemain = transferInfo?.remainingEaQty ?? 0;
              const residualDone = transferInfo?.residualOutboundEaQty ?? 0;
              const remainEa = Math.max(0, baseRemain - residualDone);

              // ✅ 잔량 프로세스 단계
              const residualStep: ResidualStep = residualStepMap[key] ?? "NONE";

              // ✅ 잔량 프로세스가 한번이라도 시작됐으면(닫고 나가도) 버튼 유지
              const hasResidualFlow =
                residualStep !== "NONE" || remainEa > 0 || !!residualInfoMap[key];

              const handleRowClick = () => {
                onSelectItemForPreview?.(it);
              };

              /** ✅ 지정이송 버튼 라벨/동작(단일 흐름) */
              const getTransferButtonLabel = () => {
                if (!isTransferring) return "지정이송";

                // 지정이송 완료 + 잔량 흐름 존재
                if (hasResidualFlow) {
                  if (residualStep === "PREP_CALLING") return "잔량 준비";
                  if (residualStep === "PACKING") return "잔량 적재";
                  if (residualStep === "DONE") return "결과/내역";
                  // 아직 단계 안 잡혔는데 잔량 남음
                  return "잔량 준비";
                }

                // 잔량 없음 -> 이송 현황
                return "이송중";
              };

              const handleTransferButtonClick = () => {
                // 1) 지정이송 전 => 지정이송 모달
                if (!isTransferring) {
                  setTransferTarget({
                    code: key,
                    name,
                    orderEaQty: Number(qty),
                  });
                  setTransferOpen(true);
                  return;
                }

                // 2) 지정이송 후
                if (hasResidualFlow) {
                  // DONE이면 결과/내역(기존 ResidualTransferModal 사용)
                  if (residualStep === "DONE") {
                    setResidualStatusTargetCode(key);
                    setResidualStatusOpen(true);
                    return;
                  }

                  // PREP_CALLING or PACKING or NONE(잔량 남음)
                  openResidualFlow(key, name, remainEa);
                  // 단계 초기화(잔량 남아있는데 NONE이면 2단계로 시작)
                  if (residualStep === "NONE") {
                    setResidualStepMap((prev) => ({ ...prev, [key]: "PREP_CALLING" }));
                  }
                  return;
                }

                // 잔량 없음이면 지정이송 현황 모달
                setTransferTarget({
                  code: key,
                  name,
                  orderEaQty: Number(qty),
                });
                setTransferOpen(true);
              };

              return (
                <tr
                  key={key}
                  className="cursor-pointer bg-white hover:bg-blue-50"
                  onClick={handleRowClick}
                >
                  <td className="border-t px-3 py-2 text-[12px]">{name}</td>

                  <td className="border-t px-3 py-2 text-right">
                    {Number(qty).toLocaleString()} EA
                  </td>

                  <td className="border-t px-3 py-2 text-right">
                    {Number(pickingStock).toLocaleString()} EA
                  </td>

                  <td className="border-t px-3 py-2 text-center">
                    {lowStock ? (
                      <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] text-red-600">
                        부족
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600">
                        여유
                      </span>
                    )}
                  </td>

                  {/* AMR 호출 */}
                  <td className="border-t px-3 py-2 text-center">
                    <div
                      className="inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                        <option value="파렛트">파렛트</option>
                      </select>

                      <button
                        type="button"
                        className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] text-white"
                        onClick={() => {
                          const productName = name || "해당 상품";

                          if (routeValue === "피킹") {
                            alert(`제품 "${productName}" 토트박스가 피킹라인으로 호출되었습니다.`);
                          } else {
                            alert(`제품 "${productName}" 파렛트가 피킹라인으로 호출되었습니다.`);
                          }

                          setLocationMap((prev) => ({
                            ...prev,
                            [key]: "입고중",
                          }));

                          const cur = (order as any).status;
                          if (onChangeStatus && (cur === "대기" || cur === "보류")) {
                            onChangeStatus("출고중" as any);
                          }
                        }}
                      >
                        호출
                      </button>
                    </div>
                  </td>

                  {/* ✅ 지정이송/잔량 단일 흐름 버튼 */}
                  <td
                    className="border-t px-3 py-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        className={`rounded-full px-2 py-0.5 text-[11px] border ${
                          !isTransferring
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : hasResidualFlow
                              ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                        onClick={handleTransferButtonClick}
                      >
                        {getTransferButtonLabel()}
                      </button>

                      {/* ✅ 잔량 표시(지정이송 이송중일 때 항상 표시) */}
                      {isTransferring && (
                        <div className="text-[11px] text-gray-500">
                          잔량{" "}
                          <span className="font-semibold text-gray-700">
                            {remainEa.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* ✅ 잔량 단계 표시(디버그/가이드용 - 원하면 빼도 됨) */}
                      {isTransferring && hasResidualFlow && (
                        <div className="text-[10px] text-gray-400">
                          {residualStep === "PREP_CALLING"
                            ? "2단계: 호출"
                            : residualStep === "PACKING"
                              ? "3단계: 적재"
                              : residualStep === "DONE"
                                ? "4단계: 결과"
                                : "대기"}
                        </div>
                      )}
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

                  {/* 재고부족(마킹) */}
                  <td
                    className="border-t px-3 py-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleMark(key, name)}
                      className={`mx-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] border transition ${
                        marked
                          ? "border-amber-400 bg-amber-50 text-amber-700"
                          : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                      title={marked ? "마킹 해제" : "나중에 재고 보충이 필요하면 눌러두세요"}
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

      {/* 하단 버튼 */}
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

      {/* ================= 모달 ================= */}

      {/* 지정이송 모달 */}
      <PalletDirectTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        productCode={transferTarget?.code}
        productName={transferTarget?.name}
        orderEaQty={transferTarget?.orderEaQty}
        existingTransfer={
          transferTarget?.code ? transferInfoMap[transferTarget.code] ?? null : null
        }
        onConfirmTransfer={(info) => {
          if (!transferTarget?.code) return;

          // ✅ orderEaQty / remainingEaQty 보정(혹시 누락 대비)
          const merged: TransferInfo = {
            ...info,
            orderEaQty: transferTarget.orderEaQty,
            remainingEaQty:
              (transferTarget.orderEaQty ?? 0) - (info.transferEaQty ?? 0),
          };

          setTransferInfoMap((prev) => ({
            ...prev,
            [transferTarget.code]: merged,
          }));

          setLocationMap((prev) => ({
            ...prev,
            [transferTarget.code]: "출고중",
          }));

          // ✅ 지정이송 후 잔량이 남으면 바로 2단계로 진입(원하면 제거 가능)
          const remainEa = Math.max(
            0,
            (transferTarget.orderEaQty ?? 0) - (info.transferEaQty ?? 0),
          );

          if (remainEa > 0) {
            setResidualStepMap((prev) => ({ ...prev, [transferTarget.code]: "PREP_CALLING" }));
            setResidualDraftMap((prev) => ({
              ...prev,
              [transferTarget.code]: prev[transferTarget.code] ?? {
                calledPallets: {},
                calledTotes: {},
                emptyPalletId: "",
                palletPickMap: {},
                totePickMap: {},
                packedLines: [],
                destSlot: null,
              },
            }));

            setResidualTarget({
              code: transferTarget.code,
              name: transferTarget.name,
              remainingEaQty: remainEa,
              existingDestinationSlots: info.destinationSlots ?? [],
            });
            setResidualOpen(true);
          }
        }}
      />

      {/* ✅ 잔량 2단계/3단계 모달 */}
      <OutboundResidualPrepModal
        open={residualOpen}
        onClose={() => setResidualOpen(false)}
        productCode={residualTarget?.code ?? ""}
        productName={residualTarget?.name}
        remainingEaQty={residualTarget?.remainingEaQty ?? 0}
        existingDestinationSlots={residualTarget?.existingDestinationSlots}
        /** ✅ 이어가기: 저장된 단계/드래프트 전달 */
        initialStep={
          residualTarget?.code
            ? residualStepMap[residualTarget.code] === "PACKING"
              ? 3
              : 2
            : 2
        }
        initialDraft={
          residualTarget?.code ? residualDraftMap[residualTarget.code] : undefined
        }
        /** ✅ 닫기/이동 시점마다 진행상태 저장 */
        onSaveProgress={(step, draft) => {
          const code = residualTarget?.code;
          if (!code) return;

          const nextStep =
            step === 2 ? "PREP_CALLING" : step === 3 ? "PACKING" : "DONE";

          setResidualStepMap((prev) => {
            if (prev[code] === nextStep) return prev; // ✅ 변화 없으면 업데이트 금지
            return { ...prev, [code]: nextStep };
          });

          setResidualDraftMap((prev) => {
            // ✅ draft가 같은 레퍼런스로 계속 들어오면 루프 유발 가능 -> 동일이면 막기
            if (prev[code] === draft) return prev;
            return { ...prev, [code]: draft };
          });
        }}
        /** ✅ 3단계에서 이송 확정 */
        onTransfer={(payload: ResidualTransferPayload) => {
          const code = payload.productCode;
          if (!code) return;

          // 1) ✅ 지정이송쪽 누적 잔량출고 EA 반영(잔량 계산용)
          setTransferInfoMap((prev) => {
            const cur = prev[code];
            if (!cur) return prev;

            const prevResidual = cur.residualOutboundEaQty ?? 0;
            const nextResidual = prevResidual + (payload.totalEa ?? 0);

            return {
              ...prev,
              [code]: {
                ...cur,
                residualOutboundEaQty: nextResidual,
              },
            };
          });

          // 2) ✅ 잔량 이송 현황 저장
          setResidualInfoMap((prev) => ({
            ...prev,
            [code]: {
              status: "이송중",
              productCode: code,
              productName: payload.productName,
              transferredEaQty: payload.totalEa,
              emptyPalletId: payload.emptyPalletId,
              destinationSlot: payload.destSlot,
              sources: payload.packedLines ?? [],
              createdAt: new Date().toISOString(),
            },
          }));

          // 3) ✅ 단계 DONE 처리(이후 버튼은 결과/내역으로)
          setResidualStepMap((prev) => ({ ...prev, [code]: "DONE" }));

          // draft는 남겨둬도 되고(감사용), 여기서 비워도 됨
          setResidualDraftMap((prev) => ({ ...prev, [code]: prev[code] }));
        }}
      />

      {/* ✅ 잔량 결과/내역 모달(기존 그대로 사용) */}
      <ResidualTransferModal
        open={residualStatusOpen}
        onClose={() => setResidualStatusOpen(false)}
        info={
          residualStatusTargetCode
            ? residualInfoMap[residualStatusTargetCode] ?? null
            : null
        }
      />
    </div>
  );
}
