// components/OutboundResidualPrepModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PackedLine, ResidualTransferPayload } from "./types";

/* ================= 타입 ================= */
type ZoneId = "A" | "B" | "C" | "D";
type Step = 2 | 3 | 4;

type Props = {
  open: boolean;
  onClose: () => void;

  productCode: string;
  productName?: string;

  remainingEaQty: number;

  initialStep?: 2 | 3 | 4;
  initialDraft?: any;
  onSaveProgress?: (step: 2 | 3 | 4, draft: any) => void;

  // 기존 지정이송 위치(파란색 표시)
  existingDestinationSlots?: string[];

  onTransfer?: (payload: ResidualTransferPayload) => void;
};

/* ================= 데모 데이터 ================= */
const BOX_EA_PER_BOX = 300;

// 파렛트(해당 상품만)
type DemoPallet = {
  id: string;
  location: string;
  lotNo: string;
  productCode: string;
  productName: string;
  boxQty: number;
  eaQty: number;
};

const DEMO_PALLETS: DemoPallet[] = [
  {
    id: "PAL-001-01",
    location: "3층창고",
    lotNo: "LOT-2501-A",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    boxQty: 10,
    eaQty: 1200,
  },
  {
    id: "PAL-001-02",
    location: "3층창고",
    lotNo: "LOT-2501-B",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    boxQty: 8,
    eaQty: 960,
  },
  {
    id: "PAL-001-03",
    location: "2층창고",
    lotNo: "LOT-2501-A",
    productCode: "P-001",
    productName: "PET 500ml 투명",
    boxQty: 6,
    eaQty: 720,
  },
];

// 토트(여러 상품 혼재)
type DemoTote = {
  id: string;
  location: string;
  lines: { productCode: string; eaQty: number }[];
};

const DEMO_TOTES: DemoTote[] = [
  {
    id: "TOTE-001",
    location: "피킹존-01",
    lines: [
      { productCode: "P-001", eaQty: 180 },
      { productCode: "C-201", eaQty: 60 },
    ],
  },
  {
    id: "TOTE-002",
    location: "피킹존-02",
    lines: [{ productCode: "P-001", eaQty: 90 }],
  },
];

// 빈파렛트
type DemoEmptyPallet = { id: string; location: string };
const DEMO_EMPTY_PALLETS: DemoEmptyPallet[] = [
  { id: "EMP-PLT-001", location: "빈파렛트존-A" },
  { id: "EMP-PLT-002", location: "빈파렛트존-A" },
  { id: "EMP-PLT-003", location: "빈파렛트존-B" },
  { id: "EMP-PLT-004", location: "빈파렛트존-B" },
];

// 입출고장 점유(노랑)
const OCCUPIED_SET = new Set<string>(["A-1-1", "A-1-2", "B-2-1", "B-2-2"]);
const ROWS = 4;
const COLS = 4;

/* ================= draft(임시저장) ================= */
type ResidualDraft = {
  step: Step;

  calledPallets: Record<string, boolean>;
  calledTotes: Record<string, boolean>;

  palletPickMap: Record<string, number>;
  totePickMap: Record<string, number>;

  emptyPalletId: string;
  packedLines: PackedLine[];

  destSlot: string | null;

  // Step4용 요약 스냅샷
  result?: {
    totalPackedEa: number;
    emptyPalletId: string;
    destSlot: string;
    packedLines: PackedLine[];
    // 추가 요약
    calledPalletIds: string[];
    calledToteIds: string[];
    inputPalletEa: number;
    inputToteEa: number;
  };
};

function draftKey(productCode: string) {
  return `wms:residualDraft:${productCode}`;
}

function safeParseDraft(raw: string | null): ResidualDraft | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return obj as ResidualDraft;
  } catch {
    return null;
  }
}

