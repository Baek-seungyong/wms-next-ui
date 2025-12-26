"use client";

import { useMemo } from "react";
import type { PalletMaster, PalletStock, ProductMaster, ReceivingItem } from "./types";
import Image from "next/image";

type Props = {
  // refs
  palletInRef: React.RefObject<HTMLInputElement | null>;
  productInRef: React.RefObject<HTMLInputElement | null>;
  qtyInRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
  lastAddedInItemIdRef: React.MutableRefObject<number | null>;

  // state
  palletQRIn: string;
  setPalletQRIn: (v: string) => void;
  selectedPalletIn: PalletMaster | null;
  setSelectedPalletIn: (v: PalletMaster | null) => void;

  searchTextIn: string;
  setSearchTextIn: (v: string) => void;
  selectedProductIn: ProductMaster | null;
  setSelectedProductIn: (v: ProductMaster | null) => void;

  showSuggestionsIn: boolean;
  setShowSuggestionsIn: (v: boolean) => void;
  showPalletSuggestionsIn: boolean;
  setShowPalletSuggestionsIn: (v: boolean) => void;

  itemsIn: ReceivingItem[];
  setItemsIn: React.Dispatch<React.SetStateAction<ReceivingItem[]>>;

  inConfirmed: boolean;
  setInConfirmed: (v: boolean) => void;
  inError: string | null;
  setInError: (v: string | null) => void;

  // derived lists
  productSuggestionsIn: ProductMaster[];
  palletSuggestionsIn: PalletMaster[];
  currentInStock: PalletStock[];

  // handlers
  findPalletExact: (q: string) => PalletMaster | null;
  handleAddItemIn: () => void;
  handleRemoveItemIn: (id: number) => void;
  handleChangeQtyIn: (id: number, value: string) => void;
};

