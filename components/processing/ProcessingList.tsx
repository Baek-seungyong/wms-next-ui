//components/processing/ProcessingList.tsx
"use client";

import { useMemo, useState } from "react";
import type { ProcessingWork } from "./types";

type Props = {
  works: ProcessingWork[];
  onOpenCreate: () => void;
  onOpenDetail: (work: ProcessingWork) => void;
};

export default function ProcessingList({
  works,
  onOpenCreate,
  onOpenDetail,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [typeFilter, setTypeFilter] = useState<string>("전체");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    return works.filter((work) => {
      const matchedStatus =
        statusFilter === "전체" ? true : work.status === statusFilter;
      const matchedType =
        typeFilter === "전체" ? true : work.type === typeFilter;
      const matchedKeyword =
        !keyword.trim() ||
        work.title.toLowerCase().includes(keyword.toLowerCase()) ||
        work.workNumber.toLowerCase().includes(keyword.toLowerCase());

      return matchedStatus && matchedType && matchedKeyword;
    });
  }, [works, statusFilter, typeFilter, keyword]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="전체">전체 상태</option>
              <option value="대기">대기</option>
              <option value="재고준비중">재고준비중</option>
              <option value="작업중">작업중</option>
              <option value="검수중">검수중</option>
              <option value="완료">완료</option>
              <option value="취소">취소</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="전체">전체 유형</option>
              <option value="라벨부착">라벨부착</option>
              <option value="스티커부착">스티커부착</option>
              <option value="재포장">재포장</option>
              <option value="합포">합포</option>
              <option value="세트구성">세트구성</option>
              <option value="검수">검수</option>
              <option value="기타">기타</option>
            </select>

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="작업명 / 작업번호 검색"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={onOpenCreate}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            후가공 작업 생성
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">작업번호</th>
                <th className="px-4 py-3 text-left font-semibold">작업명</th>
                <th className="px-4 py-3 text-left font-semibold">유형</th>
                <th className="px-4 py-3 text-left font-semibold">상태</th>
                <th className="px-4 py-3 text-left font-semibold">연결주문수</th>
                <th className="px-4 py-3 text-left font-semibold">출고목표일</th>
                <th className="px-4 py-3 text-left font-semibold">작업존</th>
                <th className="px-4 py-3 text-left font-semibold">작업자</th>
                <th className="px-4 py-3 text-left font-semibold">우선순위</th>
                <th className="px-4 py-3 text-right font-semibold">액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    조건에 맞는 후가공 작업이 없어
                  </td>
                </tr>
              ) : (
                filtered.map((work) => (
                  <tr key={work.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {work.workNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{work.title}</td>
                    <td className="px-4 py-3 text-slate-700">{work.type}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {work.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {work.linkedOrderIds.length}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {work.plannedShipDate || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{work.workZone}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {work.assignedUser || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{work.priority}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(work)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}