/* ================= 컴포넌트 ================= */
export function OutboundResidualPrepModal({
  open,
  onClose,
  productCode,
  productName,
  remainingEaQty,
  existingDestinationSlots = [],
  onTransfer,
  initialStep,
  initialDraft,
  onSaveProgress,
}: Props) {
  /* ===== step ===== */
  const [step, setStep] = useState<Step>(2);

  /* ===== 호출 상태 ===== */
  const [calledPallets, setCalledPallets] = useState<Record<string, boolean>>(
    {},
  );
  const [calledTotes, setCalledTotes] = useState<Record<string, boolean>>({});

  /* ===== 출고 입력 ===== */
  const [palletPickMap, setPalletPickMap] = useState<Record<string, number>>(
    {},
  );
  const [totePickMap, setTotePickMap] = useState<Record<string, number>>({});

  /* ===== 빈파렛트 ===== */
  const [emptyPalletId, setEmptyPalletId] = useState<string>("");
  const [emptyPalletSearch, setEmptyPalletSearch] = useState<string>("");

  /* ===== 담긴 내역 ===== */
  const [packedLines, setPackedLines] = useState<PackedLine[]>([]);

  /* ===== 목적지 ===== */
  const [destSlot, setDestSlot] = useState<string | null>(null);

  /* ===== Step4 결과 스냅샷 ===== */
  const [resultSnap, setResultSnap] = useState<ResidualDraft["result"]>(
    undefined,
  );

  const palletsForProduct = useMemo(() => {
    return DEMO_PALLETS.filter((p) => p.productCode === productCode);
  }, [productCode]);

  const totesForProduct = useMemo(() => {
    return DEMO_TOTES.filter((t) =>
      t.lines.some((l) => l.productCode === productCode),
    );
  }, [productCode]);

  /* ✅ 호출된 것만 보여주기용(항상 실행되어야 함: 조건문/step 안에 두면 훅 오류남) */
const calledPalletIds = useMemo(() => {
  return Object.keys(calledPallets).filter((id) => calledPallets[id]);
}, [calledPallets]);

const calledToteIds = useMemo(() => {
  return Object.keys(calledTotes).filter((id) => calledTotes[id]);
}, [calledTotes]);

  /* ===== 잔량 요약 ===== */
  const remainBoxQty = useMemo(
    () => Math.floor((remainingEaQty ?? 0) / BOX_EA_PER_BOX),
    [remainingEaQty],
  );
  const remainEaQty = useMemo(
    () => (remainingEaQty ?? 0) % BOX_EA_PER_BOX,
    [remainingEaQty],
  );
  const remainBoxEaQty = useMemo(
    () => remainBoxQty * BOX_EA_PER_BOX,
    [remainBoxQty],
  );

  /* ===== Step2 경고용: 호출 가능량(데모 기준) ===== */
  const calledPalletEaCapacity = useMemo(() => {
    const idSet = new Set(calledPalletIds);
    return palletsForProduct
      .filter((p) => idSet.has(p.id))
      .reduce((s, p) => s + (p.eaQty ?? 0), 0);
  }, [calledPalletIds, palletsForProduct]);

  const calledToteEaCapacity = useMemo(() => {
    const idSet = new Set(calledToteIds);
    return totesForProduct
      .filter((t) => idSet.has(t.id))
      .reduce((s, t) => {
        const match = t.lines.find((l) => l.productCode === productCode);
        return s + (match?.eaQty ?? 0);
      }, 0);
  }, [calledToteIds, totesForProduct, productCode]);

  /* ===== Step3 입력 합계(실시간) ===== */
  const inputPalletEa = useMemo(() => {
    const idSet = new Set(calledPalletIds);
    return palletsForProduct
      .filter((p) => idSet.has(p.id))
      .reduce((s, p) => s + (palletPickMap[p.id] ?? 0), 0);
  }, [calledPalletIds, palletsForProduct, palletPickMap]);

  const inputToteEa = useMemo(() => {
    const idSet = new Set(calledToteIds);
    return totesForProduct
      .filter((t) => idSet.has(t.id))
      .reduce((s, t) => s + (totePickMap[t.id] ?? 0), 0);
  }, [calledToteIds, totesForProduct, totePickMap]);

  const inputTotalEa = inputPalletEa + inputToteEa;

  const totalPackedEa = useMemo(
    () => packedLines.reduce((s, x) => s + (x.eaQty ?? 0), 0),
    [packedLines],
  );

  const diffInputVsRemain = useMemo(
    () => (remainingEaQty ?? 0) - inputTotalEa,
    [remainingEaQty, inputTotalEa],
  );

  const diffPackedVsRemain = useMemo(
    () => (remainingEaQty ?? 0) - totalPackedEa,
    [remainingEaQty, totalPackedEa],
  );

  // Step3에서 목적지 선택 가능 조건
  const canSelectDest = totalPackedEa > 0 && !!emptyPalletId;

  const canGoStep3 =
    !!emptyPalletId &&
    (Object.values(calledPallets).some(Boolean) ||
      Object.values(calledTotes).some(Boolean));

  const canGoStep4 = totalPackedEa > 0 && !!emptyPalletId && !!destSlot;

  /* ================= draft 로드/세팅 ================= */
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (!productCode) return;

    hydratedRef.current = false;

    const draft = safeParseDraft(localStorage.getItem(draftKey(productCode)));
    if (!draft) {
      setStep((initialStep ?? 2) as Step);
      setCalledPallets({});
      setCalledTotes({});
      setPalletPickMap({});
      setTotePickMap({});
      setPackedLines([]);
      setEmptyPalletId("");
      setEmptyPalletSearch("");
      setDestSlot(null);
      setResultSnap(undefined);

      queueMicrotask(() => {
        hydratedRef.current = true;
      });
      return;
    }

    setStep((draft.step ?? initialStep ?? 2) as Step);
    setCalledPallets(draft.calledPallets ?? {});
    setCalledTotes(draft.calledTotes ?? {});
    setPalletPickMap(draft.palletPickMap ?? {});
    setTotePickMap(draft.totePickMap ?? {});
    setEmptyPalletId(draft.emptyPalletId ?? "");
    setPackedLines(draft.packedLines ?? []);
    setDestSlot(draft.destSlot ?? null);
    setResultSnap(draft.result);

    queueMicrotask(() => {
      hydratedRef.current = true;
    });
  }, [open, productCode, initialStep]);

  /* ===== draft 자동 저장 + 부모 진행상태 저장 ===== */
  useEffect(() => {
    if (!open) return;
    if (!productCode) return;
    if (!hydratedRef.current) return;

    const draft: ResidualDraft = {
      step,
      calledPallets,
      calledTotes,
      palletPickMap,
      totePickMap,
      emptyPalletId,
      packedLines,
      destSlot,
      result: resultSnap,
    };

    localStorage.setItem(draftKey(productCode), JSON.stringify(draft));
    onSaveProgress?.(step, draft);
  }, [
    open,
    productCode,
    step,
    calledPallets,
    calledTotes,
    palletPickMap,
    totePickMap,
    emptyPalletId,
    packedLines,
    destSlot,
    resultSnap,
    onSaveProgress,
  ]);

  const clearDraft = () => {
    if (!productCode) return;
    localStorage.removeItem(draftKey(productCode));
  };

  const resetAll = () => {
    setStep(2);
    setCalledPallets({});
    setCalledTotes({});
    setPalletPickMap({});
    setTotePickMap({});
    setPackedLines([]);
    setEmptyPalletId("");
    setEmptyPalletSearch("");
    setDestSlot(null);
    setResultSnap(undefined);
    clearDraft();
  };

  /* ===== 액션들 ===== */
  const handleCallEmptyPallet = () => {
    const pick =
      DEMO_EMPTY_PALLETS.find((p) => p.id !== emptyPalletId) ??
      DEMO_EMPTY_PALLETS[0];
    if (!pick) return;

    setEmptyPalletId(pick.id);
    alert(`빈파렛트 "${pick.id}" 호출되었습니다. (예시)`);
  };

  const applyEmptyPalletSearch = () => {
    const q = emptyPalletSearch.trim();
    if (!q) {
      alert("빈파렛트 ID를 입력해줘.");
      return;
    }

    // 데모 목록에서 찾고, 없으면 그대로도 허용(현장 QR 입력 케이스)
    const found = DEMO_EMPTY_PALLETS.find((p) => p.id === q);
    if (found) {
      setEmptyPalletId(found.id);
      alert(`빈파렛트 "${found.id}" 선택됨`);
      return;
    }

    // 실전에서는 API조회/검증 붙일 자리. 지금은 “입력값 그대로 선택”
    setEmptyPalletId(q);
    alert(`빈파렛트 "${q}" 선택됨(수동 입력)`);
  };

  const addPackedLinesFromPalletInputs = () => {
    const idSet = new Set(calledPalletIds);

    const lines: PackedLine[] = palletsForProduct
      .filter((p) => idSet.has(p.id))
      .filter((p) => (palletPickMap[p.id] ?? 0) > 0)
      .map((p) => ({
        type: "PALLET",
        sourceId: p.id,
        eaQty: palletPickMap[p.id] ?? 0,
      }));

    if (lines.length === 0) {
      alert("호출된 파렛트의 출고EA를 먼저 입력해줘.");
      return;
    }

    setPackedLines((prev) => [...prev, ...lines]);
  };

  const addPackedLinesFromToteInputs = () => {
    const idSet = new Set(calledToteIds);

    const lines: PackedLine[] = totesForProduct
      .filter((t) => idSet.has(t.id))
      .filter((t) => (totePickMap[t.id] ?? 0) > 0)
      .map((t) => ({
        type: "TOTE",
        sourceId: t.id,
        eaQty: totePickMap[t.id] ?? 0,
      }));

    if (lines.length === 0) {
      alert("호출된 토트의 출고EA를 먼저 입력해줘.");
      return;
    }

    setPackedLines((prev) => [...prev, ...lines]);
  };

  const gotoStep3 = () => {
    if (!canGoStep3) {
      alert("빈파렛트를 선택하고, 파렛트/토트를 최소 1개 이상 호출해줘.");
      return;
    }

    // ✅ Step2 경고: 호출 수량이 부족해도 넘어가긴 가능(경고만)
    const needBoxEa = remainBoxEaQty;
    const needEachEa = remainEaQty;

    const warnPallet = calledPalletEaCapacity < needBoxEa;
    const warnTote = calledToteEaCapacity < needEachEa;

    if (warnPallet || warnTote) {
      const msgLines: string[] = [];
      if (warnPallet) {
        msgLines.push(
          `- 파렛트 호출 가능량이 부족할 수 있어 (호출 ${calledPalletEaCapacity}EA < 필요 ${needBoxEa}EA)`,
        );
      }
      if (warnTote) {
        msgLines.push(
          `- 토트 호출 가능량이 부족할 수 있어 (호출 ${calledToteEaCapacity}EA < 필요 ${needEachEa}EA)`,
        );
      }
      const ok = confirm(
        `경고!\n${msgLines.join("\n")}\n\n그래도 Step3로 넘어갈까?`,
      );
      if (!ok) return;
    }

    setStep(3);
  };

  const gotoStep4 = () => {
    if (!canGoStep4) {
      alert("담긴 내역(총 적재)과 목적지 선택이 필요해.");
      return;
    }

    // ✅ Step3 경고: 잔량과 입력/적재가 불일치해도 넘어가긴 가능
    const warn =
      (remainingEaQty ?? 0) !== inputTotalEa ||
      (remainingEaQty ?? 0) !== totalPackedEa;

    if (warn) {
      const ok = confirm(
        `경고!\n- 잔량 ${remainingEaQty}EA\n- 입력합 ${inputTotalEa}EA (차이 ${diffInputVsRemain}EA)\n- 담긴합 ${totalPackedEa}EA (차이 ${diffPackedVsRemain}EA)\n\n그래도 Step4로 넘어갈까?`,
      );
      if (!ok) return;
    }

    setResultSnap({
      totalPackedEa,
      emptyPalletId,
      destSlot: destSlot!,
      packedLines: [...packedLines],
      calledPalletIds,
      calledToteIds,
      inputPalletEa,
      inputToteEa,
    });
    setStep(4);
  };

  const handleTransfer = () => {
    if (!resultSnap) {
      alert("결과 요약이 없어. (Step4로 먼저 이동해줘)");
      return;
    }

    alert(
      `제품 ${productName ?? productCode} (${productCode})\n수량 ${resultSnap.totalPackedEa.toLocaleString()} EA\n빈파렛트 ${resultSnap.emptyPalletId}\n목적지 ${resultSnap.destSlot}\n\n이송합니다.`,
    );

    onTransfer?.({
      productCode,
      productName,
      totalEa: resultSnap.totalPackedEa,
      emptyPalletId: resultSnap.emptyPalletId,
      destSlot: resultSnap.destSlot,
      packedLines: resultSnap.packedLines,
    });

    resetAll();
    onClose();
  };

  const handleCloseKeepDraft = () => {
    onClose();
  };

  const stepLabel =
    step === 2 ? "② 잔량 준비(호출)" : step === 3 ? "③ 잔량 적재" : "④ 결과";

  // ✅ Step3에서: 호출된 것만 보여주기용 리스트 (훅은 항상 실행되어야 함!)
  const calledPalletRows = useMemo(() => {
    const idSet = new Set(calledPalletIds);
    return palletsForProduct.filter((p) => idSet.has(p.id));
  }, [calledPalletIds, palletsForProduct]);

  const calledToteRows = useMemo(() => {
    const idSet = new Set(calledToteIds);
    return totesForProduct.filter((t) => idSet.has(t.id));
  }, [calledToteIds, totesForProduct]);

  // ✅ 여기서 return null 해야 훅 순서가 절대 안 깨짐
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* ✅ 1단계와 동일한 크기감을 유지 */}
      <div className="flex h-[700px] w-[980px] flex-col rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">
              잔량 처리 (Step {step}/4)
              <span className="ml-2 rounded-full border bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700">
                {stepLabel}
              </span>
            </h2>
            <p className="text-[11px] text-gray-500">
              대상 상품:{" "}
              <span className="font-semibold text-gray-700">
                {productCode} / {productName}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCloseKeepDraft}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              닫기(임시저장)
            </button>
            <button
              onClick={() => {
                if (confirm("임시저장 포함, 현재 잔량 작업을 초기화할까?")) {
                  resetAll();
                }
              }}
              className="rounded-full bg-white px-3 py-1 text-xs text-red-600 border border-red-200 hover:bg-red-50"
            >
              초기화
            </button>
          </div>
        </div>

       {/* ✅ 상단 요약: 컴팩트 바(높이 확 줄임) */}
      <div className="border-b px-6 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2 text-gray-700">
            <span className="font-semibold text-gray-900">잔량</span>
            <span className="rounded-full border bg-white px-2 py-0.5">
              {remainingEaQty.toLocaleString()} EA
            </span>

            <span className="text-gray-400">|</span>

            <span className="font-semibold text-gray-900">BOX</span>
            <span className="rounded-full border bg-white px-2 py-0.5">
              {remainBoxQty.toLocaleString()} ({remainBoxEaQty.toLocaleString()} EA)
            </span>

            <span className="text-gray-400">|</span>

            <span className="font-semibold text-gray-900">낱개</span>
            <span className="rounded-full border bg-white px-2 py-0.5">
              {remainEaQty.toLocaleString()} EA
            </span>

            {/* ✅ Step3에서만 “입력/차이”를 같이 보여주면 좋아 */}
            {step === 3 && (
              <>
                <span className="text-gray-400">|</span>
                <span className="font-semibold text-gray-900">입력합</span>
                <span className="rounded-full border bg-white px-2 py-0.5">
                  {totalPackedEa.toLocaleString()} EA
                </span>
                <span className="text-gray-400">|</span>
                <span className="font-semibold text-gray-900">차이</span>
                <span
                  className={`rounded-full border px-2 py-0.5 ${
                    totalPackedEa === remainingEaQty
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {(remainingEaQty - totalPackedEa).toLocaleString()} EA
                </span>
              </>
            )}
          </div>

          <div className="text-gray-500">
            박스기준: <span className="font-medium text-gray-700">{BOX_EA_PER_BOX}</span> EA/BOX
          </div>
        </div>
      </div>

        {/* 본문 */}
        <div className="flex flex-1 gap-4 overflow-hidden px-5 py-4">
          {/* ========================= STEP 2 ========================= */}
          {step === 2 && (
            <>
              {/* 좌: 파렛트 / 우: 토트 */}
              <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                <Section title="파렛트 내역 · 호출">
                  <div className="flex-1 overflow-auto rounded-lg bg-white">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 border-b bg-gray-50">
                        <tr>
                          <Th left className="w-[92px]">파렛트ID</Th>
                          <Th left className="w-[70px]">위치</Th>
                          <Th left className="w-[92px]">LOT</Th>
                          <Th right className="w-[52px]">BOX</Th>
                          <Th right className="w-[76px]">EA</Th>
                          <Th center className="w-[60px]">호출</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {palletsForProduct.map((p) => {
                          const called = !!calledPallets[p.id];
                          return (
                            <tr key={p.id} className="border-b last:border-b-0 hover:bg-gray-50">
                              <Td>{p.id}</Td>
                              <Td>{p.location}</Td>
                              <Td>{p.lotNo}</Td>
                              <Td right>{p.boxQty.toLocaleString()}</Td>
                              <Td right>{p.eaQty.toLocaleString()}</Td>
                              <Td center>
                                <button
                                  type="button"
                                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                                    called
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-900 text-white hover:bg-gray-800"
                                  }`}
                                  onClick={() => {
                                    setCalledPallets((prev) => ({
                                      ...prev,
                                      [p.id]: !prev[p.id] ? true : true,
                                    }));
                                  }}
                                >
                                  {called ? "호출됨" : "호출"}
                                </button>
                              </Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
                    <div>
                      호출된 파렛트:{" "}
                      <b className="text-gray-800">{calledPalletIds.length}</b>개
                    </div>
                    <div>
                      호출 가능량(EA):{" "}
                      <b className="text-gray-800">{calledPalletEaCapacity}</b>
                    </div>
                  </div>
                </Section>

                <Section title="빈파렛트 · 호출/검색/QR">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-800"
                      onClick={handleCallEmptyPallet}
                    >
                      빈파렛트 호출
                    </button>

                    <div className="flex items-center gap-2">
                      <input
                        value={emptyPalletSearch}
                        onChange={(e) => setEmptyPalletSearch(e.target.value)}
                        placeholder="빈파렛트 ID (QR/검색 입력)"
                        className="h-9 w-[260px] rounded-md border px-3 text-[12px]"
                      />
                      <button
                        type="button"
                        className="rounded-full border bg-white px-3 py-1 text-xs hover:bg-gray-50"
                        onClick={applyEmptyPalletSearch}
                      >
                        적용
                      </button>
                    </div>

                    <div className="ml-auto text-[11px] text-gray-600">
                      선택된 빈파렛트:{" "}
                      <b className="text-gray-800">{emptyPalletId || "-"}</b>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-gray-500">
                    * 호출 버튼으로도 선택 가능 / QR(또는 검색)으로 입력해도 선택되게 해둠
                  </div>
                </Section>
              </div>

              <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                <Section title="토트 내역 · 호출">
                  <div className="flex-1 overflow-auto rounded-lg bg-white">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 border-b bg-gray-50">
                        <tr>
                          <Th left className="w-[92px]">토트ID</Th>
                          <Th left className="w-[80px]">위치</Th>
                          <Th left>내용물</Th>
                          <Th right className="w-[72px]">해당EA</Th>
                          <Th center className="w-[60px]">호출</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {totesForProduct.map((t) => {
                          const called = !!calledTotes[t.id];
                          const match = t.lines.find((l) => l.productCode === productCode);
                          const matchEa = match?.eaQty ?? 0;
                          const contentStr = t.lines
                            .map((l) => `${l.productCode}(${l.eaQty})`)
                            .join(", ");

                          return (
                            <tr key={t.id} className="border-b last:border-b-0 hover:bg-gray-50">
                              <Td>{t.id}</Td>
                              <Td>{t.location}</Td>
                              <Td>{contentStr}</Td>
                              <Td right>{matchEa.toLocaleString()}</Td>
                              <Td center>
                                <button
                                  type="button"
                                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                                    called
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-900 text-white hover:bg-gray-800"
                                  }`}
                                  onClick={() => {
                                    setCalledTotes((prev) => ({
                                      ...prev,
                                      [t.id]: !prev[t.id] ? true : true,
                                    }));
                                  }}
                                >
                                  {called ? "호출됨" : "호출"}
                                </button>
                              </Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
                    <div>
                      호출된 토트:{" "}
                      <b className="text-gray-800">{calledToteIds.length}</b>개
                    </div>
                    <div>
                      호출 가능량(EA):{" "}
                      <b className="text-gray-800">{calledToteEaCapacity}</b>
                    </div>
                  </div>
                </Section>

                <div className="mt-auto flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseKeepDraft}
                    className="rounded-full border bg-white px-3 py-2 text-xs hover:bg-gray-50"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    disabled={!canGoStep3}
                    onClick={gotoStep3}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      canGoStep3
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "cursor-not-allowed bg-gray-200 text-gray-400"
                    }`}
                  >
                    다음
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ========================= STEP 3 ========================= */}
          {step === 3 && (
            <>
              {/* 좌: 파렛트(호출된 것만) */}
              <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-auto pr-1">
                <Section title="파렛트(호출된 것만) · 출고EA 입력">
                  <div className="flex-1 overflow-auto rounded-lg bg-white">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 border-b bg-gray-50">
                        <tr>
                          <Th left className="w-[92px]">파렛트ID</Th>
                          <Th left className="w-[70px]">위치</Th>
                          <Th left className="w-[92px]">LOT</Th>
                          <Th right className="w-[52px]">EA</Th>
                          <Th right className="w-[96px]">출고EA</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {calledPalletRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-3 text-center text-gray-400">
                              호출된 파렛트가 없어.
                            </td>
                          </tr>
                        ) : (
                          calledPalletRows.map((p) => (
                            <tr key={p.id} className="border-b last:border-b-0 hover:bg-gray-50">
                              <Td>{p.id}</Td>
                              <Td>{p.location}</Td>
                              <Td>{p.lotNo}</Td>
                              <Td right>{p.eaQty.toLocaleString()}</Td>
                              <Td right>
                                <input
                                  type="number"
                                  min={0}
                                  max={p.eaQty}
                                  value={palletPickMap[p.id] ?? 0}
                                  onChange={(e) =>
                                    setPalletPickMap((prev) => ({
                                      ...prev,
                                      [p.id]: Number(e.target.value || 0),
                                    }))
                                  }
                                  className="h-8 w-full rounded-md border px-2 text-right text-[12px]"
                                />
                              </Td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      입력합: <b className="text-gray-700">{inputPalletEa}</b> EA
                    </span>
                    <button
                      type="button"
                      className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      onClick={addPackedLinesFromPalletInputs}
                    >
                      파렛트 입력분 담기
                    </button>
                  </div>
                </Section>

                <Section title="담긴 내역(실제 적재) · 삭제 가능">
                  <div className="rounded-lg border bg-white">
                    {packedLines.length === 0 ? (
                      <div className="px-3 py-4 text-center text-[11px] text-gray-400">
                        아직 담긴 내역이 없어. (위에서 “담기” 눌러줘)
                      </div>
                    ) : (
                      <ul className="max-h-[170px] overflow-auto divide-y">
                        {packedLines.map((x, idx) => (
                          <li
                            key={`${x.type}-${x.sourceId}-${idx}`}
                            className="flex items-center justify-between px-3 py-2"
                          >
                            <div className="text-[11px] text-gray-700">
                              {x.type === "PALLET" ? "파렛트" : "토트"}{" "}
                              <b>{x.sourceId}</b> →{" "}
                              <b>{x.eaQty.toLocaleString()}</b> EA
                            </div>
                            <button
                              type="button"
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-200"
                              onClick={() =>
                                setPackedLines((prev) => prev.filter((_, i) => i !== idx))
                              }
                            >
                              삭제
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
                    <div>
                      총 적재: <b className="text-gray-800">{totalPackedEa}</b> EA
                    </div>
                    <div>
                      잔량과 차이:{" "}
                      <b className={diffPackedVsRemain === 0 ? "text-gray-800" : "text-red-600"}>
                        {diffPackedVsRemain}
                      </b>
                    </div>
                  </div>
                </Section>
              </div>

              {/* 우: 토트 + 빈파렛트 + 맵 */}
              <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-auto pr-1">
                <Section title="토트(호출된 것만) · 출고EA 입력">
                  <div className="flex-1 overflow-auto rounded-lg bg-white">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 border-b bg-gray-50">
                        <tr>
                          <Th left className="w-[92px]">토트ID</Th>
                          <Th left className="w-[80px]">위치</Th>
                          <Th right className="w-[72px]">해당EA</Th>
                          <Th right className="w-[96px]">출고EA</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {calledToteRows.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-3 text-center text-gray-400">
                              호출된 토트가 없어.
                            </td>
                          </tr>
                        ) : (
                          calledToteRows.map((t) => {
                            const match = t.lines.find((l) => l.productCode === productCode);
                            const matchEa = match?.eaQty ?? 0;
                            return (
                              <tr key={t.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                <Td>{t.id}</Td>
                                <Td>{t.location}</Td>
                                <Td right>{matchEa.toLocaleString()}</Td>
                                <Td right>
                                  <input
                                    type="number"
                                    min={0}
                                    max={matchEa}
                                    value={totePickMap[t.id] ?? 0}
                                    onChange={(e) =>
                                      setTotePickMap((prev) => ({
                                        ...prev,
                                        [t.id]: Number(e.target.value || 0),
                                      }))
                                    }
                                    className="h-8 w-full rounded-md border px-2 text-right text-[12px]"
                                  />
                                </Td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      입력합: <b className="text-gray-700">{inputToteEa}</b> EA
                    </span>
                    <button
                      type="button"
                      className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      onClick={addPackedLinesFromToteInputs}
                    >
                      토트 입력분 담기
                    </button>
                  </div>
                </Section>

                <Section title="빈파렛트 + 목적지 선택(A~D)">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] text-gray-600">
                      빈파렛트: <b className="text-gray-800">{emptyPalletId || "-"}</b>
                    </div>
                    <div className="text-[11px] text-gray-600">
                      목적지: <b className="text-gray-800">{destSlot || "-"}</b>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-800"
                      onClick={handleCallEmptyPallet}
                    >
                      빈파렛트 호출
                    </button>

                    <input
                      value={emptyPalletSearch}
                      onChange={(e) => setEmptyPalletSearch(e.target.value)}
                      placeholder="빈파렛트 ID 입력"
                      className="h-9 flex-1 rounded-md border px-3 text-[12px]"
                    />
                    <button
                      type="button"
                      className="rounded-full border bg-white px-3 py-1 text-xs hover:bg-gray-50"
                      onClick={applyEmptyPalletSearch}
                    >
                      적용
                    </button>
                  </div>

                  <div className="mt-3 rounded-lg border bg-white p-3">
                    <Legend
                      items={[
                        { label: "기존 지정이송 위치", className: "bg-blue-500" },
                        {
                          label: "이번 잔량 목적지",
                          className: "border-emerald-500 bg-white",
                          ring: true,
                        },
                        { label: "점유", className: "bg-amber-300" },
                      ]}
                    />

                    <div className="mt-3 grid grid-cols-2 gap-6">
                      {(["A", "B", "C", "D"] as ZoneId[]).map((zone) => (
                        <ZoneGrid
                          key={zone}
                          zone={zone}
                          rows={ROWS}
                          cols={COLS}
                          occupiedSet={OCCUPIED_SET}
                          existingSlots={existingDestinationSlots}
                          selectedSlot={destSlot}
                          canSelect={canSelectDest}
                          onSelect={(id) => setDestSlot(id)}
                        />
                      ))}
                    </div>

                    <div className="mt-2 text-[11px] text-gray-500">
                      * 목적지 선택은 “빈파렛트 선택 + 담긴합계 &gt; 0”일 때만 가능
                    </div>
                  </div>
                </Section>

                <div className="mt-auto flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-full border bg-white px-3 py-2 text-xs hover:bg-gray-50"
                  >
                    이전
                  </button>

                  <button
                    type="button"
                    disabled={!canGoStep4}
                    onClick={gotoStep4}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      canGoStep4
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "cursor-not-allowed bg-gray-200 text-gray-400"
                    }`}
                  >
                    다음
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ========================= STEP 4 ========================= */}
          {step === 4 && (
            <>
              <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                <Section title="④ 결과 요약">
                  <div className="rounded-lg border bg-white p-3 text-[12px] text-gray-700">
                    <div>
                      상품: <b>{productCode}</b> / {productName}
                    </div>
                    <div className="mt-1">
                      잔량: <b>{remainingEaQty.toLocaleString()}</b> EA
                    </div>
                    <div className="mt-1">
                      적재(담긴):{" "}
                      <b>{(resultSnap?.totalPackedEa ?? totalPackedEa).toLocaleString()}</b> EA
                      <span className="ml-2 text-[11px] text-gray-500">
                        (차이 {diffPackedVsRemain})
                      </span>
                    </div>
                    <div className="mt-1">
                      빈파렛트: <b>{resultSnap?.emptyPalletId ?? emptyPalletId}</b>
                    </div>
                    <div className="mt-1">
                      도착지: <b>{resultSnap?.destSlot ?? destSlot ?? "-"}</b>
                    </div>
                  </div>
                </Section>

                <Section title="호출/입력/내역 요약">
                  <div className="rounded-lg border bg-white p-3 text-[11px] text-gray-700 space-y-2">
                    <div className="flex flex-wrap gap-4">
                      <div>
                        호출 파렛트:{" "}
                        <b>{resultSnap?.calledPalletIds?.length ?? calledPalletIds.length}</b>개
                      </div>
                      <div>
                        호출 토트:{" "}
                        <b>{resultSnap?.calledToteIds?.length ?? calledToteIds.length}</b>개
                      </div>
                      <div>
                        입력합:{" "}
                        <b>
                          {(resultSnap
                            ? (resultSnap.inputPalletEa + resultSnap.inputToteEa)
                            : inputTotalEa
                          ).toLocaleString()}
                        </b>{" "}
                        EA
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-600">
                      파렛트ID:{" "}
                      <span className="font-semibold text-gray-800">
                        {(resultSnap?.calledPalletIds ?? calledPalletIds).length
                          ? (resultSnap?.calledPalletIds ?? calledPalletIds).join(", ")
                          : "-"}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600">
                      토트ID:{" "}
                      <span className="font-semibold text-gray-800">
                        {(resultSnap?.calledToteIds ?? calledToteIds).length
                          ? (resultSnap?.calledToteIds ?? calledToteIds).join(", ")
                          : "-"}
                      </span>
                    </div>

                    <div className="rounded-md border bg-gray-50 p-2">
                      <div className="text-[11px] font-semibold text-gray-800">
                        담긴 내역(packedLines)
                      </div>
                      {(resultSnap?.packedLines ?? packedLines).length === 0 ? (
                        <div className="mt-2 text-center text-[11px] text-gray-400">
                          담긴 내역이 없어.
                        </div>
                      ) : (
                        <ul className="mt-2 max-h-[160px] overflow-auto divide-y">
                          {(resultSnap?.packedLines ?? packedLines).map((x, idx) => (
                            <li
                              key={`${x.type}-${x.sourceId}-${idx}`}
                              className="flex items-center justify-between py-2 text-[11px]"
                            >
                              <div>
                                {x.type === "PALLET" ? "파렛트" : "토트"} <b>{x.sourceId}</b>
                              </div>
                              <div>
                                <b>{x.eaQty.toLocaleString()}</b> EA
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Section>
              </div>

              <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                <Section title="A~D Zone 맵 (Step1/Step3 정보 통합 표시)">
                  <div className="rounded-lg border bg-white p-3">
                    <Legend
                      items={[
                        { label: "기존 지정이송 위치", className: "bg-blue-500" },
                        {
                          label: "이번 잔량 목적지",
                          className: "border-emerald-500 bg-white",
                          ring: true,
                        },
                        { label: "점유", className: "bg-amber-300" },
                      ]}
                    />

                    <div className="mt-3 grid grid-cols-2 gap-6">
                      {(["A", "B", "C", "D"] as ZoneId[]).map((zone) => (
                        <ZoneGrid
                          key={zone}
                          zone={zone}
                          rows={ROWS}
                          cols={COLS}
                          occupiedSet={OCCUPIED_SET}
                          existingSlots={existingDestinationSlots}
                          selectedSlot={resultSnap?.destSlot ?? destSlot}
                          canSelect={false}
                          onSelect={() => {}}
                        />
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="rounded-full border bg-white px-3 py-2 text-xs hover:bg-gray-50"
                      >
                        이전
                      </button>
                      <button
                        type="button"
                        onClick={handleTransfer}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        확정(이송)
                      </button>
                    </div>
                  </div>
                </Section>
              </div>
            </>
          )}
        </div>

        {/* 푸터(공통) */}
        <div className="flex items-center justify-between border-t px-5 py-3 text-[11px] text-gray-500">
          <div className="space-x-3">
            <span>
              빈파렛트: <b className="text-gray-700">{emptyPalletId || "-"}</b>
            </span>
            <span>
              담긴합: <b className="text-gray-700">{totalPackedEa}</b> EA
            </span>
            <span>
              목적지: <b className="text-gray-700">{destSlot || "-"}</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCloseKeepDraft}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              닫기(임시저장)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= UI ================= */
function SummaryCard({
  label,
  value,
  subText,
}: {
  label: string;
  value: string;
  subText?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900 leading-none">
        {value}
      </div>
      {subText && <div className="mt-1 text-[11px] text-gray-500">{subText}</div>}
    </div>
  );
}

function MiniCard({
  label,
  value,
  subText,
  warn,
}: {
  label: string;
  value: string;
  subText?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div
        className={`mt-1 text-base font-semibold leading-none ${
          warn ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </div>
      {subText && <div className="mt-1 text-[11px] text-gray-500">{subText}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border bg-gray-50/80 p-3 overflow-hidden">
      <div className="mb-2 text-xs font-semibold text-gray-800">{title}</div>
      {children}
    </div>
  );
}

function Th({
  children,
  className = "",
  left,
  right,
  center,
}: {
  children: React.ReactNode;
  className?: string;
  left?: boolean;
  right?: boolean;
  center?: boolean;
}) {
  const cls = left
    ? "text-left"
    : right
      ? "text-right"
      : center
        ? "text-center"
        : "text-left";
  return <th className={`px-2 py-2 ${cls} ${className}`}>{children}</th>;
}

function Td({
  children,
  right,
  center,
}: {
  children: React.ReactNode;
  right?: boolean;
  center?: boolean;
}) {
  const cls = right ? "text-right" : center ? "text-center" : "text-left";
  return <td className={`px-2 py-2 ${cls}`}>{children}</td>;
}

function Legend({
  items,
}: {
  items: { label: string; className: string; ring?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600">
      {items.map((x) => (
        <span key={x.label} className="inline-flex items-center gap-1">
          <span
            className={`h-3 w-3 rounded ${x.className} ${
              x.ring ? "ring-2 ring-emerald-500" : ""
            }`}
          />
          {x.label}
        </span>
      ))}
    </div>
  );
}

function ZoneGrid({
  zone,
  rows,
  cols,
  occupiedSet,
  existingSlots,
  selectedSlot,
  canSelect,
  onSelect,
}: {
  zone: ZoneId;
  rows: number;
  cols: number;
  occupiedSet: Set<string>;
  existingSlots: string[];
  selectedSlot: string | null | undefined;
  canSelect: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 font-semibold text-gray-700">{zone} zone</div>
      <div className="inline-grid grid-cols-4 gap-2 rounded-xl bg-gray-50 p-3">
        {Array.from({ length: rows * cols }).map((_, idx) => {
          const r = Math.floor(idx / cols) + 1;
          const c = (idx % cols) + 1;
          const id = `${zone}-${r}-${c}`;

          const occupied = occupiedSet.has(id);
          const isExisting = existingSlots.includes(id);
          const isSelected = selectedSlot === id;

          const base = "flex h-9 w-9 items-center justify-center rounded-md border";

          if (occupied) {
            return (
              <div
                key={id}
                className={`${base} border-amber-300 bg-amber-300`}
                title={`${id} : 점유`}
              />
            );
          }

          if (isExisting) {
            return (
              <div
                key={id}
                className={`${base} border-blue-500 bg-blue-500`}
                title={`${id} : 기존 지정이송`}
              />
            );
          }

          return (
            <button
              key={id}
              type="button"
              disabled={!canSelect}
              onClick={() => onSelect(id)}
              className={`${base} border-gray-300 bg-white hover:bg-emerald-50 ${
                isSelected ? "ring-2 ring-emerald-500" : ""
              } ${!canSelect ? "cursor-not-allowed opacity-50" : ""}`}
              title={id}
            />
          );
        })}
      </div>
    </div>
  );
}
