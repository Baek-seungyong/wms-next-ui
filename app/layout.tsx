// app/layout.tsx
import "./../styles/globals.css";
import type { ReactNode } from "react";
import { LayoutShell } from "@/components/LayoutShell";

export const metadata = {
  title: "WMS 대시보드",
  description: "자동물류 WMS/AMR UI 프로토타입",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* 공통 상단바 + 오른쪽 AMR/파렛트 + 로그인 영역 */}
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
