"use client";

import { useState } from "react";

type ShippingModalProps = {
  open: boolean;
  onClose: () => void;
};

type PalletItem = {
  id: number;
  code: string;
  name: string;
  currentQty: number;
  outQty: number;
  checked: boolean;
};

export function ShippingModal({ open, onClose }: ShippingModalProps) {
  const [palletQR, setPalletQR] = useState("");
  const [items, setItems] = useState<PalletItem[]>([]);
  const [targetLocation, setTargetLocation] = useState<"피킹" | "2-1" | "3-1">(
    "피킹",
  );

  if (!open) return null;

  // 데모용: 파렛트 조회 시 더미 데이터 로드
  const handleLoadPallet = () => {
    if (!palletQR.trim()) {
      alert("파렛트 QR을 입력해주세요.");
      return;
    }
    setItems([
      {
        id: 1,
        code: "P-001",
        name: "PET 500ml 투명",
        currentQty: 100,
        outQty: 0,
        checked: false,
      },
      {
        id: 2,
        code: "P-013",
        name: "PET 1L 반투명",
        currentQty: 50,
        outQty: 0,
        checked: false,
      },
      {
        id: 3,
        code: "C-201",
        name: "캡 28파이 화이트",
        currentQty: 500,
        outQty: 0,
        checked: false,
      },
    ]);
  };

  const toggleItem = (id: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, checked: !it.checked } : it,
      ),
    );
  };

  const changeOutQty = (id: number, value: string) => {
    const num = Number(value.replace(/[^0-9]/g, ""));
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, outQty: num || 0 } : it,
      ),
    );
  };

  const handleSubmit = () => {
    const selected = items.filter((it) => it.checked && it.outQty > 0);
    if (!palletQR.trim()) {
      alert("파렛트 번호(QR)를 입력해주세요.");
      return;
    }
    if (selected.length === 0) {
      alert("출고할 품목과 수량을 선택해주세요.");
      return;
    }

    const summary = selected
      .map(
        (it) =>
          `${it.name}(${it.code}) ${it.outQty}EA / 현재 ${it.currentQty}EA`,
      )
      .join("\n");

    alert(
      [
        `출고 파렛트: ${palletQR}`,
        `이동 위치: ${targetLocation}`,
        "",
        "출고 품목:",
        summary,
      ].join("\n"),
    );

    // 데모: 완료 후 초기화
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
              재고 출고 · 파렛트 단위 출고 / 창고이동
            </h2>
            <p className="text-xs text-gray-500">
              파렛트 적재 내역을 조회하고, 선택한 상품을 수동 출고/창고이동 하는 화면입니다.
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
          {/* 왼쪽: 파렛트 조회 및 품목 선택 */}
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
                  onClick={handleLoadPallet}
                >
                  파렛트 조회
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                QR 스캔 후 파렛트에 적재된 상품 정보가 아래 리스트에 표시됩니다.
              </p>
            </section>

            {/* 적재 내역 리스트 */}
            <section className="space-y-1.5 flex-1 min-h-[160px]">
              <h3 className="text-xs font-semibold text-gray-700">
                파렛트 적재 내역
              </h3>
              <div className="border rounded-lg overflow-hidden max-h-[260px]">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 py-2 w-8 text-center"></th>
                      <th className="px-2 py-2 text-left w-28">상품코드</th>
                      <th className="px-2 py-2 text-left">상품명</th>
                      <th className="px-2 py-2 text-center w-24">현재수량</th>
                      <th className="px-2 py-2 text-center w-28">
                        출고수량(EA)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-gray-400 text-xs"
                          colSpan={5}
                        >
                          아직 조회된 파렛트 적재 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      items.map((it) => (
                        <tr
                          key={it.id}
                          className="border-t hover:bg-gray-50 text-[11px]"
                        >
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              className="h-3 w-3"
                              checked={it.checked}
                              onChange={() => toggleItem(it.id)}
                            />
                          </td>
                          <td className="px-2 py-2 font-medium text-gray-800">
                            {it.code}
                          </td>
                          <td className="px-2 py-2 text-gray-700">{it.name}</td>
                          <td className="px-2 py-2 text-center text-gray-800">
                            {it.currentQty.toLocaleString()} EA
                          </td>
                          <td className="px-2 py-1 text-center">
                            <input
                              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs text-right"
                              value={it.outQty || ""}
                              onChange={(e) =>
                                changeOutQty(it.id, e.target.value)
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
              <h3 className="text-xs font-semibold text-gray-700">
                이동 / 반납 위치
              </h3>
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
                예: 2-1 창고에서 피킹창고로 일부 수량만 이동하는 경우 등에 사용합니다.
              </p>
            </section>
          </div>

          {/* 오른쪽: 미리보기 / 설명 */}
          <div className="w-[42%] flex flex-col border-l pl-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">
              이번 출고 / 이송 지시 미리보기
            </h3>
            <div className="flex-1 border rounded-lg bg-gray-50 px-3 py-2 overflow-auto text-[11px] text-gray-700 space-y-1">
              <p>
                파렛트:{" "}
                <span className="font-semibold">
                  {palletQR || "미입력"}
                </span>
              </p>
              <p>
                이동 위치:{" "}
                <span className="font-semibold">
                  {targetLocation}
                </span>
              </p>
              <hr className="my-1" />
              <p className="font-semibold mb-1">출고 품목</p>
              {items.filter((it) => it.checked && it.outQty > 0).length === 0 ? (
                <p className="text-gray-400">
                  선택된 출고 품목이 없습니다. 체크 후 수량을 입력하세요.
                </p>
              ) : (
                items
                  .filter((it) => it.checked && it.outQty > 0)
                  .map((it) => (
                    <p key={it.id}>
                      • {it.name}({it.code}){" "}
                      <span className="font-semibold">
                        {it.outQty} EA
                      </span>{" "}
                      / 현재 {it.currentQty} EA
                    </p>
                  ))
              )}
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              이 화면은 창고 간 이송 및 파렛트 일부 출고를 위한 예시 UI입니다. 실제 적용 시에는 재고 차감 및
              이송 트래킹 로직과 연동됩니다.
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
          <p className="text-[11px] text-gray-500">
            · 선택한 품목만 출고/이송 처리되며, 나머지는 기존 파렛트에 그대로 남습니다.
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
              이송 지시 (출고)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
