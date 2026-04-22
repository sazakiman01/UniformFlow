# Best Practices

## 🚀 Performance Best Practices

### 1. Firebase Cloud Functions

#### Cold Start Optimization
```typescript
// ✅ Good - Initialize outside handler
const db = getFirestore();
const auth = getAuth();

export const createMaterial = onRequest(async (req, res) => {
  // Function body
});

// ❌ Bad - Initialize inside handler (causes cold start)
export const createMaterial = onRequest(async (req, res) => {
  const db = getFirestore();  // Initializes on every cold start
  // Function body
});
```

#### Memory Management
```typescript
// ✅ Good - Use streams for large payloads
export const processLargeFile = onCall(async (data) => {
  const stream = fs.createReadStream(data.filePath);
  // Process stream
});

// ❌ Bad - Load entire file into memory
export const processLargeFile = onCall(async (data) => {
  const fileContent = fs.readFileSync(data.filePath);  // Can cause OOM
});
```

#### Connection Pooling
```typescript
// ✅ Good - Reuse connections
const admin = require('firebase-admin');
admin.initializeApp();

export const handler = onRequest(async (req, res) => {
  // Use existing admin instance
});

// ❌ Bad - Create new connection
export const handler = onRequest(async (req, res) => {
  const admin = require('firebase-admin').initializeApp();  // New connection
});
```

### 2. Firestore Operations

#### Batch Operations
```typescript
// ✅ Good - Use batch for multiple writes
async function createMultipleMaterials(materials: Material[]) {
  const batch = db.batch();
  
  for (const material of materials) {
    const ref = db.collection('materials').doc();
    batch.set(ref, material);
  }
  
  await batch.commit();  // Single operation
}

// ❌ Bad - Individual writes
async function createMultipleMaterials(materials: Material[]) {
  for (const material of materials) {
    await db.collection('materials').add(material);  // Multiple round trips
  }
}
```

#### Query Optimization
```typescript
// ✅ Good - Limit and paginate
async function getMaterials(pageSize: number, lastDoc?: DocumentSnapshot) {
  let query = db.collection('materials')
    .orderBy('name')
    .limit(pageSize);
  
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  return query.get();
}

// ❌ Bad - No limit
async function getMaterials() {
  return db.collection('materials').get();  // Can return thousands of docs
}
```

#### Selective Field Retrieval
```typescript
// ✅ Good - Select only needed fields
async function getMaterialNames() {
  const snapshot = await db.collection('materials')
    .select('name', 'sku')  // Only these fields
    .get();
}

// ❌ Bad - Retrieve all fields
async function getMaterialNames() {
  const snapshot = await db.collection('materials').get();  // All fields
}
```

### 3. Frontend Performance

#### Code Splitting
```typescript
// ✅ Good - Lazy load routes
import { lazy } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports = lazy(() => import('./pages/Reports'));

// ❌ Bad - Load all routes upfront
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
```

#### Memoization
```typescript
// ✅ Good - Memoize expensive calculations
import { useMemo } from 'react';

function MaterialList({ materials }: { materials: Material[] }) {
  const sortedMaterials = useMemo(() => {
    return materials.sort((a, b) => a.name.localeCompare(b.name));
  }, [materials]);
  
  return <ul>{sortedMaterials.map(m => <li key={m.id}>{m.name}</li>)}</ul>;
}

// ❌ Bad - Recalculate on every render
function MaterialList({ materials }: { materials: Material[] }) {
  const sortedMaterials = materials.sort((a, b) => a.name.localeCompare(b.name));
  return <ul>{sortedMaterials.map(m => <li key={m.id}>{m.name}</li>)}</ul>;
}
```

#### Image Optimization
```typescript
// ✅ Good - Use Next.js Image or lazy loading
<img 
  src={material.image} 
  loading="lazy" 
  alt={material.name}
  width={300}
  height={200}
/>

// ❌ Bad - Load all images immediately
<img src={material.image} alt={material.name} />
```

## 🔒 Security Best Practices

### 1. Authentication & Authorization

#### Validate on Server
```typescript
// ✅ Good - Server-side validation
export const createMaterial = onRequest(async (req, res) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    return res.status(401).send('Unauthorized');
  }
  
  // Validate data
  const schema = z.object({
    name: z.string().min(1),
    quantity: z.number().min(0)
  });
  
  const data = schema.parse(req.body);
  // Create material...
});

// ❌ Bad - Client-side only validation
// Client validation can be bypassed
```

#### Role-Based Access Control
```typescript
// ✅ Good - Check user roles
async function checkUserRole(userId: string, requiredRole: string): Promise<boolean> {
  const userDoc = await db.collection('users').doc(userId).get();
  const user = userDoc.data();
  return user?.role === requiredRole;
}

export const adminFunction = onRequest(async (req, res) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user || !(await checkUserRole(user.uid, 'admin'))) {
    return res.status(403).send('Forbidden');
  }
  
  // Admin logic...
});
```

### 2. Firestore Security Rules

