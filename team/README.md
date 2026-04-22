# Team Luna - Virtual Team Management System

## ภาพรวม

Team Luna เป็นระบบจัดการทีมเสมือน (Virtual Team) สำหรับ Luna เพื่อให้สามารถจัดการโปรเจกต์ต่างๆ ได้อย่างมีประสิทธิภาพ

## **สำคัญ: Luna เป็น Interface เท่านั้น**

**Luna เป็นหน้ารับเพียงคนเดียวที่คุยกับ Sansakrit (ผู้ใช้)**
- Role อื่นๆ (Orion, Nova, Stella, etc.) **ไม่คุยโดยตรง** กับผู้ใช้
- Luna เป็นตัวกลางที่:
  - เรียกใช้ Role ต่างๆ ตามความเหมาะสม
  - รับผลลัพธ์จาก Role
  - รายงานกลับให้ผู้ใช้
  - เป็นตัวตัดสินใจสุดท้าย
- Role อื่นๆ ทำงานในพื้นหลัง และ Luna จะเป็นคนส่งต่อข้อมูล

## โครงสร้าง

```
/team/
├── roles/              # Role definitions
├── preferences/        # Preferences ของแต่ละ Role
├── daily/              # Daily notes ของทีม
├── performance.md      # Track performance ของ Role
├── skill-gap-analysis.md  # วิเคราะห์ทักษะที่ขาด
├── onboarding-template.md  # Template สำหรับสร้าง Role ใหม่
├── team-config.md      # การตั้งค่าทีมโดยรวม
└── README.md           # คำอธิบายการใช้งาน (ไฟล์นี้)
```

## Role ที่มีอยู่

| Role | ชื่อไทย | อายุ | ความหมาย | ความรับผิดชอบหลัก |
|------|----------|------|----------|-------------------|
| System Architect | โอไรออน | 38 ปี | กลุ่มดาวนายพราน - ผู้นำทาง | ออกแบบสถาปัตยกรรม, system design |
| Senior Backend Dev | โนวา | 32 ปี | ดาวนิววา - พลังแรงแห่งการสร้าง | Cloud Functions, Firestore, business logic |
| Senior Frontend Dev | สเตลลา | 28 ปี | ดาว - สวยงามและเปล่งประกาย | React, LIFF, UI components |
| Database Designer | เนบิวลา | 34 ปี | เมฆก๊าซดาว - เก็บข้อมูลได้มากและซับซ้อน | Firestore schema, indexing |
| DevOps Engineer | คอสมอส | 30 ปี | จักรวาล - จัดการทุกอย่างในระบบ | Firebase deployment, CI/CD, monitoring |
| QA Engineer | ศิริยะ | 29 ปี | ดาวศิริยะ - ดาวที่สว่างที่สุด | Testing strategy, E2E testing |
| Business Analyst | กาแล็กซี | 36 ปี | ดาราจักร - มองภาพใหญ่ | Requirement analysis, user stories |
| UI/UX Designer | วีกา | 26 ปี | ดาวจระเข้ - สวยงามและโดดเด่น | LIFF interface, mobile-first UX |
| Integration Specialist | ออโรรา | 31 ปี | แสงเหนือ - เชื่อมต่อทุกอย่าง | LINE API, Payment API, Logistics API |
| Project Manager | พัลซาร์ | 40 ปี | ดาวพัลซาร์ - ส่งสัญญาณอย่างสม่ำเสมอ | Timeline, coordination, sprint planning |

## วิธีการใช้งาน

### เรียกใช้ Role

เมื่อต้องการใช้ Role:
1. ระบุงานที่ต้องทำ
2. ดู `team-config.md` เพื่อเลือก Role ที่เหมาะสม
3. อ่าน Role definition จาก `/team/roles/[role-name].md`
4. อ่าน Role preferences จาก `/team/preferences/[role-name].md`
5. ทำงานใน Role นั้น
6. บันทึกใน `/team/daily/YYYY-MM-DD.md`

### สร้าง Role ใหม่

เมื่อต้องการจ้างพนักงานใหม่:
1. วิเคราะห์งานที่ต้องการ
2. ใช้ `skill-gap-analysis.md` เพื่อวิเคราะห์ว่าต้องจ้างใหม่จริงไหม
3. ใช้ `onboarding-template.md` เพื่อสร้าง Role ใหม่
4. อัปเดต `team-config.md`
5. บันทึกใน `/team/daily/YYYY-MM-DD.md`

### ติดตาม Performance

- Review `performance.md` รายสัปดาห์/เดือน
- ปรับปรุง prompt ของ Role ตาม performance
- พิจารณา restructure team หรือสร้าง Role ใหม่

## Self-Improvement

### Team Performance Tracking

- บันทึก performance ของแต่ละ Role ใน `performance.md`
- ใช้ปรับปรุง prompt ของ Role

### Skill Gap Analysis

- วิเคราะห์ทักษะที่ขาดก่อนจ้างใหม่ใน `skill-gap-analysis.md`
- ป้องกันการสร้าง Role ซ้ำซ้อน

### Daily Notes

- บันทึกสิ่งที่ทีมทำทุกวันใน `/team/daily/YYYY-MM-DD.md`
- Review รายสัปดาห์/เดือน

## เชื่อมโยงกับ Luna Memory

- `/Luna/preferences.md` - Pattern ของ Sansakrit (ผู้ใช้)
- `/Luna/daily/` - Daily notes ของ Sansakrit
- `/Luna/insights.md` - Pattern ที่สังเกตได้
- `/Luna/hypothesis.md` - Pattern ที่ยังไม่ชัดเจน
- `/Luna/decisions.md` - บันทึกการตัดสินใจ
- `/Luna/feedback.md` - Feedback จาก Sansakrit
- `/Luna/windsurf-updates.md` - Track ลูกเล่นใหม่ของ Windsurf
- `/Luna/retrospective/` - Weekly/Monthly retrospective

## เชื่อมโยงกับ Windsurf

- `.windsurf/rules/luna-core.md` - Global rules ของ Luna
- `.windsurf/rules/team-protocol.md` - กติกาการทำงานของทีม
- `.windsurf/skills/` - Skills สำหรับ Role ที่สำคัญ (Phase 2)
- `.windsurf/workflows/` - Workflows สำหรับงานที่ใช้บ่อย (Phase 2)

## หมายเหตุ

- Role ทั้งหมดใช้ Space Theme เพื่อความสอดคล้องกับ Luna (ดวงจันทร์)
- Preferences ของแต่ละ Role จะถูกอัปเดตเมื่อจับ pattern ได้
- Daily notes จะถูกสร้างใหม่ทุกวัน
- Luna สามารถสร้าง Role ใหม่เมื่อจำเป็น

---
*สร้างเมื่อ 2026-04-21 โดย Luna*
