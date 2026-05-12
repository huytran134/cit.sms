# CIT-SMS — KẾ HOẠCH TRIỂN KHAI CHI TIẾT (ANTYGRAVITY IDE)

**Phiên bản:** 2.0 (Locked) | **Ngày cập nhật:** Tháng 5/2026
**Người kiến trúc:** Senior IT Consultant | **Đơn vị:** CiT EDU JSC

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

### 1.1 Tech Stack (Chốt cứng)

- **Framework:** Next.js 15 (App Router) - Server Actions & Route Handlers.
- **Language:** TypeScript (Strict Mode - Bắt buộc để tránh lỗi logic tiền).
- **Database:** MySQL 8 (Hostinger Cloud - 3GB RAM/2 CPU - Đủ đáp ứng).
- **ORM:** Prisma (Type-safe, Migration tự động).
- **UI/Styling:** Tailwind CSS + Shadcn UI + Lucide Icons.
- **Auth:** NextAuth.js v5 (Chỉ lo Authentication). Authorization (RBAC) tự code.
- **AI:** Gemini 2.5 API (Gọi external, KHÔNG chạy model local trên server).

### 1.2 Nguyên tắc Ngân hàng (Financial Lock) - TUYỆT ĐỐI KHÔNG VI PHẠM

> [!IMPORTANT]
> **Quy trình trạng thái phiếu thu/hoàn tiền:** `DRAFT` -> `PENDING_APPROVAL` -> `CONFIRMED` [LOCK].

1. **KHÔNG BAO GIỜ** tạo nút "Sửa" cho trạng thái `CONFIRMED`.
2. **Nếu sai sót:** Phải tạo phiếu "Hủy" (có lưu vết Audit Log) -> Tạo phiếu mới.
3. **Mọi thay đổi tiền tệ** đều phải có AuditLog (Ai, Khi nào, Giá trị cũ, Giá trị mới).

### 1.3 Bảo mật Dữ liệu Cá nhân (NĐ 13)

- **CCCD:** Mã hóa bằng AES-256-GCM tại App Layer (KHÔNG dùng hàm mã hóa của MySQL). Key lưu ở `.env`.
- **Chống trùng CCCD:** Dùng Blind Index (HMAC-SHA256). Không bao giờ giải mã CCCD để check trùng.
- **Xem CCCD:** Chỉ Admin. Mỗi lần xem phải ghi `CccdAccessLog`. Không trả CCCD trong API get thông thường, chỉ trả qua API chuyên dụng.

---

## 2. PHÂN QUYỀN HỆ THỐNG (3 ROLES)

Quyền được gộp theo mảng, 1 User có thể mang nhiều Role (Mảng trong DB).

| Chức năng | Quản lý (ADMIN) | Giảng viên (TEACHER) | Chủ nhiệm (CLASS_LEADER) |
| :--- | :---: | :---: | :---: |
| Quản lý Lead & Chuyển đổi HV | ✅ Toàn quyền | ❌ | ✅ Toàn quyền |
| Xem CCCD (Mã hóa) | ✅ (Có Log) | ❌ | ❌ |
| Cài đặt Program / Lớp học | ✅ | ✅ (Chỉ nội dung) | ❌ |
| Xếp lớp / Khai giảng | ✅ | ❌ | ✅ (Lớp phụ trách) |
| Nhập Điểm danh / Cảm nhận | ✅ | ✅ | ✅ (Lớp phụ trách) |
| Nhập Phiếu thu (Nháp) | ✅ | ❌ | ✅ |
| Duyệt Phiếu thu (Khóa sổ) | ✅ **DUY NHẤT** | ❌ | ❌ |
| Chuyển nợ thành Bad Debt | ✅ **DUY NHẤT** | ❌ | ❌ |
| AI Chatbot (Full RAG) | ✅ Truy xuất mọi data | ❌ | ✅ (Chỉ tài liệu) |

---

## 3. LỘ TRÌNH TRIỂN KHAI THEO PHASE (Dành cho Antigravity)

