"use client";

import { useState } from "react";

type ReceivingModalProps = {
  open: boolean;
  onClose: () => void;
};

type ReceivingItem = {
  id: number;
  code: string;
  name: string;
  qty: number;
};

export function ReceivingModal({ open, onClose }: ReceivingModalProps) {
  const [palletQR, setPalletQR] = useState("");
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState<ReceivingItem[]>([]);
  const [targetLocation, setTargetLocation] = useState<"피킹" | "2-1" | "3-1">(
    "피킹",
  );

  if (!open) return null;

  const handleAddItem = () => {
    if (!searchText.trim()) return;
    const newItem: ReceivingItem = {
      id: Date.now(),
      code: searchText.trim(),
      name: searchText.trim(),
      qty: 0,
    };
    setItems((prev) => [...prev, newItem]);
    setSearchText("");
  };

  const handleChangeQty = (id: number, value: string) => {
    const num = Number(value.replace(/[^0-9]/g, ""));
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: num || 0 } : it)),
    );
  };

  const handleSubmit = () => {
    const validItems = items.filter((it) => it.qty > 0);
    if (!palletQR.trim()) {
      alert("파렛트 번호(QR)를 입력해주세요.");
      return;
    }
    if (validItems.length === 0) {
      alert("입고 수량이 입력된 품목이 없습니다.");
      return;
    }

    const summary = validItems
      .map((it) => `${it.name}(${it.code}) ${it.qty}EA`)
      .join("\n");

    alert(
      [
        `입고 파렛트: ${palletQR}`,
        `위치: ${targetLocation}`,
        "",
        "입고 품목:",
        summary,
      ].join("\n"),
    );

    // 데모이므로 성공 후 폼 초기화
    setItems([]);
    setPalletQR("");
    setTargetLocation("피킹");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[960px] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold">
              재고 입고 · 파렛트 단위 입고 / 보충
            </h2>
            <p className="text-xs text-gray-500">
              생산/매입 입고 및 피킹/2-1 보충 입고를 수동으로 등록하는 화면입니다.
            </p>
          </div>
          <button
            className="text-xs text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            닫기 ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 flex px-5 py-4 gap-4 overflow-hidden text-sm">
          {/* 왼쪽: 입력 영역 */}
          <div className="w-[58%] flex flex-col gap-4">
            {/* 파렛트 번호 */}
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-700">
                파렛트번호 (QR코드)
              </h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="QR 스캔 또는 직접 입력 (예: PLT-1234)"
                  value={palletQR}
                  onChange={(e) => setPalletQR(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
                >
                  QR 스캔
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                실제 현장에서는 QR 스캐너로 자동 입력되며, 지금은 예시로 번호를 직접 입력합니다.
              </p>
            </section>

            {/* 상품 조회 / 추가 */}
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-700">제품 조회</h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="제품 코드 또는 이름 (예: PET 200 / 캡 / 라벨)"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
                  onClick={handleAddItem}
                >
                  조회/추가
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                조회된 상품을 아래 리스트에 추가한 후, 입고 수량을 입력합니다. (데모에서는 입력값을 그대로
                코드로 사용합니다)
              </p>
            </section>

            {/* 추가된 상품 목록 */}
            <section className="space-y-1.5 flex-1 min-h-[160px]">
              <h3 className="text-xs font-semibold text-gray-700">
                입고 품목 목록
              </h3>
              <div className="border rounded-lg overflow-hidden max-h-[260px]">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 py-2 text-left w-28">상품코드</th>
                      <th className="px-2 py-2 text-left">상품명</th>
                      <th className="px-2 py-2 text-center w-28">입고수량(EA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-gray-400 text-xs"
                          colSpan={3}
                        >
                          아직 추가된 입고 품목이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      items.map((it) => (
                        <tr
                          key={it.id}
                          className="border-t hover:bg-gray-50 text-[11px]"
                        >
                          <td className="px-2 py-2 font-medium text-gray-800">
                            {it.code}
                          </td>
                          <td className="px-2 py-2 text-gray-700">{it.name}</td>
                          <td className="px-2 py-1 text-center">
                            <input
                              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs text-right"
                              value={it.qty || ""}
                              onChange={(e) =>
                                handleChangeQty(it.id, e.target.value)
                              }
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 위치 지정 */}
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-700">입고 위치</h3>
              <div className="flex gap-3 text-xs text-gray-800">
                {(["피킹", "2-1", "3-1"] as const).map((loc) => (
                  <label key={loc} className="inline-flex items-center gap-1.5">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      checked={targetLocation === loc}
                      onChange={() => setTargetLocation(loc)}
                    />
                    <span>{loc}</span>
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-gray-500">
                예: 1-1 생산라인에서 나온 완료품을 피킹창고 또는 2-1, 3-1 창고로 입고 지시합니다.
              </p>
            </section>
          </div>

          {/* 오른쪽: 간단 로그 / 설명 */}
          <div className="w-[42%] flex flex-col border-l pl-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">
              이번 입고 지시 미리보기
            </h3>
            <div className="flex-1 border rounded-lg bg-gray-50 px-3 py-2 overflow-auto text-[11px] text-gray-700 space-y-1">
              <p>
                파렛트:{" "}
                <span className="font-semibold">
                  {palletQR || "미입력"}
                </span>
              </p>
              <p>
                위치:{" "}
                <span className="font-semibold">
                  {targetLocation}
                </span>
              </p>
              <hr className="my-1" />
              <p className="font-semibold mb-1">입고 품목</p>
              {items.length === 0 ? (
                <p className="text-gray-400">아직 추가된 품목이 없습니다.</p>
              ) : (
                items.map((it) => (
                  <p key={it.id}>
                    • {it.name}({it.code}){" "}
                    <span className="font-semibold">{it.qty} EA</span>
                  </p>
                ))
              )}
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              이 화면은 재고 입고/보충 작업자를 위한 예시 UI입니다. 실제 적용 시에는 WMS/로봇 스케줄러와
              연동됩니다.
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
          <p className="text-[11px] text-gray-500">
            · 등록된 내역은 WMS 기준 재고에 반영되며, 필요 시 AMR 이송 지시까지 연동할 수 있습니다.
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-full bg-white border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
              onClick={onClose}
            >
              취소
            </button>
            <button
              className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700"
              onClick={handleSubmit}
            >
              입고 / 이송 지시
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
