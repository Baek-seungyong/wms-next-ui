import type { CarBatchTransferSlotId } from "./types";

export const BOXES_PER_PALLET = 10;

// A~D, 1~16 생성
export const ALL_SLOTS: CarBatchTransferSlotId[] = (() => {
  const letters = ["A", "B", "C", "D"];
  const out: string[] = [];
  for (const L of letters) {
    for (let i = 1; i <= 16; i++) out.push(`${L}-${i}`);
  }
  return out;
})();

// ✅ 우선순위: A-2~A-16 → A-1 → B-2~B-16 → B-1 ... 이런 식
export const CAR_OUTBOUND_SLOT_PRIORITY: CarBatchTransferSlotId[] = (() => {
  const letters = ["A", "B", "C", "D"];
  const out: string[] = [];
  for (const L of letters) {
    for (let i = 2; i <= 16; i++) out.push(`${L}-${i}`);
    out.push(`${L}-1`);
  }
  return out;
})();

export function autoAssignCarOutboundSlots(
  count: number,
  occupied: Set<CarBatchTransferSlotId>,
  priority: CarBatchTransferSlotId[] = CAR_OUTBOUND_SLOT_PRIORITY,
): CarBatchTransferSlotId[] {
  if (count <= 0) return [];

  const result: CarBatchTransferSlotId[] = [];
  for (const slotId of priority) {
    if (result.length >= count) break;
    if (occupied.has(slotId)) continue;
    result.push(slotId);
  }
  return result;
}