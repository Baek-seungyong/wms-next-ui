// components/TransferFlowModal/types.ts

export type TransferFlowStep = 1 | 2 | 3;

/**
 * 잔량 프로세스 임시저장 Draft
 * - 2STEP: 파렛트/토트 호출 결과(called ids)
 * - 3STEP: 호출된 파렛트/토트에서 출고할 EA 수량 입력, 빈파렛트/목적지 입력
 */
export type ResidualDraft = {
  // (선택) 화면 모드
  view?: "WORK" | "RESULT";

  // 2STEP에서 호출한 대상
  calledPalletIds: string[];
  calledToteIds: string[];

  calledPalletMeta?: Record<string, { boxQty: number; totalEa: number; eaPerBox: number }>;
  calledToteMeta?: Record<string, { totalEa: number; eaPerBox: number }>;

  // 3STEP에서 출고할 EA 수량 입력(파렛트/토트별)
  palletBoxPickMap: Record<string, number>; // key: palletId, value: EA
  toteEaPickMap: Record<string, number>; // key: toteId, value: EA

  // 3STEP에서 입력
  emptyPalletId: string;
  destSlot: string | null;

  // 3STEP 확정 라인(소스 내역)
  packedLines: Array<{
    sourceType: "PALLET" | "TOTE";
    sourceId: string;
    eaQty: number;
    lotNo?: string;
    fromLocation?: string;
  }>;
};

export const EMPTY_DRAFT: ResidualDraft = {
  view: "WORK",
  calledPalletIds: [],
  calledToteIds: [],
  calledPalletMeta: {},
  calledToteMeta: {},
  palletBoxPickMap: {},
  toteEaPickMap: {},
  emptyPalletId: "",
  destSlot: null,
  packedLines: [],
};
