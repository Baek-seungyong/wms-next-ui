// components/receiving/mockData.ts
import type { PalletMaster, PalletStock, ProductMaster } from "./types";

/** 🔹 예시 상품 마스터 */
export const PRODUCT_MASTER: ProductMaster[] = [
  { code: "P-1001", name: "PET 500ml 투명" },
  { code: "P-1002", name: "PET 300ml 밀키" },
  { code: "P-2001", name: "PET 1L 투명" },
  { code: "C-2001", name: "캡 28파이 화이트" },
  { code: "L-5001", name: "라벨 500ml 화이트" },
];

/** 🔹 예시 파렛트 마스터 */
export const PALLET_MASTER: PalletMaster[] = [
  { id: "PLT-1001", desc: "3층 플랫파렛트 A-01" },
  { id: "PLT-1002", desc: "3층 플랫파렛트 A-02" },
  { id: "PLT-2001", desc: "2층 잔량파렛트 B-01" },
  { id: "PLT-2002", desc: "2층 잔량파렛트 B-02" },
  { id: "PLT-3001", desc: "1층 출고 대기존 S-01" },
];

/** 🔹 예시 파렛트 현재 적재 재고 */
export const PALLET_STOCK: PalletStock[] = [
  {
    palletId: "PLT-1001",
    code: "P-1001",
    name: "PET 500ml 투명",
    boxQty: 10,
    eaQty: 1200,
  },
  {
    palletId: "PLT-1001",
    code: "C-2001",
    name: "캡 28파이 화이트",
    boxQty: 8,
    eaQty: 960,
  },
  {
    palletId: "PLT-2001",
    code: "P-2001",
    name: "PET 1L 투명",
    boxQty: 5,
    eaQty: 600,
  },
];
