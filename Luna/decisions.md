# Luna Decision Log - บันทึกการตัดสินใจสำคัญ

*ส่วนนี้บันทึกการตัดสินใจสำคัญ + ผลลัพธ์ เพื่อเรียนรู้จากความผิดพลาด*

## รูปแบบการบันทึก

```
### [YYYY-MM-DD] - [ชื่อการตัดสินใจ]

**Context:** สถานการณ์ที่ต้องตัดสินใจ
**Options:** ตัวเลือกที่มี
**Decision:** การตัดสินใจที่เลือก
**Reasoning:** เหตุผลที่เลือก
**ผลลัพธ์:** ผลที่เกิดขึ้น
**บทเรียน:** สิ่งที่เรียนรู้ (ถ้ามี)
```

## การตัดสินใจที่บันทึก

### 2026-04-22 - Windsurf Global Rules ต้องอยู่ที่ `.codeium/windsurf/memories/global_rules.md`

**Context:** เปิดแชทใหม่ใน UniformFlow แล้ว Cascade ตอบแทน Luna แม้จะตั้งค่า Luna rules ที่ `C:\Users\sansakritsuk\.windsurf\rules\luna-core.md`
**Options:**
1. ย้ายไฟล์ Luna rules ทั้งหมดไป `.codeium/windsurf/memories/` (แต่ผิด convention)
2. เติมเนื้อหา (ย่อ) ลงใน `global_rules.md` + pointer ให้อ่านไฟล์ละเอียดที่ `.windsurf/rules/*.md`
3. ใส่เต็มๆ ไม่ย่อ (อาจเกิน limit 6000 chars)

**Decision:** Option 2 — เขียน essential (persona + pattern + paths) ย่อลงใน `global_rules.md` + pointer
**Reasoning:**
- Windsurf โหลด global rules จาก `C:\Users\sansakritsuk\.codeium\windsurf\memories\global_rules.md` เท่านั้น
- ไฟล์ละเอียดที่ `.windsurf/rules/` ยังใช้เป็น reference ให้ Luna อ่านเพิ่มได้
- รักษา separation: essentials ใน global_rules.md, details ในไฟล์เฉพาะ

**ผลลัพธ์:** รอพี่แมนเปิดแชทใหม่ทดสอบ
**บทเรียน:**
- Windsurf global rules ≠ `~/.windsurf/rules/`
- Global rules มี char limit (~6,000) — ต้องย่อ
- ตรวจ memory DB ใน `.codeium/windsurf/memories/` มี artifact อื่นที่ Windsurf ใช้ด้วย



## การ Review การตัดสินใจ

- Review รายสัปดาห์/เดือน
- วิเคราะห์ว่าการตัดสินใจถูกต้องหรือไม่
- ใช้บทเรียนปรับปรุงการตัดสินใจในอนาคต

---
*อัปเดตล่าสุด: 2026-04-21*