### PHASE 0: FOUNDATION & DATABASE (Tuần 1)
**Mục tiêu:** Khởi tạo dự án, kết nối DB, thiết lập cơ chế bảo mật cơ bản.

- [x] Khởi tạo Next.js 15 + TypeScript + Tailwind + Shadcn UI trên Antygravity.
- [x] Cấu hình kết nối MySQL Hostinger qua Prisma.
- [x] COPY TOÀN BỘ PRISMA SCHEMA (Bản vẽ ở cuối cuộc hội thoại trước) vào `schema.prisma`. Chạy `npx prisma migrate dev`.
- [x] Tạo file `lib/crypto/cccd.ts`: Viết 2 hàm `encryptCCCD()` và `hashCCCDForBlindIndex()`.
- [x] Tạo file `lib/auth/rbac.ts`: Tạo helper `requireRole(roles: string[])`.
- [x] Cấu hình NextAuth v5: Login bằng Email/Password. Lưu `roles: string[]` vào Session.

**DoD (Definition of Done):** Vào được trang Admin, DB tạo đúng toàn bộ bảng cột, test mã hóa/giải mã CCCD thành công.

### PHASE 1: CRM CORE - LEAD & STUDENT (Tuần 2-3)
**Mục tiêu:** Giải quyết bài toán đầu vào, tách biệt Lead và Student, Form đăng ký tự động.

- [x] **Public Registration Form** (`/portal/register`):
    - Mobile-first. Gồm: Tên, SĐT, CCCD (Bắt buộc), các câu hỏi tự do (Mục tiêu, Lý do...).
    - Cài đặt Google reCAPTCHA để chống spam.
    - Submit: Mã hóa CCCD -> Tạo Blind Index -> Lưu thẳng vào bảng Student (Status: `ASSIGNED`).
- [x] **Quản lý Lead** (`/admin/leads` & `/staff/leads`):
    - CNL tạo Lead thủ công (Chỉ cần Tên, SĐT. KHÔNG có CCCD).
    - Nút "Chuyển thành Học viên": Tìm SĐT trong DB -> Nếu chưa có Student, yêu cầu nhập CCCD -> Chuyển đổi.
- [x] **Danh sách Học viên** (`/admin/students`):
    - Filter theo Trạng thái, Lớp.
    - Nút "Sửa SĐT" (Chỉ Admin) - Ghi log sửa đổi.
    - Nút "Merge Hồ sơ" (Khi trùng lặp do lỗi nhập liệu).
    - Modal "Xem CCCD": Gọi API riêng -> Log vào `CccdAccessLog` -> Hiển thị 30 giây rồi ẩn.

**DoD:** HV có thể tự đăng ký bằng điện thoại, CNL tạo Lead được, không có bất kỳ hồ sơ nào trùng SĐT hoặc CCCD trong DB.

### PHASE 2: ACADEMIC STRUCTURE (Tuần 4-5)
**Mục tiêu:** Xây dựng cây chương trình, quản lý lớp học và phân công nhân sự.

- [x] **CRUD Chương trình** (`/admin/programs`):
    - Tạo Program: Nhánh (Thinking/Skill/Mentoring), Học phí chuẩn, Loại lớp (Regular/Mentoring), Chu kỳ thu tiền (Course/Half_year/Year).
    - Thiết lập Điều kiện tiên quyết (Ví dụ: TDTD cần TDTN).
- [x] **CRUD Lớp học** (`/admin/classes`):
    - Tạo lớp: Auto-gen Mã lớp (TDTN-2026-01). Gán Program, Chi nhánh.
    - Override Học phí (Nếu khác Program gốc) - Ghi Audit Log.
    - Phân công Nhân sự (ClassStaff): Gán CNL, GV, TG.
- [x] **Enrollment (Xếp lớp):**
    - Modal chọn HV -> Check điều kiện tiên quyết (Cảnh báo nhưng cho phép tiếp tục).
    - Check Sĩ số tối đa (Lớp thường) hoặc Bỏ qua (Lớp Mentoring).
    - HV chuyển từ `ASSIGNED` -> `enrolled` (trong ClassMember).