#### Least Privilege Principle
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public read, authenticated write
    match /materials/{materialId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Owner-only access
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
                      request.resource.data.customer_id == request.auth.uid;
      allow delete: if false;  // No delete
    }
    
    // Admin-only
    match /admin/{docId} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

### 3. Input Validation

#### Use Zod for Validation
```typescript
// ✅ Good - Schema validation with Zod
const createMaterialSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().min(0).max(10000),
  unit: z.enum(['m', 'kg', 'piece', 'dozen']),
  supplier: z.object({
    name: z.string().min(1),
    contact: z.string().regex(/^[0-9-]+$/)
  })
});

export const createMaterial = onRequest(async (req, res) => {
  try {
    const data = createMaterialSchema.parse(req.body);
    // Create material...
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input' });
  }
});
```

#### Sanitize User Input
```typescript
// ✅ Good - Sanitize input
import DOMPurify from 'dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}

// ❌ Bad - Trust user input
function processInput(input: string) {
  return input;  // Could contain XSS
}
```

## 🧪 Testing Best Practices

### 1. Unit Testing

#### Test Pure Functions
```typescript
// ✅ Good - Test pure functions
describe('calculateTotal', () => {
  it('should calculate total correctly', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 }
    ];
    const result = calculateTotal(items);
    expect(result).toBe(250);
  });
});

// ❌ Bad - Test functions with side effects
describe('createMaterial', () => {
  it('should create material', async () => {
    // This is integration test, not unit test
    await createMaterial(data);
  });
});
```

#### Mock External Dependencies
```typescript
// ✅ Good - Mock Firestore
import { mockFirestore } from '../test-utils';

describe('MaterialService', () => {
  it('should get material by id', async () => {
    const mockDb = mockFirestore();
    mockDb.collection('materials').doc('123').get.mockResolvedValue({
      data: () => ({ name: 'Cotton' })
    });
    
    const service = new MaterialService(mockDb);
    const result = await service.getById('123');
    expect(result.name).toBe('Cotton');
  });
});
```

### 2. Integration Testing

#### Use Firebase Emulator
```typescript
// ✅ Good - Test with emulator
describe('Stock Transaction', () => {
  let db: Firestore;
  
  beforeAll(async () => {
    // Connect to emulator
    db = getFirestore();
    // Seed test data
  });
  
  afterAll(async () => {
    // Cleanup
    await clearDatabase();
  });
  
  it('should deduct stock correctly', async () => {
    await deductStock('material123', 10);
    const material = await getMaterial('material123');
    expect(material.quantity).toBe(90);
  });
});
```

### 3. E2E Testing

#### Test Critical User Flows
```typescript
// e2e/material-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Material Management', () => {
  test('should create and view material', async ({ page }) => {
    await page.goto('/app/materials');
    await page.click('button:has-text("Add Material")');
    await page.fill('input[name="name"]', 'Cotton');
    await page.fill('input[name="quantity"]', '100');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=Cotton')).toBeVisible();
    await expect(page.locator('text=100')).toBeVisible();
  });
});
```

## 📊 Monitoring & Logging

### 1. Structured Logging
```typescript
// ✅ Good - Structured logging
import { logger } from 'firebase-functions/logger';

export const createMaterial = onRequest(async (req, res) => {
  logger.info('Creating material', { 
    name: req.body.name,
    userId: req.auth?.uid 
  });
  
  try {
    const material = await MaterialService.create(req.body);
    logger.info('Material created successfully', { materialId: material.id });
    res.json(material);
  } catch (error) {
    logger.error('Failed to create material', { error });
    res.status(500).send('Internal error');
  }
});

// ❌ Bad - Unstructured logging
console.log('Creating material');
console.log(error);
```

### 2. Error Tracking
```typescript
// ✅ Good - Track errors with context
export const processOrder = onRequest(async (req, res) => {
  try {
    const result = await OrderService.process(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Order processing failed', {
      error: error.message,
      orderId: req.body.id,
      userId: req.auth?.uid
    });
    
    // Send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      await sendToErrorTracking(error, { orderId: req.body.id });
    }
    
    res.status(500).send('Internal error');
  }
});
```

### 3. Performance Monitoring
```typescript
// ✅ Good - Track performance
export const heavyOperation = onRequest(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const result = await performHeavyOperation(req.body);
    const duration = Date.now() - startTime;
    
    logger.info('Operation completed', { 
      duration,
      operation: 'heavyOperation' 
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Operation failed', { error });
    res.status(500).send('Internal error');
  }
});
```

## 🔄 State Management Best Practices

