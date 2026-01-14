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

type Props = {
  open: boolean;
  onClose: () => void;

  productCode: string;
  productName: string;

  orderEaQty: number;
  existingTransfer: TransferInfo | null;

  existingDestinationSlots: string[];

  remainingEaQty: number;
  initialStep: TransferFlowStep;
  initialDraft?: ResidualDraft;

  onSaveProgress?: (step: TransferFlowStep, draft: ResidualDraft) => void;

  onConfirmDirectTransfer: (info: TransferInfo) => void;
  onConfirmResidualTransfer: (payload: ResidualTransferPayload) => void;
};

function StepShell({
  title,
  status,
  summary,
  active,
  locked,
  children,
}: {
  title: string;
  status: "진행중" | "대기" | "완료";
  summary?: string;
  active?: boolean;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white p-4",
        active ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200",
        locked ? "pointer-events-none opacity-40" : "",
      ].join(" ")}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold">{title}</div>
          {summary && (
            <div className="mt-1 text-[12px] text-gray-600">
              {summary}
            </div>
          )}
        </div>

        <span
          className={[
            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
            status === "진행중"
              ? "bg-blue-50 text-blue-700"
              : status === "완료"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-600",
          ].join(" ")}
        >
          {status}
        </span>
      </div>

      {children}
    </div>
  );
}

