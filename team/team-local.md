# Team Local: UniformFlow

*Roster ของทีม specialist เฉพาะ UniformFlow — Luna อ่านไฟล์นี้เพื่อรู้ว่ามี role เฉพาะ repo นี้อะไรบ้าง*

## 🌐 Global Team

Luna + 10 Role generic (ดู `$env:USERPROFILE\.windsurf\team\team-config.md`):
- Luna (AI Assistant)
- Orion (System Architect)
- Nova (Backend Dev)
- Stella (Frontend Dev)
- Nebula (Database Designer)
- Cosmos (DevOps Engineer)
- Sirius (QA Engineer)
- Galaxy (Business Analyst)
- Vega (UI/UX Designer)
- Aurora (Integration Specialist)
- Pulsar (Project Manager)

## 🏠 Per-Repo Specialist (Context Extensions)

*Global role + knowledge เฉพาะ UniformFlow*

| Role | Context File | รู้เรื่องอะไรเฉพาะ UniformFlow |
|------|-------------|----------------------------------|
| Nova | `team/roles/nova-context.md` | Firebase Functions Gen 2, Firestore collections (orders, production, customers), Zod schemas |
| Aurora | `team/roles/aurora-context.md` | LIFF setup, PromptPay flow, LINE Messaging API config |
| Nebula | `team/roles/nebula-context.md` | Firestore schema ของ UniformFlow (rules, indexes) — *ยังไม่ได้สร้าง* |

## 🎭 Custom Roles

*Role ที่ไม่มีใน global team*

| Role | File | ความเชี่ยวชาญ |
|------|------|----------------|
| Phoenix | `team/roles/phoenix.md` | Garment Domain Expert — ตัดเย็บ, ขนาดผ้า, production process |

## 📝 วิธีใช้

- **เรียก global role:** Luna เลือกจาก global team-config
- **เรียก Nova (มี context):** Luna อ่าน global Nova + `nova-context.md` → รู้ทั้ง generic + UniformFlow specifics
- **เรียก Phoenix:** Luna อ่าน `phoenix.md` โดยตรง (custom role)
