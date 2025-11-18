"use client";

import { useMemo, useState } from "react";
import type { Order, ShippingZone, OrderStatus } from "./types";
import { statusBadgeClass } from "./types";

type Props = {
  orders: Order[];
  activeOrderId: string;
  onSelectOrder: (id: string) => void;
};

type ZoneFilter = "전체" | ShippingZone;
type StatusFilter = "전체" | OrderStatus;

export function OrderList({
  orders,
  activeOrderId,
  onSelectOrder,
}: Props) {
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>("전체");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [searchText, setSearchText] = useState("");

  const zoneCounts = useMemo(() => {
    const base = { 전체: orders.length, 수도권: 0, 비수도권: 0, 차량출고: 0 };
    orders.forEach((o) => {
      if (o.zone === "수도권") base.수도권 += 1;
      else if (o.zone === "비수도권") base.비수도권 += 1;
      else if (o.zone === "차량출고") base.차량출고 += 1;
    });
    return base;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const text = searchText.trim();

    return orders.filter((o) => {
      if (zoneFilter !== "전체" && o.zone !== zoneFilter) return false;
      if (statusFilter !== "전체" && o.status !== statusFilter) return false;

      if (text.length > 0) {
        const target = `${o.id} ${o.customer}`.toLowerCase();
        if (!target.includes(text.toLowerCase())) return false;
      }

      return true;
    });
  }, [orders, zoneFilter, statusFilter, searchText]);

  return (
    <div className="bg-white shadow-sm rounded-2xl border border-gray-200 h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">주문서 목록</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            예시 데이터 {orders.length}건
          </p>
        </div>
        {/* 🔄 새로고침 (데모) */}
        <button
          type="button"
          className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
          disabled
        >
          🔄 새로고침 (데모)
        </button>
      </div>

      {/* 검색 + 상태필터 */}
      <div className="px-4 pt-3 pb-2 border-b bg-gray-50/70 flex items-center gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-[11px]"
          placeholder="주문번호 / 고객명 검색"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select
          className="w-28 border border-gray-300 rounded-md px-2 py-1 text-[11px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="전체">상태: 전체</option>
          <option value="대기">대기</option>
          <option value="출고중">출고중</option>
          <option value="보류">보류</option>
          <option value="완료">완료</option>
        </select>
      </div>

      {/* 수도권/비수도권/차량출고 필터 */}
      <div className="px-4 pt-2 pb-1 border-b bg-gray-50/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(
              ["전체", "수도권", "비수도권", "차량출고"] as ZoneFilter[]
            ).map((zone) => {
              const count =
                zone === "전체"
                  ? zoneCounts.전체
                  : zone === "수도권"
                  ? zoneCounts.수도권
                  : zone === "비수도권"
                  ? zoneCounts.비수도권
                  : zoneCounts.차량출고;

              const isActive = zoneFilter === zone;

              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setZoneFilter(zone)}
                  className={`px-3 py-1 rounded-full text-[11px] border transition
                    ${
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {zone}{" "}
                  <span
                    className={
                      isActive ? "opacity-90" : "text-gray-400 text-[10px]"
                    }
                  >
                    {count}건
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-gray-500 whitespace-nowrap">
            {zoneFilter === "전체"
              ? "모든 주문 표시"
              : `${zoneFilter} 작업 대상 주문만 표시`}
          </span>
        </div>
      </div>

      {/* 상태 legend */}
      <div className="px-4 pt-2 pb-1 text-[11px] text-gray-500 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full" /> 대기
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full" /> 출고중
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-yellow-400 rounded-full" /> 보류
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full" /> 완료
        </div>
      </div>

      {/* 주문 리스트 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-[11px] text-gray-500">
            <tr>
              <th className="p-2 border-b text-left w-36">주문번호</th>
              <th className="p-2 border-b text-left w-40">고객명</th>
              <th className="p-2 border-b text-center w-24">납기일</th>
              <th className="p-2 border-b text-center w-24">상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const active = order.id === activeOrderId;
              const isEmergency = order.isEmergency;

              const baseColor = isEmergency ? "bg-red-50" : "";
              const activeColor = isEmergency ? "bg-red-100" : "bg-blue-50";

              return (
                <tr
                  key={order.id}
                  className={`cursor-pointer ${
                    active ? activeColor : baseColor || "hover:bg-gray-50"
                  }`}
                  onClick={() => onSelectOrder(order.id)}
                >
                  <td className="p-2 border-t text-left align-middle font-medium">
                    {isEmergency ? "긴급출고" : order.id}
                  </td>
                  <td className="p-2 border-t text-left align-middle">
                    {order.customer}
                  </td>
                  <td className="p-2 border-t text-center align-middle">
                    {order.dueDate}
                  </td>
                  <td className="p-2 border-t text-center align-middle">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] ${statusBadgeClass(
                        order.status,
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              );
            })}

            {filteredOrders.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-[12px] text-gray-400 border-t"
                >
                  선택한 조건에 해당하는 주문이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
