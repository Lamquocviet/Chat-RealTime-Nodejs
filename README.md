# Message 

Một ứng dụng chat fullstack bao gồm backend REST API và frontend React + Vite.

## Tổng quan

- **Backend**: Express, MongoDB, Socket.IO, JWT, Cloudinary, Multer
- **Frontend**: React + TypeScript, Vite, Zustand, Tailwind CSS
- **Tính năng chính**:
  - Đăng ký / đăng nhập
  - Tin nhắn trực tiếp và nhóm
  - Quản lý bạn bè / gửi nhận yêu cầu kết bạn
  - Hồ sơ người dùng và tải ảnh đại diện
  - Thông báo và menu người dùng

## Thư mục dự án

- `backend/` - server Express, API route và socket chat
- `frontend/` - giao diện React và logic người dùng

## Yêu cầu

- Node.js 20+ (hoặc tương thích)
- npm
- MongoDB

## Khởi động dự án

### Backend

1. Vào thư mục `backend`
2. Cài đặt phụ thuộc:
   ```bash
   cd backend
   npm install
   ```
3. Tạo file `.env` nếu chưa có và cấu hình các biến môi trường cần thiết:
   - `PORT`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

4. Chạy server:
   ```bash
   npm run dev
   ```

### Frontend

1. Vào thư mục `frontend`
2. Cài đặt phụ thuộc:
   ```bash
   cd frontend
   npm install
   ```
3. Chạy ứng dụng:
   ```bash
   npm run dev
   ```

## Lưu ý cấu hình

- Backend sử dụng `src/server.js` làm entry point và hỗ trợ `nodemon` khi chạy `npm run dev`.
- Frontend sử dụng Vite, TypeScript, Tailwind CSS và các thư viện UI Radix.
- Nếu muốn chạy môi trường production, sử dụng `npm run build` trong `frontend/` và `npm start` trong `backend/`.



