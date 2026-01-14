"use client";

import DashboardTile from "./DashboardTile";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export default function DashboardHome() {
  // ✅ 나중에 여기 stats/badge를 실제 데이터로 연결하면 됨.
  // 지금은 더미로 대시보드 형태 먼저 잡자.
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 바: 너 UI 톤에 맞춰 간단히 */}
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg border bg-gray-50 text-xs">
              WMS
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-900">WMS 대시보드</p>
              <p className="text-[11px] text-gray-500">오늘 작업을 여기서 바로 시작</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/order?tab=order"
              className="rounded-full border bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
            >
              주문관리 바로가기
            </a>
            <a
              href="/monitor"
              className="rounded-full bg-gray-900 px-3 py-1 text-xs text-white hover:bg-black"
            >
              모니터링
            </a>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6">
        {/* 운영 요약 카드 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-[11px] text-gray-500">진행중</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">출고 작업</p>
            <p className="mt-2 text-[11px] text-gray-500">지정이송/잔량 처리 흐름 중심</p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-[11px] text-gray-500">대기</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">AMR 호출</p>
            <p className="mt-2 text-[11px] text-gray-500">작업자 호출 / 자동 호출 연동</p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-[11px] text-gray-500">주의</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">재고 부족</p>
            <p className="mt-2 text-[11px] text-gray-500">보충계획/보충내역 확인</p>
          </div>
        </div>

        {/* 섹션들: 이미지 스타일 느낌 */}
        <Section title="Outbound · 출고">
          <DashboardTile
            title="주문관리"
            desc="출고지시 · 지정이송 · 잔량처리"
            href="/order?tab=order"
            icon="🧾"
            badge={{ label: "핵심", tone: "good" }}
            stats={[
              { label: "대기", value: "—" },
              { label: "출고중", value: "—" },
              { label: "긴급", value: "—" },
            ]}
          />
          <DashboardTile
            title="피킹 작업현황"
            desc="피킹존 작업 진행/완료"
            href="/picking"
            icon="🧺"
            stats={[{ label: "작업중", value: "—" }]}
          />
          <DashboardTile
            title="출고 모달/흐름"
            desc="출고 관련 화면(필요시)"
            href="/shipping"
            icon="🚚"
            badge={{ label: "정리중", tone: "warn" }}
          />
        </Section>

        <Section title="Inbound · 입고">
          <DashboardTile title="입고 처리" desc="입고/검수/적치" href="/receiving" icon="📥" />
          <DashboardTile
            title="파렛트 입출고"
            desc="라인/슬롯 이동"
            href="/pallet"
            icon="🧱"
          />
          <DashboardTile
            title="빈 파렛트/토트"
            desc="반납/회수/관리"
            href="/empty"
            icon="🧺"
          />
        </Section>

        <Section title="Inventory · 재고/보충">
          <DashboardTile
            title="재고관리"
            desc="LOT/구역/수량"
            href="/stock"
            icon="📊"
          />
          <DashboardTile
            title="보충 계획"
            desc="부족/기준/목표"
            href="/replenish"
            icon="🔁"
          />
          <DashboardTile
            title="수동 재고조정"
            desc="예외 처리"
            href="/stock/manual"
            icon="🛠️"
            badge={{ label: "주의", tone: "warn" }}
          />
        </Section>

        <Section title="AMR · 로봇">
          <DashboardTile
            title="AMR 수동 호출"
            desc="작업자 즉시 호출"
            href="/amr/manual"
            icon="🤖"
            badge={{ label: "운영", tone: "good" }}
          />
          <DashboardTile
            title="호출 현황"
            desc="대기열/진행상태(추가 예정)"
            href="/amr/queue"
            icon="📡"
          />
          <DashboardTile
            title="창고 맵/구역"
            desc="구역 선택/슬롯 상태"
            href="/warehouse/map"
            icon="🗺️"
          />
        </Section>

        <Section title="Monitoring · Admin">
          <DashboardTile title="모니터링" desc="라인/로봇/작업자" href="/monitor" icon="🖥️" />
          <DashboardTile title="관리자" desc="권한/설정" href="/admin" icon="🔐" />
          <DashboardTile
            title="기준정보"
            desc="상품/포장/거래처(추후)"
            href="/master"
            icon="🧩"
            badge={{ label: "추가 예정", tone: "normal" }}
          />
        </Section>
      </div>
    </div>
  );
}
