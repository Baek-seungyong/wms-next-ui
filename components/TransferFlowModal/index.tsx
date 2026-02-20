// components/TransferFlowModal/index.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import type { TransferInfo, ResidualTransferPayload } from "../types";
import type { ResidualDraft, TransferFlowStep } from "./types";
import { EMPTY_DRAFT } from "./types";

import { Header } from "./Header";
import { Step1DirectTransfer } from "./Step1DirectTransfer";
import { Step2ResidualPrep } from "./Step2ResidualPrep";
import { Step3ResidualResult } from "./Step3ResidualResult";
import { Step4ConsolidationPallet } from "./Step4ConsolidationPallet";

type Props = {
  open: boolean;
  onClose: () => void;

  productCode: string;
  productName: string;

  orderEaQty: number;
  existingTransfer: TransferInfo | null;
  existingDestinationSlots: string[];

  /** (선택) 단위 데이터: 없으면 계획 계산이 일부/전체 불가 */
  eaPerBox?: number;
  eaPerPallet?: number;

  remainingEaQty: number;

  /** 기존 호환: 초기 포커스 */
  initialStep?: TransferFlowStep;
  initialDraft?: ResidualDraft;

  onSaveProgress?: (step: TransferFlowStep, draft: ResidualDraft) => void;

  /** 1STEP 확정(풀파렛트) */
  onConfirmDirectTransfer: (info: TransferInfo) => void;

  /** 최종 확정(잔량 이송) */
  onConfirmResidualTransfer: (payload: ResidualTransferPayload) => void;

  /** 3STEP 관리 버튼(토트 재고/보충) - OrderDetail의 ProductManageModal을 열어주면 됨 */
  onOpenProductManage?: (productCode: string) => void;
};

/** ✅ 기본 가정값(데이터 없어도 plan 계산되게 강제) */
const DEFAULT_EA_PER_BOX = 115;
const DEFAULT_BOXES_PER_PALLET = 10;

/** ✅ 입출고장 슬롯(임시 기본). 실제 맵 정의로 교체하면 됨 */
const OUTBOUND_SLOTS: string[] = Array.from({ length: 10 }, (_, i) => `A-${i + 1}`);

/**
 * ✅ StepShell
 * - "상태 뱃지(진행중/대기/완료)"는 여기서 렌더링하지 않음(공백/겹침 원인)
 * - 대신 active일 때만 강조(ring)만 줌
 */
function StepShell({
  active,
  children,
  onFocus,
}: {
  active?: boolean;
  children: React.ReactNode;
  onFocus?: () => void;
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white p-4",
        active ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200",
      ].join(" ")}
      onClick={onFocus}
    >
      {children}
    </div>
  );
}

function calcPlan(orderEaQty: number, eaPerPallet?: number, eaPerBox?: number) {
  const palletUnit = Number(eaPerPallet ?? 0);
  const boxUnit = Number(eaPerBox ?? 0);

  if (!Number.isFinite(orderEaQty) || orderEaQty < 0) {
    return { pallets: null, boxes: null, eas: null };
  }

  if (!palletUnit || !boxUnit) {
    return {
      pallets: palletUnit ? Math.floor(orderEaQty / palletUnit) : null,
      boxes: null,
      eas: null,
    };
  }

  const pallets = Math.floor(orderEaQty / palletUnit);
  const remAfterPallet = Math.max(0, orderEaQty - pallets * palletUnit);
  const boxes = Math.floor(remAfterPallet / boxUnit);
  const eas = Math.max(0, remAfterPallet - boxes * boxUnit);

  return { pallets, boxes, eas };
}

