// app/layout.tsx
import "./../styles/globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "WMS 대시보드",
  description: "자동물류 WMS/AMR UI 프로토타입",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="layout-root">
          {/* ✅ 상단 네비게이션 바 */}
          <header className="top-navbar">
            {/* 좌측 상단 타이틀 */}
            <Link href="/" className="navbar-title">
              WMS 대시보드
            </Link>

            {/* 상단 1차 메뉴 */}
            <nav className="navbar-menu">
              <Link href="/order" className="navbar-link">
                주문관리
              </Link>

              {/* ✅ 재고관리 + 드롭다운 */}
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
              <Link href="/admin" className="navbar-link">
                관리자
              </Link>
            </nav>
          </header>

          {/* ✅ 본문 영역 */}
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
