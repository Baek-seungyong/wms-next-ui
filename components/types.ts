export type OrderStatus = "대기" | "출고중" | "보류" | "완료";

export type Order = {
  id: string;
  customer: string;
  dueDate: string;
  status: OrderStatus;
};

export type OrderItem = {
  code: string;
  name: string;
  orderQty: number;
  stockQty: number;
  lowStock?: boolean;
};

export type PalletInfo = {
  id: string;
  floor: "3-1 풀파렛트" | "2-1 잔량파렛트";
  location: string;
  boxQty: number;
  looseQty: number;
  called: boolean;
};

export const LOCATIONS = [
  "1-1 생산라인",
  "1-2 입출고라인",
  "2-1 잔량파렛트창고",
  "2-2 피킹창고",
  "3-1 풀파렛트창고",
] as const;

export type LocationType = (typeof LOCATIONS)[number];

export type ManualAdjustLog = {
  id: number;
  timestamp: string;
  palletId: string;
  productCode: string;
  productName: string;
  qtyBox: number;
  qtyEa: number;
  location: LocationType;
  mode: "입고" | "출고";
};

export function statusBadgeClass(status: OrderStatus) {
  switch (status) {
    case "대기":
      return "bg-gray-100 text-gray-700";
    case "출고중":
      return "bg-blue-100 text-blue-700";
    case "보류":
      return "bg-yellow-100 text-yellow-800";
    case "완료":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function formatTime(date: Date) {
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join(":");
}