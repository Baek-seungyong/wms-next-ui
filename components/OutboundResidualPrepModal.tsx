// components/OutboundResidualPrepModal.tsx
"use client";

import { useMemo, useState } from "react";
import type { PackedLine, ResidualTransferPayload } from "./types";

/* ================= 타입 ================= */
type ZoneId = "A" | "B" | "C" | "D";

type Props = {
  open: boolean;
  onClose: () => void;

  productCode: string;
  productName?: string;

  remainingEaQty: number;

  // ✅ 기존 지정이송 위치(파란색으로 표시)
  existingDestinationSlots?: string[];

  // ✅ 이송 눌렀을 때
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

// 빈파렛트(이미 QR 붙어있는 것으로 가정)
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

/* ================= 컴포넌트 ================= */

export function OutboundResidualPrepModal({
  open,
  onClose,
  productCode,
  productName,
  remainingEaQty,
  existingDestinationSlots = [],
  onTransfer,
}: Props) {
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

  /* ===== 담긴 내역 ===== */
  const [packedLines, setPackedLines] = useState<PackedLine[]>([]);

  /* ===== 목적지 ===== */
  const [destSlot, setDestSlot] = useState<string | null>(null);

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

  const totalPackedEa = useMemo(
    () => packedLines.reduce((s, x) => s + (x.eaQty ?? 0), 0),
    [packedLines],
  );

  const canSelectDest = totalPackedEa > 0 && !!emptyPalletId;
  const canTransfer = canSelectDest && !!destSlot;

  const palletsForProduct = useMemo(() => {
    return DEMO_PALLETS.filter((p) => p.productCode === productCode);
  }, [productCode]);

  const totesForProduct = useMemo(() => {
    return DEMO_TOTES.filter((t) =>
      t.lines.some((l) => l.productCode === productCode),
    );
  }, [productCode]);

  const resetAll = () => {
    setCalledPallets({});
    setCalledTotes({});
    setPalletPickMap({});
    setTotePickMap({});
    setPackedLines([]);
    setEmptyPalletId("");
    setDestSlot(null);
  };

  const handleCallEmptyPallet = () => {
    const pick =
      DEMO_EMPTY_PALLETS.find((p) => p.id !== emptyPalletId) ??
      DEMO_EMPTY_PALLETS[0];
    if (!pick) return;

    setEmptyPalletId(pick.id);
    alert(`빈파렛트 "${pick.id}" 호출되었습니다. (예시)`);
  };

  const addPackedLinesFromPalletInputs = () => {
    const lines: PackedLine[] = palletsForProduct
      .filter((p) => (palletPickMap[p.id] ?? 0) > 0)
      .map((p) => ({
        type: "PALLET",
        sourceId: p.id,
        eaQty: palletPickMap[p.id] ?? 0,
      }));

    if (lines.length === 0) {
      alert("파렛트 출고EA를 먼저 입력해 주세요.");
      return;
    }

    setPackedLines((prev) => [...prev, ...lines]);
  };

  const addPackedLinesFromToteInputs = () => {
    const lines: PackedLine[] = totesForProduct
      .filter((t) => (totePickMap[t.id] ?? 0) > 0)
      .map((t) => ({
        type: "TOTE",
        sourceId: t.id,
        eaQty: totePickMap[t.id] ?? 0,
      }));

    if (lines.length === 0) {
      alert("토트 출고EA를 먼저 입력해 주세요.");
      return;
    }

    setPackedLines((prev) => [...prev, ...lines]);
  };

  const handleTransfer = () => {
    if (!canTransfer) {
      alert("빈파렛트/적재수량/목적지 선택이 필요합니다.");
      return;
    }

    alert(
      `제품 ${productName ?? productCode} (${productCode})\n수량 ${totalPackedEa.toLocaleString()} EA\n빈파렛트 ${emptyPalletId}\n목적지 ${destSlot}\n\n이송합니다.`,
    );

    onTransfer?.({
      productCode,
      productName,
      totalEa: totalPackedEa,
      emptyPalletId,
      destSlot: destSlot!,
      packedLines,
    });

    resetAll();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[760px] w-[1400px] flex-col rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-6 py-3">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">잔량 출고 준비</h2>
            <p className="text-[11px] text-gray-500">
              대상 상품:{" "}
              <span className="font-semibold text-gray-700">
                {productCode} / {productName}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
          >
            닫기
          </button>
        </div>

        {/* 상단 요약 */}
        <div className="border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-800">잔량 요약</div>
            <div className="text-[11px] text-gray-500">
              박스기준: {BOX_EA_PER_BOX} EA/BOX
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-3">
            <SummaryCard label="잔량(EA)" value={remainingEaQty.toLocaleString()} />
            <SummaryCard
              label="BOX"
              value={remainBoxQty.toLocaleString()}
              subText={`= ${remainBoxEaQty.toLocaleString()} EA`}
            />
            <SummaryCard label="낱개(EA)" value={remainEaQty.toLocaleString()} />
          </div>
        </div>

        {/* 본문 */}
        <div className="flex flex-1 gap-4 overflow-hidden px-6 py-4">
          {/* 왼쪽 */}
          <div className="flex flex-1 flex-col gap-3 overflow-auto pr-1">
            <Section title="파렛트 내역(해당 상품)">
              <div className="overflow-auto rounded-lg border bg-white">
                <table className="w-full table-fixed text-[11px]">
                  <colgroup>
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "70px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "70px" }} />
                    <col style={{ width: "90px" }} />
                  </colgroup>
                  <thead className="sticky top-0 border-b bg-gray-50">
                    <tr>
                      <Th left>파렛트ID</Th>
                      <Th left>위치</Th>
                      <Th left>LOT</Th>
                      <Th right>BOX</Th>
                      <Th right>EA</Th>
                      <Th center>호출</Th>
                      <Th right>출고EA</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {palletsForProduct.map((p) => {
                      const called = !!calledPallets[p.id];
                      return (
                        <tr key={p.id} className="border-b last:border-b-0">
                          <Td>{p.id}</Td>
                          <Td>{p.location}</Td>
                          <Td>{p.lotNo}</Td>
                          <Td right>{p.boxQty.toLocaleString()}</Td>
                          <Td right>{p.eaQty.toLocaleString()}</Td>
                          <Td center>
                            <button
                              type="button"
                              className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] text-white hover:bg-gray-800"
                              onClick={() => {
                                setCalledPallets((prev) => ({
                                  ...prev,
                                  [p.id]: true,
                                }));
                                alert(`파렛트 ${p.id} 호출 (예시)`);
                              }}
                            >
                              호출
                            </button>
                          </Td>
                          <Td right>
                            {called ? (
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
                            ) : (
                              <span className="text-gray-300">호출 후 입력</span>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  호출 후, 해당 파렛트의 출고EA를 입력하세요.
                </span>
                <button
                  type="button"
                  className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  onClick={addPackedLinesFromPalletInputs}
                >
                  파렛트 출고분 담기
                </button>
              </div>
            </Section>

            <Section title="토트 내역(해당 상품)">
              <div className="overflow-auto rounded-lg border bg-white">
                <table className="w-full table-fixed text-[11px]">
                  <colgroup>
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "240px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "70px" }} />
                    <col style={{ width: "90px" }} />
                  </colgroup>
                  <thead className="sticky top-0 border-b bg-gray-50">
                    <tr>
                      <Th left>토트ID</Th>
                      <Th left>위치</Th>
                      <Th left>내용물</Th>
                      <Th right>해당EA</Th>
                      <Th center>호출</Th>
                      <Th right>출고EA</Th>
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
                        <tr key={t.id} className="border-b last:border-b-0">
                          <Td>{t.id}</Td>
                          <Td>{t.location}</Td>
                          <Td>
                            <span className="text-gray-700">{contentStr}</span>
                          </Td>
                          <Td right>{matchEa.toLocaleString()}</Td>
                          <Td center>
                            <button
                              type="button"
                              className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] text-white hover:bg-gray-800"
                              onClick={() => {
                                setCalledTotes((prev) => ({
                                  ...prev,
                                  [t.id]: true,
                                }));
                                alert(`토트 ${t.id} 호출 (예시)`);
                              }}
                            >
                              호출
                            </button>
                          </Td>
                          <Td right>
                            {called ? (
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
                            ) : (
                              <span className="text-gray-300">호출 후 입력</span>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  호출 후, 해당 토트의 출고EA를 입력하세요.
                </span>
                <button
                  type="button"
                  className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  onClick={addPackedLinesFromToteInputs}
                >
                  토트 출고분 담기
                </button>
              </div>
            </Section>

            <Section title="빈파렛트 적재 내역">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-800"
                    onClick={handleCallEmptyPallet}
                  >
                    빈파렛트 호출
                  </button>

                  <div className="text-[11px] text-gray-600">
                    선택된 빈파렛트:{" "}
                    <span className="font-semibold text-gray-800">
                      {emptyPalletId || "없음"}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-600">
                  총 적재:{" "}
                  <span className="font-semibold text-gray-800">
                    {totalPackedEa.toLocaleString()}
                  </span>{" "}
                  EA
                </div>
              </div>

              <div className="mt-3 rounded-lg border bg-white">
                <div className="border-b px-3 py-2 text-xs font-semibold text-gray-800">
                  담긴 내역
                </div>

                {packedLines.length === 0 ? (
                  <div className="px-3 py-4 text-center text-[11px] text-gray-400">
                    아직 담긴 내역이 없습니다. (위에서 “담기”를 눌러주세요)
                  </div>
                ) : (
                  <ul className="max-h-28 overflow-auto divide-y">
                    {packedLines.map((x, idx) => (
                      <li
                        key={`${x.type}-${x.sourceId}-${idx}`}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <div className="text-[11px] text-gray-700">
                          {x.type === "PALLET" ? "파렛트" : "토트"}{" "}
                          <span className="font-semibold">{x.sourceId}</span> 에서{" "}
                          <span className="font-semibold">
                            {x.eaQty.toLocaleString()}
                          </span>{" "}
                          EA
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

              <div className="mt-2 text-[11px] text-gray-500">
                ※ 목적지 맵 선택은 “빈파렛트 호출 + 담긴 수량(총 적재) &gt; 0”일 때 활성화됩니다.
              </div>
            </Section>
          </div>

          {/* 오른쪽: 맵 */}
          <div className="flex w-[520px] flex-shrink-0 flex-col rounded-xl border bg-gray-50 p-3">
            <div className="mb-2">
              <div className="text-xs font-semibold text-gray-800">
                1층 입출고장 위치 선택 (임시 A~D)
              </div>

              <div className="mt-1 flex items-center gap-4 text-[11px] text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded bg-blue-500" /> 기존 지정이송 위치
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded border border-emerald-500 bg-white" /> 이번 잔량 파렛트 목적지
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded bg-amber-300" /> 점유
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto rounded-xl bg-white p-3">
              <div className="grid grid-cols-2 gap-6">
                {(["A", "B", "C", "D"] as ZoneId[]).map((zone) => (
                  <div key={zone}>
                    <div className="mb-1 font-semibold text-gray-700">{zone} zone</div>

                    <div className="inline-grid grid-cols-4 gap-2 rounded-xl bg-gray-50 p-3">
                      {Array.from({ length: ROWS * COLS }).map((_, idx) => {
                        const r = Math.floor(idx / COLS) + 1;
                        const c = (idx % COLS) + 1;
                        const id = `${zone}-${r}-${c}`;

                        const occupied = OCCUPIED_SET.has(id);
                        const isExisting = existingDestinationSlots.includes(id);
                        const isSelected = destSlot === id;

                        const base =
                          "flex h-9 w-9 items-center justify-center rounded-md border";

                        if (occupied) {
                          return (
                            <div
                              key={id}
                              className={`${base} border-amber-300 bg-amber-300`}
                              title={`${id} : 이미 점유`}
                            />
                          );
                        }

                        const bg = isExisting
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white border-gray-300";

                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={!canSelectDest}
                            onClick={() => setDestSlot(id)}
                            className={`${base} ${bg} hover:bg-emerald-50 ${
                              isSelected ? "ring-2 ring-emerald-500" : ""
                            } ${!canSelectDest ? "cursor-not-allowed opacity-50" : ""}`}
                            title={`${id} : 빈 위치`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-600">
              <div>
                선택 목적지:{" "}
                <span className="font-semibold text-gray-800">
                  {destSlot ?? "없음"}
                </span>
              </div>

              <button
                type="button"
                disabled={!canTransfer}
                onClick={handleTransfer}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  canTransfer
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                이송
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between border-t px-6 py-3 text-[11px] text-gray-500">
          <div className="space-x-3">
            <span>
              빈파렛트: <b className="text-gray-700">{emptyPalletId || "-"}</b>
            </span>
            <span>
              총 적재: <b className="text-gray-700">{totalPackedEa}</b> EA
            </span>
            <span>
              목적지: <b className="text-gray-700">{destSlot || "-"}</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetAll();
                onClose();
              }}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= UI 컴포넌트 ================= */

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-gray-50/80 p-3">
      <div className="mb-2 text-xs font-semibold text-gray-800">{title}</div>
      {children}
    </div>
  );
}

function Th({
  children,
  left,
  right,
  center,
}: {
  children: React.ReactNode;
  left?: boolean;
  right?: boolean;
  center?: boolean;
}) {
  const cls = left ? "text-left" : right ? "text-right" : center ? "text-center" : "text-left";
  return <th className={`px-2 py-2 ${cls}`}>{children}</th>;
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
