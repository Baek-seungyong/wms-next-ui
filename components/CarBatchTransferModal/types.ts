// components/CarBatchTransferModal/types.ts

export type CarBatchTransferSlotId = string;

export type CarBatchTransferPlan = {
  plannedPalletCount: number; // ✅ 포장계획 기반 (0이면 0이어야 함)
  plannedBoxCount?: number;
  plannedEaCount?: number;
};

export type CarBatchTransferPayload = {
  orderId: string;
  pallets: Array<{
    seq: number; // 1..N
    toSlotId: CarBatchTransferSlotId;
  }>;
  createdAt: string;
};