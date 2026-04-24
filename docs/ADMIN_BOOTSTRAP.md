# การตั้งค่า Admin คนแรก (Bootstrap)

เนื่องจากระบบใช้ Role-based access จาก Firestore แต่ยังไม่มี admin คนแรก จึงต้องสร้าง manually ครั้งเดียว

## ขั้นตอน

### 1. เปิด Email/Password Authentication

1. เข้า [Firebase Console](https://console.firebase.google.com) → เลือกโปรเจกต์
2. เมนูซ้าย → **Authentication** → **Sign-in method**
3. คลิก **Email/Password** → **Enable** → **Save**

### 2. สร้าง Firebase Auth User

1. **Authentication** → **Users** tab → **Add user**
2. กรอก Email + Password (≥ 6 ตัวอักษร) ของคุณ
3. **Add user**
4. **คัดลอก UID** ที่ได้ (คลิก user → copy UID ที่ปรากฏ)

### 3. สร้าง Firestore Profile Document

1. เมนูซ้าย → **Firestore Database**
2. **Start collection** (ถ้ายังไม่มี) → ID: `users`
3. **Add document**:
   - **Document ID:** วาง UID ที่ copy มาจากขั้นตอน 2
   - **Fields:**
     | Field | Type | Value |
     |-------|------|-------|
     | `email` | string | อีเมลเดียวกับ Auth |
     | `role` | string | `admin` |
     | `disabled` | boolean | `false` |
     | `createdAt` | timestamp | (ปัจจุบัน) |
     | `updatedAt` | timestamp | (ปัจจุบัน) |
4. **Save**

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

หรือ copy เนื้อหาจาก `firestore.rules` ไปวางใน Firebase Console → Firestore → Rules → **Publish**

### 5. ทดสอบ

1. เข้า http://localhost:3000/login
2. ล็อกอินด้วย email/password ที่สร้างในขั้นตอน 2
3. ควรเห็นเมนู **Admin** ด้านล่าง → เข้า `/admin/users` เพื่อจัดการผู้ใช้

---

## หลังจากมี Admin แล้ว

Admin สามารถเชิญผู้ใช้คนอื่นผ่าน UI ได้เลย:

1. `/admin/users` → **+ เชิญใหม่**
2. กรอก email + เลือก role → **สร้างลิงก์เชิญ**
3. **คัดลอกลิงก์** → ส่งผ่าน LINE
4. ผู้ใช้คลิก link → ตั้งรหัสผ่าน → login ได้เลย

## Troubleshooting

**ปัญหา:** ล็อกอินแล้วเห็นข้อความ "บัญชียังไม่ได้รับการตั้งค่า"
- **สาเหตุ:** ไม่มี document ใน `users/{uid}` หรือ UID ไม่ตรง
- **แก้:** ตรวจสอบว่า Document ID ใน `users` ตรงกับ UID ของ Firebase Auth user

**ปัญหา:** ล็อกอินได้แต่เข้า `/admin/users` ไม่ได้
- **สาเหตุ:** role ไม่ใช่ "admin" หรือ disabled = true
- **แก้:** แก้ค่า field ใน Firestore ให้ `role = "admin"` และ `disabled = false`
