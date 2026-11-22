# Tamy Ví tài chính ✨

**Ví tài chính rõ chữ, dễ nhập, dễ kiểm soát** — website quản lý thu chi cá nhân bằng tiếng Việt, thiết kế dành cho màn hình điện thoại.

🌐 **Website:** https://sagsdieuhanh-gif.github.io/tamy-quanlytaichinh/

## Tamy Studio v3 — giao diện mới

Thiết kế lại từ bố cục: sidebar xanh mực trên desktop, giao diện sáng tối giản trên điện thoại, số dư là điểm nhấn, ba nút ghi Chi / Thu / Chuyển ví dễ bấm và lịch sử giao dịch được đặt trước biểu đồ. Các trang Thẻ tín dụng, Ngân sách, Báo cáo, Tamy Smart và Cài đặt vẫn giữ nghiệp vụ cũ.

**Đã kiểm thử:** giao diện 350px, 390px, 1440px không tràn ngang, mở nhập chi tiêu, thêm thẻ, quẹt thẻ, trả nợ, Tamy Smart, và trường hợp không hạch toán trả thẻ thành chi tiêu lần hai. Script không có lỗi khi tải.

**Dữ liệu:** giữ nguyên khóa `moc-finance-v1` cùng sao lưu IndexedDB; chưa có đăng nhập/đồng bộ đám mây. Chỉ lưu trên thiết bị; xuất sao lưu JSON định kỳ.

## Tính năng

- Ghi **chi tiêu**, **thu nhập** hoặc **chuyển tiền giữa các ví** chỉ trong vài thao tác.
- Dashboard trực quan: tổng số dư, thu/chi theo tháng, tiền còn lại và tỷ lệ tiết kiệm.
- **Quản lý thẻ tín dụng:** nhiều thẻ, hạn mức, dư nợ, tỷ lệ dùng hạn mức, ngày chốt sao kê / hạn thanh toán dự kiến, lịch sử quẹt thẻ và thanh toán.
- **Tamy Smart:** phân tích tự động ngay trên thiết bị: cảnh báo vượt ngân sách, thẻ đến hạn, chi tiêu tăng, gợi ý tiết kiệm và hỏi đáp theo mẫu bằng số liệu thực tế.
- Ngân sách theo danh mục, biểu đồ và báo cáo theo tháng.
- Lịch sử giao dịch với tìm kiếm, bộ lọc, sửa và xóa.
- Quản lý nhiều ví, danh mục, tùy chỉnh tên hiển thị, chế độ sáng/tối.
- Xuất CSV, sao lưu và khôi phục JSON.
- Giao diện responsive với font hệ thống dễ đọc, chữ mặc định lớn hơn và lựa chọn **Dễ đọc / Chữ lớn / Rất lớn** trong Cài đặt.
- Thanh điều hướng dưới thuận tay, hỗ trợ PWA để thêm vào màn hình chính.

## Nguyên tắc hạch toán thẻ tín dụng

- **Quẹt thẻ**: tính vào chi tiêu của ngày quẹt; tăng dư nợ, giảm hạn mức khả dụng; **không** trừ ví ngân hàng/tiền mặt ngay.
- **Trả nợ thẻ**: trừ ví nguồn và giảm dư nợ; **không cộng vào chi tiêu lần thứ hai**.
- Ngày thanh toán trên giao diện chỉ là **ước tính theo ngày chốt và ngày trả tự khai**, không thay thế sao kê thực tế; dư nợ đầu kỳ có thể không có kỳ thanh toán xác định.
- Không lưu số thẻ đầy đủ, CVV, mã PIN hoặc mật khẩu ngân hàng. Có thể lưu tên thẻ và 4 số cuối không bắt buộc.
- Dữ liệu thẻ và số liệu Tamy Smart được sao lưu qua JSON, CSV và IndexedDB cùng các ví/giao dịch khác.

## Tamy Smart là gì?

**Tamy Smart 2.3 là bộ phân tích theo công thức/quy tắc, chưa phải chatbot sử dụng mô hình AI tạo sinh.** Toàn bộ tính toán diễn ra trong trình duyệt, không gửi lịch sử tài chính sang nhà cung cấp AI. Muốn nâng cấp thành AI hội thoại thực sự cần backend an toàn (ví dụ Supabase Edge Functions) và lưu API key ở máy chủ, không đặt trong JavaScript công khai của GitHub Pages.

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
