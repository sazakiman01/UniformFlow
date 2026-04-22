# Tech Stack & Architecture

## 📋 Tech Stack Overview

### Backend Stack

#### Runtime & Language
- **Node.js:** >= 22.0.0 (LTS)
- **TypeScript:** 5.3.3+ (strict mode enabled)
- **Package Manager:** pnpm >= 8.0.0 (for monorepo workspaces)

#### Cloud Platform
- **Firebase Cloud Functions:** Gen 2
  - รองรับ HTTP triggers
  - รองรับ Firestore triggers
  - รองรับ Scheduled triggers
  - Scalable automatically

#### Database
- **Cloud Firestore:** NoSQL document database
  - Real-time sync
  - Offline support
  - Automatic scaling
  - Strong consistency

#### SDK & Libraries
- **Firebase Admin SDK:** 13.8.0+
  - สำหรับ server-side operations
  - Full admin privileges
  - Transaction support

- **Zod:** 3.22.4+
  - Schema validation
  - Runtime type checking
  - TypeScript inference

### Frontend Stack

#### Framework & Build Tool
- **React:** 18.2.0+
- **Vite:** 5.0.11+ (fast HMR, optimized builds)
- **TypeScript:** 5.3.3+ (strict mode)

#### UI & Styling
- **Tailwind CSS:** 3.4.0+ (utility-first CSS)
- **shadcn/ui:** Component library built on Radix UI
- **Lucide React:** Icon library

#### State Management & Data Fetching
- **Zustand:** 4.5.0+ (lightweight state management)
- **TanStack Query:** 5.17.0+ (server state management, caching)
- **React Hook Form:** 7.49.0+ (form handling)
- **Zod:** 3.22.4+ (validation via @hookform/resolvers)

#### Routing
- **React Router DOM:** 6.21.0+ (client-side routing)

#### PWA & Offline
- **vite-plugin-pwa:** 0.17.4+ (PWA support)
- **Service Worker:** Auto-generated
- **Offline-first architecture**

#### Special Libraries
- **html5-qrcode:** 2.3.8+ (QR/Barcode scanning)
- **recharts:** 2.10.0+ (data visualization)
- **date-fns:** 3.3.0+ (date manipulation)

#### Testing
- **Playwright:** 1.48.0+ (E2E testing)
- **Jest:** 29.5.0+ (unit testing for backend)

### Development Tools

#### Code Quality
- **ESLint:** 8.56.0+
  - @typescript-eslint/eslint-plugin
  - @typescript-eslint/parser
  - Custom rules for TypeScript

- **Prettier:** 3.2.4+ (code formatting)
  - Consistent code style
  - Auto-format on save

#### Git Hooks
- **Husky:** 9.1.6+ (Git hooks)
- **lint-staged:** 15.2.10+ (run linters on staged files)

#### Type Checking
- **TypeScript:** 5.3.3+ (strict mode)
  - `strict: true`
  - `noImplicitAny: true`
  - `strictNullChecks: true`
  - `strictFunctionTypes: true`

#### Firebase Tools
- **firebase-tools:** 13.0.0+ (Firebase CLI)
  - Local emulator support
  - Deployment management
  - Firestore rules testing

## 🏗️ Architecture

### Monorepo Structure

```
project-root/
├── packages/
│   ├── functions/          # Cloud Functions (Gen 2)
│   │   ├── src/
│   │   │   ├── functions/  # HTTP/Trigger entry points
│   │   │   ├── services/   # Business logic
│   │   │   ├── models/     # TypeScript interfaces
│   │   │   ├── utils/      # Helper functions
│   │   │   └── scripts/    # Seed/maintenance scripts
│   │   ├── dist/           # Compiled output
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                # React + Vite Frontend
│   │   ├── src/
│   │   │   ├── components/ # React components
│   │   │   ├── pages/      # Page components
│   │   │   ├── hooks/      # Custom hooks
│   │   │   ├── services/   # API calls
│   │   │   ├── stores/     # Zustand stores
│   │   │   ├── types/      # TypeScript types
│   │   │   └── utils/      # Helper functions
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── shared/             # Shared code
│       ├── src/
│       │   ├── types/      # Shared types
│       │   ├── constants/  # Shared constants
│       │   └── utils/      # Shared utilities
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                   # Documentation
├── .windsurf/              # Workflows & rules
├── firebase.json           # Firebase config
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
├── .firebaserc             # Firebase project config
├── tsconfig.json           # Root TypeScript config
├── tsconfig.base.json      # Base TypeScript config
├── .eslintrc.json          # ESLint config
├── .prettierrc             # Prettier config
├── package.json            # Root package.json
├── pnpm-workspace.yaml      # pnpm workspace config
└── .gitignore
```

### Modular Architecture Pattern