- [x] **Khai giảng:** Nút "Khai giảng" cho CNL -> Đổi Status Lớp -> Đổi Status toàn bộ HV trong lớp sang `STUDYING`.

**DoD:** Quản lý tạo được đầy đủ cây chương trình và lớp học. HV được xếp lớp chính xác.

### PHASE 3: OPERATIONS - SESSIONS & ATTENDANCE (Tuần 6-7)
**Mục tiêu:** Quản lý lịch học thực tế và điểm danh hàng ngày.

- [ ] **Tự động tạo Session (Rolling Window):**
    - Cron job chạy hàng ngày: Tìm lớp `IN_PROGRESS` -> Tạo thêm Session cho 2-3 tuần tới (nếu là lịch cố định).
- [x] **Điểm danh** (`/staff/classes/[id]/attendance`):
    - UI Mobile: Bảng danh sách HV + 4 Radio button (Có mặt / Vắng có phép / Vắng KP / Học bù).
    - CNL nhập xong -> Tự động chuyển Session sang `COMPLETED`.
- [x] **Học bù chéo lớp:**
    - Logic: HV vắng `EXCUSED` ở Lớp A -> Đi học ở Lớp B cùng Program -> Đánh dấu `MAKEUP` ở Lớp B -> Tích hoàn thành buổi vắng ở Lớp A. (Sĩ số Lớp B không thay đổi).
- [x] **Cảm nhận (Feedback):**
    - Sau khi điểm danh, HV điền link Form (hoặc CNL nhập phụ): 3 câu chấm Emoji 1-5 sao (Bài học, GV, TG) + Textarea.
- [x] **Tốt nghiệp:**
    - Hệ thống đếm: Số buổi `PRESENT`/`MAKEUP` >= 80% Tổng buổi -> Hiện nút "Đề xuất tốt nghiệp" cho Admin bấm.

**DoD:** CNL thao tác điểm danh mỗi buổi mất dưới 2 phút. Học bù chéo lớp chạy đúng logic. Tỷ lệ tốt nghiệp tính chính xác 80%.

### PHASE 4: FINANCIAL CORE (Tuần 8-9)
> [!CAUTION]
> **CẢNH BÁO:** Phần dễ sinh bug nhất. Đảm bảo tính chính xác tuyệt đối của dòng tiền.

- [x] **Nhập Phiếu thu (CNL):**
    - Form nhập: Chọn HV -> Nhập số tiền -> CHỌN Hình thức (Tiền mặt/Chuyển khoản).
    - **QUAN TRỌNG:** Nếu chuyển khoản, BẮT BUỘC nhập: Họ tên người chuyển, Số TK/Ngân hàng, Nội dung CK.
    - Lưu trạng thái: `PENDING_APPROVAL`.
- [x] **Màn hình Duyệt hàng loạt (Admin):**
    - Bảng hiển thị các cột: [Checkbox] | Ngày | Tên HV | SĐT HV | Mã Lớp | Số tiền | Người chuyển khoản | STK/Ngân hàng | [Duyệt] | [Từ chối]
    - Admin tick checkbox nhiều dòng -> Bấm "Xác nhận hàng loạt" -> Trạng thái chuyển `CONFIRMED` (LOCKED).
- [x] **Cập nhật Công nợ tự động:**
    - Mỗi khi phiếu thu `CONFIRMED`, trigger tính toán lại ở `ClassMember.debtStatus`.
    - Logic: Công nợ = TuitionFeeActual - Tổng(Receipt `CONFIRMED`).
    - Trạng thái: `CLEAR` (0) -> `OWING` (>0 & <= Ngày hẹn) -> `OVERDUE` (>0 & Quá ngày hẹn).
- [x] **Xử lý Nợ xấu (Bad Debt):**
    - HV Rút lui -> Admin đánh dấu phần nợ còn lại thành `BAD_DEBT` (Chỉ Admin được quyền).
    - Dashboard Tài chính: `BAD_DEBT` KHÔNG được cộng vào Doanh thu.
