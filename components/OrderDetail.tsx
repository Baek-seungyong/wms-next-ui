//components/OrderDetail.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import type { ReactElement } from "react";
import type {
  Order,
  OrderItem,
  OrderStatus,
  TransferInfo,
  ResidualTransferInfo,
  ResidualTransferPayload,
  LocationStatus,
  AmrCallStatus,
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
import type { CarBatchTransferPayload } from "./CarBatchTransferModal/types";
import { useRouter } from "next/navigation";

type Props = {
  order: Order | null;
  items: OrderItem[];
  onChangeStatus?: (status: OrderStatus) => void;
  onComplete?: (newItems: OrderItem[]) => void;
  onUpdateItems?: (orderId: string, nextItems: OrderItem[]) => void;
  onAddFieldMemo?: (orderId: string, text: string) => void;
};

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

const amrStatusBadgeClass = (status?: AmrCallStatus) => {
  switch (status) {
    case "이송대기":
      return "border-gray-200 bg-gray-100 text-gray-700";
    case "이송중":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "이송완료":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-100 text-gray-400";
  }
};

type ResidualStep = "NONE" | "PREP_CALLING" | "READY_MOVE" | "DONE";

type ManageTarget = {
  code: string;
  name: string;
  orderEaQty: number;
  pickingStock: number;
  toteStock: number;
  boxEa: number;
  location: LocationStatus;

  calledToteBoxId?: string | null;
  calledToteBoxStock?: number;

  calledPalletId?: string | null;
  calledPalletStock?: number;
  isPalletCalled?: boolean;
};

const buildToteBoxId = (orderId: string, code: string) =>
  `TB-${orderId.slice(-4)}-${code.replace(/[^A-Z0-9]/g, "").slice(-4)}`;

const buildPalletId = (orderId: string, code: string) =>
  `PL-${orderId.slice(-4)}-${code.replace(/[^A-Z0-9]/g, "").slice(-4)}`;

export function OrderDetail({
  order,
  items,
  onChangeStatus,
  onComplete,
  onUpdateItems,
  onAddFieldMemo,
}: Props): ReactElement | null {
  const router = useRouter();
  const hasLowStock = useMemo(() => items.some((i) => (i as any).lowStock), [items]);

  const [locationMap, setLocationMap] = useState<Record<string, LocationStatus>>({
    "P-001": "창고",
    "P-013": "입고중",
    "C-201": "작업중",
    "L-009": "출고중",
  });

  const [transferInfoMap, setTransferInfoMap] = useState<Record<string, TransferInfo | undefined>>(
    {},
  );

  useEffect(() => {
    if (!order) return;

    const next: Record<string, TransferInfo | undefined> = {};
    for (const it of items) {
      const code = (it as any).code ?? (it as any).itemCode ?? "";
      const dt = (it as any).directTransfer as TransferInfo | undefined;
      if (code && dt) next[code] = dt;
    }
    setTransferInfoMap(next);
  }, [order?.id, items]);

  const [residualInfoMap, setResidualInfoMap] = useState<
    Record<string, ResidualTransferInfo | undefined>
  >({});

  const [residualStepMap, setResidualStepMap] = useState<Record<string, ResidualStep | undefined>>(
    {},
  );
  const [residualDraftMap, setResidualDraftMap] = useState<Record<string, ResidualDraft | undefined>>(
    {},
  );

  const [residualStatusOpen, setResidualStatusOpen] = useState(false);
  const [residualStatusTargetCode, setResidualStatusTargetCode] = useState<string | null>(null);

  const [markedList, setMarkedList] = useState<ReplenishMark[]>([]);
  useEffect(() => {
    setMarkedList(getReplenishMarks());
  }, []);

  const handleToggleMark = (code: string, name: string) => {
    const next = toggleReplenishMark(code, name);
    setMarkedList(next);
  };
  const isProductMarked = (code: string) => markedList.some((m) => m.code === code);

  const [toteStockMap, setToteStockMap] = useState<Record<string, number>>({});

  const getToteStock = (it: OrderItem) => {
    const code = (it as any).code ?? (it as any).itemCode ?? "";
    const base =
      (it as any).calledToteBoxStock ??
      (it as any).toteStock ??
      (it as any).toteEaQty ??
      (it as any).toteQty ??
      (it as any).currentToteStock ??
      0;
    return toteStockMap[code] ?? Number(base ?? 0);
  };

  const getLocation = (it: OrderItem) => {
    const code = (it as any).code ?? (it as any).itemCode ?? "";
    return ((it as any).locationStatus as LocationStatus | undefined) ?? locationMap[code] ?? "창고";
  };

  const [flowOpen, setFlowOpen] = useState(false);
  const [flowTarget, setFlowTarget] = useState<{
    code: string;
    name: string;
    orderEaQty: number;
  } | null>(null);

  const openTransferFlow = (code: string, name: string, orderEaQty: number) => {
    setFlowTarget({ code, name, orderEaQty });
    setFlowOpen(true);
  };

  const applyCarBatchTransferToItems = (payload: CarBatchTransferPayload) => {
    if (!order?.id || !onUpdateItems) return;

    const nextItems = items.map((it) => ({
      ...(it as any),
      carBatchTransfer: payload,
    })) as any;

    onUpdateItems(order.id, nextItems);
  };

  const [imgPreviewOpen, setImgPreviewOpen] = useState(false);
  const [imgPreviewItem, setImgPreviewItem] = useState<OrderItem | null>(null);

  const getItemImageUrl = (it: OrderItem) => {
    return String(
      (it as any).imageUrl ??
        (it as any).imageURL ??
        (it as any).image ??
        (it as any).img ??
        (it as any).thumbnailUrl ??
        "",
    );
  };

  const toggleImagePreview = (it: OrderItem) => {
    const code = (it as any).code ?? (it as any).itemCode ?? "";
    const curCode = imgPreviewItem
      ? ((imgPreviewItem as any).code ?? (imgPreviewItem as any).itemCode ?? "")
      : "";

    if (imgPreviewOpen && curCode === code) {
      setImgPreviewOpen(false);
      setImgPreviewItem(null);
      return;
    }

    setImgPreviewItem(it);
    setImgPreviewOpen(true);
  };

  const [processingInfoOpen, setProcessingInfoOpen] = useState(false);
  const [commOpen, setCommOpen] = useState(false);
  const [fieldMemoText, setFieldMemoText] = useState("");

  const communication = (order as any)?.communication ?? {};
  const customerMemo = String(communication.customerMemo ?? "").trim();
  const managerMemo = String(communication.managerMemo ?? "").trim();
  const fieldMemos = Array.isArray(communication.fieldMemos) ? communication.fieldMemos : [];

  const communicationCount = (customerMemo ? 1 : 0) + (managerMemo ? 1 : 0) + fieldMemos.length;

  const handleAddFieldMemoClick = () => {
    if (!order?.id) return;
    const trimmed = fieldMemoText.trim();
    if (!trimmed) return;

    onAddFieldMemo?.(order.id, trimmed);
    setFieldMemoText("");
    setCommOpen(true);
  };

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

  const [manageOpen, setManageOpen] = useState(false);
  const [manageTarget, setManageTarget] = useState<ManageTarget | null>(null);
  const [editToteEa, setEditToteEa] = useState<string>("");

  const openManageModalFromItem = (it: OrderItem) => {
    const code = (it as any).code ?? (it as any).itemCode ?? "";
    const name = (it as any).name ?? "";
    const orderEaQty = Number((it as any).qty ?? (it as any).orderQty ?? 0);
    const pickingStock = Number((it as any).pickingStock ?? (it as any).stockQty ?? 0);
    const location = getLocation(it);

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
      calledToteBoxId: (it as any).calledToteBoxId ?? null,
      calledToteBoxStock: Number((it as any).calledToteBoxStock ?? toteStock ?? 0),
      calledPalletId: (it as any).calledPalletId ?? null,
      calledPalletStock: Number((it as any).calledPalletStock ?? 0),
      isPalletCalled: !!(it as any).isPalletCalled,
    });

    setEditToteEa(String(toteStock));
    setManageOpen(true);
  };

  const closeManageModal = () => {
    setManageOpen(false);
    setManageTarget(null);
    setEditToteEa("");
  };

  const updateItemInOrder = (code: string, updater: (item: OrderItem) => OrderItem) => {
    if (!order?.id || !onUpdateItems) return;
    const nextItems = items.map((it) => {
      const itCode = (it as any).code ?? (it as any).itemCode ?? "";
      if (itCode !== code) return it;
      return updater(it);
    });
    onUpdateItems(order.id, nextItems);
  };

  const handleApplyToteStock = () => {
    if (!manageTarget || !order?.id) return;

    if (!manageTarget.calledToteBoxId) {
      alert("먼저 토트박스를 호출한 뒤 수정해줘.");
      return;
    }

    const next = Number(editToteEa);
    if (!Number.isFinite(next) || next < 0) {
      alert("재고는 0 이상의 숫자로 입력해줘.");
      return;
    }

    setToteStockMap((prev) => ({ ...prev, [manageTarget.code]: next }));
    setManageTarget((prev) =>
      prev
        ? {
            ...prev,
            toteStock: next,
            calledToteBoxStock: next,
          }
        : prev,
    );

    updateItemInOrder(manageTarget.code, (item) => ({
      ...(item as any),
      toteStock: next,
      calledToteBoxStock: next,
    }));

    alert(
      `"${manageTarget.name}" 토트박스(${manageTarget.calledToteBoxId}) 재고를 ${next.toLocaleString()} EA로 수정했어.`,
    );
  };

  const handleCallReplenishPallet = () => {
    if (!manageTarget || !order?.id) return;

    const palletId =
      manageTarget.calledPalletId || buildPalletId(order.id, manageTarget.code);

    const palletStock =
      manageTarget.calledPalletStock && manageTarget.calledPalletStock > 0
        ? manageTarget.calledPalletStock
        : Number(getEaPerPalletByCode(manageTarget.code) || 0);

    setManageTarget((prev) =>
      prev
        ? {
            ...prev,
            calledPalletId: palletId,
            calledPalletStock: palletStock,
            isPalletCalled: true,
            location: "입고중",
          }
        : prev,
    );

    setLocationMap((prev) => ({ ...prev, [manageTarget.code]: "입고중" }));

    updateItemInOrder(manageTarget.code, (item) => ({
      ...(item as any),
      calledPalletId: palletId,
      calledPalletStock: palletStock,
      isPalletCalled: true,
      locationStatus: "입고중",
    }));

    alert(`${manageTarget.name} 파렛트(${palletId})를 호출했어.`);
  };

  const handleReturnReplenishPallet = () => {
    if (!manageTarget || !order?.id) return;

    if (!manageTarget.calledPalletId || !manageTarget.isPalletCalled) {
      alert("회송할 파렛트가 없어.");
      return;
    }

    const palletId = manageTarget.calledPalletId;

    setManageTarget((prev) =>
      prev
        ? {
            ...prev,
            calledPalletId: null,
            calledPalletStock: 0,
            isPalletCalled: false,
          }
        : prev,
    );

    updateItemInOrder(manageTarget.code, (item) => ({
      ...(item as any),
      calledPalletId: null,
      calledPalletStock: 0,
      isPalletCalled: false,
    }));

    alert(`${manageTarget.name} 파렛트(${palletId})를 회송했어.`);
  };

  const handleReplenish1Box = () => {
    if (!manageTarget || !order?.id) return;

    const boxEa = Number(manageTarget.boxEa ?? 0);
    if (!boxEa || boxEa <= 0) {
      alert("이 상품은 1BOX 내품수량(BOX EA)이 설정되어 있지 않아. 데이터에 boxEa를 넣어줘.");
      return;
    }

    if (!manageTarget.calledToteBoxId) {
      alert("먼저 토트박스를 호출해줘.");
      return;
    }

    if (!manageTarget.calledPalletId || !manageTarget.isPalletCalled) {
      alert("먼저 파렛트를 호출해줘.");
      return;
    }

    const curTote = toteStockMap[manageTarget.code] ?? manageTarget.toteStock ?? 0;
    const curPallet = Number(manageTarget.calledPalletStock ?? 0);

    if (curPallet < boxEa) {
      alert("호출된 파렛트 재고가 부족해서 1BOX 보충을 할 수 없어.");
      return;
    }

    const nextTote = curTote + boxEa;
    const nextPallet = Math.max(0, curPallet - boxEa);

    setToteStockMap((prev) => ({ ...prev, [manageTarget.code]: nextTote }));
    setManageTarget((prev) =>
      prev
        ? {
            ...prev,
            toteStock: nextTote,
            calledToteBoxStock: nextTote,
            calledPalletStock: nextPallet,
            location: "입고중",
          }
        : prev,
    );
    setLocationMap((prev) => ({ ...prev, [manageTarget.code]: "입고중" }));

    updateItemInOrder(manageTarget.code, (item) => ({
      ...(item as any),
      toteStock: nextTote,
      calledToteBoxStock: nextTote,
      calledPalletStock: nextPallet,
      locationStatus: "입고중",
    }));

    alert(
      `1BOX 보충 완료\n- 토트박스: ${manageTarget.calledToteBoxId}\n- 파렛트: ${manageTarget.calledPalletId}\n- +${boxEa.toLocaleString()} EA`,
    );
  };

  const handleManualCall = (it: OrderItem, routeValue: "피킹" | "파렛트") => {
    if (!order?.id) return;

    const code = (it as any).code ?? (it as any).itemCode ?? "";
    const productName = (it as any).name || "해당 상품";

    if (routeValue === "피킹") {
      const toteId = (it as any).calledToteBoxId ?? buildToteBoxId(order.id, code);
      const toteStock = Number((it as any).calledToteBoxStock ?? (it as any).toteStock ?? 0);

      updateItemInOrder(code, (item) => ({
        ...(item as any),
        callRoute: routeValue,
        amrCallStatus: "이송중",
        calledToteBoxId: toteId,
        calledToteBoxStock: toteStock,
      }));

      window.setTimeout(() => {
        updateItemInOrder(code, (item) => ({
          ...(item as any),
          callRoute: routeValue,
          amrCallStatus: "이송완료",
          locationStatus: "입고중",
          calledToteBoxId: toteId,
          calledToteBoxStock: toteStock,
        }));
        setLocationMap((prev) => ({ ...prev, [code]: "입고중" }));
      }, 800);

      alert(`제품 "${productName}" 토트박스(${toteId})가 피킹라인으로 호출되었습니다.`);
    } else {
      const palletId = (it as any).calledPalletId ?? buildPalletId(order.id, code);
      const palletStock = Number((it as any).calledPalletStock ?? getEaPerPalletByCode(code) ?? 0);

      updateItemInOrder(code, (item) => ({
        ...(item as any),
        callRoute: routeValue,
        amrCallStatus: "이송중",
        calledPalletId: palletId,
        calledPalletStock: palletStock,
        isPalletCalled: true,
      }));

      window.setTimeout(() => {
        updateItemInOrder(code, (item) => ({
          ...(item as any),
          callRoute: routeValue,
          amrCallStatus: "이송완료",
          locationStatus: "입고중",
          calledPalletId: palletId,
          calledPalletStock: palletStock,
          isPalletCalled: true,
        }));
        setLocationMap((prev) => ({ ...prev, [code]: "입고중" }));
      }, 800);

      alert(`제품 "${productName}" 파렛트(${palletId})가 피킹라인으로 호출되었습니다.`);
    }

    const cur = (order as any).status;
    if (onChangeStatus && (cur === "대기" || cur === "보류")) {
      onChangeStatus("출고중" as any);
    }
  };

  const handleConfirmItem = (it: OrderItem) => {
    if (!order?.id) return;

    const code = (it as any).code ?? (it as any).itemCode ?? "";
    const productName = (it as any).name ?? "";
    const orderQty = Number((it as any).qty ?? (it as any).orderQty ?? 0);
    const stockQty = Number((it as any).pickingStock ?? (it as any).stockQty ?? 0);
    const toteStock = getToteStock(it);
    const alreadyConfirmed = !!(it as any).confirmed;

    if (alreadyConfirmed) {
      alert(`"${productName}"은 이미 확인 완료된 상품이야.`);
      return;
    }

    const nextStock = Math.max(0, stockQty - orderQty);
    const nextToteStock = Math.max(0, toteStock - orderQty);
    const nextLowStock = nextStock < orderQty;

    updateItemInOrder(code, (item) => ({
      ...(item as any),
      stockQty: nextStock,
      toteStock: nextToteStock,
      calledToteBoxStock: nextToteStock,
      lowStock: nextLowStock,
      confirmed: true,
      confirmedQty: orderQty,
      confirmedAt: new Date().toISOString(),
      locationStatus: "출고중",
    }));

    setToteStockMap((prev) => ({ ...prev, [code]: nextToteStock }));
    setLocationMap((prev) => ({ ...prev, [code]: "출고중" }));

    alert(
      `상품 확인 완료\n- 상품: ${productName}\n- 차감수량: ${orderQty.toLocaleString()} EA\n- 남은 피킹재고: ${nextStock.toLocaleString()} EA`,
    );
  };

  if (!order) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border bg-white text-sm text-gray-500">
        주문을 선택하면 상세 정보가 표시됩니다.
      </div>
    );
  }

  const allConfirmed = items.length > 0 && items.every((it) => !!(it as any).confirmed);

  const handleClickComplete = () => {
    if (!allConfirmed) {
      alert("모든 상품의 확인 버튼을 완료한 뒤 출고 완료를 눌러줘.");
      return;
    }
    onComplete?.(items);
  };

  const handleHoldOrder = () => {
    onChangeStatus?.("보류" as OrderStatus);
  };

  const processingRequired = !!order?.processingLink?.processingRequired;
  const processingStatus = order?.processingLink?.processingStatus ?? "NONE";
  const linkedWorkCount = order?.processingLink?.linkedWorkIds?.length ?? 0;
  const plannedShipDate = order?.plannedShipDate ?? "-";
  const holdReason = order?.holdReason ?? "-";

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">주문 상세 및 출고 지시</div>
          <div className="mt-0.5 text-[13px] font-semibold">주문번호: {order.id}</div>
          <div className="mt-0.5 text-[11px] text-gray-500">
            납기일: <span className="font-medium text-gray-700">{(order as any).dueDate}</span>
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

          <div className="mt-1 text-[11px] text-emerald-600">
            확인완료:{" "}
            <span className="font-semibold">
              {items.filter((it) => !!(it as any).confirmed).length} / {items.length}
            </span>
          </div>

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

      <div className="mb-3 rounded-2xl border bg-white">
        <button
          type="button"
          onClick={() => setProcessingInfoOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-900">후가공 정보</span>
            <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              {linkedWorkCount}
            </span>
            {(processingRequired || linkedWorkCount > 0 || processingStatus !== "NONE") && (
              <span className="text-[11px] text-amber-500">🔔</span>
            )}
          </div>

          <span className="text-[11px] text-gray-400">{processingInfoOpen ? "접기" : "열기"}</span>
        </button>

        {processingInfoOpen && (
          <div className="border-t px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[12px] text-gray-500">
                  주문 단위 후가공 상태 / 출고예정일 / 연결 작업 확인
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  router.push("/processing");
                }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
              >
                후가공 작업
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
              <div className="rounded-xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] text-gray-500">후가공 필요</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {processingRequired ? "예" : "아니오"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] text-gray-500">후가공 상태</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {processingStatus}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] text-gray-500">연결 작업 수</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {linkedWorkCount}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] text-gray-500">출고예정일</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {plannedShipDate}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] text-gray-500">주문 상태</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {order.status ?? "-"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] text-gray-500">보류 사유</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {holdReason}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-3 rounded-2xl border bg-white">
        <button
          type="button"
          onClick={() => setCommOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-blue-600">커뮤니케이션 히스토리</span>
            <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              {communicationCount}
            </span>
            {(customerMemo || managerMemo || fieldMemos.length > 0) && (
              <span className="text-[11px] text-amber-500">🔔</span>
            )}
          </div>

          <span className="text-[11px] text-gray-400">{commOpen ? "접기" : "열기"}</span>
        </button>

        {commOpen && (
          <div className="border-t px-4 py-4">
            <div className="space-y-3">
              {customerMemo && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      고객메모
                    </span>
                    <span className="text-[11px] text-gray-500">읽기전용</span>
                  </div>
                  <div className="text-[13px] text-gray-800">{customerMemo}</div>
                </div>
              )}

              {managerMemo && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      관리자메모
                    </span>
                    <span className="text-[11px] text-gray-500">읽기전용</span>
                  </div>
                  <div className="text-[13px] text-gray-800">{managerMemo}</div>
                </div>
              )}

              <div className="rounded-2xl border bg-gray-50 px-4 py-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    현장메모
                  </span>
                  <span className="text-[11px] text-gray-500">현장에서만 작성 가능</span>
                </div>

                {fieldMemos.length === 0 ? (
                  <div className="mb-3 rounded-xl border border-dashed bg-white px-3 py-4 text-[12px] text-gray-400">
                    아직 작성된 현장메모가 없어.
                  </div>
                ) : (
                  <div className="mb-3 space-y-2">
                    {fieldMemos.map((memo: any) => (
                      <div key={memo.id} className="rounded-xl border bg-white px-3 py-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="text-[12px] font-semibold text-gray-800">
                            {memo.author ?? "작업자"}
                          </div>
                          <div className="text-[11px] text-gray-400">{memo.createdAt ?? "-"}</div>
                        </div>
                        <div className="text-[13px] text-gray-700">{memo.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border bg-white p-3">
                  <div className="mb-2 text-[12px] text-gray-600">현장메모 작성</div>

                  <div className="flex gap-2">
                    <textarea
                      value={fieldMemoText}
                      onChange={(e) => setFieldMemoText(e.target.value)}
                      placeholder="현장 작업 메모를 입력해줘. (예: 피킹 완료, 박스 부족 확인, 관리자 전달 등)"
                      className="min-h-[88px] flex-1 resize-none rounded-xl border px-3 py-2 text-[13px] outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddFieldMemoClick}
                      disabled={!fieldMemoText.trim()}
                      className="self-end rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      등록
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
              <th className="border-b px-3 py-2 text-center">확인</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => {
              const code = (it as any).code ?? (it as any).itemCode ?? "";
              const name = (it as any).name ?? "";
              const qty = Number((it as any).qty ?? (it as any).orderQty ?? 0);
              const pickingStock = Number((it as any).pickingStock ?? (it as any).stockQty ?? 0);
              const lowStock = (it as any).lowStock;

              const routeValue = ((it as any).callRoute ?? "피킹") as "피킹" | "파렛트";
              const amrCallStatus = (it as any).amrCallStatus as AmrCallStatus | undefined;
              const location = getLocation(it);
              const marked = isProductMarked(code);
              const confirmed = !!(it as any).confirmed;

              const transferInfo = transferInfoMap[code];
              const isTransferring = transferInfo?.status === "이송중";

              const baseRemain = transferInfo?.remainingEaQty ?? 0;
              const residualDone = transferInfo?.residualOutboundEaQty ?? 0;
              const remainEa = Math.max(0, baseRemain - residualDone);

              const residualStep: ResidualStep = residualStepMap[code] ?? "NONE";

              const hasResidualFlow =
                residualStep !== "NONE" || remainEa > 0 || !!residualInfoMap[code];

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
                if (isTransferring && hasResidualFlow && residualStep === "DONE") {
                  setResidualStatusTargetCode(code);
                  setResidualStatusOpen(true);
                  return;
                }

                openTransferFlow(code, name, Number(qty));

                if (isTransferring && remainEa > 0 && residualStep === "NONE") {
                  setResidualStepMap((prev) => ({ ...prev, [code]: "PREP_CALLING" }));
                }
              };

              return (
                <tr key={code} className="cursor-pointer bg-white hover:bg-blue-50">
                  <td className="border-t px-3 py-2 text-[12px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{name}</span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImagePreview(it);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        title="이미지 미리보기"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M9 7l1.2-2h3.6L15 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>

                  <td className="border-t px-3 py-2 text-right">{Number(qty).toLocaleString()} EA</td>

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

                  <td className="border-t px-3 py-2 text-center">
                    <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="rounded border px-2 py-0.5 text-[11px]"
                        value={routeValue}
                        onChange={(e) => {
                          updateItemInOrder(code, (item) => ({
                            ...(item as any),
                            callRoute: e.target.value as "피킹" | "파렛트",
                          }));
                        }}
                      >
                        <option value="피킹">피킹</option>
                        <option value="파렛트">파렛트</option>
                      </select>

                      <button
                        type="button"
                        className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] text-white"
                        onClick={() => handleManualCall(it, routeValue)}
                      >
                        호출
                      </button>

                      <span
                        className={`inline-flex min-w-[64px] items-center justify-center rounded-full border px-2 py-0.5 text-[11px] ${amrStatusBadgeClass(
                          amrCallStatus,
                        )}`}
                      >
                        {amrCallStatus ?? "미호출"}
                      </span>
                    </div>
                  </td>

                  <td className="border-t px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        className={`rounded-full border px-2 py-0.5 text-[11px] ${
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

                      {isTransferring && (
                        <div className="text-[11px] text-gray-500">
                          잔량 <span className="font-semibold text-gray-700">{remainEa.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="border-t px-3 py-2 text-center">
                    <span
                      className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-0.5 text-[11px] ${locationBadgeClass(
                        location,
                      )}`}
                    >
                      {location}
                    </span>
                  </td>

                  <td className="border-t px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openManageModalFromItem(it)}
                      className={`mx-auto inline-flex items-center justify-center rounded-md border px-3 py-1 text-[12px] font-medium transition ${
                        marked
                          ? "border-blue-600 bg-blue-600 text-white hover:opacity-90"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      title="제품 관리창 열기"
                    >
                      관리
                    </button>
                  </td>

                  <td className="border-t px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleConfirmItem(it)}
                      disabled={confirmed}
                      className={`mx-auto inline-flex min-w-[72px] items-center justify-center rounded-md border px-3 py-1 text-[12px] font-medium transition ${
                        confirmed
                          ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {confirmed ? "확인완료" : "확인"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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

      <ProductManageModal
        open={manageOpen}
        target={manageTarget}
        displayToteEa={manageTarget ? (toteStockMap[manageTarget.code] ?? manageTarget.toteStock) : 0}
        displayLocation={
          manageTarget
            ? (((items.find((x) => x.code === manageTarget.code) as any)?.locationStatus as LocationStatus | undefined) ??
                locationMap[manageTarget.code] ??
                manageTarget.location)
            : "창고"
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
        onCallReplenishPallet={handleCallReplenishPallet}
        onReturnReplenishPallet={handleReturnReplenishPallet}
        locationBadgeClass={locationBadgeClass}
      />

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
        onSaveProgress={(step, draft) => {
          const code = flowTarget?.code;
          if (!code) return;

          const nextStep: ResidualStep =
            step === 2 ? "PREP_CALLING" : step === 3 ? "READY_MOVE" : "PREP_CALLING";

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

          if (order?.id && onUpdateItems) {
            const orderId = order.id;

            const nextItems = items.map((it) => {
              const itCode = (it as any).code ?? (it as any).itemCode ?? "";

              if (itCode !== code) return it;

              return {
                ...(it as any),
                directTransfer: merged,
                locationStatus: "출고중",
              } as any;
            });

            onUpdateItems(orderId, nextItems);
          }

          const remainEa = Math.max(0, (flowTarget?.orderEaQty ?? 0) - (info.transferEaQty ?? 0));

          if (remainEa > 0) {
            setResidualStepMap((prev) => ({
              ...prev,
              [code]: "PREP_CALLING",
            }));

            setResidualDraftMap((prev) => ({
              ...prev,
              [code]:
                prev[code] ??
                ({
                  calledResidualPalletIds: [],
                  residualPalletMeta: {},
                  residualBoxPickMap: {},
                  boxDestSlot: null,
                  calledToteIds: [],
                  toteMeta: {},
                  toteEaPickMap: {},
                  eaDestSlot: null,
                  consolidationPalletId: null,
                  consolidationDestSlot: null,
                  consolidationDestMode: "AUTO",
                } as ResidualDraft),
            }));
          }
        }}
        onConfirmResidualTransfer={(payload: ResidualTransferPayload) => {
          const code = payload.productCode;
          if (!code) return;

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

          setResidualStepMap((prev) => ({ ...prev, [code]: "DONE" }));
        }}
      />

      <ResidualTransferModal
        open={residualStatusOpen}
        onClose={() => setResidualStatusOpen(false)}
        info={residualStatusTargetCode ? residualInfoMap[residualStatusTargetCode] ?? null : null}
        directTransfer={residualStatusTargetCode ? transferInfoMap[residualStatusTargetCode] ?? null : null}
        draft={residualStatusTargetCode ? residualDraftMap[residualStatusTargetCode] ?? null : null}
      />

      {imgPreviewOpen && imgPreviewItem && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={() => {
            setImgPreviewOpen(false);
            setImgPreviewItem(null);
          }}
        >
          <div
            className="w-[520px] max-w-[92vw] rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-sm font-semibold">{(imgPreviewItem as any).name ?? "상품 이미지"}</div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-700"
                onClick={() => {
                  setImgPreviewOpen(false);
                  setImgPreviewItem(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {getItemImageUrl(imgPreviewItem) ? (
                <img
                  src={getItemImageUrl(imgPreviewItem)}
                  alt={(imgPreviewItem as any).name ?? "preview"}
                  className="h-[360px] w-full rounded-xl border object-contain bg-white"
                />
              ) : (
                <div className="flex h-[360px] items-center justify-center rounded-xl border bg-gray-50 text-sm text-gray-500">
                  이미지가 없어. (item.imageUrl 넣어야 보여)
                </div>
              )}

              <div className="mt-3 text-[12px] text-gray-600">
                코드:{" "}
                <span className="font-mono text-gray-800">
                  {(imgPreviewItem as any).code ?? (imgPreviewItem as any).itemCode ?? "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}