#### Backend (functions/)
```
src/
├── functions/              # Entry points
│   ├── http/              # HTTP triggers
│   │   └── materials.ts
│   ├── firestore/        # Firestore triggers
│   │   └── stock.ts
│   └── scheduled/         # Scheduled functions
│       └── daily-report.ts
│
├── services/              # Business logic
│   ├── material.service.ts
│   ├── stock.service.ts
│   └── bom.service.ts
│
├── models/                # Data models
│   ├── material.model.ts
│   ├── stock-transaction.model.ts
│   └── bom.model.ts
│
└── utils/                 # Pure functions
    ├── validators.ts
    └── formatters.ts
```

#### Frontend (web/)
```
src/
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── features/         # Feature-specific components
│
├── pages/                 # Page components
│   ├── app/              # Worker app (mobile-first)
│   └── dashboard/        # Dashboard (responsive)
│
├── hooks/                # Custom hooks
│   ├── useMaterials.ts
│   └── useStock.ts
│
├── services/             # API services
│   ├── api.ts           # Axios/Fetch wrapper
│   └── material.service.ts
│
├── stores/               # State management
│   └── auth.store.ts
│
└── types/                # TypeScript types
    └── material.types.ts
```

### Key Architectural Principles

#### 1. TypeScript Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

#### 2. Interface-First Design
กำหนด interface ชัดเจนสำหรับทุก Firestore document model:
```typescript
// models/material.model.ts
export interface Material {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit: 'm' | 'kg' | 'piece';
  category: string;
  cost_per_unit: number;
  reorder_point: number;
  location: string;
  supplier: Supplier;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

#### 3. Service Layer Pattern
แยก business logic ออกจาก function entry points:
```typescript
// services/material.service.ts
export const MaterialService = {
  async create(data: CreateMaterialDTO): Promise<Material> {
    // Validation
    // Business logic
    // Firestore operation
  },
  
  async update(id: string, data: UpdateMaterialDTO): Promise<Material> {
    // Validation
    // Business logic
    // Firestore operation
  }
};

// functions/http/materials.ts
export const createMaterial = onRequest(async (req, res) => {
  const result = await MaterialService.create(req.body);
  res.json(result);
});
```

#### 4. Transaction Pattern for Critical Operations
การอัปเดตสต็อกวิกฤตต้องใช้ transactions:
```typescript
export async function deductStock(
  materialId: string,
  quantity: number
): Promise<void> {
  await db.runTransaction(async (transaction) => {
    const materialRef = db.collection('materials').doc(materialId);
    const materialDoc = await transaction.get(materialRef);
    
    if (!materialDoc.exists) {
      throw new Error('Material not found');
    }
    
    const currentQuantity = materialDoc.data()?.quantity || 0;
    const newQuantity = currentQuantity - quantity;
    
    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }
    
    transaction.update(materialRef, { quantity: newQuantity });
    
    // Create transaction record
    const transactionRef = db.collection('stock_transactions').doc();
    transaction.set(transactionRef, {
      material_id: materialId,
      type: 'out',
      quantity: -quantity,
      created_at: Timestamp.now()
    });
  });
}
```

#### 5. Separation of Concerns
- **Functions:** Entry points only (HTTP, triggers, scheduled)
- **Services:** Business logic and data operations
- **Models:** Type definitions and interfaces
- **Utils:** Pure functions without side effects

## 🔄 Data Flow

### Request Flow (HTTP)
```
Client Request
  → Cloud Function (functions/http/*.ts)
    → Service Layer (services/*.ts)
      → Firestore Operations
      → Validation (Zod)
      → Business Logic
    → Response
```

### Event Flow (Firestore Trigger)
```
Firestore Event
  → Cloud Function Trigger (functions/firestore/*.ts)
    → Service Layer
      → Business Logic
      → Side Effects (notifications, etc.)
```

### Frontend Data Flow
```
Component
  → Custom Hook (hooks/*.ts)
    → TanStack Query (caching, refetching)
      → API Service (services/*.ts)
        → Cloud Function HTTP endpoint
```

## 🎯 Why This Architecture?

### Benefits

1. **Type Safety:** TypeScript strict mode catches errors at compile time
2. **Scalability:** Monorepo allows easy addition of new packages
3. **Maintainability:** Clear separation of concerns makes code easier to maintain
4. **Reusability:** Shared package reduces code duplication
5. **Testability:** Modular structure enables unit and integration testing
6. **Performance:** TanStack Query provides efficient caching and data synchronization

### Trade-offs

1. **Complexity:** Monorepo adds initial setup complexity
2. **Build Time:** TypeScript compilation across packages can be slower
3. **Learning Curve:** Team needs to understand monorepo patterns

## 📦 Deployment Strategy

### Backend (Cloud Functions)
```bash
pnpm --filter functions build
firebase deploy --only functions
```

### Frontend (Hosting)
```bash
pnpm --filter web build
firebase deploy --only hosting
```

### CI/CD Pipeline
```yaml
# Example GitHub Actions
- pnpm install
- pnpm typecheck
- pnpm lint
- pnpm test
- pnpm build
- firebase deploy
```

---
*อัปเดตเมื่อ: 2026-04-21*