- [x] **Hoàn tiền:**
    - Tạo `RefundReceipt` (Chỉ Admin). Kiểm tra: Nếu Class là `MENTORING` -> Chặn hoàn tiền (Toast báo lỗi). Lớp `REGULAR` -> Cho phép.

**DoD:** Tiền không bị mất đi, không có cách nào sửa phiếu thu đã duyệt, Dashboard đối soát khớp 100% với sổ phụ của Quản lý.

### PHASE 5: AI ASSISTANT (GEMINI RAG) (Tuần 10)
**Mục tiêu:** Tích hợp Gemini 2.5 để hỗ trợ tra cứu, chia làm 2 tầng quyền.

- [x] **Quản lý tài liệu** (`/admin/documents`):
    - Admin upload file PDF/Word (Bài giảng, Quy trình, Câu hỏi thảo luận).
    - Lưu file lên Hostinger Storage, lưu đường dẫn vào DB Document.
- [ ] **Thiết lập Gemini API:**
    - Tạo file `lib/ai/gemini.ts`. Khởi tạo Vertex AI hoặc Google AI SDK.
    - **LƯU Ý:** Tắt chế độ *Improve model* trên Google AI Studio để bảo mật data.
- [ ] **AI Context Builder (Backend):**
    - Nếu User role = `ADMIN`: Truy vấn DB (Học viên, Tài chính, Điểm danh) + File PDF -> Ghép thành Prompt gửi Gemini.
    - Nếu User role = `CLASS_LEADER` / `TEACHER`: CHỈ lấy dữ liệu từ bảng Document -> Ghép thành Prompt. (Chặn tuyệt đối truy vấn bảng PII).
- [ ] **UI Chatbox:**
    - Icon góc dưới màn hình. Giao diện tương tự ChatGPT. Lưu lịch sử chat vào `AiChatHistory`.

**DoD:** Admin hỏi "Tổng nợ lớp TDTN K15 là bao nhiêu?" -> AI trả lời đúng số. CNL hỏi "Bài học buổi 3 của TDTN là gì?" -> AI trả lời đúng. CNL hỏi "HV A nợ tiền không?" -> AI nói "Tôi không có quyền truy cập thông tin này".

### PHASE 6: GO-LIVE & DATA MIGRATION (Tuần 11)
**Mục tiêu:** Đưa dữ liệu cũ vào, chuẩn bị ra mắt.

- [ ] **Tool Import Excel:**
    - Dùng thư viện `xlsx`. Cho phép upload 2 sheet: (1) Danh sách HV cũ (2) Lịch sử thu tiền cũ.
    - Validation: Check trùng SĐT/CCCD -> Báo lỗi row thứ mấy -> Cho phép import phần hợp lệ.
    - Toàn bộ data import vào sẽ mặc định có AuditLog là "Imported from Excel".
- [ ] **Xuất Báo cáo:** Export Excel danh sách lớp, công nợ (dùng `exceljs`).
- [ ] **Smoke Test toàn hệ thống:** Đi lại full flow từ đăng ký -> xếp lớp -> điểm danh -> thu tiền -> duyệt tiền -> tốt nghiệp.
- [ ] **Đào tạo CNL:** Hướng dẫn dùng Public Form thay vì thu giấy.

---

## 4. DANH SÁCH DECISION LOG CỐT LÕI

- **D-21 (CCCD Key):** CCCD là Unique bắt buộc khi thành HV chính thức. Lead KHÔNG cần CCCD.
- **D-22 (Gộp TVV):** Bỏ role TVV. CNL lo toàn bộ từ Telesale đến vận hành lớp.
- **D-23 (Mật Thất):** Lớp Mentoring thu theo Năm/6 tháng. **KHÔNG CHO PHÉP** hoàn tiền.
- **D-26 (AI Gemini):** Dùng API ngoài. Full RAG cho Admin. Restricted RAG (chỉ file tĩnh) cho CNL/GV.
- **D-28 (Duyệt hàng loạt):** Bắt buộc CNL nhập Thông tin chuyển khoản. Màn hình Admin là Checklist đối chiếu.
- **D-29 (Rolling Session):** Chỉ tạo lịch học 2-3 tuần trước, KHÔNG tạo toàn bộ khóa khi khai giảng.
- **D-34 (Tốt nghiệp):** Hardcode cứng 80% cho mọi lớp Regular.

