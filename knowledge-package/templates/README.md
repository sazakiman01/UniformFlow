# Templates

เทมเพลตสำหรับเริ่มโปรเจคใหม่โดยใช้ architecture และ best practices จาก UniformFlow

## 📁 เนื้อหาใน Templates

- **config/** - Configuration files (TypeScript, ESLint, Prettier, etc.)
- **firebase/** - Firebase configuration templates
- **package/** - package.json templates for different packages
- **scripts/** - Utility scripts

## 🚀 การใช้งาน

### 1. Copy Templates
คัดลอกไฟล์จาก templates ไปยังโปรเจคใหม่ของคุณ

### 2. Customize
แก้ไข configuration ตามความต้องการของโปรเจค

### 3. Install Dependencies
รัน `pnpm install` เพื่อติดตั้ง dependencies

## 📝 Templates ที่มี

### Configuration Templates
- `tsconfig.base.json` - Base TypeScript configuration
- `tsconfig.json` - Root TypeScript configuration
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `pnpm-workspace.yaml` - pnpm workspace configuration

### Firebase Templates
- `firebase.json` - Firebase configuration
- `firestore.rules` - Firestore security rules template
- `firestore.indexes.json` - Firestore indexes template

### Package Templates
- `package.root.json` - Root package.json template
- `package.functions.json` - Functions package.json template
- `package.web.json` - Web package.json template
- `package.shared.json` - Shared package.json template

---
*อัปเดตเมื่อ: 2026-04-21*
