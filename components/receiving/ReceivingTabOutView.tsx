"use client";

import type { PalletMaster, ReceivingItem } from "./types";

type Props = {
  // refs
  palletOutRef: React.RefObject<HTMLInputElement | null>;
  qtyOutRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;

  // state
  palletQROut: string;
  setPalletQROut: (v: string) => void;
  selectedPalletOut: PalletMaster | null;
  setSelectedPalletOut: (v: PalletMaster | null) => void;

  showPalletSuggestionsOut: boolean;
  setShowPalletSuggestionsOut: (v: boolean) => void;

  outFilterText: string;
  setOutFilterText: (v: string) => void;

  itemsOut: ReceivingItem[];
  filteredOutItems: ReceivingItem[];

  outConfirmed: boolean;
  setOutConfirmed: (v: boolean) => void;

  outError: string | null;
  setOutError: (v: string | null) => void;

  outHasOver: boolean;

  // handlers
  findPalletExact: (q: string) => PalletMaster | null;
  handleChangeQtyOut: (id: number, value: string) => void;
  handleOutAllRow: (id: number) => void;

  // suggestions
  palletSuggestionsOut: PalletMaster[];
};

export function ReceivingTabOutView(props: Props) {
  return (
    <div className="basis-[45%] shrink-0 flex flex-col gap-4 min-w-0">
      {/* 파렛트 번호 (출고) */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-semibold text-gray-700">출고 파렛트번호 (QR코드)</h3>
        <div className="flex gap-2">
          <input
            ref={props.palletOutRef as any}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="QR 스캔 또는 직접 입력 (예: PLT-1234)"
            value={props.palletQROut}
            onChange={(e) => {
              const v = e.target.value;
              props.setPalletQROut(v);
              props.setSelectedPalletOut(null);
              props.setShowPalletSuggestionsOut(!!v);
              props.setOutConfirmed(false);
              props.setOutError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const exact = props.findPalletExact(props.palletQROut);
                if (exact) {
                  props.setSelectedPalletOut(exact);
                  props.setPalletQROut(exact.id);
                  props.setShowPalletSuggestionsOut(false);
                }
              }
            }}
          />
          <button
            type="button"
            className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
            onClick={() => {
              alert("QR 스캔 기능은 추후 연동 예정입니다. (데모)");
            }}
          >
            QR 스캔
          </button>
        </div>

        {/* 파렛트 자동완성 리스트 (출고) */}
        {props.showPalletSuggestionsOut && props.palletSuggestionsOut.length > 0 && (
          <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px] shadow-sm">
            {props.palletSuggestionsOut.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  props.setPalletQROut(p.id);
                  props.setSelectedPalletOut(p);
                  props.setShowPalletSuggestionsOut(false);
                  props.setOutConfirmed(false);
                  props.setOutError(null);
                }}
                className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
              >
                <span className="font-mono">{p.id}</span>
                <span className="ml-2 text-gray-600 flex-1 truncate">{p.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* 선택된 파렛트 표시 (출고) */}
        <div className="mt-1 text-[11px] text-gray-600">
          {props.selectedPalletOut ? (
            <>
              선택된 파렛트:&nbsp;
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-800 border border-slate-200">
                {props.selectedPalletOut.id}
              </span>
              <span className="ml-1 text-gray-700">{props.selectedPalletOut.desc}</span>
            </>
          ) : props.palletQROut ? (
            <span className="text-gray-500">
              직접 입력한 파렛트 번호:{" "}
              <span className="font-mono font-semibold">{props.palletQROut}</span>
            </span>
          ) : (
            <span className="text-gray-400">선택된 파렛트가 없습니다.</span>
          )}
        </div>
      </section>

      {/* 출고 목록 필터 */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-semibold text-gray-700">품목 필터 (코드/이름)</h3>
        <input
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="예: P-1001 / PET"
          value={props.outFilterText}
          onChange={(e) => props.setOutFilterText(e.target.value)}
        />
      </section>

      {/* 출고 품목 목록 */}
      <section className="space-y-1.5 flex-1 min-h-[160px] min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-700">출고 품목 목록</h3>
          {props.outConfirmed && (
            <span className="text-[11px] font-semibold text-orange-700">
              ✅ 출고 확정 완료
            </span>
          )}
        </div>

        <div className="border rounded-lg overflow-hidden max-h-[320px]">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-2 py-2 text-left w-24">상품코드</th>
                <th className="px-2 py-2 text-left">상품명</th>
                <th className="px-2 py-2 text-right w-20">BOX</th>
                <th className="px-2 py-2 text-right w-24">전체수량(EA)</th>
                <th className="px-2 py-2 text-center w-28">출고수량(EA)</th>
                <th className="px-2 py-2 text-center w-16">전량</th>
              </tr>
            </thead>
            <tbody>
              {props.filteredOutItems.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-400 text-xs" colSpan={6}>
                    표시할 품목이 없습니다.
                  </td>
                </tr>
              ) : (
                props.filteredOutItems.map((it) => {
                  const max = typeof it.totalQty === "number" ? it.totalQty : 0;
                  const isOver = typeof it.totalQty === "number" && it.qty > max;

                  return (
                    <tr
                      key={it.id}
                      className={`border-t hover:bg-gray-50 text-[11px] ${isOver ? "bg-red-50" : ""}`}
                    >
                      <td className="px-2 py-2 font-medium text-gray-800">{it.code}</td>
                      <td className="px-2 py-2 text-gray-700">{it.name}</td>
                      <td className="px-2 py-2 text-right">{it.boxQty?.toLocaleString() ?? "-"}</td>
                      <td className="px-2 py-2 text-right">{it.totalQty?.toLocaleString() ?? "-"}</td>
                      <td className="px-2 py-1 text-center">
                        <input
                          ref={(el) => {
                            props.qtyOutRefs.current[it.id] = el;
                          }}
                          className={`w-20 rounded-md border px-2 py-1 text-xs text-right ${
                            isOver ? "border-red-300 bg-white" : "border-gray-300 bg-white"
                          }`}
                          value={it.qty || ""}
                          onChange={(e) => props.handleChangeQtyOut(it.id, e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          type="button"
                          className="rounded-full border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100"
                          onClick={() => props.handleOutAllRow(it.id)}
                        >
                          전량
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {props.outHasOver && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            출고수량이 현재수량을 초과한 품목이 있습니다. (현재수량 이하로 입력해 주세요)
          </div>
        )}

        {props.outError && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {props.outError}
          </div>
        )}
      </section>
    </div>
  );
}
