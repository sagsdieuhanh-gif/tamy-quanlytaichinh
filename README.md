# Tamy Ví tài chính ✨

**Ví tài chính rõ chữ, dễ nhập, dễ kiểm soát** — website quản lý thu chi cá nhân bằng tiếng Việt, thiết kế dành cho màn hình điện thoại.

🌐 **Website:** https://sagsdieuhanh-gif.github.io/tamy-quanlytaichinh/

## Tính năng

- Ghi **chi tiêu**, **thu nhập** hoặc **chuyển tiền giữa các ví** chỉ trong vài thao tác.
- Dashboard trực quan: tổng số dư, thu/chi theo tháng, tiền còn lại và tỷ lệ tiết kiệm.
- Ngân sách theo danh mục, biểu đồ và báo cáo theo tháng.
- Lịch sử giao dịch với tìm kiếm, bộ lọc, sửa và xóa.
- Quản lý nhiều ví, danh mục, tùy chỉnh tên hiển thị, chế độ sáng/tối.
- Xuất CSV, sao lưu và khôi phục JSON.
- Giao diện responsive với font hệ thống dễ đọc, chữ mặc định lớn hơn và lựa chọn **Dễ đọc / Chữ lớn / Rất lớn** trong Cài đặt.
- Thanh điều hướng dưới thuận tay, hỗ trợ PWA để thêm vào màn hình chính.

## Dữ liệu và quyền riêng tư

Bản đang phát hành là **ứng dụng lưu cục bộ** trong trình duyệt: dữ liệu chính lưu ở `localStorage` và bản dự phòng tự động lưu trong `IndexedDB` trên **cùng thiết bị**. Nếu khóa lưu chính bị xóa nhưng IndexedDB vẫn tồn tại, ứng dụng có thể phục hồi. Hai lớp lưu trữ này không phải dịch vụ đám mây. Dữ liệu chưa được đồng bộ giữa điện thoại và máy tính, chưa có liên kết ngân hàng hoặc tài khoản đăng nhập thực tế. Tài khoản Supabase và đồng bộ đang được phát triển tại [nhánh feature/supabase-accounts](https://github.com/sagsdieuhanh-gif/tamy-quanlytaichinh/pull/1), chưa đưa lên production do chưa có dự án Supabase riêng.

**Giữ nguyên khóa lưu dữ liệu cũ** `moc-finance-v1` nhằm bảo toàn lịch sử thu chi của người đã sử dụng Mộc Finance trên cùng trình duyệt. Không đổi tên key khi cập nhật giao diện.

Nên xuất sao lưu JSON định kỳ, đặc biệt trước khi đổi điện thoại/xóa dữ liệu trình duyệt. Dữ liệu minh họa cần được thay bằng sổ trống trước khi dùng thực tế.

## Cài lên điện thoại

- **iPhone:** Safari → Chia sẻ → Thêm vào Màn hình chính.
- **Android:** Chrome → ⋮ → Thêm vào màn hình chính / Cài đặt ứng dụng.

## Triển khai

Repository dùng GitHub Pages → GitHub Actions. Workflow `Deploy Tamy Ví tài chính to GitHub Pages` tự động xuất bản phiên bản mới sau mỗi lần cập nhật nhánh main.

Mã nguồn thuần HTML/CSS/JavaScript, không cần build. Để thử trên máy:

```bash
python3 -m http.server 8000
```

Mở http://localhost:8000.
