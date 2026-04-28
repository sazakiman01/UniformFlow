# 2026-04-27: เพิ่มฟีเจอร์ลบลูกค้า

### Status
✅ Completed

**สิ่งที่เปลี่ยน:**
- เพิ่ม function deleteCustomer ใน src/lib/customers.ts
- สร้างหน้าจัดการลูกค้าใน dashboard (src/app/dashboard/customers/page.tsx)
- เพิ่ม UI ลบลูกค้าพร้อม confirmation dialog
- เพิ่ม link "ลูกค้า" ใน dashboard navigation
- เพิ่ม search input สำหรับค้นหาลูกค้า (ชื่อ, เบอร์โทร, TIN)
- แสดงข้อมูลลูกค้าใน table (ชื่อ, เบอร์โทร, ประเภท, TIN)
- เพิ่ม loading state และ empty state

**ไฟล์ที่แก้ไข:**
- d:\coding\UniformFlow\src\lib\customers.ts (เพิ่ม deleteDoc import และ deleteCustomer function)
- d:\coding\UniformFlow\src\app\dashboard\customers\page.tsx (สร้างใหม่)
- d:\coding\UniformFlow\src\app\dashboard\layout.tsx (เพิ่ม link ลูกค้าใน NAV_ITEMS)

**Role:** Nova (Backend) + Stella (Frontend)

### UI Improvement (2026-04-27 23:08)
**สิ่งที่เปลี่ยน:**
- ลบฟิลด์ "ที่อยู่เต็มสำหรับเอกสาร" ออกจาก CustomerPicker
- ลูกค้าบอกไม่ได้ใช้ จึงลบออกเพื่อลดความซับซ้อน

**ไฟล์ที่แก้ไข:**
- d:\coding\UniformFlow\src\components\admin\CustomerPicker.tsx (ลบ textarea fullAddress)

**Role:** Stella (Frontend)
