"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import {
  importStudentAndFinanceExcel,
  type ImportResult,
} from "@/lib/actions/data-import";

export function DataImportForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "");
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await importStudentAndFinanceExcel(formData);
    setResult(res);
    setIsLoading(false);
  }

  function handleReset() {
    setResult(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      {/* Hướng dẫn định dạng file */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-2 text-sm text-amber-800">
            <p className="font-semibold">Yêu cầu định dạng file Excel (.xlsx)</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="font-medium">Sheet 1: DanhSachHV</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-700">
                  <li>HoTen (bắt buộc)</li>
                  <li>SoDienThoai (bắt buộc)</li>
                  <li>Email</li>
                  <li>CCCD</li>
                  <li>GioiTinh</li>
                  <li>NgaySinh</li>
                  <li>NoiLamViec</li>
                  <li>DiaChi</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Sheet 2: LichSuThu</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-700">
                  <li>SoDienThoai (bắt buộc)</li>
                  <li>MaLop (bắt buộc)</li>
                  <li>SoTien (bắt buộc)</li>
                  <li>PhuongThucTT (bắt buộc)</li>
                  <li>NgayThu (bắt buộc)</li>
                  <li>TenNguoiChuyen</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-amber-600">
              * Phiếu thu import sẽ có trạng thái <strong>ĐÃ XÁC NHẬN</strong> ngay lập tức (dữ liệu lịch sử).
              Dòng lỗi sẽ được bỏ qua, các dòng hợp lệ vẫn được nhập.
            </p>
          </div>
        </div>
      </div>

      {/* Form upload */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-background p-8 transition-colors hover:border-blue-400 hover:bg-blue-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileSpreadsheet className="mb-3 h-12 w-12 text-gray-400" />
          {fileName ? (
            <div className="text-center">
              <p className="font-medium text-foreground">{fileName}</p>
              <p className="mt-1 text-sm text-gray-500">Nhấn để chọn file khác</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-medium text-gray-700">Kéo thả hoặc nhấn để chọn file</p>
              <p className="mt-1 text-sm text-gray-500">Chỉ hỗ trợ file .xlsx</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !fileName}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isLoading ? "Đang xử lý..." : "Bắt đầu Import"}
          </button>

          {result && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-background"
            >
              Import file khác
            </button>
          )}
        </div>
      </form>

      {/* Loading indicator */}
      {isLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-blue-700">
              Đang đọc file và import dữ liệu. Vui lòng đợi...
            </p>
          </div>
        </div>
      )}

      {/* Kết quả import */}
      {result && !isLoading && (
        <div className="space-y-4">
          {/* Tóm tắt */}
          <div
            className={`rounded-lg border p-4 ${
              result.errorCount === 0
                ? "border-green-200 bg-green-50"
                : result.successCount === 0
                ? "border-red-200 bg-red-50"
                : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.errorCount === 0 ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              ) : result.successCount === 0 ? (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    result.errorCount === 0
                      ? "text-green-800"
                      : result.successCount === 0
                      ? "text-red-800"
                      : "text-yellow-800"
                  }`}
                >
                  {result.message}
                </p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <strong>{result.successCount}</strong> dòng thành công
                  </span>
                  <span className="flex items-center gap-1 text-red-700">
                    <XCircle className="h-4 w-4" />
                    <strong>{result.errorCount}</strong> dòng lỗi
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chi tiết lỗi */}
          {result.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-card">
              <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-3">
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-800">
                  Chi tiết lỗi ({result.errors.length} dòng)
                </p>
              </div>
              <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
                {result.errors.map((error, index) => (
                  <li
                    key={index}
                    className="px-4 py-2.5 text-sm text-red-700"
                  >
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
