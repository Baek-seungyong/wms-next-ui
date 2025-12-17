// components/WarehouseZonePickerModal.tsx
"use client";

import { useMemo, useState } from "react";

export type WarehouseFloor = "2F" | "3F";

export type ZoneDef = {
  id: string; // 예: "2F-1", "3F-10", "2F-P"
  label: string; // 예: "1", "10", "P"
  // ✅ 정규화 좌표(0~1000 기준) - 꼭지점(폴리곤)
  points: Array<{ x: number; y: number }>;
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
const ZONES_2F: ZoneDef[] = [
  { id: "2F-1", label: "1", points: [{ x: 40, y: 60 }, { x: 300, y: 60 }, { x: 300, y: 250 }, { x: 40, y: 250 }] },
  { id: "2F-2", label: "2", points: [{ x: 300, y: 60 }, { x: 760, y: 60 }, { x: 760, y: 180 }, { x: 300, y: 180 }] },
  { id: "2F-3", label: "3", points: [{ x: 300, y: 180 }, { x: 760, y: 180 }, { x: 760, y: 280 }, { x: 300, y: 280 }] },
  { id: "2F-4", label: "4", points: [{ x: 760, y: 60 }, { x: 980, y: 60 }, { x: 980, y: 280 }, { x: 760, y: 280 }] },
  { id: "2F-5", label: "5", points: [{ x: 40, y: 280 }, { x: 260, y: 280 }, { x: 260, y: 560 }, { x: 40, y: 560 }] },
  { id: "2F-6", label: "6", points: [{ x: 260, y: 280 }, { x: 460, y: 280 }, { x: 460, y: 560 }, { x: 260, y: 560 }] },
  { id: "2F-7", label: "7", points: [{ x: 540, y: 280 }, { x: 760, y: 280 }, { x: 760, y: 560 }, { x: 540, y: 560 }] },
  { id: "2F-8", label: "8", points: [{ x: 760, y: 280 }, { x: 980, y: 280 }, { x: 980, y: 560 }, { x: 760, y: 560 }] },
  { id: "2F-9", label: "9", points: [{ x: 40, y: 560 }, { x: 260, y: 560 }, { x: 260, y: 940 }, { x: 40, y: 940 }] },
  { id: "2F-10", label: "10", points: [{ x: 260, y: 560 }, { x: 760, y: 560 }, { x: 760, y: 760 }, { x: 260, y: 760 }] },
  { id: "2F-11", label: "11", points: [{ x: 260, y: 760 }, { x: 760, y: 760 }, { x: 760, y: 940 }, { x: 260, y: 940 }] },

  // ✅ 피킹 구역(2층 도면의 파란 랙 영역)도 “구역”으로 넣고 싶으면 이런 식으로
  { id: "2F-P", label: "P", points: [{ x: 780, y: 300 }, { x: 980, y: 300 }, { x: 980, y: 520 }, { x: 780, y: 520 }] },
];

const ZONES_3F: ZoneDef[] = [
  { id: "3F-1", label: "1", points: [{ x: 40, y: 60 }, { x: 300, y: 60 }, { x: 300, y: 250 }, { x: 40, y: 250 }] },
  { id: "3F-2", label: "2", points: [{ x: 300, y: 60 }, { x: 760, y: 60 }, { x: 760, y: 180 }, { x: 300, y: 180 }] },
  { id: "3F-3", label: "3", points: [{ x: 300, y: 180 }, { x: 760, y: 180 }, { x: 760, y: 280 }, { x: 300, y: 280 }] },
  { id: "3F-4", label: "4", points: [{ x: 760, y: 60 }, { x: 980, y: 60 }, { x: 980, y: 280 }, { x: 760, y: 280 }] },
  { id: "3F-5", label: "5", points: [{ x: 40, y: 280 }, { x: 260, y: 280 }, { x: 260, y: 560 }, { x: 40, y: 560 }] },
  { id: "3F-6", label: "6", points: [{ x: 260, y: 280 }, { x: 460, y: 280 }, { x: 460, y: 560 }, { x: 260, y: 560 }] },
  { id: "3F-7", label: "7", points: [{ x: 540, y: 280 }, { x: 760, y: 280 }, { x: 760, y: 560 }, { x: 540, y: 560 }] },
  { id: "3F-8", label: "8", points: [{ x: 760, y: 280 }, { x: 980, y: 280 }, { x: 980, y: 560 }, { x: 760, y: 560 }] },
  { id: "3F-9", label: "9", points: [{ x: 40, y: 560 }, { x: 260, y: 560 }, { x: 260, y: 940 }, { x: 40, y: 940 }] },
  { id: "3F-10", label: "10", points: [{ x: 260, y: 560 }, { x: 760, y: 560 }, { x: 760, y: 760 }, { x: 260, y: 760 }] },
  { id: "3F-11", label: "11", points: [{ x: 260, y: 760 }, { x: 760, y: 760 }, { x: 760, y: 940 }, { x: 260, y: 940 }] },
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
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
              >
                {zones.map((z) => {
                  const isHover = hoverId === z.id;
                  return (
                    <g key={z.id}>
                      <polygon
                        points={pointsToSvg(z.points)}
                        fill={isHover ? "rgba(59,130,246,0.22)" : "rgba(59,130,246,0.10)"}
                        stroke={isHover ? "rgba(37,99,235,0.9)" : "rgba(37,99,235,0.5)"}
                        strokeWidth={2}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoverId(z.id)}
                        onMouseLeave={() => setHoverId(null)}
                        onClick={() => onSelect(z)}
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