export function ReceivingTabInView(props: Props) {
  const previewInItems = useMemo(
    () => props.itemsIn.filter((x) => x.qty > 0),
    [props.itemsIn],
  );

  return (
    <div className="basis-[45%] shrink-0 flex flex-col gap-4 min-w-0">
      {/* 파렛트 번호 (입고) */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-semibold text-gray-700">파렛트번호 (QR코드)</h3>
        <div className="flex gap-2">
          <input
            ref={props.palletInRef as any}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="QR 스캔 또는 직접 입력 (예: PLT-1234)"
            value={props.palletQRIn}
            onChange={(e) => {
              const v = e.target.value;
              props.setPalletQRIn(v);
              props.setSelectedPalletIn(null);
              props.setShowPalletSuggestionsIn(!!v);
              props.setInConfirmed(false);
              props.setInError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const exact = props.findPalletExact(props.palletQRIn);
                if (exact) {
                  props.setSelectedPalletIn(exact);
                  props.setPalletQRIn(exact.id);
                  props.setShowPalletSuggestionsIn(false);
                  setTimeout(() => props.productInRef.current?.focus(), 0);
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

        {/* 파렛트 자동완성 리스트 (입고) */}
        {props.showPalletSuggestionsIn && props.palletSuggestionsIn.length > 0 && (
          <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px] shadow-sm">
            {props.palletSuggestionsIn.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  props.setPalletQRIn(p.id);
                  props.setSelectedPalletIn(p);
                  props.setShowPalletSuggestionsIn(false);
                  props.setInConfirmed(false);
                  props.setInError(null);
                  setTimeout(() => props.productInRef.current?.focus(), 0);
                }}
                className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
              >
                <span className="font-mono">{p.id}</span>
                <span className="ml-2 text-gray-600 flex-1 truncate">{p.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* 선택된 파렛트 표시 */}
        <div className="mt-1 text-[11px] text-gray-600">
          {props.selectedPalletIn ? (
            <>
              선택된 파렛트:&nbsp;
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-800 border border-slate-200">
                {props.selectedPalletIn.id}
              </span>
              <span className="ml-1 text-gray-700">{props.selectedPalletIn.desc}</span>
            </>
          ) : props.palletQRIn ? (
            <span className="text-gray-500">
              직접 입력한 파렛트 번호:{" "}
              <span className="font-mono font-semibold">{props.palletQRIn}</span>
            </span>
          ) : (
            <span className="text-gray-400">선택된 파렛트가 없습니다.</span>
          )}
        </div>
      </section>

      {/* 상품 조회 / 추가 */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-semibold text-gray-700">제품 조회</h3>
        <div className="flex gap-2">
          <input
            ref={props.productInRef as any}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="제품 코드 또는 이름 (예: P-1001 / PET 500ml)"
            value={props.searchTextIn}
            onChange={(e) => {
              const v = e.target.value;
              props.setSearchTextIn(v);
              props.setSelectedProductIn(null);
              props.setShowSuggestionsIn(!!v);
              props.setInConfirmed(false);
              props.setInError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") props.handleAddItemIn();
            }}
          />
          <button
            type="button"
            className="px-3 py-2 rounded-md bg-gray-800 text-white text-xs"
            onClick={props.handleAddItemIn}
          >
            추가
          </button>
        </div>

        {/* 자동완성 리스트 (제품) */}
        {props.showSuggestionsIn && props.productSuggestionsIn.length > 0 && (
          <div className="mt-1 max-h-32 overflow-y-auto rounded border bg-white text-[11px] shadow-sm">
            {props.productSuggestionsIn.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => {
                  props.setSearchTextIn(p.code);
                  props.setSelectedProductIn(p);
                  props.setShowSuggestionsIn(false);
                  props.setInConfirmed(false);
                  props.setInError(null);

                  const exists = props.itemsIn.find((x) => x.code === p.code);
                  if (exists) {
                    props.lastAddedInItemIdRef.current = exists.id;
                    props.setSearchTextIn("");
                    props.setSelectedProductIn(null);
                    return;
                  }

                  const newItem: ReceivingItem = {
                    id: Date.now(),
                    code: p.code,
                    name: p.name,
                    qty: 0,
                  };
                  props.lastAddedInItemIdRef.current = newItem.id;
                  props.setItemsIn((prev) => [...prev, newItem]);
                  props.setSearchTextIn("");
                  props.setSelectedProductIn(null);
                }}
                className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-gray-100"
              >
                <span className="font-mono">{p.code}</span>
                <span className="ml-2 text-gray-500">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 입고 품목 목록 */}
      <section className="space-y-1.5 flex-1 min-h-[160px] min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-700">입고 품목 목록</h3>
          {props.inConfirmed && (
            <span className="text-[11px] font-semibold text-emerald-700">
              ✅ 입고 확정 완료
            </span>
          )}
        </div>

        <div className="border rounded-lg overflow-hidden max-h-[320px]">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-2 py-2 text-left w-28">상품코드</th>
                <th className="px-2 py-2 text-left">상품명</th>
                <th className="px-2 py-2 text-center w-28">입고수량(EA)</th>
                <th className="px-2 py-2 text-center w-16">삭제</th>
              </tr>
            </thead>
            <tbody>
              {props.itemsIn.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-400 text-xs" colSpan={4}>
                    아직 추가된 입고 품목이 없습니다.
                  </td>
                </tr>
              ) : (
                props.itemsIn.map((it) => (
                  <tr key={it.id} className="border-t hover:bg-gray-50 text-[11px]">
                    <td className="px-2 py-2 font-medium text-gray-800">{it.code}</td>
                    <td className="px-2 py-2 text-gray-700">{it.name}</td>
                    <td className="px-2 py-1 text-center">
                      <input
                        ref={(el) => {
                          props.qtyInRefs.current[it.id] = el;
                        }}
                        className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs text-right"
                        value={it.qty || ""}
                        onChange={(e) => props.handleChangeQtyIn(it.id, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        className="rounded-full border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100"
                        onClick={() => props.handleRemoveItemIn(it.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {props.inError && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {props.inError}
          </div>
        )}
      </section>

      {/* (선택) 왼쪽에 작은 도움 이미지가 필요하면 여기서 쓸 수 있음 - 지금은 제거 */}
      <div className="hidden">
        <Image src="/images/warehouse/in.jpg" alt="입고" width={10} height={10} />
        <div className="text-[10px]">{previewInItems.length}</div>
      </div>
    </div>
  );
}
