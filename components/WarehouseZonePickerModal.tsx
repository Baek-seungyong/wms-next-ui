// components/WarehouseZonePickerModal.tsx
"use client";

import { useMemo, useState } from "react";

export type WarehouseFloor = "2F" | "3F";

export type ZoneDef = {
  id: string;
  label: string;
  points: { x: number; y: number }[];
  disabled?: boolean; // ✅ 추가
};

type Props = {
  open: boolean;
  floor: WarehouseFloor;
  onClose: () => void;
  onSelect: (zone: ZoneDef) => void;
};

/**
 * ✅ 임시 구역 좌표(대충 사각형) - 너가 정리한 실제 좌표로 나중에 교체하면 됨
 * - 좌표 기준: viewBox 0 0 1000 1000
 * - points는 시계/반시계 방향 아무거나 OK (순서만 이어지게)
 */
export const ZONES_2F: ZoneDef[] = [
  {
    id: "2F-1",
    label: "2층 1구역",
    points: [
      { x: 14, y: 12 },
      { x: 883, y: 12 },
      { x: 883, y: 550 },
      { x: 14, y: 550 },
    ],
  },
  {
    id: "2F-2",
    label: "2층 2구역",
    points: [
      { x: 883, y: 13 },
      { x: 2629, y: 13 },
      { x: 2629, y: 276 },
      { x: 883, y: 276 },
    ],
  },
  {
    id: "2F-3",
    label: "2층 3구역",
    points: [
      { x: 883, y: 277 },
      { x: 2630, y: 277 },
      { x: 2630, y: 563 },
      { x: 883, y: 563 },
    ],
  },
  {
    id: "2F-4",
    label: "2층 4구역",
    points: [
      { x: 2629, y: 11 },
      { x: 3502, y: 11 },
      { x: 3502, y: 564 },
      { x: 2629, y: 564 },
    ],
  },
  {
    id: "2F-5",
    label: "2층 5구역",
    points: [
      { x: 884, y: 562 },
      { x: 1502, y: 562 },
      { x: 1502, y: 1094 },
      { x: 884, y: 1094 },
    ],
  },
  {
    id: "2F-6",
    label: "2층 6구역",
    points: [
      { x: 15, y: 1110 },
      { x: 882, y: 1110 },
      { x: 882, y: 1648 },
      { x: 15, y: 1648 },
    ],
  },
  {
    id: "2F-7",
    label: "2층 7구역",
    points: [
      { x: 883, y: 1094 },
      { x: 1971, y: 1094 },
      { x: 1971, y: 1368 },
      { x: 883, y: 1368 },
    ],
  },
  {
    id: "2F-8",
    label: "2층 8구역",
    points: [
      { x: 883, y: 1368 },
      { x: 1971, y: 1368 },
      { x: 1971, y: 1648 },
      { x: 883, y: 1648 },
    ],
  },

  // ✅ 2층 P구역: 일단 데이터는 두되, 선택 불가 처리
  {
    id: "2F-P",
    label: "2층 P구역",
    disabled: true,
    points: [
      { x: 2632, y: 564 },
      { x: 3054, y: 564 },
      { x: 3054, y: 1093 },
      { x: 2632, y: 1093 },
    ],
  },
];

