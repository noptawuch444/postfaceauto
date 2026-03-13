# Final Setup Guide (Facebook AutoPost)

ระบบถูกสร้างเสร็จสมบูรณ์แล้ว! เพื่อให้ระบบทำงานได้จริง โปรดดำเนินการดังนี้:

## 1. ติดตั้ง PostgreSQL
- ดาวน์โหลดและติดตั้ง: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
- สร้าง Database ชื่อ `autopost_fb`
- ตรวจสอบรหัสผ่านใน `backend/.env` ตรง `DATABASE_URL` ให้ถูกต้อง ดังนี้:
  `DATABASE_URL=postgres://postgres:รหัสผ่านของคุณ@localhost:5432/autopost_fb`

## 2. ตั้งค่า Facebook App (ใน backend/.env)
- ใส่ `FACEBOOK_APP_ID` และ `FACEBOOK_APP_SECRET` ที่คุณมีในไฟล์ `.env`
- หากต้องการใช้ User Access Token ที่มีอยู่แล้ว สามารถนำไปใช้งานในส่วน Connect Manual ได้เลย

## 3. รันระบบ
เปิด Terminal 2 หน้าต่าง:
- **Terminal 1 (Backend):** `cd backend` และ `npm start`
- **Terminal 2 (Frontend):** `cd frontend` และ `npm run dev`

---

### รายละเอียดระบบที่สร้างสำเร็จ:
- [x] Backend API (Auth, FB OAuth, Post Scheduler, Templates)
- [x] Admin Dashboard (Blue Luxury Theme)
- [x] Public Posting Link (Password protected)
- [x] Mobile Responsive UI
- [x] Local Storage Security (JWT)
- [x] Image Upload support

ขอให้สนุกกับระบบใหม่ของคุณ! 🚀
