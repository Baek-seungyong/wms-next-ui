"use client";

import { useState } from "react";
import type { PalletInfo } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function RobotProductCallModal({ open, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<{ code: string; name: string } | null>(null);
  const [pallets, setPallets] = useState<PalletInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!open) return null;

  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSelectedProduct(null);
      setPallets([]);
      setSelectedIds([]);
      return;
    }

    if (q.includes("cap") || q.includes("캡")) {
      setSelectedProduct({ code: "C-BLACK", name: "캡 블랙" });
      setPallets([
        { id: "PLT-3F-C01", floor: "3-1 풀파렛트", location: "3층 랙 A-02", boxQty: 32, looseQty: 0, called: false },
        { id: "PLT-3F-C02", floor: "3-1 풀파렛트", location: "3층 랙 A-03", boxQty: 28, looseQty: 0, called: false },
        { id: "PLT-2F-C10", floor: "2-1 잔량파렛트", location: "2층 랙 B-05", boxQty: 4, looseQty: 1200, called: false },
        { id: "PLT-2F-C11", floor: "2-1 잔량파렛트", location: "2층 랙 B-06", boxQty: 2, looseQty: 600, called: false },
      ]);
      setSelectedIds([]);
      return;
    }

    if (q.includes("label") || q.includes("라벨")) {
      setSelectedProduct({ code: "L-500W", name: "라벨 500ml 화이트" });
      setPallets([
        { id: "PLT-3F-L01", floor: "3-1 풀파렛트", location: "3층 랙 C-01", boxQty: 20, looseQty: 0, called: false },
        { id: "PLT-3F-L02", floor: "3-1 풀파렛트", location: "3층 랙 C-02", boxQty: 18, looseQty: 0, called: false },
        { id: "PLT-2F-L10", floor: "2-1 잔량파렛트", location: "2층 랙 D-04", boxQty: 3, looseQty: 400, called: false },
        { id: "PLT-2F-L11", floor: "2-1 잔량파렛트", location: "2층 랙 D-05", boxQty: 1, looseQty: 120, called: false },
      ]);
      setSelectedIds([]);
      return;
    }

    if (q.includes("500")) {
      setSelectedProduct({ code: "P-500ML-T", name: "PET 500ml 투명" });
      setPallets([
        { id: "PLT-3F-P500-01", floor: "3-1 풀파렛트", location: "3층 랙 A-10", boxQty: 36, looseQty: 0, called: false },
        { id: "PLT-3F-P500-02", floor: "3-1 풀파렛트", location: "3층 랙 A-11", boxQty: 36, looseQty: 0, called: false },
        { id: "PLT-2F-P500-10", floor: "2-1 잔량파렛트", location: "2층 랙 B-10", boxQty: 5, looseQty: 180, called: false },
        { id: "PLT-2F-P500-11", floor: "2-1 잔량파렛트", location: "2층 랙 B-11", boxQty: 2, looseQty: 60, called: false },
      ]);
      setSelectedIds([]);
      return;
    }

    setSelectedProduct({ code: "P-200ML-T", name: "PET 200ml 용기 투명" });
    setPallets([
      { id: "PLT-3F-P200-01", floor: "3-1 풀파렛트", location: "3층 랙 A-01", boxQty: 40, looseQty: 0, called: false },
      { id: "PLT-3F-P200-02", floor: "3-1 풀파렛트", location: "3층 랙 A-02", boxQty: 38, looseQty: 0, called: false },
      { id: "PLT-2F-P200-10", floor: "2-1 잔량파렛트", location: "2층 랙 B-03", boxQty: 6, looseQty: 220, called: false },
      { id: "PLT-2F-P200-11", floor: "2-1 잔량파렛트", location: "2층 랙 B-07", boxQty: 3, looseQty: 0, called: false },
    ]);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const callSelectedPallets = () => {
    if (selectedIds.length === 0) return;
    setPallets((prev) =>
      prev.map((p) => (selectedIds.includes(p.id) ? { ...p, called: true } : p)),
    );
  };

  const totalSelectedBox = pallets
    .filter((p) => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.boxQty, 0);

  const totalSelectedLoose = pallets
    .filter((p) => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.looseQty, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[960px] h-[560px] rounded-2xl shadow-xl border border-gray-200 bg-white flex flex-col">
        <div className="p-4 flex flex-col gap-3 h-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">AMR 수동 호출 · 로봇 / 제품 호출</h2>
              <p className="text-[11px] text-gray-500 mt-1">
                특정 제품 기준으로 3층 풀파렛트 / 2층 잔량파렛트를 조회하고, 호출할 파렛트를 선택합니다.
              </p>
            </div>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              onClick={onClose}
            >
              ✕ 닫기
            </button>
          </div>

          <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
            <div className="col-span-4 flex flex-col gap-3">
              <div className="h-full border border-gray-200 rounded-xl">
                <div className="p-3 flex flex-col gap-3 h-full">
                  <div>
                    <h3 className="text-xs font-semibold mb-1">상품 검색</h3>
                    <div className="flex gap-2 mb-2">
                      <input
                        className="flex-1 border rounded-md px-2 py-1 text-xs"
                        placeholder="제품 코드 또는 이름 (예: PET 200 / PET 500 / 캡 / 라벨)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-md"
                        onClick={handleSearch}
                      >
                        검색
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      검색 후 해당 제품이 적재된 파렛트 목록이 우측에 표시됩니다.
                    </p>
                  </div>

                  <div className="border rounded-xl p-3 bg-gray-50 text-xs flex-1">
                    <p className="font-semibold text-gray-800 mb-1">선택된 상품</p>
                    {selectedProduct ? (
                      <>
                        <p className="text-gray-700">코드: {selectedProduct.code}</p>
                        <p className="text-gray-700">제품명: {selectedProduct.name}</p>
                      </>
                    ) : (
                      <p className="text-gray-500">아직 선택된 상품이 없습니다.</p>
                    )}
                  </div>

                  <div className="border rounded-xl p-3 bg-gray-50 text-xs">
                    <p className="font-semibold text-gray-800 mb-1">선택된 파렛트 합계</p>
                    <p className="text-gray-700">
                      전체 박스: <span className="font-medium">{totalSelectedBox}</span> BOX
                    </p>
                    <p className="text-gray-700">
                      전체 낱개: <span className="font-medium">{totalSelectedLoose}</span> EA
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      여러 파렛트를 동시에 선택해서 호출할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-8 flex flex-col">
              <div className="flex-1 border border-gray-200 rounded-xl">
                <div className="p-3 h-full flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold">파렛트 목록</h3>
                      <p className="text-[11px] text-gray-500">
                        3층 풀파렛트와 2층 잔량파렛트를 한 화면에서 조회하고, 호출할 파렛트를 선택합니다.
                      </p>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      선택된 파렛트 수: {selectedIds.length} 개
                    </div>
                  </div>

                  <div className="border rounded-xl overflow-hidden flex-1 min-h-0">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 border-b w-8 text-center">
                            <input
                              type="checkbox"
                              checked={
                                pallets.length > 0 && selectedIds.length === pallets.length
                              }
                              onChange={(e) =>
                                setSelectedIds(
                                  e.target.checked ? pallets.map((p) => p.id) : [],
                                )
                              }
                            />
                          </th>
                          <th className="p-2 border-b w-32 text-left">파렛트ID</th>
                          <th className="p-2 border-b w-32 text-center">위치</th>
                          <th className="p-2 border-b text-left">랙 / 상세위치</th>
                          <th className="p-2 border-b w-24 text-center">박스수량</th>
                          <th className="p-2 border-b w-28 text-center">낱개 수량</th>
                          <th className="p-2 border-b w-24 text-center">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pallets.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="p-4 text-center text-gray-500 text-xs"
                            >
                              상품을 검색하면 해당 상품이 적재된 파렛트 목록이 표시됩니다.
                            </td>
                          </tr>
                        )}
                        {pallets.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="border-t p-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(p.id)}
                                onChange={() => toggleSelect(p.id)}
                              />
                            </td>
                            <td className="border-t p-2">{p.id}</td>
                            <td className="border-t p-2 text-center">{p.floor}</td>
                            <td className="border-t p-2">{p.location}</td>
                            <td className="border-t p-2 text-center">{p.boxQty} BOX</td>
                            <td className="border-t p-2 text-center">{p.looseQty} EA</td>
                            <td className="border-t p-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] ${
                                  p.called
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {p.called ? "호출완료" : "대기"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 text-xs mt-1">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                      onClick={() => setSelectedIds([])}
                      disabled={selectedIds.length === 0}
                    >
                      선택 해제
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-full ${
                        selectedIds.length === 0
                          ? "bg-gray-200 text-gray-500"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                      disabled={selectedIds.length === 0}
                      onClick={callSelectedPallets}
                    >
                      선택 파렛트 호출
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}