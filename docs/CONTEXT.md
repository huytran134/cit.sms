# CiT-SMS — BỘ NÃO NGHIỆP VỤ (CONTEXT)

AI BẮT BUỘC PHẢI ĐỌC FILE NÀY KHI CÓ THẮC MẮC VỀ LUỒNG HOẠT ĐỘNG.

---

## 1. Định vị khách hàng
- **Đối tượng:** Sinh viên, người mới ra trường, người khởi nghiệp (< 35 tuổi).
- **Đặc điểm:** KHÔNG có trường hợp VIP đòi nhảy cóc khóa học. Luôn tuân thủ đúng lộ trình Tư duy.

## 2. Hành trình khách hàng tuyệt đối
1. **Lead đăng ký** (Chưa có CCCD) -> CNL Telesale tư vấn.
2. **Đăng ký xếp lớp** -> HV tự điền Public Form (Bắt buộc có CCCD).
3. **Đang học** (Khai giảng -> Học các buổi -> Tốt nghiệp).
4. **Chuyển tiếp:** Tư vấn khóa sau -> Quay lại bước 2.
5. **Nếu không học tiếp** -> Trở thành "Học viên cũ" để chăm sóc dài hạn.

## 3. Hệ thống Chương trình (Phân nhánh cứng)
- **Nhánh Tư duy (Thinking):** `TDTN` (Tài năng) / `TDKT` (Khởi nghiệp) -> `TDTD` (Thành đạt) -> `TĐĐT` (Đột phá).
    - **Quy tắc:** Phải học xong 1 trong 2 khóa đầu mới được học TDTD. Học xong TDTD mới học TĐĐT.
- **Nhánh Kỹ năng (Skill):** Học tự do, không điều kiện tiên quyết.
- **Lớp Mật Thất (Mentoring):** 1 thầy 1 trò. Thu tiền theo Năm/6 tháng. **TUYỆT ĐỐI KHÔNG ĐƯỢC HOÀN TIỀN.**

## 4. Quy trình Buổi học thực tế (Áp dụng cho UI Điểm danh)
1. CNL thông báo lịch & đếm số lượng xác nhận (Ít quá -> Admin quyết định hủy).
2. Đón học viên.
3. Thủ tục đầu giờ: Chào hỏi -> **ĐIỂM DANH**.
4. Trợ giảng (TG) vào thảo luận với học viên (Dựa vào Câu hỏi thảo luận của buổi đó).
5. Giải lao.
6. Giảng viên chính (GV) giảng bài.
7. CNL phát phiếu cảm nhận (Emoji 1-5 sao) -> Tổ chức ra về.

## 5. Quy trình Tài chính Thực tế
1. CNL thu tiền (Tiền mặt hoặc CK) -> Nhập vào hệ thống (Lúc này là **NHÁP**).
2. **THÔNG TIN BẮT BUỘC KHI CHUYỂN KHOẢN:** Họ tên người gửi, Số tài khoản/Ngân hàng, Nội dung CK.
3. Quản lý mở màn hình "Duyệt hàng loạt" -> So sánh với App ngân hàng -> Tick Check -> Xác nhận (**KHÓA SỔ**).
4. HV có thể nợ. Nếu hẹn trả -> Trạng thái "Nợ trong hạn". Quá hẹn -> "Nợ quá hạn".
5. Nếu HV nghỉ (Rút lui) và không trả nợ nữa -> Quản lý chuyển thành "**Công nợ xấu (Bad Debt)**" -> BỊ TRỪ KHỎI DOANH THU.

## 6. Dữ liệu từ Phiếu giấy (Đã số hóa)
- HV tự điền qua Mobile Form.
- **Các trường tự do (Textarea) bắt buộc có:** Mục tiêu 3 năm, Lý do tham gia, Quá trình học tập. Các trường này lưu vào bảng `Student`.

## 7. AI Chatbox Phân tầng
- **Quản lý (Admin):** Hỏi gì cũng đáp (Truy xuất thẳng DB Học viên, Tiền, Điểm danh qua Gemini API).
- **CNL / Giảng viên:** CHỈ được hỏi về Bài giảng, Quy trình, Câu hỏi thảo luận (Lấy từ file PDF upload). Nếu hỏi về tiền/Học viên -> AI phải chặn: "Tôi không có quyền truy cập".
