//components/processing/types.ts
"use client";

export type ProcessingUnit = "EA" | "BOX" | "PALLET";

export type ProcessingWorkStatus =
  | "대기"
  | "재고준비중"
  | "작업중"
  | "검수중"
  | "완료"
  | "취소";

export type ProcessingWorkType =
  | "라벨부착"
  | "스티커부착"
  | "재포장"
  | "합포"
  | "세트구성"
  | "검수"
  | "기타";

export type ProcessingZone =
  | "후가공1"
  | "후가공2"
  | "검수존"
  | "포장존";

export type ProcessingPriority = "보통" | "긴급";

export type ProcessingResultLocation =
  | "후가공완료존"
  | "출고대기존";

export type OrderStatus =
  | "대기"
  | "보류"
  | "출고대기"
  | "출고준비"
  | "출고중"
  | "완료";

export type OrderHoldReason =
  | "후가공대기"
  | "재고부족"
  | "고객요청"
  | "수동보류";

export type OrderProcessingStatus =
  | "NONE"
  | "WAITING"
  | "IN_PROGRESS"
  | "DONE";

export type ShippingZone = "수도권" | "비수도권" | "차량출고";

export type ProcessingSourceItem = {
  id: string;
  productCode: string;
  productName: string;
  qty: number;
  unit: ProcessingUnit;
  location: string;
  lotNo?: string;
  palletId?: string;
  toteBoxId?: string;
};

export type ProcessingResultItem = {
  id: string;
  productCode: string;
  productName: string;
  qty: number;
  unit: ProcessingUnit;
  location: string;
  goodQty?: number;
  defectQty?: number;
  discardQty?: number;
};

export type ProcessingWork = {
  id: string;
  workNumber: string;
  title: string;
  type: ProcessingWorkType;
  status: ProcessingWorkStatus;
  linkedOrderIds: string[];
  plannedShipDate?: string;
  priority: ProcessingPriority;
  workZone: ProcessingZone;
  resultLocation: ProcessingResultLocation;
  sourceItems: ProcessingSourceItem[];
  resultItems: ProcessingResultItem[];
  memo?: string;
  assignedUser?: string;
  inspectionRequired?: boolean;
  inspectionCompleted?: boolean;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProcessingCompletedStockItem = {
  id: string;
  workId: string;
  workNumber: string;
  productCode: string;
  productName: string;
  qty: number;
  unit: ProcessingUnit;
  location: string;
  linkedOrderIds: string[];
  plannedShipDate?: string;
  createdAt: string;
};

export type OrderProcessingLink = {
  processingRequired: boolean;
  processingStatus: OrderProcessingStatus;
  linkedWorkIds: string[];
  completedAt?: string;
};

export type ProcessingOrder = {
  id: string;
  customer: string;
  dueDate: string;
  zone: ShippingZone;
  status: OrderStatus;
  isEmergency?: boolean;
  plannedShipDate?: string;
  holdReason?: OrderHoldReason;
  processingLink?: OrderProcessingLink;
};

export type ProcessingTabKey =
  | "list"
  | "waiting-orders"
  | "completed-stock";

export type ProcessingStore = {
  orders: ProcessingOrder[];
  works: ProcessingWork[];
  completedStocks: ProcessingCompletedStockItem[];
};