//components/processing/utils.ts
"use client";

import type {
  ProcessingCompletedStockItem,
  ProcessingOrder,
  ProcessingResultItem,
  ProcessingStore,
  ProcessingWork,
} from "./types";
import { initialProcessingStore } from "./mock";

const STORAGE_KEY = "wms-processing-store-v1";

export function getTodayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export function isBeforeToday(date?: string) {
  if (!date) return false;
  return date < getTodayYmd();
}

export function isTodayOrPast(date?: string) {
  if (!date) return false;
  return date <= getTodayYmd();
}

export function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function generateWorkNumber(existing: ProcessingWork[]) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const sameDayCount = existing.filter((work) =>
    work.workNumber.startsWith(`PG-${y}${m}${d}`)
  ).length;

  return `PG-${y}${m}${d}-${String(sameDayCount + 1).padStart(3, "0")}`;
}

export function loadProcessingStore(): ProcessingStore {
  if (typeof window === "undefined") {
    return initialProcessingStore;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProcessingStore));
    return initialProcessingStore;
  }

  try {
    return JSON.parse(raw) as ProcessingStore;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProcessingStore));
    return initialProcessingStore;
  }
}

export function saveProcessingStore(store: ProcessingStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getOrderById(orders: ProcessingOrder[], orderId: string) {
  return orders.find((order) => order.id === orderId);
}

export function getWorksByOrderId(works: ProcessingWork[], orderId: string) {
  return works.filter((work) => work.linkedOrderIds.includes(orderId));
}

export function resolveOrderStatusAfterProcessing(
  order: ProcessingOrder,
  works: ProcessingWork[]
): ProcessingOrder {
  const processingRequired = order.processingLink?.processingRequired ?? false;
  if (!processingRequired) return order;

  const linkedWorkIds = order.processingLink?.linkedWorkIds ?? [];
  if (linkedWorkIds.length === 0) {
    return {
      ...order,
      status: "보류",
      holdReason: "후가공대기",
      processingLink: {
        processingRequired: true,
        processingStatus: "WAITING",
        linkedWorkIds: [],
      },
    };
  }

  const linkedWorks = works.filter((work) => linkedWorkIds.includes(work.id));
  const allDone =
    linkedWorks.length > 0 && linkedWorks.every((work) => work.status === "완료");
  const hasInProgress = linkedWorks.some((work) =>
    ["재고준비중", "작업중", "검수중"].includes(work.status)
  );

  if (allDone) {
    return {
      ...order,
      status: isTodayOrPast(order.plannedShipDate) ? "출고준비" : "출고대기",
      holdReason: undefined,
      processingLink: {
        processingRequired: true,
        processingStatus: "DONE",
        linkedWorkIds,
        completedAt: new Date().toISOString(),
      },
    };
  }

  if (hasInProgress) {
    return {
      ...order,
      status: "보류",
      holdReason: "후가공대기",
      processingLink: {
        processingRequired: true,
        processingStatus: "IN_PROGRESS",
        linkedWorkIds,
      },
    };
  }

  return {
    ...order,
    status: "보류",
    holdReason: "후가공대기",
    processingLink: {
      processingRequired: true,
      processingStatus: "WAITING",
      linkedWorkIds,
    },
  };
}

export function syncAllOrders(store: ProcessingStore): ProcessingStore {
  const nextOrders = store.orders.map((order) =>
    resolveOrderStatusAfterProcessing(order, store.works)
  );

  return {
    ...store,
    orders: nextOrders,
  };
}

export function buildCompletedStocksFromWork(
  work: ProcessingWork
): ProcessingCompletedStockItem[] {
  const rows: ProcessingCompletedStockItem[] = (work.resultItems || []).map(
    (item: ProcessingResultItem) => ({
      id: generateId("done-stock"),
      workId: work.id,
      workNumber: work.workNumber,
      productCode: item.productCode,
      productName: item.productName,
      qty: item.goodQty ?? item.qty,
      unit: item.unit,
      location: item.location,
      linkedOrderIds: work.linkedOrderIds,
      plannedShipDate: work.plannedShipDate,
      createdAt: new Date().toISOString(),
    })
  );

  return rows;
}

export function completeWorkAndSync(store: ProcessingStore, workId: string) {
  const target = store.works.find((work) => work.id === workId);
  if (!target) return store;

  const nextWorks = store.works.map((work) =>
    work.id === workId
      ? {
          ...work,
          status: "완료" as const,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          inspectionCompleted: work.inspectionRequired ? true : work.inspectionCompleted,
        }
      : work
  );

  const completedWork = nextWorks.find((work) => work.id === workId)!;

  const doneStocks = buildCompletedStocksFromWork(completedWork);

  const filteredStocks = store.completedStocks.filter((row) => row.workId !== workId);

  const nextStore: ProcessingStore = {
    ...store,
    works: nextWorks,
    completedStocks: [...filteredStocks, ...doneStocks],
  };

  return syncAllOrders(nextStore);
}

export function upsertWork(store: ProcessingStore, work: ProcessingWork) {
  const exists = store.works.some((item) => item.id === work.id);

  const nextWorks = exists
    ? store.works.map((item) => (item.id === work.id ? work : item))
    : [work, ...store.works];

  let nextOrders = [...store.orders];

  if (work.linkedOrderIds.length > 0) {
    nextOrders = nextOrders.map((order) => {
      if (!work.linkedOrderIds.includes(order.id)) return order;

      const currentIds = order.processingLink?.linkedWorkIds ?? [];
      const nextIds = Array.from(new Set([...currentIds, work.id]));

      return {
        ...order,
        status: "보류",
        holdReason: "후가공대기" as const,
        plannedShipDate: order.plannedShipDate ?? work.plannedShipDate,
        processingLink: {
          processingRequired: true,
          processingStatus:
            work.status === "대기"
              ? "WAITING"
              : ["재고준비중", "작업중", "검수중"].includes(work.status)
              ? "IN_PROGRESS"
              : work.status === "완료"
              ? "DONE"
              : "WAITING",
          linkedWorkIds: nextIds,
        },
      };
    });
  }

  return syncAllOrders({
    ...store,
    works: nextWorks,
    orders: nextOrders,
  });
}

export function updateWorkStatus(
  store: ProcessingStore,
  workId: string,
  status: ProcessingWork["status"]
) {
  const nextWorks = store.works.map((work) =>
    work.id === workId
      ? {
          ...work,
          status,
          startedAt:
            status === "작업중" && !work.startedAt
              ? new Date().toISOString()
              : work.startedAt,
          updatedAt: new Date().toISOString(),
        }
      : work
  );

  return syncAllOrders({
    ...store,
    works: nextWorks,
  });
}