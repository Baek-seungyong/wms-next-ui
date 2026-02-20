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

import {
  getReplenishMarks,
  toggleReplenishMark,
  type ReplenishMark,
} from "@/utils/replenishMarkStore";

import { TransferFlowModal } from "./TransferFlowModal";
import type { ResidualDraft, TransferFlowStep } from "./TransferFlowModal/types";
import { ResidualTransferModal } from "./ResidualTransferModal";
import { ProductManageModal } from "./ProductManageModal";

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
type ResidualStep = "NONE" | "PREP_CALLING" | "READY_MOVE" | "DONE";

type ManageTarget = {
  code: string;
  name: string;
  orderEaQty: number;
  pickingStock: number;
  // "현재 토트 재고"로 쓸 값 (아이템에 있으면 사용, 없으면 0)
  toteStock: number;
  // 1BOX 내품수량(아이템에 있으면 사용, 없으면 0)
  boxEa: number;
  // 현재 위치 뱃지용
  location: LocationStatus;
};

export function OrderDetail({
  order,
  items,
  onChangeStatus,
  onComplete,
  onSelectItemForPreview,
}: Props): ReactElement | null {
  /* ================= 재고/경고 ================= */
  const hasLowStock = useMemo(() => items.some((i) => (i as any).lowStock), [items]);

  /* ================= AMR/위치 상태 ================= */
  const [amrRouteMap, setAmrRouteMap] = useState<Record<string, string>>({});
  const [locationMap, setLocationMap] = useState<Record<string, LocationStatus>>({
    "P-001": "창고",
    "P-013": "입고중",
    "C-201": "작업중",
    "L-009": "출고중",
  });

  /* ================= 지정이송/잔량이송 상태 ================= */
  const [transferInfoMap, setTransferInfoMap] = useState<Record<string, TransferInfo | undefined>>(
    {},
  );

  const [residualInfoMap, setResidualInfoMap] = useState<
    Record<string, ResidualTransferInfo | undefined>
  >({});

  /** ✅ 잔량 단계/임시저장(닫고 나가도 이어가기) */
  const [residualStepMap, setResidualStepMap] = useState<Record<string, ResidualStep | undefined>>(
    {},
  );
  const [residualDraftMap, setResidualDraftMap] = useState<Record<string, ResidualDraft | undefined>>(
    {},
  );

  /* ================= 잔량 결과 모달(기존 ResidualTransferModal) ================= */
  const [residualStatusOpen, setResidualStatusOpen] = useState(false);
  const [residualStatusTargetCode, setResidualStatusTargetCode] = useState<string | null>(null);

  /* ================= 재고 보충 마킹 ================= */
  const [markedList, setMarkedList] = useState<ReplenishMark[]>([]);
  useEffect(() => {
    setMarkedList(getReplenishMarks());
  }, []);

  const handleToggleMark = (code: string, name: string) => {
    const next = toggleReplenishMark(code, name);
    setMarkedList(next);
  };
  const isProductMarked = (code: string) => markedList.some((m) => m.code === code);

  /* ================= 토트 재고(수정 반영용) =================
   * - items는 props라 직접 바꾸기 어려우니까, 화면에서만 덮어씌우는 map으로 관리
   */
  const [toteStockMap, setToteStockMap] = useState<Record<string, number>>({});

  const getToteStock = (it: OrderItem) => {
    const code = (it as any).code ?? (it as any).itemCode ?? "";
    const base =
      (it as any).toteStock ??
      (it as any).toteEaQty ??
      (it as any).toteQty ??
      (it as any).currentToteStock ??
      0;
    return toteStockMap[code] ?? Number(base ?? 0);
  };

  /* ================= (신) 통합 모달 상태 ================= */
  const [flowOpen, setFlowOpen] = useState(false);
  const [flowTarget, setFlowTarget] = useState<{
    code: string;
    name: string;
    orderEaQty: number;
  } | null>(null);

  /** ✅ 버튼 하나로 열기 */
  const openTransferFlow = (code: string, name: string, orderEaQty: number) => {
    setFlowTarget({ code, name, orderEaQty });
    setFlowOpen(true);
  };

  /** ================= 단위 정보(계산용) =================
   * - TransferFlowModal 상단의 '파렛트/박스/낱개' 자동 계산용
   * - 데이터가 없으면 0으로 들어가서 계산이 일부/전체 비활성화됨
   */
  const getEaPerBoxByCode = (code: string) => {
    const it = items.find((x) => ((x as any).code ?? (x as any).itemCode ?? "") === code);
    if (!it) return 0;
    return Number(
      (it as any).boxEa ??
        (it as any).eaPerBox ??
        (it as any).boxInnerEa ??
        (it as any).unitsPerBox ??
        0,
    );
  };

  const getEaPerPalletByCode = (code: string) => {
    const it = items.find((x) => ((x as any).code ?? (x as any).itemCode ?? "") === code);
    if (!it) return 0;
    return Number(
      (it as any).palletEa ??
        (it as any).eaPerPallet ??
        (it as any).unitsPerPallet ??
        (it as any).eaPerPalletQty ??
        0,
    );
  };

  const openManageModalFromCode = (code: string) => {
    const it = items.find((x) => ((x as any).code ?? (x as any).itemCode ?? "") === code);
    if (!it) {
      alert(`해당 코드(${code})의 아이템을 items에서 못 찾았어. (저장/데이터 확인 필요)`);
      return;
    }
    openManageModalFromItem(it);
  };

  /* ================= 제품관리(관리 버튼) 모달 ================= */
  const [manageOpen, setManageOpen] = useState(false);
  const [manageTarget, setManageTarget] = useState<ManageTarget | null>(null);

  // 재고수정 입력값
  const [editToteEa, setEditToteEa] = useState<string>("");

  const openManageModalFromItem = (it: OrderItem) => {
    const code = (it as any).code ?? (it as any).itemCode ?? "";
    const name = (it as any).name ?? "";
    const orderEaQty = Number((it as any).qty ?? (it as any).orderQty ?? 0);
    const pickingStock = Number((it as any).pickingStock ?? (it as any).stockQty ?? 0);
    const location: LocationStatus = locationMap[code] ?? "창고";

    const toteStock = getToteStock(it);

    const boxEa = Number(
      (it as any).boxEa ??
        (it as any).eaPerBox ??
        (it as any).boxInnerEa ??
        (it as any).unitsPerBox ??
        0,
    );

    setManageTarget({
      code,
      name,
      orderEaQty,
      pickingStock,
      toteStock,
      boxEa,
      location,
    });

    // 모달 열릴 때 입력값 기본 세팅 (현재 토트 재고)
    setEditToteEa(String(toteStock));
    setManageOpen(true);
  };

  const closeManageModal = () => {
    setManageOpen(false);
    setManageTarget(null);
    setEditToteEa("");
  };

  const handleApplyToteStock = () => {
    if (!manageTarget) return;

    const next = Number(editToteEa);
    if (!Number.isFinite(next) || next < 0) {
      alert("재고는 0 이상의 숫자로 입력해줘.");
      return;
    }

    setToteStockMap((prev) => ({ ...prev, [manageTarget.code]: next }));
    alert(`"${manageTarget.name}" 토트 재고를 ${next.toLocaleString()} EA로 수정했어.`);
    // 모달 상단 표시도 즉시 갱신되도록
    setManageTarget((prev) => (prev ? { ...prev, toteStock: next } : prev));
  };

  const handleReplenish1Box = () => {
    if (!manageTarget) return;

    const boxEa = Number(manageTarget.boxEa ?? 0);
    if (!boxEa || boxEa <= 0) {
      alert("이 상품은 1BOX 내품수량(BOX EA)이 설정되어 있지 않아. 데이터에 boxEa를 넣어줘.");
      return;
    }

    const cur = toteStockMap[manageTarget.code] ?? manageTarget.toteStock ?? 0;
    const next = cur + boxEa;

    // UI상 토트 재고 +1BOX 반영
    setToteStockMap((prev) => ({ ...prev, [manageTarget.code]: next }));
    setManageTarget((prev) => (prev ? { ...prev, toteStock: next } : prev));

    // “입고중”으로 바꿔서 작업 흐름 느낌 주기
    setLocationMap((prev) => ({ ...prev, [manageTarget.code]: "입고중" }));

    alert(
      `파렛트에서 1BOX 보충 호출!\n- 상품: ${manageTarget.name}\n- +${boxEa.toLocaleString()} EA\n- 토트 재고: ${next.toLocaleString()} EA`,
    );
  };

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

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white p-4 text-sm">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">주문 상세 및 출고 지시</div>
          <div className="mt-0.5 text-[13px] font-semibold">주문번호: {order.id}</div>
          <div className="mt-0.5 text-[11px] text-gray-500">
            납기일:{" "}
            <span className="font-medium text-gray-700">{(order as any).dueDate}</span>
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

          {hasLowStock && <div className="mt-1 text-[11px] text-red-500">⚠ 피킹창고 재고 부족 상품 있음</div>}

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
              <th className="border-b px-3 py-2 text-center">제품호출</th>
              <th className="border-b px-3 py-2 text-center">지정이송</th>
              <th className="border-b px-3 py-2 text-center">토트박스 위치</th>
              <th className="border-b px-3 py-2 text-center">재고관리</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => {
              const code = (it as any).code ?? (it as any).itemCode ?? "";
              const name = (it as any).name ?? "";
              const qty = Number((it as any).qty ?? (it as any).orderQty ?? 0);
              const pickingStock = Number((it as any).pickingStock ?? (it as any).stockQty ?? 0);
              const lowStock = (it as any).lowStock;

              const routeValue = amrRouteMap[code] ?? "피킹";
              const location: LocationStatus = locationMap[code] ?? "창고";
              const marked = isProductMarked(code);

              const transferInfo = transferInfoMap[code];
              const isTransferring = transferInfo?.status === "이송중";

              // ✅ 잔량 계산(지정이송 잔량 - 잔량출고 누적)
              const baseRemain = transferInfo?.remainingEaQty ?? 0;
              const residualDone = transferInfo?.residualOutboundEaQty ?? 0;
              const remainEa = Math.max(0, baseRemain - residualDone);

              // ✅ 잔량 프로세스 단계
              const residualStep: ResidualStep = residualStepMap[code] ?? "NONE";

              // ✅ 잔량 프로세스가 한번이라도 시작됐으면 버튼 유지
              const hasResidualFlow =
                residualStep !== "NONE" || remainEa > 0 || !!residualInfoMap[code];

              const handleRowClick = () => {
                onSelectItemForPreview?.(it);
              };

              /** ✅ 버튼 라벨 */
              const getTransferButtonLabel = () => {
                if (!isTransferring) return "지정이송";

                if (hasResidualFlow) {
                  if (residualStep === "PREP_CALLING") return "잔량 준비";
                  if (residualStep === "READY_MOVE") return "잔량 이송";
                  if (residualStep === "DONE") return "이송조회";
                  return "잔량 준비";
                }

                return "이송중";
              };

              const handleTransferButtonClick = () => {
                // ✅ DONE이면 결과 모달(ResidualTransferModal)로
                if (isTransferring && hasResidualFlow && residualStep === "DONE") {
                  setResidualStatusTargetCode(code);
                  setResidualStatusOpen(true);
                  return;
                }

                // ✅ 그 외는 통합 모달 열기(2/3스텝 이어서 가능)
                openTransferFlow(code, name, Number(qty));

                // ✅ 잔량 남아있는데 단계 NONE이면 2단계 시작
                if (isTransferring && remainEa > 0 && residualStep === "NONE") {
                  setResidualStepMap((prev) => ({ ...prev, [code]: "PREP_CALLING" }));
                }
              };

              return (
                <tr
                  key={code}
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
                    <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="rounded border px-2 py-0.5 text-[11px]"
                        value={routeValue}
                        onChange={(e) => setAmrRouteMap((prev) => ({ ...prev, [code]: e.target.value }))}
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

                          setLocationMap((prev) => ({ ...prev, [code]: "입고중" }));

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
                  <td className="border-t px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
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

                      {/* ✅ 잔량 표시 */}
                      {isTransferring && (
                        <div className="text-[11px] text-gray-500">
                          잔량{" "}
                          <span className="font-semibold text-gray-700">{remainEa.toLocaleString()}</span>
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

                  {/* 재고관리(모달) */}
                  <td className="border-t px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openManageModalFromItem(it)}
                      className={`mx-auto inline-flex items-center justify-center rounded-md px-3 py-1 text-[12px] border transition font-medium ${
                        marked
                          ? "border-blue-600 bg-blue-600 text-white hover:opacity-90"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      title="제품 관리창 열기"
                    >
                      관리
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

      {/* ================= 제품관리 모달 ================= */}
      <ProductManageModal
        open={manageOpen}
        target={manageTarget}
        displayToteEa={manageTarget ? (toteStockMap[manageTarget.code] ?? manageTarget.toteStock) : 0}
        displayLocation={
          manageTarget ? (locationMap[manageTarget.code] ?? manageTarget.location) : "창고"
        }
        isMarked={manageTarget ? isProductMarked(manageTarget.code) : false}
        editToteEa={editToteEa}
        onChangeEditToteEa={setEditToteEa}
        onClose={closeManageModal}
        onToggleMark={() => {
          if (!manageTarget) return;
          handleToggleMark(manageTarget.code, manageTarget.name);
        }}
        onApplyToteStock={handleApplyToteStock}
        onReplenish1Box={handleReplenish1Box}
        locationBadgeClass={locationBadgeClass}
      />

      {/* ================= (신) 통합 모달 ================= */}
      <TransferFlowModal
        open={flowOpen}
        onClose={() => setFlowOpen(false)}
        productCode={flowTarget?.code ?? ""}
        productName={flowTarget?.name ?? ""}
        orderEaQty={flowTarget?.orderEaQty ?? 0}
        existingTransfer={flowTarget?.code ? transferInfoMap[flowTarget.code] ?? null : null}
        existingDestinationSlots={
          flowTarget?.code ? transferInfoMap[flowTarget.code]?.destinationSlots ?? [] : []
        }
        eaPerBox={flowTarget?.code ? getEaPerBoxByCode(flowTarget.code) : 0}
        eaPerPallet={flowTarget?.code ? getEaPerPalletByCode(flowTarget.code) : 0}
        remainingEaQty={(() => {
          const code = flowTarget?.code;
          if (!code) return 0;
          const t = transferInfoMap[code];
          if (!t) return 0;
          const baseRemain = t.remainingEaQty ?? 0;
          const residualDone = t.residualOutboundEaQty ?? 0;
          return Math.max(0, baseRemain - residualDone);
        })()}
        /** ✅ 3스텝 기준(1~3) */
        initialStep={(() => {
          const code = flowTarget?.code;
          if (!code) return 1 as TransferFlowStep;

          const t = transferInfoMap[code];
          const isTransferring = t?.status === "이송중";
          if (!isTransferring) return 1 as TransferFlowStep;

          const remainEa = (() => {
            const baseRemain = t?.remainingEaQty ?? 0;
            const residualDone = t?.residualOutboundEaQty ?? 0;
            return Math.max(0, baseRemain - residualDone);
          })();

          if (remainEa <= 0) return 1 as TransferFlowStep;

          const step = residualStepMap[code] ?? "PREP_CALLING";
          if (step === "DONE") return 3 as TransferFlowStep;
          if (step === "READY_MOVE") return 3 as TransferFlowStep;
          return 2 as TransferFlowStep;
        })()}
        initialDraft={flowTarget?.code ? residualDraftMap[flowTarget.code] : undefined}
        /** ✅ 닫아도 이어가기 저장 */
        onSaveProgress={(step, draft) => {
          const code = flowTarget?.code;
          if (!code) return;

          const nextStep: ResidualStep =
            step === 2 ? "PREP_CALLING" :
            step === 3 ? "READY_MOVE" :
            "PREP_CALLING";

          setResidualStepMap((prev) => {
            if (prev[code] === nextStep) return prev;
            return { ...prev, [code]: nextStep };
          });

          setResidualDraftMap((prev) => {
            if (prev[code] === draft) return prev;
            return { ...prev, [code]: draft };
          });
        }}
        onOpenProductManage={(code) => openManageModalFromCode(code)}
        onConfirmDirectTransfer={(info: TransferInfo) => {
          const code = flowTarget?.code;
          if (!code) return;

          const merged: TransferInfo = {
            ...info,
            orderEaQty: flowTarget?.orderEaQty ?? 0,
            remainingEaQty: (flowTarget?.orderEaQty ?? 0) - (info.transferEaQty ?? 0),
          };

          setTransferInfoMap((prev) => ({ ...prev, [code]: merged }));
          setLocationMap((prev) => ({ ...prev, [code]: "출고중" }));

          // 지정이송 후 잔량 남으면 잔량 준비 단계로 + draft 기본값 확보
          const remainEa = Math.max(0, (flowTarget?.orderEaQty ?? 0) - (info.transferEaQty ?? 0));
          if (remainEa > 0) {
            setResidualStepMap((prev) => ({ ...prev, [code]: "PREP_CALLING" }));
            setResidualDraftMap((prev) => ({
              ...prev,
              [code]:
                prev[code] ??
                ({
                  view: "WORK",
                  calledResidualPalletIds: [],
                  residualPalletMeta: {},
                  residualBoxPickMap: {},
                  boxDestSlot: null,
                  calledToteIds: [],
                  toteMeta: {},
                  toteEaPickMap: {},
                  eaDestSlot: null,
                  consolidationPalletId: "",
                  packedLines: [],
                } as any as ResidualDraft),
            }));
          }
        }}
        onConfirmResidualTransfer={(payload: ResidualTransferPayload) => {
          const code = payload.productCode;
          if (!code) return;

          // 1) 지정이송쪽 누적 잔량출고 EA 반영(잔량 계산용)
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

          // 2) 잔량 이송 현황 저장 (ResidualTransferModal 조회용)
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

          // 3) DONE 처리(여기서만 DONE!)
          setResidualStepMap((prev) => ({ ...prev, [code]: "DONE" }));
        }}
      />

      {/* ✅ 잔량 결과/내역 모달 */}
      <ResidualTransferModal
        open={residualStatusOpen}
        onClose={() => setResidualStatusOpen(false)}
        info={residualStatusTargetCode ? residualInfoMap[residualStatusTargetCode] ?? null : null}
        directTransfer={residualStatusTargetCode ? transferInfoMap[residualStatusTargetCode] ?? null : null}
        draft={residualStatusTargetCode ? residualDraftMap[residualStatusTargetCode] ?? null : null}
      />
    </div>
  );
}
