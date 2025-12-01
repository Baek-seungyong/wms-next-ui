// app/admin/items/page.tsx
export default function AdminItemsPage() {
  return (
    <div className="rounded-2xl border bg-white p-4 text-sm">
      <h2 className="text-sm font-semibold mb-2">품목 관리</h2>
      <p className="text-[12px] text-gray-500">
        여기에서 WMS/생산에 사용할 품목 마스터를 관리합니다.
      </p>
      {/* TODO: 품목 리스트 / 검색 / 등록 폼 추가 */}
    </div>
  );
}
