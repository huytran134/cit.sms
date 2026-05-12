import { DataImportForm } from "@/components/import/data-import-form";
import { Database, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Import Dữ liệu | CiT-SMS",
};

export default function DataImportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-blue-100 p-3">
          <Database className="h-6 w-6 text-blue-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import Dữ liệu Cũ</h1>
          <p className="mt-1 text-sm text-gray-500">
            Nhập khẩu danh sách học viên và lịch sử thu tiền từ file Excel để chuẩn bị Go-live.
          </p>
        </div>
      </div>

      {/* Cảnh báo bảo mật */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">Lưu ý quan trọng trước khi import</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-red-700">
              <li>Chỉ thực hiện import một lần duy nhất khi chuẩn bị Go-live.</li>
              <li>CCCD trong file Excel sẽ được <strong>mã hóa ngay lập tức</strong>, không lưu plaintext.</li>
              <li>Phiếu thu import sẽ bị <strong>khóa sổ ngay</strong> (không thể sửa/xóa).</li>
              <li>Dữ liệu trùng (SĐT, CCCD) sẽ bị bỏ qua, không ghi đè.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form import */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm md:p-6">
        <DataImportForm />
      </div>
    </div>
  );
}
