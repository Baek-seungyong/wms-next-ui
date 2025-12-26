export type ReceivingModalProps = {
  open: boolean;
  onClose: () => void;
};

export type ReceivingItem = {
  id: number;
  code: string;
  name: string;
  qty: number; // 입고/출고 수량
  boxQty?: number; // 현재 박스 수량(출고 탭용)
  totalQty?: number; // 현재 전체 수량 EA(출고 탭용)
};

export type ProductMaster = {
  code: string;
  name: string;
};

export type PalletMaster = {
  id: string;
  desc: string;
};

export type PalletStock = {
  palletId: string;
  code: string;
  name: string;
  boxQty: number;
  eaQty: number;
};

/** ✅ 이송 위치 모델 */
export type MoveTarget =
  | { kind: "PICKING" }
  | { kind: "2F"; zoneId: string | null }
  | { kind: "3F"; zoneId: string | null };
