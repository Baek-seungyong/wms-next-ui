import type { MoveTarget, PalletStock, ReceivingItem } from "./types";
import { PALLET_MASTER, PALLET_STOCK } from "./mockData";

export function normalizeNum(value: string) {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

export function findPalletExact(q: string) {
  const t = q.trim().toUpperCase();
  return PALLET_MASTER.find((p) => p.id.toUpperCase() === t) ?? null;
}

export const getPalletStock = (palletId: string): PalletStock[] =>
  PALLET_STOCK.filter((s) => s.palletId === palletId);

export const buildOutItemsFromStock = (palletId: string): ReceivingItem[] => {
  const now = Date.now();
  const stock = getPalletStock(palletId);
  return stock.map((s, idx) => ({
    id: now + idx,
    code: s.code,
    name: s.name,
    qty: 0,
    boxQty: s.boxQty,
    totalQty: s.eaQty,
  }));
};

export const formatMoveTarget = (t: MoveTarget) => {
  if (t.kind === "PICKING") return "피킹";
  if (t.kind === "2F")
    return `2층${t.zoneId ? ` - ${t.zoneId.replace("2F-", "")}` : ""}`;
  return `3층${t.zoneId ? ` - ${t.zoneId.replace("3F-", "")}` : ""}`;
};

export const ensureZoneSelected = (t: MoveTarget) => {
  if (t.kind === "2F" || t.kind === "3F") return !!t.zoneId;
  return true;
};