export function TransferFlowModal({
  open,
  onClose,
  productCode,
  productName,
  orderEaQty,
  existingTransfer,
  existingDestinationSlots,
  remainingEaQty,
  initialStep,
  initialDraft,
  onSaveProgress,
  onConfirmDirectTransfer,
  onConfirmResidualTransfer,
}: Props) {
  const [step, setStep] = useState<TransferFlowStep>(initialStep);
  const [draft, setDraft] = useState<ResidualDraft>(initialDraft ?? EMPTY_DRAFT);
  const [directInfo, setDirectInfo] = useState<TransferInfo | null>(existingTransfer);

  const hasResidual = useMemo(() => Number(remainingEaQty) > 0, [remainingEaQty]);

  const directTransferEaQty = useMemo(() => {
    return Number(
      (directInfo as any)?.transferEaQty ??
        (existingTransfer as any)?.transferEaQty ??
        0,
    );
  }, [directInfo, existingTransfer]);

  const directDestSlots =
    ((directInfo as any)?.destinationSlots as string[] | undefined) ??
    ((existingTransfer as any)?.destinationSlots as string[] | undefined) ??
    existingDestinationSlots;

  useEffect(() => {
    if (!open) return;
    setStep(initialStep);
    setDraft(initialDraft ?? EMPTY_DRAFT);
    setDirectInfo(existingTransfer);
  }, [open, initialStep, initialDraft, existingTransfer]);

  const setDraftSafe = (next: ResidualDraft, stepToSave: TransferFlowStep) => {
    setDraft(next);
    onSaveProgress?.(stepToSave, next);
  };

  const handleConfirmDirect = (info: TransferInfo) => {
    setDirectInfo(info);
    onConfirmDirectTransfer(info);

    const transferEa = Number((info as any).transferEaQty ?? 0);
    const remainByCalc = Math.max(0, Number(orderEaQty) - transferEa);
    const remain =
      typeof (info as any).remainingEaQty === "number"
        ? Math.max(0, Number((info as any).remainingEaQty))
        : remainByCalc;

    if (remain > 0) {
      const nextStep: TransferFlowStep = 2;
      setStep(nextStep);
      onSaveProgress?.(nextStep, draft);
      return;
    }

    onClose();
  };

  const handleConfirmCallingOnly = (nextDraft: ResidualDraft) => {
    setDraftSafe(nextDraft, 2);
    const nextStep: TransferFlowStep = 3;
    setStep(nextStep);
    onSaveProgress?.(nextStep, nextDraft);
  };

  const handleConfirmResidual = (
    payload: ResidualTransferPayload,
    nextDraft: ResidualDraft,
  ) => {
    setDraftSafe(nextDraft, 3);
    onConfirmResidualTransfer(payload);
    onClose();
  };

  const lockStep2 = !hasResidual; // ✅ 잔량 없으면 Step2/3 통째로 잠김
  const lockStep3 = !hasResidual;

  const status1: "진행중" | "대기" | "완료" =
    step === 1 ? "진행중" : directTransferEaQty > 0 ? "완료" : "대기";
  const status2: "진행중" | "대기" | "완료" =
    !hasResidual ? "대기" : step === 2 ? "진행중" : step > 2 ? "완료" : "대기";
  const status3: "진행중" | "대기" | "완료" =
    !hasResidual ? "대기" : step === 3 ? "진행중" : "대기";

  // ✅ STEP 요약(상단에 박히는 한 줄)
  const step1Summary = useMemo(() => {
    const pallets = (directInfo as any)?.palletIds ?? (existingTransfer as any)?.palletIds ?? [];
    const dest = (directDestSlots ?? []).filter(Boolean);

    if (!pallets.length && directTransferEaQty <= 0) return "아직 선택된 파렛트 없음";
    return `파렛트 ${pallets.length}개 · ${directTransferEaQty.toLocaleString()} EA · 목적지 ${dest.length ? dest.join(", ") : "-"}`;
  }, [directInfo, existingTransfer, directDestSlots, directTransferEaQty]);

  const step2Summary = useMemo(() => {
    if (!hasResidual) return "잔량 0EA라 2STEP 없음";
    const p = draft.calledPalletIds?.length ?? 0;
    const t = draft.calledToteIds?.length ?? 0;
    return `호출 파렛트 ${p} · 호출 토트 ${t}`;
  }, [draft.calledPalletIds, draft.calledToteIds, hasResidual]);

  const step3Summary = useMemo(() => {
    if (!hasResidual) return "잔량 0EA라 3STEP 없음";
    const pCount =
      Object.keys(draft.palletBoxPickMap || {}).filter(
        (k) => (draft.palletBoxPickMap?.[k] ?? 0) > 0,
      ).length;
    const tCount =
      Object.keys(draft.toteEaPickMap || {}).filter(
        (k) => (draft.toteEaPickMap?.[k] ?? 0) > 0,
      ).length;

    const total =
      Object.values(draft.palletBoxPickMap || {}).reduce((a, b) => a + Number(b || 0), 0) +
      Object.values(draft.toteEaPickMap || {}).reduce((a, b) => a + Number(b || 0), 0);

    return `입력 ${total.toLocaleString()} EA (파렛트 ${pCount}/토트 ${tCount}) · 목적지 ${draft.destSlot ?? "-"} · 빈파렛트 ${draft.emptyPalletId?.trim() ? draft.emptyPalletId : "-"}`;
  }, [draft, hasResidual]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[720px] w-[980px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <Header
          step={step}
          productCode={productCode}
          productName={productName}
          orderEaQty={orderEaQty}
          directTransferEaQty={directTransferEaQty}
          remainingEaQty={remainingEaQty}
          onClose={onClose}
        />

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <StepShell
              title="1 STEP · 지정이송"
              status={status1}
              summary={step1Summary}
              active={step === 1}
            >
              <Step1DirectTransfer
                productCode={productCode}
                productName={productName}
                orderEaQty={orderEaQty}
                existingTransfer={existingTransfer}
                existingDestinationSlots={existingDestinationSlots}
                onConfirmDirectTransfer={(info) => {
                  handleConfirmDirect(info);
                  // ✅ 1STEP 확정하면 진행중 포커스는 2로 넘어가도,
                  // UI는 한 화면이라서 "어디 작업중" 표시용 step은 그대로 세팅해둠
                  // (남은 잔량 있으면 step=2가 되고 강조도 2로 감)
                  const remain = Math.max(0, orderEaQty - Number((info as any)?.transferEaQty ?? 0));
                  if (remain > 0) setStep(2);
                }}
                onClose={onClose}
              />
            </StepShell>

            <StepShell
              title="2 STEP · 파렛트/토트 호출"
              status={status2}
              summary={step2Summary}
              active={step === 2}
              locked={lockStep2}
            >
              <Step2ResidualPrep
                productCode={productCode}
                productName={productName}
                remainingEaQty={remainingEaQty}
                draft={draft}
                onChangeDraft={(next) => setDraftSafe(next, 2)}
                onConfirmCalling={(nextDraft) => {
                  handleConfirmCallingOnly(nextDraft);
                  setStep(3);
                }}
                onBack={() => setStep(1)}
              />
            </StepShell>

            <StepShell
              title="3 STEP · 잔량 출고/이송 확정"
              status={status3}
              summary={step3Summary}
              active={step === 3}
              locked={lockStep3}
            >
              <Step3ResidualResult
                productCode={productCode}
                productName={productName}
                remainingEaQty={remainingEaQty}
                draft={draft}
                directDestinationSlots={directDestSlots}
                onChangeDraft={(next) => setDraftSafe(next, 3)}
                onBack={() => setStep(2)}
                onConfirmResidual={handleConfirmResidual}
              />
            </StepShell>
          </div>
        </div>
      </div>
    </div>
  );
}