---

## 5. CẤU TRÚC THƯ MỤC CHUẨN

```text
sms.cit/
├── prisma/
│   ├── schema.prisma          # Định nghĩa Database Schema (camelCase, @map)
│   ├── seed.ts                # Script nạp dữ liệu mẫu (Admin, Programs, Branches)
│   └── migrations/            # Lịch sử thay đổi cấu trúc Database
├── public/                    # Tài nguyên tĩnh (Images, Icons, Fonts)
├── src/
│   ├── app/                   # Next.js 15 App Router
│   │   ├── (auth)/            # Nhóm Route xác thực (Login, Force Change Password)
│   │   │   ├── login/         # Trang đăng nhập
│   │   │   └── change-password/ # Trang buộc đổi mật khẩu
│   │   ├── (admin)/           # Dashboard dành riêng cho Admin (/admin/...)
│   │   │   ├── dashboard/     # Báo cáo tổng quan, tài chính
│   │   │   ├── programs/      # Quản lý chương trình học
│   │   │   └── settings/      # Cấu hình hệ thống
│   │   ├── (staff)/           # Dashboard dành cho CNL, Giảng viên (/staff/...)
│   │   │   ├── leads/         # Quản lý khách hàng tiềm năng
│   │   │   ├── classes/       # Quản lý lớp học & Điểm danh
│   │   │   └── finance/       # Nhập phiếu thu (Nháp) & Đối soát
│   │   ├── portal/            # Trang đăng ký công khai cho Học viên (/portal/register)
│   │   ├── api/               # API Route Handlers (AI streaming, Webhooks)
│   │   │   └── ai/chat/       # Endpoint xử lý Chatbot Gemini SSE
│   │   ├── layout.tsx         # Layout gốc (Root Layout)
│   │   └── page.tsx           # Trang Landing page/Redirect
│   ├── components/            # Thành phần giao diện (UI)
│   │   ├── ui/                # Thành phần nguyên tử (Shadcn UI: Button, Input, Modal...)
│   │   ├── students/          # UI đặc thù: Form học viên, Modal xem CCCD, Merge hồ sơ
│   │   ├── classes/           # UI đặc thù: Enrollment modal, Attendance radio buttons
│   │   ├── finance/           # UI đặc thù: Receipt form, Bulk approve table
│   │   ├── ai/                # UI Chatbot: Chat window, Message bubble, Tool status
│   │   └── shared/            # Layout components (Sidebar, Navbar, Audit-log viewer)
│   ├── lib/                   # Logic cốt lõi và Tiện ích
│   │   ├── auth/              # Cấu hình NextAuth.js v5 và RBAC helpers (rbac.ts)
│   │   ├── crypto/            # Bảo mật: cccd.ts (AES-256-GCM + HMAC Blind Index)
│   │   ├── validation/        # Zod Schemas kiểm tra dữ liệu đầu vào
│   │   ├── services/          # Business Logic (Payment, Attendance, Eligibility check)
│   │   ├── audit/             # Logger: Ghi log tài chính và log truy cập CCCD (Immutable)
│   │   └── ai/                # Gemini Logic: Prompt builder, Tool registry, RAG service
│   ├── hooks/                 # Custom React Hooks (useAuth, useDebounce...)
│   ├── styles/                # Cấu hình Tailwind CSS và Global CSS
│   └── types/                 # Định nghĩa TypeScript interfaces/types dùng chung
├── .env                       # Biến môi trường (DATABASE_URL, CCCD_KEY, GEMINI_API_KEY)
├── .env.example               # File mẫu hướng dẫn cấu hình môi trường
├── CLAUDE.md                  # Hướng dẫn dự án & Quy tắc phát triển (Locked Principles)
├── next.config.ts             # Cấu hình Next.js
├── package.json               # Quản lý dependencies
└── tsconfig.json              # Cấu hình TypeScript (Strict Mode)
```
<!-- SNAPSHOT --> 2026-05-09 16:04 | OK | Phase: Phase 0 | Last: Updated User schema with safe relations & added performance rules to CLAUDE.md | Next: Finalize Phase 0 (Prisma migration)


