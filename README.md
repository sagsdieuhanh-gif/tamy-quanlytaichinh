# Mộc Finance 🌿

Ứng dụng web quản lý thu chi cá nhân bằng tiếng Việt, thiết kế **mobile-first** để sử dụng trên điện thoại.

## Website

Khi GitHub Pages được bật, website có địa chỉ:

**https://sagsdieuhanh-gif.github.io/tamy-quanlytaichinh/**

## Triển khai GitHub Pages

1. Mở **Settings → Pages**: https://github.com/sagsdieuhanh-gif/tamy-quanlytaichinh/settings/pages
2. Trong **Build and deployment → Source**, chọn **GitHub Actions** (không phải Deploy from a branch).
3. GitHub sẽ chạy workflow **Deploy Mộc Finance to GitHub Pages** tại tab **Actions**; nếu chưa chạy, chọn **Run workflow**.
4. Sau khi thành công, mở website trên điện thoại. Trên iPhone: Safari → Chia sẻ → Thêm vào Màn hình chính. Trên Android: Chrome → ⋮ → Cài đặt ứng dụng/Thêm vào màn hình chính.

## Tính năng

- Tổng quan số dư, thu nhập, chi tiêu và báo cáo theo tháng.
- Thêm, sửa, xóa giao dịch chi/thu/chuyển ví.
- Ví tiền, danh mục và ngân sách theo tháng.
- Biểu đồ thống kê, tìm kiếm, lọc giao dịch.
- Xuất CSV, sao lưu và khôi phục JSON.
- Chế độ sáng/tối, giao diện responsive, hỗ trợ thêm vào màn hình chính.
- Sau lần truy cập đầu tiên, service worker hỗ trợ sử dụng offline.

## Dữ liệu và quyền riêng tư

Ứng dụng thuần frontend, không sử dụng backend. Dữ liệu được lưu trong `localStorage` của **chính trình duyệt trên thiết bị**, không đẩy lên GitHub hoặc tài khoản ngân hàng. Không có đồng bộ giữa các thiết bị và chưa có liên kết ngân hàng. Nên sao lưu JSON định kỳ; không nhập mật khẩu, số thẻ hay dữ liệu nhạy cảm khác vào app.

Dữ liệu minh họa chỉ để trải nghiệm; hãy chọn tạo sổ trống trước khi sử dụng thực tế.

## Phát triển

Tất cả giao diện và xử lý chính nằm trong `index.html`, không cần npm/build. `manifest.webmanifest`, `service-worker.js` và các icon phục vụ cài lên màn hình chính.

Local:
```bash
python3 -m http.server 8000
```
Mở http://localhost:8000.

## Công nghệ

HTML, CSS, JavaScript thuần · GitHub Pages · Progressive Web App (PWA).
