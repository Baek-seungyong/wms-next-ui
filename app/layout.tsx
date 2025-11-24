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
            {/* 좌측 상단 타이틀 (클릭 시 메인 대시보드로 이동) */}
            <Link href="/" className="navbar-title">
              WMS 대시보드
            </Link>

            {/* 상단 메뉴 */}
            <nav className="navbar-menu">
              <Link href="/order" className="navbar-link">
                주문관리
              </Link>
              <Link href="/stock" className="navbar-link">
                재고관리
              </Link>
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