<!-- SNAPSH
<!-- SNAPSHOT --> 2026-05-09 16:43 | OK | Phase: Phase 0 | Last: Created src/lib/crypto/cccd.ts (AES-256-GCM Encryption & Blind Index) | Next: Task 0.3 (Auth & RBAC)


<!-- SNAPSHOT --> 2026-05-09 16:50 | OK | Phase: Phase 0 | Last: Created src/lib/auth/rbac.ts & nextauth.config.ts (NextAuth v5 & Roles setup) | Next: Phase 0.4 (Prisma Seeding & Initial Admin)

<!-- SNAPSHOT --> 2026-05-09 16:43 | OK | Phase: Phase 0 | Last: Created src/lib/crypto/cccd.ts (AES-256-GCM Encryption & Blind Index) | Next: Task 0.3 (Auth & RBAC)


<!-- SNAPSHOT --> 2026-05-09 16:50 | OK | Phase: Phase 0 | Last: Created src/lib/auth/rbac.ts & nextauth.config.ts (NextAuth v5 & Roles setup) | Next: Phase 0.4 (Prisma Seeding & Initial Admin)

<!-- SNAPSHOT --> 2026-05-09 17:07 | OK | Phase: Phase 1 | Last: Created Lead creation UI (Action, Component, Page) with Zod validation | Next: Task 1.2 (Lead to Student Conversion)

<!-- SNAPSHOT --> 2026-05-09 18:14 | OK | Phase: Phase 1 | Last: Implemented fetchLeadsAction and dynamic Leads list UI (Mobile-first Cards) | Next: Task 1.4 (Lead to Student Conversion with CCCD Encryption)

<!-- SNAPSHOT --> 2026-05-09 18:22 | OK | Phase: Phase 1 | Last: Implemented /leads page with Create Form, Leads List, and Mobile-first Card UI | Next: Task 1.6 (User Profile & Login Page)

<!-- SNAPSHOT --> 2026-05-11 12:15 | DOCS SYNC | Phase: Phase 5 | Last: Synced Implementation Plan with actual codebase progress | Next: Phase 6 (Excel Import Tool)

<!-- SNAPSHOT --> 2026-05-11 | OK | Phase: Phase 3 | Last: Tạo Quick Session Generator — generateClassSessions action + GenerateSessionsButton component (day picker + anti-duplicate) | Next: Phase 4 (Attendance & Feedback)

<!-- SNAPSHOT --> 2026-05-11 | OK | Phase: Phase 6 | Last: Xuất báo cáo Excel — cài exceljs, exportClassStudentList + exportDebtReport actions (base64), ExportButton component, tích hợp vào admin/classes/[id] và admin/finance/approvals | Next: Phase 7 (AI Chatbot)

<!-- SNAPSHOT --> 2026-05-11 15:30 | OK | Phase: Phase 6 | Last: Implemented Excel Import Tool — /admin/settings/data-import (Server Action + UI, CCCD mã hóa, Phiếu thu CONFIRMED, partial success) | Next: Phase 7 (AI Assistant / Gemini Integration)

<!-- SNAPSHOT --> 2026-05-11 16:30 | OK | Phase: Phase 5 | Last: Tích hợp Gemini AI Assistant — lib/ai/gemini.ts (Tiered RAG + OOM Guard), /api/ai/chat (Streaming SSE), ChatWidget component (icon góc phải dưới), tích hợp vào admin & staff layout | Next: Thay mock auth bằng getServerSession thực tế khi NextAuth hoàn thiện

