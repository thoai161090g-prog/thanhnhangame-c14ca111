

# Thành Nhân VIP MD5 - Trang Dự Đoán Tài Xỉu

## Tổng quan
Xây dựng trang web dự đoán kết quả Tài/Xỉu dựa trên phân tích mã MD5, với hệ thống key bản quyền, đăng ký/đăng nhập, thanh toán QR tĩnh (BIDV), và trang quản trị admin.

---

## 1. Đăng ký / Đăng nhập
- Trang đăng ký tài khoản (email + mật khẩu)
- Trang đăng nhập cho người dùng thường và admin
- Tài khoản admin mặc định để quản lý hệ thống
- Bảo vệ các trang yêu cầu đăng nhập

## 2. Trang chủ - Chọn Game
- Giao diện đẹp, tông màu VIP (đen/vàng/đỏ) với hiệu ứng pháo hoa bắn tung toé
- Hiển thị danh sách game: **68GB, LC79, Thiên Đường Trò Chơi, Sao 789, Ta28**
- Mỗi game là 1 card có hình ảnh, khi nhấn vào sẽ chuyển đến trang phân tích MD5 của game đó
- Hiển thị thông tin Telegram admin: @nhan161019

## 3. Trang Phân Tích MD5 (theo game)
- Khung nhập mã MD5 ở trên cùng
- Kiểm tra key hợp lệ trước khi cho phép sử dụng
- Thuật toán phân tích MD5 nâng cao → cho ra kết quả **Tài** hoặc **Xỉu** kèm % độ tin cậy
- Hiển thị kết quả với animation đẹp mắt
- Lưu lịch sử phân tích

## 4. Hệ thống Key bản quyền
- Người dùng cần key hợp lệ để sử dụng tính năng phân tích
- Key tự động kích hoạt sau khi thanh toán
- Các gói key:
  - 1 ngày: 35.000đ
  - 3 ngày: 70.000đ  
  - 1 tuần: 111.000đ
  - 1 tháng: 150.000đ
  - Vĩnh viễn: 250.000đ

## 5. Trang Mua Key
- Hiển thị các gói giá key
- Khi chọn gói → hiển thị mã QR thanh toán BIDV (ảnh QR tĩnh của bạn, chủ TK: Nguyen Thanh Nhan, STK: 8887596710)
- Nội dung chuyển khoản tự động sinh theo user + gói
- Sau khi người dùng xác nhận đã chuyển khoản → hệ thống tự động tạo key và kích hoạt

## 6. Trang Admin
- Đăng nhập admin riêng
- Xem danh sách tất cả key đã tạo, trạng thái, thời hạn
- Phê duyệt / hủy key thủ công nếu cần
- Xem doanh thu tổng và theo ngày
- Xem danh sách người dùng đã đăng ký
- Quản lý lịch sử giao dịch mua key

## 7. Lịch sử người dùng
- Lịch sử mua key (gói, ngày mua, thời hạn, trạng thái)
- Lịch sử phân tích MD5

## 8. Backend (Lovable Cloud / Supabase)
- Bảng users (đăng ký/đăng nhập)
- Bảng keys (key, user, gói, ngày tạo, ngày hết hạn, trạng thái)
- Bảng transactions (lịch sử mua key, doanh thu)
- Bảng analysis_history (lịch sử phân tích MD5)
- Phân quyền admin vs user thường

## 9. Giao diện & Hiệu ứng
- Theme VIP sang trọng (gradient đen/vàng/đỏ)
- Hiệu ứng pháo hoa (confetti/fireworks) trên trang chủ
- Animation khi hiển thị kết quả phân tích
- Responsive trên mobile và desktop

