"use client";

import { useState } from "react";

type LineType = "피킹" | "2-1" | "3-1";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ReceivingItem = {
  id: number;
  code: string;
  name: string;
  qty: number;
};

type PalletItem = {
  id: number;
  code: string;
  name: string;
  currentQty: number;
  outQty: number;
  checked: boolean;
};

export function StockManualAdjustModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"입고" | "출고">("입고");

  // ===== 입고 탭 상태 =====
  const [inPalletQR, setInPalletQR] = useState("");
  const [inSearchText, setInSearchText] = useState("");
  const [inItems, setInItems] = useState<ReceivingItem[]>([]);
  const [inTargetLocation, setInTargetLocation] = useState<LineType>("피킹");

  // ===== 출고 탭 상태 =====
  const [outPalletQR, setOutPalletQR] = useState("");
  const [outItems, setOutItems] = useState<PalletItem[]>([]);
  const [outTargetLocation, setOutTargetLocation] = useState<LineType>("피킹");

  if (!open) return null;

  // ---------------- 공통: 빈 파렛트 호출 ----------------
  const handleEmptyPalletCall = () => {
    alert("빈 파렛트 호출 지시 완료 (데모): 현재 위치로 빈 파렛트가 이동합니다.");
  };

  // ---------------- 입고 탭 로직 ----------------
  const handleAddReceivingItem = () => {
    if (!inSearchText.trim()) return;
    const txt = inSearchText.trim();
    const newItem: ReceivingItem = {
      id: Date.now(),
      code: txt,
      name: txt,
      qty: 0,
    };
    setInItems((prev) => [...prev, newItem]);
    setInSearchText("");
  };

  const handleChangeReceivingQty = (id: number, value: string) => {
    const num = Number(value.replace(/[^0-9]/g, ""));
    setInItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: num || 0 } : it)),
    );
  };

  const handleSubmitReceiving = () => {
    const validItems = inItems.filter((it) => it.qty > 0);
    if (!inPalletQR.trim()) {
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
        "[입고 / 보충 지시]",
        `파렛트: ${inPalletQR}`,
        `위치: ${inTargetLocation}`,
        "",
        "입고 품목:",
        summary,
      ].join("\n"),
    );

    // 데모: 초기화
    setInItems([]);
    setInPalletQR("");
    setInTargetLocation("피킹");
    onClose();
  };

  // ---------------- 출고 탭 로직 ----------------
  const handleLoadPallet = () => {
    if (!outPalletQR.trim()) {
      alert("파렛트 QR을 입력해주세요.");
      return;
    }

    // 데모용 더미 데이터
    setOutItems([
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

  const toggleOutItem = (id: number) => {
    setOutItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, checked: !it.checked } : it,
      ),
    );
  };

  const changeOutQty = (id: number, value: string) => {
    const num = Number(value.replace(/[^0-9]/g, ""));
    setOutItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, outQty: num || 0 } : it,
      ),
    );
  };

  const handleSubmitShipping = () => {
    const selected = outItems.filter((it) => it.checked && it.outQty > 0);
    if (!outPalletQR.trim()) {
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
        "[출고 / 창고이동 지시]",
        `파렛트: ${outPalletQR}`,
        `이동 위치: ${outTargetLocation}`,
        "",
        "출고 품목:",
        summary,
      ].join("\n"),
    );

    // 데모: 초기화
    setOutItems([]);
    setOutPalletQR("");
    setOutTargetLocation("피킹");
    onClose();
  };

  // ================== JSX ===================
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[960px] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold">
              재고 수동 수정 · 파렛트 단위 입고 / 출고 / 이송
            </h2>
            <p className="text-xs text-gray-500">
              파렛트번호와 상품, 수량, 위치를 지정하여 재고를 수동으로 입고하거나 출고/창고이동 지시를 합니다.
            </p>
          </div>
          <button
            className="text-xs text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            닫기 ✕
          </button>
        </div>

        {/* 상단 탭 + 빈 파렛트 버튼 */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b bg-gray-50">
          <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
            {(["입고", "출고"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1 rounded-full ${
                  activeTab === tab
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-800 hover:bg-gray-100"
            onClick={handleEmptyPalletCall}
          >
            📦 빈 파렛트 호출
          </button>
        </div>

        {/* 본문 (탭별 내용) */}
        <div className="flex-1 flex px-5 py-4 gap-4 overflow-hidden text-sm">
          {activeTab === "입고" ? (
            // ========= 입고 탭 =========
            <>
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
                      value={inPalletQR}
                      onChange={(e) => setInPalletQR(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
                    >
                      QR 스캔
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    생산완료품 또는 매입상품을 파렛트에 적재한 후, QR을 스캔하여 파렛트번호를 등록합니다.
                  </p>
                </section>

                {/* 상품 조회/추가 */}
                <section className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-gray-700">제품 조회</h3>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="제품 코드 또는 이름 (예: PET 200 / 캡 / 라벨)"
                      value={inSearchText}
                      onChange={(e) => setInSearchText(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
                      onClick={handleAddReceivingItem}
                    >
                      조회/추가
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    조회된 상품을 아래 리스트에 추가한 후, 파렛트에 적재되는 입고 수량(EA)을 입력합니다.
                  </p>
                </section>

                {/* 입고 품목 리스트 */}
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
                          <th className="px-2 py-2 text-center w-28">
                            입고수량(EA)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {inItems.length === 0 ? (
                          <tr>
                            <td
                              className="px-3 py-4 text-center text-gray-400 text-xs"
                              colSpan={3}
                            >
                              아직 추가된 입고 품목이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          inItems.map((it) => (
                            <tr
                              key={it.id}
                              className="border-t hover:bg-gray-50 text-[11px]"
                            >
                              <td className="px-2 py-2 font-medium text-gray-800">
                                {it.code}
                              </td>
                              <td className="px-2 py-2 text-gray-700">
                                {it.name}
                              </td>
                              <td className="px-2 py-1 text-center">
                                <input
                                  className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs text-right"
                                  value={it.qty || ""}
                                  onChange={(e) =>
                                    handleChangeReceivingQty(
                                      it.id,
                                      e.target.value,
                                    )
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
                    입고 위치
                  </h3>
                  <div className="flex gap-3 text-xs text-gray-800">
                    {(["피킹", "2-1", "3-1"] as const).map((loc) => (
                      <label
                        key={loc}
                        className="inline-flex items-center gap-1.5"
                      >
                        <input
                          type="radio"
                          className="h-3 w-3"
                          checked={inTargetLocation === loc}
                          onChange={() => setInTargetLocation(loc)}
                        />
                        <span>{loc}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    예: 1-1 생산라인에서 완제품을 3-1 보관창고 또는 피킹창고로 바로 입고할 때 사용합니다.
                  </p>
                </section>
              </div>

              {/* 오른쪽: 입고 미리보기 */}
              <div className="w-[42%] flex flex-col border-l pl-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">
                  이번 입고 / 보충 지시 미리보기
                </h3>
                <div className="flex-1 border rounded-lg bg-gray-50 px-3 py-2 overflow-auto text-[11px] text-gray-700 space-y-1">
                  <p>
                    파렛트:{" "}
                    <span className="font-semibold">
                      {inPalletQR || "미입력"}
                    </span>
                  </p>
                  <p>
                    위치:{" "}
                    <span className="font-semibold">
                      {inTargetLocation}
                    </span>
                  </p>
                  <hr className="my-1" />
                  <p className="font-semibold mb-1">입고 품목</p>
                  {inItems.length === 0 ? (
                    <p className="text-gray-400">
                      아직 추가된 품목이 없습니다.
                    </p>
                  ) : (
                    inItems.map((it) => (
                      <p key={it.id}>
                        • {it.name}({it.code}){" "}
                        <span className="font-semibold">{it.qty} EA</span>
                      </p>
                    ))
                  )}
                </div>
                <p className="mt-2 text-[11px] text-gray-500">
                  이 탭은 생산/매입 입고 및 피킹/2-1 보충 작업을 위한 수동 입고 화면 예시입니다.
                </p>
              </div>
            </>
          ) : (
            // ========= 출고 탭 =========
            <>
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
                      value={outPalletQR}
                      onChange={(e) => setOutPalletQR(e.target.value)}
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
                    파렛트 QR을 스캔하면 현재 그 파렛트에 적재된 상품 목록이 아래에 표시됩니다.
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
                          <th className="px-2 py-2 text-center w-24">
                            현재수량
                          </th>
                          <th className="px-2 py-2 text-center w-28">
                            출고수량(EA)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {outItems.length === 0 ? (
                          <tr>
                            <td
                              className="px-3 py-4 text-center text-gray-400 text-xs"
                              colSpan={5}
                            >
                              아직 조회된 파렛트 적재 내역이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          outItems.map((it) => (
                            <tr
                              key={it.id}
                              className="border-t hover:bg-gray-50 text-[11px]"
                            >
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="checkbox"
                                  className="h-3 w-3"
                                  checked={it.checked}
                                  onChange={() => toggleOutItem(it.id)}
                                />
                              </td>
                              <td className="px-2 py-2 font-medium text-gray-800">
                                {it.code}
                              </td>
                              <td className="px-2 py-2 text-gray-700">
                                {it.name}
                              </td>
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
                      <label
                        key={loc}
                        className="inline-flex items-center gap-1.5"
                      >
                        <input
                          type="radio"
                          className="h-3 w-3"
                          checked={outTargetLocation === loc}
                          onChange={() => setOutTargetLocation(loc)}
                        />
                        <span>{loc}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    예: 2-1 창고 파렛트 일부를 피킹창고로 이송하거나, 보류존 등으로 이동시킬 때 사용합니다.
                  </p>
                </section>
              </div>

              {/* 오른쪽: 출고 미리보기 */}
              <div className="w-[42%] flex flex-col border-l pl-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">
                  이번 출고 / 창고이동 지시 미리보기
                </h3>
                <div className="flex-1 border rounded-lg bg-gray-50 px-3 py-2 overflow-auto text-[11px] text-gray-700 space-y-1">
                  <p>
                    파렛트:{" "}
                    <span className="font-semibold">
                      {outPalletQR || "미입력"}
                    </span>
                  </p>
                  <p>
                    이동 위치:{" "}
                    <span className="font-semibold">
                      {outTargetLocation}
                    </span>
                  </p>
                  <hr className="my-1" />
                  <p className="font-semibold mb-1">출고 품목</p>
                  {outItems.filter((it) => it.checked && it.outQty > 0).length ===
                  0 ? (
                    <p className="text-gray-400">
                      선택된 출고 품목이 없습니다. 체크 후 수량을 입력하세요.
                    </p>
                  ) : (
                    outItems
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
                  이 탭은 파렛트에 적재된 상품 중 일부를 수동 출고하거나 다른 창고로 이동시키는 작업용 UI
                  예시입니다.
                </p>
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
          <p className="text-[11px] text-gray-500">
            · 이 화면은 WMS 작업자용 재고 수동 조정 UI 예시입니다. 실제 적용 시에는 WMS 재고 / 로봇 이송
            스케줄러와 연동하여 사용합니다.
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-full bg-white border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
              onClick={onClose}
            >
              닫기
            </button>
            {activeTab === "입고" ? (
              <button
                className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700"
                onClick={handleSubmitReceiving}
              >
                입고 / 이송 지시
              </button>
            ) : (
              <button
                className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700"
                onClick={handleSubmitShipping}
              >
                출고 / 이송 지시
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
