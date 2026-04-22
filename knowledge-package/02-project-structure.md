# Project Structure

## 📁 Root Directory Structure

```
project-root/
├── packages/              # Monorepo packages
│   ├── functions/        # Firebase Cloud Functions (Gen 2)
│   ├── web/              # React + Vite Frontend
│   └── shared/           # Shared types & utilities
│
├── docs/                 # Project documentation
├── requirements/         # Customer requirements
├── .windsurf/            # Workflows & AI rules
├── .github/              # GitHub workflows
├── .husky/               # Git hooks
│
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── .firebaserc           # Firebase project aliases
│
├── tsconfig.json         # Root TypeScript config
├── tsconfig.base.json    # Base TypeScript config
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier configuration
├── .prettierignore       # Prettier ignore patterns
│
├── package.json          # Root package.json
├── pnpm-workspace.yaml   # pnpm workspace config
├── pnpm-lock.yaml        # pnpm lock file
│
├── .gitignore            # Git ignore patterns
├── .nvmrc                # Node version specification
├── .npmrc                # npm configuration
│
└── README.md             # Project README
```

## 📦 Package: functions/ (Cloud Functions)

### Directory Structure
```
packages/functions/
├── src/
│   ├── functions/        # Cloud Function entry points
│   │   ├── http/        # HTTP triggers
│   │   │   ├── materials.ts
│   │   │   └── stock.ts
│   │   ├── firestore/  # Firestore triggers
│   │   │   └── onMaterialChange.ts
│   │   └── scheduled/   # Scheduled functions
│   │       └── dailyReport.ts
│   │
│   ├── services/         # Business logic layer
│   │   ├── material.service.ts
│   │   ├── stock.service.ts
│   │   └── bom.service.ts
│   │
│   ├── models/           # Data models & interfaces
│   │   ├── material.model.ts
│   │   ├── stock-transaction.model.ts
│   │   └── bom.model.ts
│   │
│   ├── utils/            # Pure helper functions
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   │
│   └── scripts/          # Utility scripts
│       ├── seed.ts       # Database seeding
│       └── migrate.ts   # Data migration
│
├── __tests__/            # Test files
│   ├── services/
│   └── rules/
│
├── dist/                 # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── esbuild.config.js     # Build configuration
```

### Key Files

#### package.json
```json
{
  "name": "@project/functions",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "bundle": "esbuild src/index.ts --bundle --platform=node",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "test": "jest --runInBand",
    "seed": "tsx src/scripts/seed.ts"
  },
  "dependencies": {
    "@project/shared": "workspace:*",
    "firebase-admin": "^13.8.0",
    "firebase-functions": "^7.2.0",
    "zod": "^3.22.4"
  }
}
```

#### tsconfig.json
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

## 📦 Package: web/ (React Frontend)

### Directory Structure
```
packages/web/
├── src/
│   ├── components/       # React components
│   │   ├── ui/         # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── input.tsx
│   │   └── features/   # Feature-specific components
│   │       ├── materials/
│   │       └── stock/
│   │
│   ├── pages/           # Page components
│   │   ├── app/        # Worker app (mobile-first)
│   │   │   ├── StockIn.tsx
│   │   │   ├── StockOut.tsx
│   │   │   └── QuickLookup.tsx
│   │   └── dashboard/  # Dashboard (responsive)
│   │       ├── Overview.tsx
│   │       ├── Reports.tsx
│   │       └── Settings.tsx
│   │
│   ├── hooks/           # Custom React hooks
│   │   ├── useMaterials.ts
│   │   ├── useStock.ts
│   │   └── useAuth.ts
│   │
│   ├── services/         # API services
│   │   ├── api.ts       # Axios/Fetch wrapper
│   │   ├── material.service.ts
│   │   └── auth.service.ts
│   │
│   ├── stores/          # Zustand stores
│   │   ├── auth.store.ts
│   │   └── ui.store.ts
│   │
│   ├── types/           # TypeScript types
│   │   ├── material.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/           # Utility functions
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Entry point
│   └── vite-env.d.ts    # Vite type definitions
│
├── public/              # Static assets
│   ├── favicon.ico
│   └── manifest.json    # PWA manifest
│
├── e2e/                 # Playwright E2E tests
│   ├── materials.spec.ts
│   └── stock.spec.ts
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── index.html
```

