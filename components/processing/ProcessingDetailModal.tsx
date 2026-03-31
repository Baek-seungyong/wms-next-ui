//components/processing/ProcessingDetailModal.tsx
"use client";

import type { ProcessingOrder, ProcessingWork } from "./types";

type Props = {
  open: boolean;
  work: ProcessingWork | null;
  orders: ProcessingOrder[];
  onClose: () => void;
  onStartPrep: (workId: string) => void;
  onStartWork: (workId: string) => void;
  onStartInspection: (workId: string) => void;
  onComplete: (workId: string) => void;
};

export default function ProcessingDetailModal({
  open,
  work,
  orders,
  onClose,
  onStartPrep,
  onStartWork,
  onStartInspection,
  onComplete,
}: Props) {
  if (!open || !work) return null;

  const linkedOrders = orders.filter((order) => work.linkedOrderIds.includes(order.id));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{work.workNumber}</h2>
            <p className="mt-1 text-sm text-slate-500">{work.title}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            닫기
          </button>
        </div>

        <div className="max-h-[calc(90vh-76px)] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-base font-bold text-slate-900">작업 정보</h3>

                <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
                  <div>작업유형: {work.type}</div>
                  <div>상태: {work.status}</div>
                  <div>우선순위: {work.priority}</div>
                  <div>작업존: {work.workZone}</div>
                  <div>결과위치: {work.resultLocation}</div>
                  <div>작업자: {work.assignedUser || "-"}</div>
                  <div>출고목표일: {work.plannedShipDate || "-"}</div>
                  <div>검수필수: {work.inspectionRequired ? "예" : "아니오"}</div>
                  <div>작업시작: {work.startedAt || "-"}</div>
                  <div>작업완료: {work.completedAt || "-"}</div>
                </div>

                {work.memo ? (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    {work.memo}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-base font-bold text-slate-900">투입 재고</h3>
                <div className="space-y-3">
                  {work.sourceItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
                    >
                      <div className="font-semibold text-slate-900">
                        {item.productCode} / {item.productName}
                      </div>
                      <div className="mt-1">
                        수량: {item.qty} {item.unit}
                      </div>
                      <div>위치: {item.location}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-base font-bold text-slate-900">결과 재고</h3>
                <div className="space-y-3">
                  {work.resultItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
                    >
                      <div className="font-semibold text-slate-900">
                        {item.productCode} / {item.productName}
                      </div>
                      <div className="mt-1">
                        총수량: {item.qty} {item.unit}
                      </div>
                      <div>
                        양품: {item.goodQty ?? 0} / 불량: {item.defectQty ?? 0} /
                        폐기: {item.discardQty ?? 0}
                      </div>
                      <div>위치: {item.location}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-base font-bold text-slate-900">연결 주문</h3>

                {linkedOrders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    연결된 주문 없음
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {order.id}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {order.status}
                          </span>
                          {order.holdReason ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              {order.holdReason}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1">
                          고객사: {order.customer} / 출고예정일:{" "}
                          {order.plannedShipDate || "-"}
                        </div>
                        <div>
                          후가공상태: {order.processingLink?.processingStatus || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-base font-bold text-slate-900">작업 액션</h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onStartPrep(work.id)}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    재고준비중
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartWork(work.id)}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    작업 시작
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartInspection(work.id)}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    검수중
                  </button>
                  <button
                    type="button"
                    onClick={() => onComplete(work.id)}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    작업 완료
                  </button>
                </div>

                <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                  완료 처리 시 결과 재고가 후가공 완료 재고에 반영되고,
                  연결된 주문 상태도 자동으로 갱신되게 해놨다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}