export const ZONES_3F: ZoneDef[] = [
  {
    id: "3F-1",
    label: "3층 1구역",
    points: [
      { x: 6, y: 11 },
      { x: 868, y: 11 },
      { x: 868, y: 275 },
      { x: 762, y: 275 },
      { x: 762, y: 560 },
      { x: 6, y: 560 },
    ],
  },
  {
    id: "3F-2",
    label: "3층 2구역",
    points: [
      { x: 868, y: 12 },
      { x: 2604, y: 12 },
      { x: 2604, y: 276 },
      { x: 868, y: 276 },
    ],
  },
  {
    id: "3F-3",
    label: "3층 3구역",
    points: [
      { x: 761, y: 276 },
      { x: 2603, y: 276 },
      { x: 2603, y: 561 },
      { x: 761, y: 561 },
    ],
  },
  {
    id: "3F-4",
    label: "3층 4구역",
    points: [
      { x: 2603, y: 12 },
      { x: 3476, y: 12 },
      { x: 3476, y: 561 },
      { x: 2603, y: 561 },
    ],
  },
  {
    id: "3F-5",
    label: "3층 5구역",
    points: [
      { x: 6, y: 561 },
      { x: 826, y: 561 },
      { x: 826, y: 1089 },
      { x: 6, y: 1089 },
    ],
  },
  {
    id: "3F-6",
    label: "3층 6구역",
    points: [
      { x: 869, y: 561 },
      { x: 1500, y: 561 },
      { x: 1500, y: 1089 },
      { x: 869, y: 1089 },
    ],
  },
  {
    id: "3F-7",
    label: "3층 7구역",
    points: [
      { x: 1948, y: 561 },
      { x: 2602, y: 561 },
      { x: 2602, y: 1089 },
      { x: 1948, y: 1089 },
    ],
  },
  {
    id: "3F-8",
    label: "3층 8구역",
    points: [
      { x: 2602, y: 561 },
      { x: 3477, y: 561 },
      { x: 3477, y: 1089 },
      { x: 2602, y: 1089 },
    ],
  },
  {
    id: "3F-9",
    label: "3층 9구역",
    points: [
      { x: 7, y: 1089 },
      { x: 779, y: 1089 },
      { x: 779, y: 1359 },
      { x: 869, y: 1359 },
      { x: 869, y: 1640 },
      { x: 7, y: 1640 },
    ],
  },
  {
    id: "3F-10",
    label: "3층 10구역",
    points: [
      { x: 778, y: 1089 },
      { x: 1500, y: 1089 },
      { x: 1500, y: 562 },
      { x: 1949, y: 562 },
      { x: 1949, y: 1089 },
      { x: 2603, y: 1089 },
      { x: 2603, y: 1358 },
      { x: 778, y: 1358 },
    ],
  },
  {
    id: "3F-11",
    label: "3층 11구역",
    points: [
      { x: 869, y: 1359 },
      { x: 2603, y: 1359 },
      { x: 2603, y: 1640 },
      { x: 869, y: 1640 },
    ],
  },
];

function pointsToSvg(points: ZoneDef["points"]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export function WarehouseZonePickerModal({ open, floor, onClose, onSelect }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const imageSrc = floor === "2F" ? "/images/warehouse/floor2.png" : "/images/warehouse/floor3.png";
  const zones = useMemo(() => (floor === "2F" ? ZONES_2F : ZONES_3F), [floor]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-[1000px] max-w-[95vw] max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {floor === "2F" ? "2층" : "3층"} 이송 구역 선택
            </div>
            <div className="mt-0.5 text-[11px] text-gray-500">
              도면 위 구역을 클릭해서 선택하세요. (임시 좌표 적용 중)
            </div>
          </div>
          <button
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            닫기 ✕
          </button>
        </div>

        {/* 바디 */}
        <div className="p-4">
          <div className="relative overflow-auto rounded-2xl border bg-gray-50 p-3">
            {/* 이미지 + SVG 오버레이 */}
            <div className="relative mx-auto w-[920px] max-w-[90vw]">
              <img src={imageSrc} alt={`${floor} 도면`} className="block h-auto w-full select-none" />

              {/* SVG overlay (viewBox 1000 기준) */}
                <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 3502 1648"   // ✅ 원본 이미지 크기
                preserveAspectRatio="xMinYMin meet"
                >
                {zones.map((z) => {
                    const isHover = hoverId === z.id;
                    const isDisabled = !!z.disabled;

                    const fill = isDisabled
                    ? "rgba(148,163,184,0.12)" // 회색톤
                    : isHover
                        ? "rgba(59,130,246,0.22)"
                        : "rgba(59,130,246,0.10)";

                    const stroke = isDisabled
                    ? "rgba(148,163,184,0.35)"
                    : isHover
                        ? "rgba(37,99,235,0.9)"
                        : "rgba(37,99,235,0.5)";
                  return (
                    <g key={z.id}>
                      <polygon
                        points={pointsToSvg(z.points)}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={2}
                        className={z.disabled ? "cursor-not-allowed" : "cursor-pointer"}
                        onMouseEnter={() => setHoverId(z.id)}
                        onMouseLeave={() => setHoverId(null)}
                        onClick={() => {
                            if (z.disabled) return; // 2층 p구역 무시
                            onSelect(z);
                        }}
                      />
                      {/* 라벨(대충 중앙에) */}
                      <text
                        x={z.points.reduce((s, p) => s + p.x, 0) / z.points.length}
                        y={z.points.reduce((s, p) => s + p.y, 0) / z.points.length}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={22}
                        fontWeight={700}
                        fill="rgba(30,41,59,0.85)"
                        className="pointer-events-none select-none"
                      >
                        {z.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-gray-500">
            * 지금은 “임시 폴리곤”이라 실제 구역 경계와 다를 수 있어요. 좌표만 교체하면 그대로 맞춰집니다.
          </div>
        </div>
      </div>
    </div>
  );
}
