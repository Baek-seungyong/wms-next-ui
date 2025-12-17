// components/PickingWorkStatusView.tsx
"use client";

import { useMemo } from "react";

type PickingStage = "입고중" | "작업중";

interface PickingItem {
  id: string;
  stage: PickingStage;
  productName: string;
  orderNo?: string;
  remark?: string;
}

type RobotStatus =
  | "대기"
  | "호출이동중"
  | "작업대이동"
  | "출고대기존이동"
  | "복귀중"
  | "오류";

interface RobotProduct {
  id: string;
  productName: string;
}

interface RobotInfo {
  id: string; // 로봇1 ~ 로봇4
  status: RobotStatus;
  currentLocation: string;
  carriedItems: RobotProduct[];
  message?: string;
  progress: number;
}

/** ✅ 작업중(=출고중) 주문 요약 타입 */
export type ActiveOrderSummary = {
  orderNo: string;
  customerName: string;
  items: { productName: string; orderQty: number }[];
};

type Props = {
  /** ✅ 외부에서 실제 출고중 주문을 주입할 수 있게 열어둠(없으면 MOCK 사용) */
  activeOrders?: ActiveOrderSummary[];
};

// ----------------------
// 더미 데이터 (예시)
// ----------------------
const MOCK_PICKING_ITEMS: PickingItem[] = [
  { id: "IN-001", stage: "입고중", productName: "T20 트레이 20구", orderNo: "ORD-20251125-001" },
  { id: "IN-002", stage: "입고중", productName: "PET 500ml 투명", orderNo: "ORD-20251125-002" },
  { id: "WK-001", stage: "작업중", productName: "T20 트레이 20구", orderNo: "ORD-20251125-001" },
  { id: "WK-002", stage: "작업중", productName: "PET 2L 투명", orderNo: "ORD-20251125-003" },
];

const MOCK_ACTIVE_ORDERS: ActiveOrderSummary[] = [
  {
    orderNo: "ORD-251114-03",
    customerName: "C도매",
    items: [
      { productName: "PET 500ml 투명", orderQty: 3000 },
      { productName: "PET 1L 반투명", orderQty: 50 },
      { productName: "캡 28파이 화이트", orderQty: 100 },
      { productName: "라벨 500ml 화이트", orderQty: 100 },
    ],
  },
  {
    orderNo: "ORD-251115-02",
    customerName: "E도매",
    items: [
      { productName: "PET 500ml 투명", orderQty: 3000 },
      { productName: "PET 1L 반투명", orderQty: 50 },
      { productName: "캡 28파이 화이트", orderQty: 100 },
      { productName: "라벨 500ml 화이트", orderQty: 100 },
    ],
  },
  {
    orderNo: "ORD-251116-03",
    customerName: "H연구소",
    items: [
      { productName: "PET 500ml 투명", orderQty: 3000 },
      { productName: "PET 1L 반투명", orderQty: 50 },
      { productName: "캡 28파이 화이트", orderQty: 100 },
      { productName: "라벨 500ml 화이트", orderQty: 100 },
    ],
  },
];

const MOCK_ROBOTS: RobotInfo[] = [
  {
    id: "로봇1",
    status: "호출이동중",
    currentLocation: "피킹존 입구 → 컨베이어 1번 라인 이동 중",
    carriedItems: [
      { id: "R1-P1", productName: "T20 트레이 20구" },
      { id: "R1-P2", productName: "PET 500ml 투명" },
    ],
    progress: 60,
  },
  { id: "로봇2", status: "대기", currentLocation: "피킹존 중앙 대기구역", carriedItems: [], progress: 0 },
  {
    id: "로봇3",
    status: "작업대이동",
    currentLocation: "컨베이어 출구 → 작업대 B 근처",
    carriedItems: [
      { id: "R3-P1", productName: "PET 2L 투명" },
      { id: "R3-P2", productName: "PET 1L 투명" },
      { id: "R3-P3", productName: "PET 300ml 밀키" },
    ],
    progress: 80,
  },
  { id: "로봇4", status: "복귀중", currentLocation: "작업대 A → 충전존 복귀 중", carriedItems: [], progress: 40 },
];

// ----------------------
// 유틸
// ----------------------
function stageColor(stage: PickingStage) {
  if (stage === "입고중") return "border-blue-200 bg-blue-50/60";
  return "border-gray-200 bg-gray-50";
}

function robotStatusChipClass(status: RobotStatus) {
  switch (status) {
    case "대기":
      return "bg-gray-100 text-gray-800 border border-gray-300";
    case "호출이동중":
      return "bg-sky-100 text-sky-800 border border-sky-300";
    case "작업대이동":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "출고대기존이동":
      return "bg-amber-100 text-amber-800 border border-amber-300";
    case "복귀중":
      return "bg-indigo-100 text-indigo-800 border border-indigo-300";
    case "오류":
      return "bg-red-100 text-red-800 border border-red-300";
  }
}

