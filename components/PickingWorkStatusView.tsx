// components/PickingWorkStatusView.tsx
"use client";

import { useMemo } from "react";

type PickingStage = "입고중" | "작업중" | "출고대기";

interface PickingItem {
  id: string;
  stage: PickingStage;
  productName: string;
  // 내부적으로는 주문번호/코드 등을 가질 수 있지만
  // 현황판에는 상품명만 크게 표시
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
  currentLocation: string; // 피킹존 내부 위치
  carriedItems: RobotProduct[]; // 한 번에 여러 제품(최대 6박스)
  message?: string;
  progress: number; // 0~100
}

// ----------------------
// 더미 데이터 (예시)
// ----------------------

const MOCK_PICKING_ITEMS: PickingItem[] = [
  // 입고중: AMR이 피킹존 안에서 컨베이어 입구까지 박스를 가져오는 중
  {
    id: "IN-001",
    stage: "입고중",
    productName: "T20 트레이 20구",
    orderNo: "ORD-20251125-001",
    remark: "로봇1이 피킹존 입구로 이동 중",
  },
  {
    id: "IN-002",
    stage: "입고중",
    productName: "PET 500ml 투명",
    orderNo: "ORD-20251125-002",
    remark: "로봇3 적재 완료, 컨베이어로 이동 중",
  },

  // 작업중: 컨베이어 위에서 QR 스캔 완료, 작업대에서 포장 중
  {
    id: "WK-001",
    stage: "작업중",
    productName: "T20 트레이 20구",
    orderNo: "ORD-20251125-001",
    remark: "작업대 A에서 포장 중",
  },
  {
    id: "WK-002",
    stage: "작업중",
    productName: "PET 2L 투명",
    orderNo: "ORD-20251125-003",
    remark: "작업대 B에서 2번/3번 주문 공용 사용",
  },

  // 출고대기: 작업자가 포장을 마치고 출고대기라인으로 보낸 상태
  {
    id: "OUT-001",
    stage: "출고대기",
    productName: "T20 트레이 20구",
    orderNo: "ORD-20251125-001",
    remark: "출고대기존 랙 B-02",
  },
  {
    id: "OUT-002",
    stage: "출고대기",
    productName: "PET 500ml 투명",
    orderNo: "ORD-20251125-002",
    remark: "출고대기 팔레트 03",
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
    message: "작업대 A 요청분 적재 후 이동",
    progress: 60,
  },
  {
    id: "로봇2",
    status: "대기",
    currentLocation: "피킹존 중앙 대기구역",
    carriedItems: [],
    message: "다음 피킹 호출 대기",
    progress: 0,
  },
  {
    id: "로봇3",
    status: "작업대이동",
    currentLocation: "컨베이어 출구 → 작업대 B 근처",
    carriedItems: [
      { id: "R3-P1", productName: "PET 2L 투명" },
      { id: "R3-P2", productName: "PET 1L 투명" },
      { id: "R3-P3", productName: "PET 300ml 밀키" },
    ],
    message: "작업대 B로 박스 3개 이송 중",
    progress: 80,
  },
  {
    id: "로봇4",
    status: "복귀중",
    currentLocation: "작업대 A → 충전존 복귀 중",
    carriedItems: [],
    message: "작업 종료 후 충전존 복귀",
    progress: 40,
  },
];

// ----------------------
// 유틸 함수
// ----------------------

function stageTitle(stage: PickingStage) {
  return stage;
}

function stageDescription(stage: PickingStage) {
  if (stage === "입고중")
    return "AMR가 피킹존 컨베이어 입구로 박스를 가져오는 상태";
  if (stage === "작업중")
    return "컨베이어에서 작업대로 옮겨져 포장 작업이 진행 중인 상태";
  return "포장 완료 후 출고대기 라인으로 보낸 상태";
}

function stageColor(stage: PickingStage) {
  if (stage === "입고중") return "border-blue-300 bg-blue-50/80";
  if (stage === "작업중") return "border-emerald-300 bg-emerald-50/80";
  return "border-amber-300 bg-amber-50/80";
}

function robotStatusChipClass(status: RobotStatus) {
  switch (status) {
    case "대기":
      return "bg-gray-50 text-gray-700 border border-gray-300";
    case "호출이동중":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "작업대이동":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "출고대기존이동":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "복귀중":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    case "오류":
      return "bg-red-50 text-red-700 border border-red-200";
  }
}

// ----------------------
// 메인 컴포넌트
// ----------------------