### 1. Zustand Store Pattern
```typescript
// ✅ Good - Simple, focused stores
interface MaterialStore {
  materials: Material[];
  loading: boolean;
  error: Error | null;
  
  fetchMaterials: () => Promise<void>;
  addMaterial: (material: Material) => void;
  updateMaterial: (id: string, material: Partial<Material>) => void;
}

export const useMaterialStore = create<MaterialStore>((set) => ({
  materials: [],
  loading: false,
  error: null,
  
  fetchMaterials: async () => {
    set({ loading: true, error: null });
    try {
      const materials = await MaterialService.getAll();
      set({ materials, loading: false });
    } catch (error) {
      set({ error: error as Error, loading: false });
    }
  },
  
  addMaterial: (material) => {
    set((state) => ({ materials: [...state.materials, material] }));
  },
  
  updateMaterial: (id, updates) => {
    set((state) => ({
      materials: state.materials.map((m) => 
        m.id === id ? { ...m, ...updates } : m
      )
    }));
  }
}));

// ❌ Bad - Giant store with everything
interface AppStore {
  materials: Material[];
  orders: Order[];
  users: User[];
  // ... 50 more fields
}
```

### 2. Server State with TanStack Query
```typescript
// ✅ Good - Use TanStack Query for server state
function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: MaterialService.getAll,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 10 * 60 * 1000  // 10 minutes
  });
}

// ✅ Good - Mutations with invalidation
function useCreateMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: MaterialService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    }
  });
}

// ❌ Bad - Manual state management for server data
function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    MaterialService.getAll().then(setMaterials).finally(() => setLoading(false));
  }, []);
  
  return { materials, loading };
}
```

## 🎯 Code Organization Best Practices

### 1. Feature-Based Organization
```
src/
├── features/
│   ├── materials/
│   │   ├── MaterialList.tsx
│   │   ├── MaterialForm.tsx
│   │   ├── useMaterials.ts
│   │   └── material.service.ts
│   └── orders/
│       ├── OrderList.tsx
│       ├── OrderForm.tsx
│       └── useOrders.ts
```

### 2. Barrel Exports
```typescript
// services/index.ts
export { MaterialService } from './material.service';
export { OrderService } from './order.service';
export { StockService } from './stock.service';

// Use elsewhere
import { MaterialService, OrderService } from '@/services';
```

### 3. Type Exports
```typescript
// models/material.model.ts
export interface Material {
  id: string;
  name: string;
  quantity: number;
}

export type CreateMaterialDTO = Omit<Material, 'id' | 'created_at' | 'updated_at'>;
export type UpdateMaterialDTO = Partial<CreateMaterialDTO>;
```

## 🚨 Error Handling Best Practices

### 1. Custom Error Classes
```typescript
export class MaterialNotFoundError extends Error {
  constructor(materialId: string) {
    super(`Material not found: ${materialId}`);
    this.name = 'MaterialNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(materialId: string, requested: number, available: number) {
    super(`Insufficient stock: requested ${requested}, available ${available}`);
    this.name = 'InsufficientStockError';
  }
}
```

### 2. Error Boundaries (React)
```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

### 3. Global Error Handler
```typescript
// functions/src/index.ts
export const app = express();

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});
```

## 📝 Documentation Best Practices

### 1. JSDoc Comments
```typescript
/**
 * Creates a new material in the database
 * @param data - Material data to create
 * @returns Promise resolving to created material
 * @throws MaterialNotFoundError if material already exists
 * @example
 * ```ts
 * const material = await MaterialService.create({
 *   name: 'Cotton',
 *   quantity: 100,
 *   unit: 'm'
 * });
 * ```
 */
async create(data: CreateMaterialDTO): Promise<Material> {
  // Implementation
}
```

### 2. README for Each Module
```markdown
# Material Service

Handles all material-related operations.

## Functions

- `create(data)` - Create new material
- `update(id, data)` - Update existing material
- `delete(id)` - Soft delete material
- `getAll()` - Get all materials with pagination
```

### 3. API Documentation
```typescript
/**
 * @swagger
 * /api/materials:
 *   post:
 *     summary: Create a new material
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Material created successfully
 */
```

## 🎨 UI/UX Best Practices

### 1. Loading States
```typescript
// ✅ Good - Show loading state
function MaterialList() {
  const { data: materials, isLoading } = useMaterials();
  
  if (isLoading) {
    return <Spinner />;
  }
  
  return <ul>{materials?.map(m => <li key={m.id}>{m.name}</li>)}</ul>;
}
```

### 2. Error States
```typescript
// ✅ Good - Show error state
function MaterialList() {
  const { data: materials, isLoading, error } = useMaterials();
  
  if (error) {
    return <ErrorMessage message={error.message} />;
  }
  
  if (isLoading) {
    return <Spinner />;
  }
  
  return <ul>{materials?.map(m => <li key={m.id}>{m.name}</li>)}</ul>;
}
```

### 3. Empty States
```typescript
// ✅ Good - Show empty state
function MaterialList() {
  const { data: materials, isLoading } = useMaterials();
  
  if (isLoading) {
    return <Spinner />;
  }
  
  if (!materials || materials.length === 0) {
    return <EmptyState message="No materials found" />;
  }
  
  return <ul>{materials.map(m => <li key={m.id}>{m.name}</li>)}</ul>;
}
```

---
*อัปเดตเมื่อ: 2026-04-21*
