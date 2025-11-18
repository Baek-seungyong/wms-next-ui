// components/types.ts

// 주문 상태 타입
export type OrderStatus = "대기" | "출고중" | "보류" | "완료";

// ⭐ 수도권/비수도권/차량출고 구분 타입
export type ShippingZone = "수도권" | "비수도권" | "차량출고";

// 주문 데이터 타입
export type Order = {
  id: string;              // 실제 키값 (긴급출고도 내부적으로는 고유 ID)
  customer: string;        // 일반 주문: 고객명 / 긴급출고: 상품명
  dueDate: string;
  status: OrderStatus;
  zone?: ShippingZone;
  isEmergency?: boolean;   // ⭐ 긴급출고 여부
};

// 품목(라인아이템) 타입
export type OrderItem = {
  code: string;
  name: string;
  orderQty: number;
  stockQty: number;
  lowStock?: boolean;
};

// 상태 뱃지 CSS
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
