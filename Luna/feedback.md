# Luna Feedback Loop - Feedback จาก Sansakrit

*ส่วนนี้บันทึก feedback จาก Sansakrit (positive/negative) เพื่อปรับปรุง behavior ของ Luna*

## รูปแบบการบันทึก

```
### [YYYY-MM-DD] - [หัวข้อ]

**Feedback:** [ข้อความ feedback]
**ประเภท:** [positive/negative/constructive]
**บริบท:** สถานการณ์ที่เกิด
**การดำเนินการ:** สิ่งที่ Luna ปรับปรุง
**ผลลัพธ์:** ผลที่เกิดขึ้นหลังปรับปรุง
```

## Feedback ที่ได้รับ

### 2026-04-21 - ลืมทำตามรูปแบบการทำงาน
- **ปัญหา:** สรุป requirements โดยไม่เรียกทีมงาน (Galaxy) มาทำ
- **ผลกระทบ:** พี่แมนไม่พอใจ ถือเป็นงานบกพร่อง
- **การแก้ไข:**
  - เพิ่ม warning ด้านบนสุดใน luna-core.md
  - บันทึกใน preferences ว่าเป็น pattern สำคัญ
  - เช็ค pattern ก่อนทำงานทุกครั้ง
- **บทเรียน:** ต้องทำตามรูปแบบการทำงานเสมอ (เรียกทีม → รีวิว → เสนอ) ที่บันทึก

### 2026-04-22 - Luna ไม่ตอบเมื่อเปิดแชทใหม่ (Cascade ตอบแทน)

- **ปัญหา:** เปิดแชทใหม่ใน UniformFlow → Cascade แนะนำตัวเองแทน Luna
- **สาเหตุราก:** `C:\Users\sansakritsuk\.codeium\windsurf\memories\global_rules.md` เป็นไฟล์เปล่า 0 bytes — Windsurf โหลด global rules จากที่นี่ที่เดียว ไม่ใช่ `~/.windsurf/rules/`
- **การแก้ไข:**
  - เขียน Luna persona + critical pattern + paths ย่อ ลงใน `global_rules.md`
  - ใส่ pointer ให้ Luna อ่านไฟล์ละเอียดที่ `~/.windsurf/rules/*.md` เพิ่มเมื่อต้องการ
- **บทเรียน:**
  - Windsurf `.windsurf/rules/*.md` ที่ user level **ไม่ใช่** global — เป็น workspace-level เท่านั้น
  - Global rules ที่แท้จริง = `~/.codeium/windsurf/memories/global_rules.md` (ไฟล์เดียว, limit ~6,000 chars)
  - Memory DB ยังดึง memories เก่ามาช่วยได้ แต่ไม่ reliable สำหรับ persona anchor

## การใช้ Feedback

- Review feedback รายสัปดาห์
- ปรับปรุง behavior ของ Luna ตาม feedback
- บันทึก pattern ที่พบเข้า `insights.md` → `preferences.md`

---
*อัปเดตล่าสุด: 2026-04-21*
