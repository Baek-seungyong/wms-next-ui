import "./../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "WMS 출고 UI 데모",
  description: "자동물류 WMS/AMR UI 프로토타입",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}