# Coding Standards

## 🎯 General Principles

### 1. TypeScript First
- **ห้ามเขียน raw JavaScript** - ทุกไฟล์ต้องเป็น TypeScript
- **Strict mode enabled** - ไม่ใช้ `any` ถ้าไม่จำเป็น
- **Interface-first** - กำหนด interface ชัดเจนก่อนเขียน implementation

### 2. Type Safety
```typescript
// ✅ Good - Explicit typing
interface Material {
  id: string;
  name: string;
  quantity: number;
}

const material: Material = {
  id: '123',
  name: 'Cotton',
  quantity: 100
};

// ❌ Bad - Implicit typing
const material = {
  id: '123',
  name: 'Cotton',
  quantity: 100
};
```

### 3. Naming Conventions

#### Variables & Functions: camelCase
```typescript
const materialName = 'Cotton';
const totalQuantity = 100;

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

#### Classes & Interfaces: PascalCase
```typescript
class MaterialService {
  async create(data: CreateMaterialDTO): Promise<Material> {
    // implementation
  }
}

interface Material {
  id: string;
  name: string;
}
```

#### Constants: SCREAMING_SNAKE_CASE
```typescript
const MAX_QUANTITY = 1000;
const DEFAULT_PAGE_SIZE = 20;
const API_BASE_URL = 'https://api.example.com';
```

#### Private Members: Prefix with `_`
```typescript
class MaterialService {
  private _cache: Map<string, Material> = new Map();
  
  private _validateQuantity(quantity: number): boolean {
    return quantity > 0;
  }
}
```

### 4. File Naming

#### Backend (functions/)
- Services: `material.service.ts`
- Models: `material.model.ts`
- Utils: `date.utils.ts`
- Functions: `create-material.function.ts`

#### Frontend (web/)
- Components: `MaterialCard.tsx`
- Hooks: `useMaterials.ts`
- Pages: `StockIn.tsx`
- Types: `material.types.ts`

## 📝 Code Style

### 1. Formatting (Prettier)
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

### 2. Indentation
- Use **2 spaces** (not tabs)
- Consistent indentation throughout

### 3. Line Length
- Maximum **100 characters** per line
- Break long lines for readability

### 4. Semicolons
- **Always use semicolons**
```typescript
// ✅ Good
const name = 'John';

// ❌ Bad
const name = 'John'
```

## 🔧 TypeScript Best Practices

### 1. Interface vs Type

#### Use Interface for Objects
```typescript
// ✅ Good - Interface for object shapes
interface Material {
  id: string;
  name: string;
  quantity: number;
}

interface MaterialService {
  create(data: CreateMaterialDTO): Promise<Material>;
}
```

#### Use Type for Unions, Primitives, Tuples
```typescript
// ✅ Good - Type for unions
type MaterialStatus = 'active' | 'inactive' | 'discontinued';

// ✅ Good - Type for tuples
type Coordinate = [number, number];

// ✅ Good - Type for primitives
type ID = string;
```

### 2. Avoid `any`
```typescript
// ❌ Bad
function process(data: any) {
  return data.value;
}

// ✅ Good - Use unknown or generic
function process<T extends { value: unknown }>(data: T): unknown {
  return data.value;
}

// ✅ Better - Specific type
function process(data: { value: string }): string {
  return data.value;
}
```

### 3. Use Readonly for Immutable Data
```typescript
// ✅ Good
interface Material {
  readonly id: string;
  readonly created_at: Timestamp;
  name: string;
  quantity: number;
}

const material: Readonly<Material> = {
  id: '123',
  created_at: Timestamp.now(),
  name: 'Cotton',
  quantity: 100
};
```

### 4. Use Utility Types
```typescript
// Partial - Make all properties optional
type UpdateMaterialDTO = Partial<Material>;

// Pick - Select specific properties
type MaterialSummary = Pick<Material, 'id' | 'name' | 'quantity'>;

// Omit - Exclude specific properties
type CreateMaterialDTO = Omit<Material, 'id' | 'created_at' | 'updated_at'>;

