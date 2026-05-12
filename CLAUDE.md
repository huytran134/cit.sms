# CiT-SMS — QUY TẮC PHÁT TRIỂN (LOCKED PRINCIPLES)

Tài liệu này chứa các quy tắc "bất di bất dịch" cho AI khi làm việc trên dự án CiT-SMS. **PHẢI ĐỌC VÀ TUÂN THỦ TUYỆT ĐỐI.**

---

## 1. TỔNG QUAN DỰ ÁN & TRẠNG THÁI HIỆN TẠI
- **Dự án:** CiT-SMS (Hệ thống Quản lý Học viên cho CiT EDU JSC).
- **Đối tượng:** Sinh viên, người mới ra trường, người khởi nghiệp (< 35 tuổi).
- **Spec Độc tôn:** `plan.md` (Luôn đọc file này nếu không chắc về nghiệp vụ).
- **Trạng thái hiện tại:** Phase 0 (Foundation & Database). CHƯA CODE BUSINESS LOGIC.
- **Môi trường:** Node.js, MySQL 8 (Hostinger Cloud), Next.js 15 App Router.

---

## 2. TECH STACK (OVERRIDE CỨNG - KHÔNG ĐỔI)
⚠️ **TỪ CHỐI** mọi đề xuất sử dụng PostgreSQL, Express, hoặc Laravel.
- **Framework:** Next.js 15 (App Router) + TypeScript Strict.
- **Database:** MySQL 8 (KHÔNG dùng PostgreSQL).
- **ORM:** Prisma.
- **UI:** Tailwind CSS + Shadcn UI + Lucide React.
- **Form:** React Hook Form + Zod resolver.
- **AI:** Gemini 2.5 API (Gọi HTTP ra ngoài, KHÔNG cài model local).

---

## 3. CÁC QUY TẮC "ĐỎ" (RED LINES) - TUYỆT ĐỐI KHÔNG VI PHẠM

### 3.1 Khóa sổ Tài chính (Financial Lock)
- **KHÔNG** tạo API Route hoặc Server Action `update()` cho bảng `PaymentReceipt` hay `RefundReceipt` nếu trạng thái là `CONFIRMED` hoặc `APPROVED`.
- **KHÔNG** thêm nút "Sửa" (Edit) trên UI cho các phiếu đã xác nhận.
- **Cách xử lý duy nhất:** Tạo phiếu Hủy (Status -> `CANCELLED`, giữ số tiền cũ) -> Tạo phiếu mới.

### 3.2 Bảo mật CCCD (Dữ liệu nhạy cảm)
- **KHÔNG** trả trường CCCD trong các API get danh sách (VD: `GET /api/students`).
- **KHÔNG** log giá trị plaintext của CCCD vào console, error message, hay AuditLog.
- **Chỉ duy nhất 1 API** được trả CCCD: `GET /api/students/[id]/cccd`. API này phải:
    1. Check `role === ADMIN`.
    2. Ghi log vào bảng `CccdAccessLog`.
- **Mã hóa:** Luôn dùng AES-256-GCM. Key từ `process.env.CCCD_ENCRYPTION_KEY`. Dùng logic từ `lib/crypto/cccd.ts`.

### 3.3 Phân quyền RBAC
- Bảng User có `roles` dạng Array (Ví dụ: `["ADMIN", "CLASS_LEADER"]`).
- **KHÔNG** viết: `if (user.role === "ADMIN")`.
- **PHẢI** viết: `if (user.roles.includes("ADMIN"))`.
- Mọi Server Action/Route Handler phải gọi `requireRole(["ADMIN"])` ở dòng đầu tiên.

