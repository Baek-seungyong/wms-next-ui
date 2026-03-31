//components/processing/ProcessingPageClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProcessingTabKey, ProcessingWork } from "./types";
import {
  completeWorkAndSync,
  loadProcessingStore,
  saveProcessingStore,
  syncAllOrders,
  updateWorkStatus,
  upsertWork,
} from "./utils";
import ProcessingTabs from "./ProcessingTabs";
import ProcessingList from "./ProcessingList";
import ProcessingWaitingOrders from "./ProcessingWaitingOrders";
import ProcessingCompletedStock from "./ProcessingCompletedStock";
import ProcessingCreateModal from "./ProcessingCreateModal";
import ProcessingDetailModal from "./ProcessingDetailModal";

export default function ProcessingPageClient() {
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<ProcessingTabKey>("list");
  const [store, setStore] = useState(loadProcessingStore());
  const [createOpen, setCreateOpen] = useState(false);
  const [detailWork, setDetailWork] = useState<ProcessingWork | null>(null);

  useEffect(() => {
    const loaded = syncAllOrders(loadProcessingStore());
    setStore(loaded);
    saveProcessingStore(loaded);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveProcessingStore(store);
  }, [store, ready]);

  const summary = useMemo(() => {
    const waitingOrderCount = store.orders.filter(
      (order) =>
        order.processingLink?.processingRequired ||
        order.holdReason === "후가공대기" ||
        order.status === "출고대기"
    ).length;

    const inProgressCount = store.works.filter((work) =>
      ["재고준비중", "작업중", "검수중"].includes(work.status)
    ).length;

    const doneCount = store.works.filter((work) => work.status === "완료").length;

    return {
      waitingOrderCount,
      inProgressCount,
      doneCount,
    };
  }, [store]);

  const handleCreate = (work: ProcessingWork) => {
    const next = upsertWork(store, work);
    setStore(next);
    setActiveTab("list");
  };

  const handleStartPrep = (workId: string) => {
    setStore((prev) => updateWorkStatus(prev, workId, "재고준비중"));
  };

  const handleStartWork = (workId: string) => {
    setStore((prev) => updateWorkStatus(prev, workId, "작업중"));
  };

  const handleStartInspection = (workId: string) => {
    setStore((prev) => updateWorkStatus(prev, workId, "검수중"));
  };

  const handleComplete = (workId: string) => {
    setStore((prev) => completeWorkAndSync(prev, workId));
    setDetailWork((prev) =>
      prev && prev.id === workId
        ? {
            ...prev,
            status: "완료",
            completedAt: new Date().toISOString(),
          }
        : prev
    );
  };

  if (!ready) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
        후가공 관리 데이터를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">후가공 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              독립 후가공 작업 생성, 주문 연결, 완료 재고 관리까지 한 번에 처리
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">후가공 대기 주문</div>
              <div className="mt-1 text-xl font-bold text-slate-900">
                {summary.waitingOrderCount}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">진행중 작업</div>
              <div className="mt-1 text-xl font-bold text-slate-900">
                {summary.inProgressCount}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">완료 작업</div>
              <div className="mt-1 text-xl font-bold text-slate-900">
                {summary.doneCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProcessingTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "list" ? (
        <ProcessingList
          works={store.works}
          onOpenCreate={() => setCreateOpen(true)}
          onOpenDetail={(work) => setDetailWork(work)}
        />
      ) : null}

      {activeTab === "waiting-orders" ? (
        <ProcessingWaitingOrders orders={store.orders} />
      ) : null}

      {activeTab === "completed-stock" ? (
        <ProcessingCompletedStock items={store.completedStocks} />
      ) : null}

      <ProcessingCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        orders={store.orders}
        works={store.works}
        onCreate={handleCreate}
      />

      <ProcessingDetailModal
        open={!!detailWork}
        work={
          detailWork
            ? store.works.find((work) => work.id === detailWork.id) || detailWork
            : null
        }
        orders={store.orders}
        onClose={() => setDetailWork(null)}
        onStartPrep={handleStartPrep}
        onStartWork={handleStartWork}
        onStartInspection={handleStartInspection}
        onComplete={handleComplete}
      />
    </div>
  );
}