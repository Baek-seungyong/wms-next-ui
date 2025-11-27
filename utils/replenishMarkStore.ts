// utils/replenishMarkStore.ts
export type ReplenishMark = {
  code: string;   // 상품코드
  name: string;   // 상품명
  markedAt: string; // ISO 날짜
};

const STORAGE_KEY = "wms-replenish-marks";

/** 저장된 전체 마킹 목록 가져오기 */
export function getReplenishMarks(): ReplenishMark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReplenishMark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReplenishMarks(list: ReplenishMark[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** 특정 상품이 이미 마킹되어 있는지 */
export function isMarked(code: string): boolean {
  return getReplenishMarks().some((m) => m.code === code);
}

/** 토글(있으면 해제, 없으면 추가) */
export function toggleReplenishMark(code: string, name: string): ReplenishMark[] {
  const now = new Date().toISOString();
  let list = getReplenishMarks();

  if (list.some((m) => m.code === code)) {
    list = list.filter((m) => m.code !== code);
  } else {
    list = [{ code, name, markedAt: now }, ...list];
  }

  saveReplenishMarks(list);
  return list;
}

/** 필요하면 재고관리 화면에서 전부 지우는 용도 */
export function clearReplenishMarks() {
  saveReplenishMarks([]);
}
