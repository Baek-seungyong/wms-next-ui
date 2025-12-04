// components/LayoutShell.tsx
"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";

import { RobotProductCallModal } from "@/components/RobotProductCallModal";
import { ReceivingModal } from "@/components/ReceivingModal";

interface LayoutShellProps {
  children: ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);
  const [isPalletModalOpen, setIsPalletModalOpen] = useState(false);

  return (
    <div className="layout-root">
      {/* 상단 네비게이션 바 */}
      <header className="top-navbar relative z-30">
        {/* 왼쪽 : 타이틀 + 메뉴 */}
        <div className="flex flex-1 items-center gap-6">
          <Link href="/" className="navbar-title">
            WMS 대시보드
          </Link>

          <nav className="navbar-menu">
            {/* 주문관리 드롭다운 */}
            <div className="navbar-link navbar-has-dropdown">
              <span>주문관리</span>
              <div className="navbar-dropdown">
                <Link
                  href="/order?tab=order"
                  className="navbar-dropdown-link"
                >
                  <span>1. 주문관리</span>
                </Link>
                <Link
                  href="/order?tab=picking"
                  className="navbar-dropdown-link"
                >
                  <span>2. Picking 작업 현황</span>
                </Link>
              </div>
            </div>

            {/* 재고관리 드롭다운 */}
            <div className="navbar-link navbar-has-dropdown">
              <span>재고관리</span>
              <div className="navbar-dropdown">
                <Link
                  href="/stock?tab=map"
                  className="navbar-dropdown-link"
                >
                  <span>1. 창고도면 재고현황</span>
                </Link>
                <Link
                  href="/stock?tab=io"
                  className="navbar-dropdown-link"
                >
                  <span>2. 창고별 입출고 관리</span>
                </Link>
                <Link
                  href="/stock?tab=history"
                  className="navbar-dropdown-link"
                >
                  <span>3. 입출고 히스토리</span>
                </Link>
              </div>
            </div>

            <Link href="/production" className="navbar-link">
              생산관리
            </Link>
            <Link href="/monitoring" className="navbar-link">
              모니터링
            </Link>

            {/* 🔹 관리자 드롭다운 */}
            <div className="navbar-link navbar-has-dropdown">
              <span>관리자</span>
              <div className="navbar-dropdown">
                <Link
                  href="/admin/items"
                  className="navbar-dropdown-link"
                >
                  <span>1. 품목 관리</span>
                </Link>
                <Link
                  href="/admin/locations"
                  className="navbar-dropdown-link"
                >
                  <span>2. 창고/로케이션 관리</span>
                </Link>
                <Link
                  href="/admin/pallets"
                  className="navbar-dropdown-link"
                >
                  <span>3. 파렛트/토트박스 관리</span>
                </Link>
                <Link
                  href="/admin/partners"
                  className="navbar-dropdown-link"
                >
                  <span>4. 거래처 관리</span>
                </Link>
                <Link
                  href="/admin/accounts"
                  className="navbar-dropdown-link"
                >
                  <span>5. 계정 관리</span>
                </Link>
                <Link
                  href="/admin/devices"
                  className="navbar-dropdown-link"
                >
                  <span>6. 기기 연동 관리</span>
                </Link>
                <Link
                  href="/admin/data"
                  className="navbar-dropdown-link"
                >
                  <span>7. 데이터 관리</span>
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* 오른쪽 : 공통 버튼 + 사용자 인사 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRobotModalOpen(true)}
              className="flex items-center gap-1 rounded-full border border-white/70 bg-black/80 px-4 py-1 text-[11px] text-white shadow-sm hover:bg-black hover:border-white"
            >
              <span className="text-xs">🤖</span>
              <span>AMR 수동 호출</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPalletModalOpen(true)}
              className="flex items-center gap-1 rounded-full border border-white/70 bg-black/80 px-4 py-1 text-[11px] text-white shadow-sm hover:bg-black hover:border-white"
            >
              <span className="text-xs">🧱</span>
              <span>파렛트 입출고</span>
            </button>
          </div>

          {/* 로그인 영역 */}
          <div className="flex items-center gap-2 text-[11px] text-gray-100">
            <span>백승용님 반갑습니다</span>
            <button
              type="button"
              onClick={() => {}}
              className="rounded-full border border-gray-300/60 px-3 py-0.5 text-[11px] text-gray-100 hover:bg-gray-800"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="main-content relative z-0">
        {children}
      </main>

      {/* 공통 모달 */}
      <RobotProductCallModal
        open={isRobotModalOpen}
        mode="manual"
        onClose={() => setIsRobotModalOpen(false)}
        onConfirmEmergency={() => {}}
      />

      <ReceivingModal
        open={isPalletModalOpen}
        onClose={() => setIsPalletModalOpen(false)}
      />
    </div>
  );
}
