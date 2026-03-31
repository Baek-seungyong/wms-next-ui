//components/processing/ProcessingCreateModal.tsx
"use client";

import { useMemo, useState } from "react";
import type {
  ProcessingOrder,
  ProcessingPriority,
  ProcessingResultItem,
  ProcessingResultLocation,
  ProcessingSourceItem,
  ProcessingWork,
  ProcessingWorkType,
  ProcessingZone,
} from "./types";
import { generateId, generateWorkNumber } from "./utils";
import ProcessingOrderLinkPanel from "./ProcessingOrderLinkPanel";
import ProcessingSourceItemsPanel from "./ProcessingSourceItemsPanel";
import ProcessingResultItemsPanel from "./ProcessingResultItemsPanel";

type Props = {
  open: boolean;
  onClose: () => void;
  orders: ProcessingOrder[];
  works: ProcessingWork[];
  onCreate: (work: ProcessingWork) => void;
};

export default function ProcessingCreateModal({
  open,
  onClose,
  orders,
  works,
  onCreate,
}: Props) {
  const waitingOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.processingLink?.processingRequired ||
          order.holdReason === "후가공대기"
      ),
    [orders]
  );

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ProcessingWorkType>("라벨부착");
  const [priority, setPriority] = useState<ProcessingPriority>("보통");
  const [workZone, setWorkZone] = useState<ProcessingZone>("후가공1");
  const [resultLocation, setResultLocation] =
    useState<ProcessingResultLocation>("후가공완료존");
  const [plannedShipDate, setPlannedShipDate] = useState("");
  const [inspectionRequired, setInspectionRequired] = useState(false);
  const [memo, setMemo] = useState("");
  const [assignedUser, setAssignedUser] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [sourceItems, setSourceItems] = useState<ProcessingSourceItem[]>([
    {
      id: generateId("src"),
      productCode: "",
      productName: "",
      qty: 0,
      unit: "EA",
      location: "2층 잔량 파렛트 창고",
    },
  ]);
  const [resultItems, setResultItems] = useState<ProcessingResultItem[]>([
    {
      id: generateId("res"),
      productCode: "",
      productName: "",
      qty: 0,
      unit: "EA",
      location: "후가공완료존",
      goodQty: 0,
      defectQty: 0,
      discardQty: 0,
    },
  ]);

  if (!open) return null;

  const toggleOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const resetForm = () => {
    setTitle("");
    setType("라벨부착");
    setPriority("보통");
    setWorkZone("후가공1");
    setResultLocation("후가공완료존");
    setPlannedShipDate("");
    setInspectionRequired(false);
    setMemo("");
    setAssignedUser("");
    setSelectedOrderIds([]);
    setSourceItems([
      {
        id: generateId("src"),
        productCode: "",
        productName: "",
        qty: 0,
        unit: "EA",
        location: "2층 잔량 파렛트 창고",
      },
    ]);
    setResultItems([
      {
        id: generateId("res"),
        productCode: "",
        productName: "",
        qty: 0,
        unit: "EA",
        location: "후가공완료존",
        goodQty: 0,
        defectQty: 0,
        discardQty: 0,
      },
    ]);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("작업명을 입력해줘.");
      return;
    }

    const now = new Date().toISOString();

    const work: ProcessingWork = {
      id: generateId("work"),
      workNumber: generateWorkNumber(works),
      title: title.trim(),
      type,
      status: "대기",
      linkedOrderIds: selectedOrderIds,
      plannedShipDate: plannedShipDate || undefined,
      priority,
      workZone,
      resultLocation,
      sourceItems: sourceItems.map((item) => ({
        ...item,
        location: item.location || "2층 잔량 파렛트 창고",
      })),
      resultItems: resultItems.map((item) => ({
        ...item,
        location: item.location || resultLocation,
      })),
      memo: memo.trim() || undefined,
      assignedUser: assignedUser.trim() || undefined,
      inspectionRequired,
      inspectionCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    onCreate(work);
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">후가공 작업 생성</h2>
            <p className="mt-1 text-sm text-slate-500">
              독립 작업으로 만들고, 필요하면 주문을 연결하면 돼.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            닫기
          </button>
        </div>

        <div className="max-h-[calc(92vh-76px)] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-base font-bold text-slate-900">기본 정보</h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="작업명"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />

                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ProcessingWorkType)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="라벨부착">라벨부착</option>
                    <option value="스티커부착">스티커부착</option>
                    <option value="재포장">재포장</option>
                    <option value="합포">합포</option>
                    <option value="세트구성">세트구성</option>
                    <option value="검수">검수</option>
                    <option value="기타">기타</option>
                  </select>

                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as ProcessingPriority)
                    }
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="보통">보통</option>
                    <option value="긴급">긴급</option>
                  </select>

                  <select
                    value={workZone}
                    onChange={(e) => setWorkZone(e.target.value as ProcessingZone)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="후가공1">후가공1</option>
                    <option value="후가공2">후가공2</option>
                    <option value="검수존">검수존</option>
                    <option value="포장존">포장존</option>
                  </select>

                  <select
                    value={resultLocation}
                    onChange={(e) =>
                      setResultLocation(e.target.value as ProcessingResultLocation)
                    }
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="후가공완료존">후가공완료존</option>
                    <option value="출고대기존">출고대기존</option>
                  </select>

                  <input
                    type="date"
                    value={plannedShipDate}
                    onChange={(e) => setPlannedShipDate(e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />

                  <input
                    value={assignedUser}
                    onChange={(e) => setAssignedUser(e.target.value)}
                    placeholder="작업자"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />

                  <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={inspectionRequired}
                      onChange={(e) => setInspectionRequired(e.target.checked)}
                    />
                    검수 필수
                  </label>
                </div>

                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="작업 메모"
                  className="mt-3 min-h-[100px] w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"
                />
              </div>

              <ProcessingSourceItemsPanel
                items={sourceItems}
                onChange={setSourceItems}
              />

              <ProcessingResultItemsPanel
                items={resultItems}
                onChange={setResultItems}
              />
            </div>

            <div className="space-y-6">
              <ProcessingOrderLinkPanel
                orders={waitingOrders}
                selectedOrderIds={selectedOrderIds}
                onToggleOrder={toggleOrder}
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-base font-bold text-slate-900">생성 요약</h3>

                <div className="space-y-2 text-sm text-slate-700">
                  <div>작업명: {title || "-"}</div>
                  <div>작업유형: {type}</div>
                  <div>우선순위: {priority}</div>
                  <div>작업존: {workZone}</div>
                  <div>결과위치: {resultLocation}</div>
                  <div>출고목표일: {plannedShipDate || "-"}</div>
                  <div>연결 주문 수: {selectedOrderIds.length}</div>
                  <div>투입 재고 행 수: {sourceItems.length}</div>
                  <div>결과 재고 행 수: {resultItems.length}</div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                    }}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    초기화
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    작업 생성
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}