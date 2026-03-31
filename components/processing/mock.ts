//components/processing/mock.ts
"use client";

import type {
  ProcessingStore,
  ProcessingOrder,
  ProcessingWork,
  ProcessingCompletedStockItem,
} from "./types";

const now = new Date().toISOString();

const mockOrders: ProcessingOrder[] = [
  {
    id: "ORD-240401-001",
    customer: "카카두 재팬",
    dueDate: "2026-04-05",
    plannedShipDate: "2026-04-05",
    zone: "수도권",
    status: "보류",
    holdReason: "후가공대기",
    isEmergency: false,
    processingLink: {
      processingRequired: true,
      processingStatus: "WAITING",
      linkedWorkIds: [],
    },
  },
  {
    id: "ORD-240401-002",
    customer: "동방플라스틱",
    dueDate: "2026-04-03",
    plannedShipDate: "2026-04-03",
    zone: "비수도권",
    status: "보류",
    holdReason: "후가공대기",
    isEmergency: true,
    processingLink: {
      processingRequired: true,
      processingStatus: "WAITING",
      linkedWorkIds: [],
    },
  },
  {
    id: "ORD-240401-003",
    customer: "일반 거래처",
    dueDate: "2026-04-10",
    plannedShipDate: "2026-04-10",
    zone: "차량출고",
    status: "대기",
    isEmergency: false,
    processingLink: {
      processingRequired: false,
      processingStatus: "NONE",
      linkedWorkIds: [],
    },
  },
];

const mockWorks: ProcessingWork[] = [
  {
    id: "PW-1",
    workNumber: "PG-20260330-001",
    title: "500ml 투명용기 라벨 부착",
    type: "라벨부착",
    status: "작업중",
    linkedOrderIds: ["ORD-240401-002"],
    plannedShipDate: "2026-04-03",
    priority: "긴급",
    workZone: "후가공1",
    resultLocation: "후가공완료존",
    sourceItems: [
      {
        id: "src-1",
        productCode: "P-500-CLR",
        productName: "500ml 투명용기",
        qty: 1000,
        unit: "EA",
        location: "2층 잔량 파렛트 창고",
      },
    ],
    resultItems: [
      {
        id: "res-1",
        productCode: "P-500-CLR-LB",
        productName: "500ml 투명용기(라벨완료)",
        qty: 1000,
        unit: "EA",
        location: "후가공완료존",
        goodQty: 980,
        defectQty: 10,
        discardQty: 10,
      },
    ],
    memo: "라벨 위치 우측 정렬",
    assignedUser: "작업자A",
    inspectionRequired: true,
    inspectionCompleted: false,
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

const mockCompletedStocks: ProcessingCompletedStockItem[] = [];

export const initialProcessingStore: ProcessingStore = {
  orders: mockOrders,
  works: mockWorks,
  completedStocks: mockCompletedStocks,
};