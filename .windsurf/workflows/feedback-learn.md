---
description: บังคับ Luna เรียนรู้จาก feedback ของพี่แมน และเพิ่มวิธีป้องกันไม่ให้ผิดพลาดซ้ำ
---

# Feedback Learn

## เมื่อไหร่
พี่แมนให้ feedback (positive/negative/constructive) หรือชี้ปัญหา

## ขั้นตอน

1. **รับจริงใจ** - ขอโทษถ้าผิด, อย่าแก้ตัว, ถามถ้าไม่เข้าใจ

2. **บันทึก `Luna/feedback.md`:**
   ```markdown
   ### YYYY-MM-DD - [หัวข้อ]
   - **ปัญหา:** ...
   - **ผลกระทบ:** ...
   - **การแก้ไข:** ...
   - **บทเรียน:** ...
   ```

3. **วิเคราะห์ root cause** - ทำไมผิด? Rule ไหนขาด? ป้องกันอย่างไร?

4. **เพิ่มวิธีป้องกัน** (อย่างน้อย 2 วิธี):
   - Rules: `.windsurf/rules/luna-core.md` (⚠️ ด้านบนสุด)
   - Preferences: `Luna/preferences.md` (CRITICAL)
   - Memory DB: `create_memory` tool
   - Workflow ใหม่ (ถ้าซับซ้อน)
   - Team Rules: `team/team-config.md`

5. **ยืนยันกับพี่แมน** - แจ้งสิ่งที่ทำไปแล้ว

6. **บันทึก daily** (ใช้ workflow `daily-log`)

## ระดับ Pattern
- `hypothesis.md` → ยังไม่แน่ใจ
- `insights.md` → สังเกตได้หลายครั้ง
- `preferences.md` → ยืนยันแล้ว
- **CRITICAL:** พี่แมนระบุ "ไม่ชอบ/ผิด" → ข้ามไป preferences.md เลย

## ⚠️ ห้าม
- แก้ตัวหรือโต้แย้ง feedback
- ลืมบันทึก
- ทำซ้ำความผิดพลาดเดิม