export function PickingWorkStatusView() {
  const inboundItems = useMemo(
    () => MOCK_PICKING_ITEMS.filter((i) => i.stage === "입고중"),
    [],
  );
  const workingItems = useMemo(
    () => MOCK_PICKING_ITEMS.filter((i) => i.stage === "작업중"),
    [],
  );
  const waitingItems = useMemo(
    () => MOCK_PICKING_ITEMS.filter((i) => i.stage === "출고대기"),
    [],
  );

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 text-[12px]">
      {/* 좌측: 3칸 현황판 */}
      <section className="flex flex-1 flex-col gap-3 rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">피킹존 작업 현황판</div>
            <div className="text-[11px] text-gray-500">
              피킹존 내부에서 AMR 입고 → 작업대 포장 → 출고대기로 이어지는
              흐름을 한눈에 표시합니다.
            </div>
          </div>
          <div className="text-right text-[11px] text-gray-500">
            입고중:{" "}
            <span className="font-semibold text-blue-600">
              {inboundItems.length}건
            </span>{" "}
            / 작업중:{" "}
            <span className="font-semibold text-emerald-600">
              {workingItems.length}건
            </span>{" "}
            / 출고대기:{" "}
            <span className="font-semibold text-amber-600">
              {waitingItems.length}건
            </span>
          </div>
        </div>

        {/* 3단 컬럼 */}
        <div className="grid flex-1 grid-cols-3 gap-3">
          {(["입고중", "작업중", "출고대기"] as PickingStage[]).map(
            (stage) => {
              const list =
                stage === "입고중"
                  ? inboundItems
                  : stage === "작업중"
                  ? workingItems
                  : waitingItems;

              return (
                <div
                  key={stage}
                  className={`flex h-full flex-col rounded-2xl border p-3 ${stageColor(
                    stage,
                  )}`}
                >
                  {/* 컬럼 헤더: 중앙 정렬, 큰 텍스트 */}
                  <div className="mb-2 flex flex-col items-center text-center">
                    <div className="text-[20px] font-bold tracking-wide text-slate-800">
                      {stageTitle(stage)}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600">
                      {stageDescription(stage)}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      총{" "}
                      <span className="font-semibold text-slate-700">
                        {list.length}개 상품
                      </span>
                    </div>
                  </div>

                  {/* 상품 리스트: 상품명만 크게 */}
                  <div className="flex-1 overflow-auto rounded-xl bg-white/90 px-2 py-3">
                    {list.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-[11px] text-gray-400">
                        현재 표시할 상품이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {list.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col items-center rounded-lg border border-gray-200 bg-white px-2 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                          >
                            {/* 상품명 크게 */}
                            <div className="text-center text-[18px] font-semibold text-slate-900 leading-snug">
                              {item.productName}
                            </div>

                            {/* 부가정보는 아주 작게 (있어도 되고 없어도 되는 정도) */}
                            {(item.orderNo || item.remark) && (
                              <div className="mt-1 text-center text-[10px] text-slate-500">
                                {item.orderNo && (
                                  <span className="mr-1 font-mono">
                                    {item.orderNo}
                                  </span>
                                )}
                                {item.remark && <span>{item.remark}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </section>

      {/* 우측: 로봇 현황 */}
      <section className="flex w-[360px] flex-col gap-3 rounded-2xl border bg-slate-950/95 p-4 text-[12px] text-slate-50">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">피킹존 로봇 현황</div>
            <div className="text-[10px] text-slate-300">
              피킹존 내부에서 주문건을 처리 중인 AMR 4대의 상태와 적재 상품입니다.
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            총{" "}
            <span className="font-semibold text-slate-50">
              {MOCK_ROBOTS.length}대
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-auto rounded-xl bg-slate-900/80 p-2">
          {MOCK_ROBOTS.map((bot) => (
            <div
              key={bot.id}
              className="flex flex-col gap-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold">
                    {bot.id}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${robotStatusChipClass(
                      bot.status,
                    )}`}
                  >
                    {bot.status}
                  </span>
                </div>
                <span className="text-[10px] text-slate-300">
                  {bot.progress}%
                </span>
              </div>

              <div className="text-[10px] text-slate-300">
                위치: {bot.currentLocation}
              </div>

              {/* 진행도 바 */}
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${bot.progress}%` }}
                />
              </div>

              {/* 적재 상품 리스트 (최대 6개 가정) */}
              <div className="mt-2">
                <div className="mb-1 text-[10px] text-slate-300">
                  적재 상품{" "}
                  <span className="font-semibold text-slate-50">
                    {bot.carriedItems.length}개
                  </span>
                </div>
                {bot.carriedItems.length === 0 ? (
                  <div className="text-[10px] text-slate-500">
                    현재 적재된 박스 없음
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {bot.carriedItems.map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-50"
                      >
                        {p.productName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {bot.message && (
                <div className="mt-1 text-[10px] text-emerald-300">
                  · {bot.message}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