<!-- SNAPSHOT --> 2026-05-11 17:30 | OK | Phase: CRITICAL | Last: Kết nối NextAuth v5 thật — src/auth.ts (bcrypt+DB), auth.config.ts (edge), middleware.ts (route guard), /login page, getSessionForAction helper; xóa toàn bộ getMockSession/CURRENT_USER_ID/"admin-001" khỏi 11 Server Actions | Next: Seed DB user thật để test đăng nhập

<!-- SNAPSHOT --> 2026-05-11 18:00 | OK | Phase: Phase 0 | Last: Tạo prisma/seed.ts — upsert Admin user (bcrypt hash), gán role ADMIN, tạo 2 Chi nhánh mẫu, 3 Chương trình (TDTD/TDDP/MAT_THAT); cài ts-node, cấu hình package.json#prisma.seed | Next: Test đăng nhập với admin@citedu.vn / CitEdu@2026

<!-- SNAPSHOT --> 2026-05-11 18:30 | OK | Phase: Phase 0 | Last: Bổ sung seed CNL — tạo cnl001@citedu.vn (bcrypt hash, CLASS_LEADER role), tạo lớp mẫu TDTD-2026-01, gán CNL vào ClassStaff; xử lý phone conflict bằng OR lookup | Next: Test đăng nhập CNL cnl001@citedu.vn / cnl@2026

<!-- SNAPSHOT --> 2026-05-11 19:00 | OK | Phase: Phase 2 | Last: Auto-gen classCode/name — REGULAR: [CODE]_[YY].[Seq] (YY=year-2009), MENTORING: [CODE]_[YYYY].[Seq]; Transaction-safe sequence; thêm branchId+startDate vào form; bỏ trường name khỏi UI; cập nhật seed sang TDTD_17.1; fix Zod v4 schema syntax | Next: Test tạo lớp qua UI

<!-- SNAPSHOT --> 2026-05-11 21:30 | OK | Phase: Phase 1 | Last: Tái cấu trúc routing — đổi (admin)→admin, (staff)→staff; tạo root app/layout.tsx; strip html/body khỏi nested layouts; role-based middleware (ADMIN→/admin/*, CLASS_LEADER→/staff/*); cập nhật toàn bộ internal links (18 file); fix redirect sau login theo role | Next: Test đăng nhập Admin→/admin/dashboard, CNL→/staff/classes

<!-- SNAPSHOT --> 2026-05-12 | OK | Phase: Phase 6 | Last: Security audit & bug fix — xóa 2 debug endpoint (debug-auth, force-reset-password), thêm auth guard vào 10 fetch actions, sửa variable shadowing trong session.ts & attendance.ts, fix receipt code collision, chuẩn hóa Prisma error check (instanceof) và DebtStatus enum | Next: Smoke testing & staff training
<!-- SNAPSHOT --> 2026-05-12 | OK | Phase: Phase 2 | Last: Fix context-aware redirect — thêm getBasePath/redirectToClassDetail helper (rbac.ts), tạo /admin/classes/[id]/sessions & finance pages với admin back link, fix back button staff finance (/admin→/staff), fix revalidatePath session.ts & receipt.ts (từ /classes/... sang /admin+/staff dual paths) | Next: RBAC hardening
<!-- SNAPSHOT --> 2026-05-12 | OK | Phase: Phase 2 | Last: RBAC fix cancelClass — cancelClassAction (ADMIN-only, assertRole, lý do ≥20 ký tự, block COMPLETED/CANCELLED), CancelClassButton component (isAdmin guard, inline confirm UI, char counter), tích hợp admin class detail với session check | Next: Smoke test full flow
<!-- SNAPSHOT --> 2026-05-12 16:00 | OK | Phase: UI/UX | Last: Critical UI overhaul — cài Shadcn UI (button/input/card/badge/label/sheet/separator), tạo tailwind.config.ts+globals.css+postcss.config.mjs, font Inter, brand colors CiT EDU (Indigo/Emerald/Crimson), AppShell + Sidebar responsive (hamburger mobile), refactor login-form/create-lead-form/class-form/approval-list | Next: Smoke test giao diện /login + /admin/dashboard + /staff/leads