### Key Files

#### package.json
```json
{
  "name": "@project/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@project/shared": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.5.0",
    "firebase": "^10.7.0",
    "zod": "^3.22.4"
  }
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'App Name',
        short_name: 'App',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
});
```

## 📦 Package: shared/ (Shared Code)

### Directory Structure
```
packages/shared/
├── src/
│   ├── types/           # Shared TypeScript types
│   │   ├── material.types.ts
│   │   ├── stock.types.ts
│   │   └── common.types.ts
│   │
│   ├── constants/       # Shared constants
│   │   ├── errors.ts
│   │   └── validation.ts
│   │
│   └── utils/           # Shared utilities
│       ├── date.ts
│       └── string.ts
│
├── package.json
└── tsconfig.json
```

### Key Files

#### package.json
```json
{
  "name": "@project/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {}
}
```

## 📁 Documentation Structure

```
docs/
├── architecture/
│   ├── system-design.md
│   └── data-flow.md
├── api/
│   ├── endpoints.md
│   └── authentication.md
├── deployment/
│   ├── firebase.md
│   └── ci-cd.md
└── development/
    ├── setup.md
    └── testing.md
```

## 📁 Configuration Files

### Root Configuration Files

#### tsconfig.json
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "composite": true
  },
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/functions" },
    { "path": "./packages/web" }
  ]
}
```

#### tsconfig.base.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

#### .eslintrc.json
```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": true
  },
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

#### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
```

## 🎯 File Naming Conventions

### Backend (functions/)
- **Functions:** kebab-case (e.g., `material.service.ts`, `stock-transaction.model.ts`)
- **Classes:** PascalCase (e.g., `MaterialService`, `StockValidator`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `MAX_QUANTITY`, `DEFAULT_PAGE_SIZE`)
- **Private methods:** prefix with `_` (e.g., `_validateQuantity()`)

### Frontend (web/)
- **Components:** PascalCase (e.g., `MaterialCard.tsx`, `StockForm.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useMaterials.ts`, `useAuth.ts`)
- **Pages:** PascalCase (e.g., `StockIn.tsx`, `DashboardOverview.tsx`)
- **Utils:** camelCase (e.g., `formatDate.ts`, `validateForm.ts`)

### Shared (shared/)
- **Types:** camelCase with `.types.ts` suffix (e.g., `material.types.ts`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `API_ERRORS.ts`)
- **Utils:** camelCase (e.g., `dateUtils.ts`)

## 📝 Best Practices for File Organization

### 1. Keep Related Files Together
Group files by feature rather than by type:
```
✅ Good:
src/
├── features/
│   └── materials/
│       ├── MaterialList.tsx
│       ├── MaterialForm.tsx
│       └── useMaterials.ts

❌ Bad:
src/
├── components/
│   └── MaterialList.tsx
├── hooks/
│   └── useMaterials.ts
└── forms/
    └── MaterialForm.tsx
```

### 2. Use Index Files for Barrel Exports
```typescript
// services/index.ts
export { MaterialService } from './material.service';
export { StockService } from './stock.service';
```

### 3. Separate Test Files
Keep test files in `__tests__` directory or co-locate with source files:
```
src/
├── services/
│   ├── material.service.ts
│   └── material.service.test.ts  # or
└── __tests__/
    └── services/
        └── material.service.test.ts
```

### 4. Use Absolute Imports
Configure TypeScript to support absolute imports:
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["packages/shared/src/*"]
    }
  }
}
```

---
*อัปเดตเมื่อ: 2026-04-21*