// Record - Create object type with specific keys
type MaterialMap = Record<string, Material>;
```

## 🏗️ Function Design

### 1. Single Responsibility
```typescript
// ❌ Bad - Function does too much
async function processOrder(order: Order) {
  // Validate
  if (!order.items.length) throw new Error('Empty order');
  
  // Calculate total
  const total = order.items.reduce((sum, item) => sum + item.price, 0);
  
  // Create order
  const orderRef = await db.collection('orders').add(order);
  
  // Update stock
  for (const item of order.items) {
    await updateStock(item.materialId, -item.quantity);
  }
  
  // Send notification
  await sendNotification(order.customerId, 'Order created');
  
  return orderRef.id;
}

// ✅ Good - Separated concerns
async function processOrder(order: Order): Promise<string> {
  validateOrder(order);
  const orderId = await createOrder(order);
  await updateStockForOrder(order);
  await notifyCustomer(order.customerId);
  return orderId;
}

function validateOrder(order: Order): void {
  if (!order.items.length) throw new Error('Empty order');
}

async function createOrder(order: Order): Promise<string> {
  const orderRef = await db.collection('orders').add(order);
  return orderRef.id;
}

async function updateStockForOrder(order: Order): Promise<void> {
  for (const item of order.items) {
    await updateStock(item.materialId, -item.quantity);
  }
}

async function notifyCustomer(customerId: string): Promise<void> {
  await sendNotification(customerId, 'Order created');
}
```

### 2. Pure Functions
```typescript
// ✅ Good - Pure function (no side effects)
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad - Impure function (modifies external state)
let total = 0;
function addToTotal(price: number): void {
  total += price;
}
```

### 3. Error Handling
```typescript
// ✅ Good - Explicit error types
class MaterialNotFoundError extends Error {
  constructor(materialId: string) {
    super(`Material not found: ${materialId}`);
    this.name = 'MaterialNotFoundError';
  }
}

class InsufficientStockError extends Error {
  constructor(materialId: string, requested: number, available: number) {
    super(`Insufficient stock for ${materialId}: requested ${requested}, available ${available}`);
    this.name = 'InsufficientStockError';
  }
}

async function deductStock(materialId: string, quantity: number): Promise<void> {
  const material = await getMaterial(materialId);
  if (!material) {
    throw new MaterialNotFoundError(materialId);
  }
  
  if (material.quantity < quantity) {
    throw new InsufficientStockError(materialId, quantity, material.quantity);
  }
  
  // Update stock...
}
```

### 4. Async/Await
```typescript
// ✅ Good - Use async/await for readability
async function processMaterials(ids: string[]): Promise<Material[]> {
  const materials: Material[] = [];
  
  for (const id of ids) {
    const material = await getMaterial(id);
    materials.push(material);
  }
  
  return materials;
}