### 3.4 Tách biệt Lead và Student
- **Lead:** Khách hàng tiềm năng. KHÔNG CÓ CCCD.
- **Student:** Học viên chính thức. BẮT BUỘC CÓ CCCD (đã mã hóa và blind index).
- **Chuyển đổi:** Yêu cầu nhập CCCD -> Check trùng Blind Index -> Tạo Student mới -> Gắn `convertedToStudentId` vào Lead -> Đổi status Lead thành `CONVERTED`. KHÔNG update thẳng bảng Lead thành Student.

### 3.5 Hoàn tiền cho Lớp Mật Thất (Mentoring)
- Khi tạo `RefundReceipt`, phải kiểm tra `Class.type`.
- Nếu `Class.type === "MENTORING"` -> Throw Error: "Lớp Mật Thất không hỗ trợ hoàn tiền".

---

## 4. NGÔN NGỮ & ĐẶT TÊN (DOMAIN LANGUAGE)
- **Giao tiếp & Kế hoạch:** Mọi bản kế hoạch (Implementation Plan) và phản hồi tin nhắn PHẢI viết bằng Tiếng Việt (trừ thuật ngữ chuyên môn không thể chuyển ngữ). TUYỆT ĐỐI không sai lỗi chính tả.
- **UI / Label / Button:** Tiếng Việt (Ví dụ: "Chủ nhiệm lớp", "Phiếu thu").
- **Code (Biến, Hàm, DB):** Tiếng Anh.
- **Tên bảng DB:** PascalCase (Singular) - VD: `Student`, `ClassMember`.
- **Tên cột DB:** camelCase (Map sang snake_case trong MySQL bằng `@map`).
- **API Path:** kebab-case - VD: `/api/payment-receipts`.

**Từ điển thuật ngữ:**
- Chủ nhiệm lớp -> `ClassLeader`
- Học bù -> `MakeupAttendance`
- Công nợ xấu -> `BadDebt`
- Mật Thất (1 thầy 1 trò) -> `Mentoring` (Enum `ClassType`)

---

## 5. CẤU TRÚC & ĐỊNH DẠNG CODE
- **Server Action:** Luôn theo trình tự: `Auth check` -> `Validate input (Zod)` -> `Business Logic (Service)` -> `Revalidate`.
- **Service Layer:** Logic phức tạp phải nằm trong `lib/services/` (VD: `student.service.ts`). Không gọi Prisma trực tiếp từ Server Action.
- **Tailwind:** Mobile-first (`p-2 md:p-4`). Không i18n, dùng Tiếng Việt trực tiếp trong code UI.

---

## 6. XỬ LÝ NGOẠI LỆ
- **AI Error:** Hiển thị toast: "Trợ lý AI đang bận, vui lòng thử lại sau vài giây".
- **Prisma P2002 (Unique):** Trả về message: "Số điện thoại/CCCD đã tồn tại trong hệ thống".

---

## 7. QUY TẮC ANTIGRAWITY IDE
- **Minimal Edits:** Chỉ chỉnh sửa phần file bị ảnh hưởng. KHÔNG viết lại toàn bộ file.
- **Performance:** Không tạo N+1 query. Dùng `include` trong Prisma.
- **CHẶN OOM (Out of Memory):** TUYỆT ĐỐI KHÔNG DÙNG `include: { auditLogs: true }`, `include: { aiChatHistories: true }`, hoặc `include: { approvedReceipts: true }` khi query bảng `User`. Nếu cần lấy log, phải query trực tiếp từ bảng con với `where: { userId: xxx }` và luôn có `take: 50` (phân trang).
- **AI Token:** Truncate lịch sử chat khi gửi tới Gemini API để tránh vượt giới hạn.

---

## 8. SNAPSHOT RULE
BẮT BUỘC cập nhật dòng SNAPSHOT ở cuối file `IMPLEMENTATION_PLAN.md` sau mỗi phiên làm việc có thay đổi quan trọng:
`<!-- SNAPSHOT --> YYYY-MM-DD HH:MM | <STATUS> | Phase: <PHASE> | Last: <việc vừa làm> | Next: <việc kế tiếp>`