export function TransferFlowModal({
  open,
  onClose,
  productCode,
  productName,
  orderEaQty,
  existingTransfer,
  existingDestinationSlots,
  eaPerBox,
  eaPerPallet,
  remainingEaQty,
  initialStep,
  initialDraft,
  onSaveProgress,
  onConfirmDirectTransfer,
  onConfirmResidualTransfer,
  onOpenProductManage,
}: Props) {
  const [focusStep, setFocusStep] = useState<TransferFlowStep>(initialStep ?? 1);
  const [draft, setDraft] = useState<ResidualDraft>(initialDraft ?? EMPTY_DRAFT);
  const [directInfo, setDirectInfo] = useState<TransferInfo | null>(existingTransfer);

  /** ✅ 단위값 “항상” 확보 (props 없으면 기본 가정값 적용) */
  const effectiveEaPerBox = useMemo(() => {
    const v = Number(eaPerBox ?? 0);
    return v > 0 ? v : DEFAULT_EA_PER_BOX;
  }, [eaPerBox]);

  const effectiveEaPerPallet = useMemo(() => {
    const v = Number(eaPerPallet ?? 0);
    if (v > 0) return v;
    return DEFAULT_EA_PER_BOX * DEFAULT_BOXES_PER_PALLET; // 1150
  }, [eaPerPallet]);

  /** ✅ 계획 계산 */
  const plan = useMemo(
    () => calcPlan(Number(orderEaQty || 0), effectiveEaPerPallet, effectiveEaPerBox),
    [orderEaQty, effectiveEaPerPallet, effectiveEaPerBox],
  );

  // 1STEP 입력(자동 배정용)
  const [directPalletQty, setDirectPalletQty] = useState<number>(0);

  const directTransferEaQty = useMemo(() => {
    return Number(
      (directInfo as any)?.transferEaQty ?? (existingTransfer as any)?.transferEaQty ?? 0,
    );
  }, [directInfo, existingTransfer]);

  /** ✅ Step1 확정 목적지 슬롯들 (Step1DirectTransfer 기준: destinationSlots 확정) */
  const step1AssignedOutboundSlots = useMemo(() => {
    const fromDirect = (directInfo as any)?.destinationSlots as string[] | undefined;
    const fromExisting = (existingTransfer as any)?.destinationSlots as string[] | undefined;
    return (fromDirect?.length ? fromDirect : fromExisting ?? []).filter(Boolean);
  }, [directInfo, existingTransfer]);

  /** ✅ 점유 슬롯(선택 불가) */
  const occupiedOutboundSlots = useMemo(() => {
    return (existingDestinationSlots ?? []).filter(Boolean);
  }, [existingDestinationSlots]);

  // ✅ 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (!open) return;

    setFocusStep(initialStep ?? 1);

    setDraft(() => {
      const base = initialDraft ?? EMPTY_DRAFT;

      const next: ResidualDraft = {
        ...base,
        planPalletQty: base.planPalletQty ?? (plan.pallets ?? undefined),
        planBoxQty: base.planBoxQty ?? (plan.boxes ?? undefined),
        planEaQty: base.planEaQty ?? (plan.eas ?? undefined),
      };

      return next;
    });

    setDirectInfo(existingTransfer);

    // ✅ 1STEP 기본 입력: "항상" 포장계획(계획 파렛트 수량)으로 리셋
    setDirectPalletQty(plan.pallets ?? 0);
  }, [open, initialStep, initialDraft, existingTransfer, plan.pallets, plan.boxes, plan.eas]);

  const setDraftSafe = (next: ResidualDraft, stepToSave: TransferFlowStep) => {
    setDraft(next);
    onSaveProgress?.(stepToSave, next);
  };

  const targetBoxQty = Number(draft.planBoxQty ?? plan.boxes ?? 0);
  const targetEaQty = Number(draft.planEaQty ?? plan.eas ?? 0);

  const buildResidualPayload = (): ResidualTransferPayload => {
    const boxUnit = Number(effectiveEaPerBox ?? 0);
    const packedLines: any[] = [];

    // 2STEP(박스) -> EA 환산
    for (const [palletId, boxQty] of Object.entries(draft.residualBoxPickMap || {})) {
      const b = Number(boxQty || 0);
      if (b <= 0) continue;

      const unit = Number(draft.residualPalletMeta?.[palletId]?.eaPerBox ?? 0) || boxUnit;
      const eaQty = unit ? b * unit : 0;

      packedLines.push({
        sourceType: "PALLET",
        sourceId: palletId,
        eaQty,
        fromLocation: "2층 잔량랙",
      });
    }

    // 3STEP(토트) EA 그대로
    for (const [toteId, eaQtyRaw] of Object.entries(draft.toteEaPickMap || {})) {
      const eaQty = Number(eaQtyRaw || 0);
      if (eaQty <= 0) continue;

      packedLines.push({
        sourceType: "TOTE",
        sourceId: toteId,
        eaQty,
        fromLocation: "피킹라인",
      });
    }

    const totalEa = packedLines.reduce((a, b) => a + Number(b?.eaQty || 0), 0);

    return {
      productCode,
      productName,
      totalEa,
      emptyPalletId: draft.consolidationPalletId, // 합포 파렛트에 귀속
      destSlot: draft.eaDestSlot ?? draft.boxDestSlot ?? null,
      consolidationDestSlot: draft.consolidationDestSlot ?? null, // ✅ 합포 파렛트 목적지
      packedLines,
    } as any;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[740px] w-[1040px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <Header
          step={focusStep}
          productCode={productCode}
          productName={productName}
          orderEaQty={orderEaQty}
          directTransferEaQty={directTransferEaQty}
          remainingEaQty={remainingEaQty}
          plan={plan}
          onClose={onClose}
        />

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <StepShell active={focusStep === 1} onFocus={() => setFocusStep(1)}>
              <Step1DirectTransfer
                productCode={productCode}
                productName={productName}
                orderEaQty={orderEaQty}
                eaPerPallet={effectiveEaPerPallet}
                planPalletQty={plan.pallets}
                planBoxQty={plan.boxes}
                planEaQty={plan.eas}
                existingTransfer={existingTransfer}
                existingDestinationSlots={existingDestinationSlots}
                directPalletQty={directPalletQty}
                onChangeDirectPalletQty={setDirectPalletQty}
                onApplyAutoDirect={(info) => {
                  setDirectInfo(info);
                  onConfirmDirectTransfer(info);
                  setFocusStep(2);
                }}
                onConfirmManualDirect={(info) => {
                  setDirectInfo(info);
                  onConfirmDirectTransfer(info);
                  setFocusStep(2);
                }}
              />
            </StepShell>

            <StepShell active={focusStep === 2} onFocus={() => setFocusStep(2)}>
              <Step2ResidualPrep
                productCode={productCode}
                productName={productName}
                targetBoxQty={targetBoxQty}
                eaPerBox={effectiveEaPerBox}
                planPalletQty={plan.pallets}
                planBoxQty={plan.boxes}
                planEaQty={plan.eas}
                draft={draft}
                onChangeDraft={(next) => setDraftSafe(next, 2)}
              />
            </StepShell>

            <StepShell active={focusStep === 3} onFocus={() => setFocusStep(3)}>
              <Step3ResidualResult
                productCode={productCode}
                productName={productName}
                targetEaQty={targetEaQty}
                planPalletQty={plan.pallets}
                planBoxQty={plan.boxes}
                planEaQty={plan.eas}
                draft={draft}
                onChangeDraft={(next) => setDraftSafe(next, 3)}
                onOpenManage={onOpenProductManage}
              />
            </StepShell>

            <StepShell active={focusStep === 4} onFocus={() => setFocusStep(4)}>
              <Step4ConsolidationPallet
                planPalletQty={plan.pallets}
                planBoxQty={plan.boxes}
                planEaQty={plan.eas}
                draft={draft}
                onChangeDraft={(next) => setDraftSafe(next, 4)}
                baseOutboundSlots={step1AssignedOutboundSlots}
                allOutboundSlots={OUTBOUND_SLOTS}
                occupiedOutboundSlots={occupiedOutboundSlots}
              />
            </StepShell>

            {/* 최종 확정 버튼 */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const payload = buildResidualPayload();
                  onConfirmResidualTransfer(payload);
                  onClose();
                }}
                className="rounded-full bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-emerald-700"
              >
                잔량 이송 확정
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}