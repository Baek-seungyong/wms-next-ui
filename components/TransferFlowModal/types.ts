// components/TransferFlowModal/types.ts
export type TransferFlowStep = 1 | 2 | 3 | 4;

export type ResidualDraft = {
  /** 계획(표시용/기본값 저장용) */
  planPalletQty?: number;
  planBoxQty?: number;
  planEaQty?: number;

  /** 2STEP: 잔량 파렛트(박스) */
  calledResidualPalletIds?: string[];
  residualPalletMeta?: Record<
    string,
    {
      eaPerBox?: number;
      boxQty?: number;
      totalEa?: number;
    }
  >;
  residualBoxPickMap?: Record<string, number>;
  boxDestSlot?: string | null;

  /** 3STEP: 토트(EA) */
  calledToteIds?: string[];
  toteMeta?: Record<
    string,
    {
      totalEa: number;
      lotNo?: string;
      location?: string;
    }
  >;
  toteEaPickMap?: Record<string, number>;
  eaDestSlot?: string | null;

  /** 4STEP: 합포 파렛트 */
  consolidationPalletId?: string | null;

  /** ✅ 4STEP: 합포 파렛트 목적지 */
  consolidationDestSlot?: string | null; // 최종 목적지(자동/수동 공통 결과)
  consolidationDestMode?: "AUTO" | "MANUAL"; // 기본 AUTO
};

export const EMPTY_DRAFT: ResidualDraft = {
  planPalletQty: undefined,
  planBoxQty: undefined,
  planEaQty: undefined,

  calledResidualPalletIds: [],
  residualPalletMeta: {},
  residualBoxPickMap: {},
  boxDestSlot: null,

  calledToteIds: [],
  toteMeta: {},
  toteEaPickMap: {},
  eaDestSlot: null,

  consolidationPalletId: null,
  consolidationDestSlot: null,
  consolidationDestMode: "AUTO",
};