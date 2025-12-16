// components/types.ts

// 주문 상태 타입
export type OrderStatus = "대기" | "출고중" | "보류" | "완료";

// ⭐ 수도권/비수도권/차량출고 구분 타입
export type ShippingZone = "수도권" | "비수도권" | "차량출고";

// 주문 데이터 타입
export type Order = {
  id: string; // 실제 키값 (긴급출고도 내부적으로는 고유 ID)
  customer: string; // 일반 주문: 고객명 / 긴급출고: 상품명
  dueDate: string;
  status: OrderStatus;
  zone?: ShippingZone;
  isEmergency?: boolean; // ⭐ 긴급출고 여부
};

// 품목(라인아이템) 타입
export type OrderItem = {
  code: string;
  name: string;
  orderQty: number;
  stockQty: number;
  lowStock?: boolean;
};

export type TransferStatus = "이송중" | "완료";

/** ✅ 지정이송 정보 */
export type TransferInfo = {
  status: "이송중" | "완료";
  fromLocation?: string;
  palletIds: string[];
  destinationSlots: string[];

  orderEaQty: number;
  transferEaQty: number;
  remainingEaQty: number;

  /** ✅ 잔량출고로 추가로 출고된 누적 EA (OrderDetail에서 사용) */
  residualOutboundEaQty?: number;
};

/** ✅ 잔량출고에서 "어디에서 몇 EA 담았는지" 라인 (packedLines / sources 공용)
 *  ⚠ OutboundResidualPrepModal에서 사용하는 필드명과 반드시 동일해야 함
 */
export type PackedLine = {
  type: "PALLET" | "TOTE";
  sourceId: string;
  eaQty: number;
};

/** ✅ 잔량 이송(잔량출고) 정보 */
export type ResidualTransferInfo = {
  status: "이송중" | "완료";
  productCode: string;
  productName?: string;

  // 잔량 출고로 실제 이동한 EA (총합)
  transferredEaQty: number;

  // 빈파렛트ID (스캔/호출된 빈파렛트)
  emptyPalletId: string;

  // 어디로 보냈는지 (A-3-4 같은 슬롯)
  destinationSlot: string;

  // 어떤 원천에서 얼마 담았는지(파렛트/토트 breakdown)
  sources: PackedLine[];

  createdAt: string; // demo용
};

/** ✅ OutboundResidualPrepModal -> OrderDetail로 넘기는 payload 타입(권장) */
export type ResidualTransferPayload = {
  productCode: string;
  productName?: string;
  totalEa: number;
  emptyPalletId: string;
  destSlot: string;
  packedLines: PackedLine[];
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
