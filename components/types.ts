// components/types.ts

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

export type OrderProcessingLink = {
  processingRequired: boolean;
  processingStatus: OrderProcessingStatus;
  linkedWorkIds: string[];
  completedAt?: string;
};

export type ShippingZone = "수도권" | "비수도권" | "차량출고";

export type AmrCallStatus = "이송대기" | "이송중" | "이송완료";

export type LocationStatus = "창고" | "입고중" | "작업중" | "출고중";

export type Order = {
  id: string;
  customer: string;
  dueDate: string;
  status: OrderStatus;
  zone: ShippingZone;
  isEmergency?: boolean;

  plannedShipDate?: string;
  holdReason?: OrderHoldReason;
  processingLink?: OrderProcessingLink;
};

export type OrderItem = {
  code: string;
  name: string;
  orderQty: number;
  stockQty: number;
  lowStock?: boolean;

  boxEa?: number;
  palletEa?: number;
  imageUrl?: string;

  toteStock?: number;

  callRoute?: "피킹" | "파렛트";
  amrCallStatus?: AmrCallStatus;
  locationStatus?: LocationStatus;

  confirmed?: boolean;
  confirmedAt?: string | null;
  confirmedQty?: number;

  // ✅ 호출 귀속 정보
  calledToteBoxId?: string | null;
  calledToteBoxStock?: number;

  calledPalletId?: string | null;
  calledPalletStock?: number;
  isPalletCalled?: boolean;
};

export type TransferStatus = "이송중" | "완료";

export type TransferInfo = {
  productCode?: string;
  status: "이송중" | "완료";
  fromLocation?: string;
  palletIds: string[];
  destinationSlots: string[];

  orderEaQty: number;
  transferEaQty: number;
  remainingEaQty: number;

  residualOutboundEaQty?: number;
};

export type PackedLine = {
  type: "PALLET" | "TOTE";
  sourceId: string;
  eaQty: number;
};

export type ResidualTransferInfo = {
  status: "이송중" | "완료";
  productCode: string;
  productName?: string;
  transferredEaQty: number;
  emptyPalletId: string;
  destinationSlot: string;
  sources: PackedLine[];
  createdAt: string;
};

export type ResidualTransferPayload = {
  productCode: string;
  productName?: string;
  totalEa: number;
  emptyPalletId: string;
  destSlot: string;
  packedLines: PackedLine[];
};

export const statusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case "대기":
      return "bg-gray-200 text-gray-700";
    case "출고중":
      return "bg-blue-100 text-blue-700";
    case "보류":
      return "bg-yellow-100 text-yellow-700";
    case "완료":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-200 text-gray-700";
  }
};