// ✅ Good - Use Promise.all for parallel operations
async function processMaterialsParallel(ids: string[]): Promise<Material[]> {
  const promises = ids.map(id => getMaterial(id));
  return Promise.all(promises);
}
```

## 🔥 Firestore Specific Patterns

### 1. Transaction Pattern
```typescript
// ✅ Good - Use transactions for critical operations
async function transferStock(
  fromMaterialId: string,
  toMaterialId: string,
  quantity: number
): Promise<void> {
  await db.runTransaction(async (transaction) => {
    const fromRef = db.collection('materials').doc(fromMaterialId);
    const toRef = db.collection('materials').doc(toMaterialId);
    
    const [fromDoc, toDoc] = await Promise.all([
      transaction.get(fromRef),
      transaction.get(toRef)
    ]);
    
    if (!fromDoc.exists || !toDoc.exists) {
      throw new Error('Material not found');
    }
    
    const fromQuantity = fromDoc.data()?.quantity || 0;
    const toQuantity = toDoc.data()?.quantity || 0;
    
    if (fromQuantity < quantity) {
      throw new Error('Insufficient stock');
    }
    
    transaction.update(fromRef, { quantity: fromQuantity - quantity });
    transaction.update(toRef, { quantity: toQuantity + quantity });
    
    // Create transaction record
    const transactionRef = db.collection('stock_transactions').doc();
    transaction.set(transactionRef, {
      from_material_id: fromMaterialId,
      to_material_id: toMaterialId,
      quantity,
      type: 'transfer',
      created_at: Timestamp.now()
    });
  });
}
```

### 2. Batch Operations
```typescript
// ✅ Good - Use batch for multiple writes
async function createMultipleMaterials(materials: CreateMaterialDTO[]): Promise<void> {
  const batch = db.batch();
  
  for (const material of materials) {
    const ref = db.collection('materials').doc();
    batch.set(ref, {
      ...material,
      id: ref.id,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });
  }
  
  await batch.commit();
}
```

### 3. Query Patterns
```typescript
// ✅ Good - Use cursor-based pagination
async function getMaterialsPaginated(
  pageSize: number,
  lastDoc?: DocumentSnapshot
): Promise<{ materials: Material[]; lastDoc: DocumentSnapshot }> {
  let query = db.collection('materials')
    .orderBy('name')
    .limit(pageSize);
  
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  const snapshot = await query.get();
  const materials = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Material));
  
  return {
    materials,
    lastDoc: snapshot.docs[snapshot.docs.length - 1]
  };
}
```

## 🎨 React Specific Patterns

### 1. Component Structure
```typescript
// ✅ Good - Clear component structure
interface MaterialCardProps {
  material: Material;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MaterialCard({ material, onEdit, onDelete }: MaterialCardProps) {
  const { data: stock } = useMaterialStock(material.id);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{material.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Quantity: {stock?.quantity || 0}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onEdit(material.id)}>Edit</Button>
        <Button variant="destructive" onClick={() => onDelete(material.id)}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 2. Custom Hooks
```typescript
// ✅ Good - Reusable custom hook
function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function loadMaterials() {
      try {
        setLoading(true);
        const data = await MaterialService.getAll();
        setMaterials(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    loadMaterials();
  }, []);
  
  return { materials, loading, error };
}
```

### 3. Form Handling
```typescript
// ✅ Good - Use react-hook-form with Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const materialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unit: z.enum(['m', 'kg', 'piece'])
});

type MaterialFormData = z.infer<typeof materialSchema>;

export function MaterialForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema)
  });
  
  const onSubmit = async (data: MaterialFormData) => {
    await MaterialService.create(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input type="number" {...register('quantity', { valueAsNumber: true })} />
      {errors.quantity && <span>{errors.quantity.message}</span>}
      
      <button type="submit">Create</button>
    </form>
  );
}
```

## 🧪 Testing Standards

### 1. Unit Tests
```typescript
// ✅ Good - Clear test structure
describe('MaterialService', () => {
  describe('create', () => {
    it('should create a new material', async () => {
      const data: CreateMaterialDTO = {
        name: 'Cotton',
        quantity: 100,
        unit: 'm'
      };
      
      const result = await MaterialService.create(data);
      
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(data.name);
      expect(result.quantity).toBe(data.quantity);
    });
    
    it('should throw error if name is empty', async () => {
      const data: CreateMaterialDTO = {
        name: '',
        quantity: 100,
        unit: 'm'
      };
      
      await expect(MaterialService.create(data)).rejects.toThrow();
    });
  });
});
```

### 2. Integration Tests
```typescript
// ✅ Good - Test with Firestore emulator
describe('Stock Transaction', () => {
  beforeAll(async () => {
    await seedDatabase();
  });
  
  afterAll(async () => {
    await clearDatabase();
  });
  
  it('should deduct stock correctly', async () => {
    const materialId = 'test-material';
    await MaterialService.create({ id: materialId, name: 'Test', quantity: 100 });
    
    await deductStock(materialId, 50);
    
    const material = await MaterialService.getById(materialId);
    expect(material.quantity).toBe(50);
  });
});
```

## 📋 Code Review Checklist

### Before Committing
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Prettier formatting applied
- [ ] All tests pass
- [ ] No `any` types (unless justified)
- [ ] Proper error handling
- [ ] No console.log in production code
- [ ] Sensitive data not committed
- [ ] Documentation updated if needed

### Code Review Points
- [ ] Code follows naming conventions
- [ ] Functions have single responsibility
- [ ] No code duplication
- [ ] Proper TypeScript types
- [ ] Error handling is appropriate
- [ ] Performance considerations
- [ ] Security considerations
- [ ] Test coverage adequate

---
*อัปเดตเมื่อ: 2026-04-21*
