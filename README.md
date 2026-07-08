# Message 🚀

**Message** là một ứng dụng chat fullstack với frontend React + TypeScript và backend Node.js + Express. Dự án hỗ trợ chat riêng tư, nhóm, quản lý bạn bè, gọi video real-time và bảng điều khiển admin.

---

## Table of Contents

- [Project Name](#project-name)
- [Demo](#demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Database Design](#database-design)
- [Screenshots](#screenshots)
- [Performance](#performance)
- [Security](#security)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)
- [License](#license)
- [Author](#author)

---

## Project Name

- **Tên dự án:** Message

- **Mô tả ngắn:** Ứng dụng chat real-time đa nền tảng với tính năng nhắn tin riêng tư và nhóm, quản lý bạn bè, gọi video, và dashboard admin.

---

<!-- ## Demo

- **Frontend URL:** 
- **Backend URL:**  -->


---

## Features

### Authentication

- Register
- Login
- JWT access token
- Refresh token
- Change password
- Blocked account handling

### Chat

- Direct chat
- Group chat
- Real-time messaging
- File attachments (multiple files)
- Message history
- Read receipts / mark as seen
- Group membership management

### Friends

- Search user by username
- Send friend request
- Accept friend request
- Decline friend request
- Friend list retrieval

### Video Call

- WebRTC signaling bằng Socket.IO
- Camera / Microphone support
- Incoming / outgoing call events
- Call history
- Call status lifecycle (calling / accepted / rejected / ended / missed)

### Admin

- User listing
- User block / activate
- Promote / demote admin
- Delete user
- Audit log
- User statistics

### Profile

- Avatar upload via Cloudinary
- Update profile information
- View user profile details

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Zustand, Radix UI, Sonner, Emoji Mart |
| Backend | Node.js, Express, MongoDB, Mongoose, Socket.IO, Cloudinary, Multer |
| Database | MongoDB Atlas / MongoDB |
| Authentication | JWT, Refresh Token, httpOnly cookies, bcrypt |
| Cloud | Cloudinary |
| Realtime | Socket.IO, WebRTC |

---

## Architecture

Ứng dụng được thiết kế theo kiến trúc client-server với hai phần riêng biệt:

- Frontend React gửi yêu cầu REST API qua Axios đến backend.
- Backend Express xử lý xác thực, logic người dùng, chat, và gọi video.
- Socket.IO quản lý realtime cho online users, tin nhắn mới, group event, và video call signaling.
- MongoDB lưu trữ dữ liệu người dùng, conversation, message, request, call và audit log.
- Cloudinary lưu trữ ảnh đại diện và tệp đính kèm.

Mô hình luồng chính:

```text
Client React
  ↓
Axios REST API / Socket.IO
  ↓
Express + Middleware
  ↓
MongoDB / Cloudinary
```

---

## Folder Structure

```text
Chat/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── libs/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── socket/
│   │   └── utils/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.development
└── README.md
```

---

## Installation

### Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong `backend/` với các biến môi trường sau (xem phần [Environment Variables](#environment-variables)).

Chạy server:

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Tạo file `.env.development` nếu cần.

Chạy ứng dụng frontend:

```bash
npm run dev
```

---

## Environment Variables

### Backend

- `PORT` — cổng chạy server (mặc định `5001`).
- `MONGODB_CONNECTIONSTRING` — kết nối MongoDB.
- `CLIENT_URL` — URL frontend được phép truy cập CORS.
- `ACCESS_TOKEN_SECRET` — khóa bí mật JWT cho access token.
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name.
- `CLOUDINARY_API_KEY` — Cloudinary API key.
- `CLOUDINARY_API_SECRET` — Cloudinary API secret.

### Frontend

- `VITE_API_URL` — URL backend API, ví dụ `http://localhost:5001/api`.
- `VITE_SOCKET_URL` — URL Socket.IO backend, ví dụ `http://localhost:5001/`.

---

## API Overview

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `POST /api/auth/refresh`
- `PATCH /api/auth/change-password`

### Users

- `GET /api/users/me`
- `GET /api/users/search`
- `GET /api/users/:userId`
- `POST /api/users/uploadAvatar`
- `PATCH /api/users/updateProfile`

### Friends

- `POST /api/friends/requests`
- `POST /api/friends/requests/:requestId/accept`
- `POST /api/friends/requests/:requestId/decline`
- `GET /api/friends`
- `GET /api/friends/requests`

### Conversations

- `POST /api/conversations`
- `GET /api/conversations`
- `GET /api/conversations/:conversationId/messages`
- `PATCH /api/conversations/:conversationId/seen`
- `GET /api/conversations/:conversationId/members`
- `POST /api/conversations/:conversationId/members`
- `DELETE /api/conversations/:conversationId/members/:memberId`
- `PATCH /api/conversations/:conversationId/leave`
- `DELETE /api/conversations/:conversationId`

### Messages

- `POST /api/messages/direct`
- `POST /api/messages/group`

### Calls

- `POST /api/calls/initiate`
- `PATCH /api/calls/:callId/accept`
- `PATCH /api/calls/:callId/reject`
- `PATCH /api/calls/:callId/end`
- `GET /api/calls/history`

### Admin

- `GET /api/admin/stats/users`
- `GET /api/admin`
- `GET /api/admin/audit-log`
- `DELETE /api/admin/:userId`
- `PATCH /api/admin/:userId/promote`
- `PATCH /api/admin/:userId/demote`
- `PATCH /api/admin/:userId/block`
- `PATCH /api/admin/:userId/active`

### Socket Events

- `video-call:initiate`
- `video-call:incoming`
- `video-call:accept`
- `video-call:rejected`
- `video-call:ice-candidate`
- `video-call:ended`
- `online-users`
- `new-message`
- `new-group`
- `read-message`

---

## Database Design

### Collections

- `User` — lưu thông tin người dùng, email, username, role, status, avatar, bio, số điện thoại.
- `Conversation` — hỗ trợ conversation riêng tư và nhóm, chứa participants, group metadata, lastMessage, các trạng thái unread và seen.
- `Message` — tin nhắn text / image / file, lưu attachments, sender và conversation.
- `FriendRequest` — lưu yêu cầu kết bạn giữa hai người dùng.
- `Friend` — lưu mối quan hệ bạn bè giữa hai user.
- `Call` — lưu lịch sử cuộc gọi, trạng thái cuộc gọi và thời lượng.
- `AuditLog` — lưu hoạt động quản trị như tạo user, block user, login/logout.

### Mối quan hệ

- `User` tham gia nhiều `Conversation` qua `participants`.
- `Conversation` có nhiều `Message` qua `conversationId`.
- `User` tạo và nhận `FriendRequest`.
- `Friend` quản lý quan hệ đôi chiều giữa hai user.
- `Call` liên kết `caller` và `receiver` với `User`.
- `AuditLog` ghi nhận hành động với `actor` và `targetId`.

---

## Screenshots

> Placeholder: thêm hình chụp màn hình app chat, dashboard admin và giao diện gọi video.

---

## Performance

- Pagination tin nhắn với cursor và giới hạn 50 bản ghi.
- Socket rooms cho conversation và user riêng biệt.
- Chỉ tải conversation / message khi cần.
- MongoDB index trên `participants.userId`, `conversationId`, `createdAt`, `lastMessageAt`.
- Tập trung xử lý realtime trên Socket.IO, giảm tải cho REST API.

---

## Security

- JWT access token và refresh token.
- Bcrypt mã hóa mật khẩu.
- CORS giới hạn origin client.
- `httpOnly` cookie cho refresh token.
- Middleware bảo vệ routes và phân quyền admin.
- Kiểm tra quan hệ bạn bè / thành viên nhóm trước khi gửi tin nhắn hoặc thao tác nhóm.

---

## Deployment

### Backend

- `cd backend`
- `npm install`
- Thiết lập `.env`
- `npm run dev` hoặc `npm start`

### Frontend

- `cd frontend`
- `npm install`
- `npm run dev`
- `npm run build` cho production

### Database

- MongoDB Atlas hoặc MongoDB cục bộ.
- Dùng biến `MONGODB_CONNECTIONSTRING` cho kết nối.

### Cloudinary

- Sử dụng Cloudinary để upload avatar và file đính kèm.
- Cấu hình qua `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

### Environment Variables

- Đảm bảo frontend và backend đều có biến môi trường đúng.

---

## Future Improvements

- Thêm tính năng typing indicator.
- Thông báo đẩy (push notifications).
- Xem trước file / attachment ngay trong chat.
- Tối ưu realtime bằng Redis pub/sub cho scale nhiều server.
- Nâng cấp cấu hình call để hỗ trợ audio-only và sharing screen.
- Thêm kiểm tra đầu vào chặt chẽ hơn và schema validation.

---

## License

MIT

---

## Author

- **Name:** Your Name
- **GitHub:** @your-github
- **Email:** your-email@example.com