function CardShell({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

// ----------------------
// 메인
// ----------------------
export function PickingWorkStatusView({ activeOrders }: Props) {
  const inboundItems = useMemo(
    () => MOCK_PICKING_ITEMS.filter((i) => i.stage === "입고중"),
    [],
  );
  const workingItems = useMemo(
    () => MOCK_PICKING_ITEMS.filter((i) => i.stage === "작업중"),
    [],
  );

  const activeOrderCards = activeOrders ?? MOCK_ACTIVE_ORDERS;

  return (
    <div className="h-[calc(100vh-120px)]">
      {/* ✅ 섹션 구분감을 위해 바탕을 살짝 깔아줌 */}
      <div className="grid h-full grid-cols-[minmax(0,1fr)_360px_360px] gap-4 rounded-2xl bg-slate-50/60 p-3">
        {/* (1) 좌측: 입고중/작업중 */}
        <div className="min-w-0 w-full">
          <CardShell
            title="피킹존 작업 현황판"
            right={
              <div className="text-right text-[11px] text-gray-500">
                입고중{" "}
                <span className="font-semibold text-blue-600">
                  {inboundItems.length}건
                </span>{" "}
                · 작업중{" "}
                <span className="font-semibold text-emerald-600">
                  {workingItems.length}건
                </span>
              </div>
            }
          >
            <div className="grid h-[calc(100vh-120px-24px-56px-32px)] grid-cols-2 gap-3">
              {(["입고중", "작업중"] as PickingStage[]).map((stage) => {
                const list = stage === "입고중" ? inboundItems : workingItems;

                return (
                  <div
                    key={stage}
                    className={`flex min-h-0 flex-col rounded-2xl border p-3 ${stageColor(stage)}`}
                  >
                    <div className="mb-3 flex flex-col items-center text-center">
                      <div className="text-[22px] font-bold tracking-wide text-slate-900">
                        {stage}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-600">
                        총{" "}
                        <span className="font-semibold text-slate-900">
                          {list.length}개 상품
                        </span>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-white/95 px-2 py-3">
                      {list.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[11px] text-gray-400">
                          현재 표시할 상품이 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {list.map((item) => (
                            <div
                              key={item.id}
                              className="flex h-[88px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                            >
                              <div className="text-center text-[18px] font-semibold leading-snug text-slate-900">
                                {item.productName}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardShell>
        </div>

        {/* (2) 가운데: 작업중 주문 요약(출고중 주문) */}
        <div className="w-full">
          <CardShell
            title="주문 처리 현황"
            right={
              <div className="text-right text-[10px] text-gray-500">
                최대 4건 · 현재{" "}
                <span className="font-semibold text-gray-800">
                  {Math.min(activeOrderCards.length, 4)}건
                </span>
              </div>
            }
          >
            <div className="mb-2 text-[10px] text-gray-500">
              주문관리 상태: <span className="font-semibold text-blue-600">출고중</span>
            </div>

            <div className="h-[calc(100vh-120px-24px-56px-32px)] overflow-auto rounded-xl bg-gray-50 p-3">
              {activeOrderCards.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-[11px] text-gray-500">
                  작업중인 주문이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeOrderCards.slice(0, 4).map((o) => (
                    <div
                      key={o.orderNo}
                      className="flex flex-col gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[12px] font-bold text-slate-900">
                            {o.orderNo}
                          </div>
                          <div className="mt-0.5 text-[11px] text-gray-600">
                            고객명:{" "}
                            <span className="font-semibold">{o.customerName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {o.items.map((it, idx) => (
                          <div
                            key={`${o.orderNo}-${idx}-${it.productName}`}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                          >
                            <div className="text-[12px] font-semibold text-slate-900">
                              {it.productName}
                            </div>
                            <div className="text-[11px] text-gray-700">
                              주문수량:{" "}
                              <span className="font-semibold">
                                {it.orderQty.toLocaleString()}
                              </span>{" "}
                              EA
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardShell>
        </div>

        {/* (3) 우측: 로봇 현황 */}
        <div className="w-full">
          <CardShell
            title="피킹존 로봇 현황"
            right={
              <div className="text-right text-[10px] text-gray-500">
                총{" "}
                <span className="font-semibold text-gray-800">
                  {MOCK_ROBOTS.length}대
                </span>
              </div>
            }
          >
            <div className="h-[calc(100vh-120px-24px-56px-32px)] overflow-auto rounded-xl bg-gray-50 p-3">
              <div className="space-y-2">
                {MOCK_ROBOTS.map((bot) => (
                  <div
                    key={bot.id}
                    className="flex flex-col gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[16px] font-bold text-slate-900">
                          {bot.id}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${robotStatusChipClass(
                            bot.status,
                          )}`}
                        >
                          {bot.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1">
                      {bot.carriedItems.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                          현재 적재된 상품이 없습니다.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {bot.carriedItems.map((p) => (
                            <div
                              key={p.id}
                              className="flex h-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-[13px] font-semibold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                            >
                              {p.productName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  );
}
