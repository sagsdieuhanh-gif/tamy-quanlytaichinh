# Tamy Ví tài chính — sao lưu Google Drive

Tamy có thể **sao lưu và khôi phục dữ liệu bằng một tệp JSON trên Google Drive của người dùng**. Tính năng được đặt ở **Cài đặt → Google Drive**. Bản gốc vẫn nằm trong `localStorage` và bản dự phòng IndexedDB trên thiết bị. Đây là **sao lưu, không phải cơ sở dữ liệu đồng bộ trực tiếp**.

## Bước cấu hình Google OAuth (chủ website chỉ cần làm một lần)

1. Mở [Google Cloud Console](https://console.cloud.google.com/) và tạo hoặc chọn một Google Cloud project.
2. Bật [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com) cho project đó.
3. Vào [Google Auth Platform](https://console.cloud.google.com/auth/overview). Cấu hình **Branding**, **Audience** và **Data access** cho ứng dụng. Nếu đang ở chế độ Testing và đối tượng người dùng là External, thêm tài khoản Google cần dùng vào **Test users**.
4. Mở [OAuth Clients](https://console.cloud.google.com/auth/clients), tạo **OAuth 2.0 Client ID** thuộc loại **Web application**. Phần **Authorized JavaScript origins** thêm chính xác:
   ```
   https://sagsdieuhanh-gif.github.io
   ```
   Chỉ nhập origin, **không** thêm `/tamy-quanlytaichinh/` sau tên miền. Nếu thử local, thêm `http://localhost:8000` (theo cổng máy chủ test).
5. Google cấp mã dạng `123...-xxx.apps.googleusercontent.com`. Đây là **Client ID công khai**, **không phải Client Secret**. Có thể đặt vào `drive-config.js` và xuất bản để mọi người dùng Tamy thấy nút “Kết nối tài khoản Google”, hoặc nhập mã một lần trong phần Cài đặt của Tamy trên thiết bị của bạn.
6. Mở website Tamy → **Cài đặt → Google Drive → Kết nối tài khoản Google**. Chọn tài khoản và đồng ý quyền với những tệp được Tamy tạo hoặc được bạn cấp quyền (`drive.file`). Nhấn **Sao lưu lên Drive** để tạo bản sao đầu tiên.

**Không đưa Client Secret, API key tài chính hoặc mã truy cập Google lên GitHub.** Mã OAuth Client ID có thể công khai. Token Google chỉ giữ trong bộ nhớ phiên trang web; đóng/mở lại cần kết nối lại để tiếp tục sao lưu.

## Sử dụng

- **Sao lưu:** Sau khi kết nối, nhấn **Sao lưu lên Drive**. Tamy tạo tệp `Tamy-Vi-Tai-Chinh-Backup.json` trong Drive. Lần lưu sau có xác nhận trước khi thay thế bản trước.
- **Khôi phục:** Chọn **Khôi phục từ Drive**, kiểm tra thông báo và xác nhận trước khi thay dữ liệu trên máy. Tamy chỉ chấp nhận JSON đúng định dạng và hợp lệ.
- **Tự sao lưu:** Sau khi lưu thành công lần đầu, bật **Tự sao lưu sau khi sửa dữ liệu**; tính năng chỉ chạy trong lúc website đang mở và phiên xác thực Google còn hiệu lực. Không sao lưu nền khi đã đóng tab.
- **Chuyển thiết bị:** Mở Tamy trên thiết bị mới, kết nối cùng tài khoản Google, chọn **Khôi phục từ Drive**. Không đồng thời ghi chép trên hai thiết bị rồi mong muốn Tamy tự gộp dữ liệu; bản sao là snapshot, không phải đồng bộ 2 chiều.
- **Ngắt kết nối:** Không xóa tệp trên Drive hay dữ liệu tại máy. Bạn có thể xóa hoặc quản lý tệp sao lưu trực tiếp trong Google Drive.

## An toàn dữ liệu

- Scope giới hạn: `https://www.googleapis.com/auth/drive.file`.
- Dữ liệu được tải qua kết nối HTTPS tới Google Drive API; không gửi dữ liệu tới server của Tamy.
- Tệp JSON **không mã hóa đầu cuối**. Hãy bảo mật tài khoản Google, không chia sẻ tệp và không nhập số thẻ tín dụng đầy đủ, CVV, PIN vào ứng dụng.
- Google Drive có thể yêu cầu cấu hình xác minh ứng dụng OAuth tùy đối tượng người dùng và chế độ xuất bản của Google Cloud.
- Giữ thêm bản sao JSON tải về máy để có một bản lưu ngoài Drive.

## Kiểm tra

- `node --check drive.js` và cú pháp JavaScript trong `index.html`.
- Browser test với Google Identity Services và Google Drive API **giả lập** kiểm tra kết nối, tạo sao lưu, tải bản sao, hộp xác nhận khôi phục và ngăn ghi đè tự động khi chưa cho phép.
- **Chưa kiểm thử OAuth thực với tài khoản Google** nếu chưa có OAuth Client ID đã cấu hình.
