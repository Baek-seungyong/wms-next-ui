import { WarehouseMapView } from "../../components/WarehouseMapView";

export default function StockPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">재고관리 (창고 도면 재고 조회)</h1>
      <WarehouseMapView />
    </div>
  );
}
