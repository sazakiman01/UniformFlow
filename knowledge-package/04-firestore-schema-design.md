# Firestore Schema Design Patterns

## 🎯 Core Principles

### 1. Flat Structure
Firestore เป็น NoSQL document database ที่ออกแบบมาให้เก็บข้อมูลแบบ flat หลีกเลี่ยงการ nest subcollection ลึกเกิน 1 ชั้น

```typescript
// ✅ Good - Flat structure
materials/{materialId}
  {
    "id": "materialId",
    "name": "Cotton Fabric",
    "quantity": 100,
    "unit": "m",
    "category": "fabric",
    "cost_per_unit": 50,
    "supplier": {
      "name": "Supplier Co",
      "contact": "081-234-5678"
    }
  }

// ❌ Bad - Deep nesting
materials/{materialId}/batches/{batchId}/items/{itemId}
  {
    "name": "Cotton",
    "quantity": 10
  }
```

### 2. Denormalization for Read Performance
Firestore มี limit ในการ query และ join ข้อมูล ดังนั้นควร denormalize ข้อมูลที่ต้องอ่านบ่อย

```typescript
// ✅ Good - Denormalize for read performance
orders/{orderId}
  {
    "id": "orderId",
    "customer_name": "John Doe",  // Denormalized
    "customer_email": "john@example.com",  // Denormalized
    "items": [
      {
        "material_name": "Cotton Fabric",  // Denormalized
        "quantity": 10,
        "price": 500
      }
    ],
    "total": 5000
  }

// แม้ว่าจะมี customer collection แยก แต่ก็เก็บข้อมูล customer ใน order เพื่อลด query
customers/{customerId}
  {
    "id": "customerId",
    "name": "John Doe",
    "email": "john@example.com"
  }
```

### 3. Composite Keys for Relationships
ใช้ composite keys เพื่อสร้าง relationships ระหว่าง documents

```typescript
// ✅ Good - Composite keys
stock_transactions/{transactionId}
  {
    "id": "transactionId",
    "material_id": "material123",  // Foreign key
    "material_name": "Cotton Fabric",  // Denormalized
    "type": "in",
    "quantity": 100,
    "created_at": Timestamp.now()
  }

// Query ด้วย composite index
db.collection('stock_transactions')
  .where('material_id', '==', 'material123')
  .orderBy('created_at', 'desc')
```

## 📦 Collection Design Patterns

### Pattern 1: Master-Detail with Subcollections

```typescript
// ✅ Good - Master-detail pattern
orders/{orderId}
  {
    "id": "orderId",
    "customer_id": "customer123",
    "status": "pending",
    "total": 5000,
    "created_at": Timestamp.now()
  }

orders/{orderId}/items/{itemId}
  {
    "id": "itemId",
    "material_id": "material123",
    "quantity": 10,
    "price": 500
  }

// Query items for a specific order
db.collection('orders')
  .doc(orderId)
  .collection('items')
  .get()
```

### Pattern 2: Embedded Documents for Small Data

```typescript
// ✅ Good - Embed for small, rarely changing data
materials/{materialId}
  {
    "id": "materialId",
    "name": "Cotton Fabric",
    "quantity": 100,
    "supplier": {
      "id": "supplier123",
      "name": "Supplier Co",
      "contact": "081-234-5678"
    }
  }

// ❌ Bad - Separate collection for rarely accessed data
materials/{materialId}
  {
    "id": "materialId",
    "name": "Cotton Fabric",
    "supplier_id": "supplier123"
  }

suppliers/{supplierId}
  {
    "id": "supplierId",
    "name": "Supplier Co",
    "contact": "081-234-5678"
  }
```

### Pattern 3: Reference Collections for Large Data

```typescript
// ✅ Good - Reference for large, frequently changing data
orders/{orderId}
  {
    "id": "orderId",
    "customer_id": "customer123",
    "status": "pending",
    "created_at": Timestamp.now()
  }

// Use subcollection for items (can be many)
orders/{orderId}/items/{itemId}
  {
    "id": "itemId",
    "material_id": "material123",
    "quantity": 10
  }
```

## 🔑 Key Design Patterns

### 1. Timestamp Pattern
เก็บ timestamps สำหรับ tracking และ sorting

```typescript
interface Material {
  id: string;
  name: string;
  quantity: number;
  created_at: Timestamp;  // Creation time
  updated_at: Timestamp;  // Last update time
  deleted_at?: Timestamp;  // Soft delete
}
```

### 2. Status Pattern
ใช้ enum สำหรับ status เพื่อ consistency

```typescript
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  status: OrderStatus;
  created_at: Timestamp;
}
```

### 3. Version Pattern
ใช้สำหรับ tracking changes

```typescript
interface Material {
  id: string;
  name: string;
  quantity: number;
  version: number;  // Increment on each update
  updated_at: Timestamp;
}
```

### 4. Soft Delete Pattern
ไม่ลบข้อมูลจริง แต่ mark เป็น deleted

```typescript
interface Material {
  id: string;
  name: string;
  quantity: number;
  deleted_at?: Timestamp;  // Null if not deleted
}

// Query only non-deleted
db.collection('materials')
  .where('deleted_at', '==', null)
  .get()
```

## 📊 Schema Examples

### Materials Collection (Stock Management)

```typescript
interface Material {
  // Primary key
  id: string;
  
  // Core fields
  name: string;
  sku: string;
  barcode?: string;
  qr_code?: string;
  
  // Inventory
  quantity: number;
  unit: 'm' | 'kg' | 'piece' | 'dozen';
  reorder_point: number;
  location: string;
  
  // Classification
  category: string;
  subcategory?: string;
  
  // Supplier
  supplier: {
    id: string;
    name: string;
    contact: string;
    email?: string;
  };
  
  // Cost
  cost_per_unit: number;
  
  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at?: Timestamp;
}
```

### Stock Transactions Collection

```typescript
interface StockTransaction {
  // Primary key
  id: string;
  
  // Reference
  material_id: string;
  material_name: string;  // Denormalized
  
  // Transaction details
  type: 'in' | 'out' | 'adjust';
  quantity: number;  // Positive for in/out, can be negative for adjust
  
  // Reference fields
  reference?: string;  // PO number, GRN, etc.
  supplier_ref?: string;
  reason?: string;  // For adjustments
  
  // Metadata
  created_by: string;  // User ID
  created_at: Timestamp;
}
```

### BOM (Bill of Materials) Collection

```typescript
interface BOM {
  // Primary key
  id: string;
  
  // Product info
  name: string;
  product_code: string;
  description?: string;
  
  // Materials
  items: Array<{
    material_id: string;
    material_name: string;  // Denormalized
    quantity_per_unit: number;
    unit: string;
  }>;
  
  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Orders Collection

```typescript
interface Order {
  // Primary key
  id: string;
  
  // Customer info (denormalized)
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  
  // Order details
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  
  // Delivery
  delivery_address?: string;
  delivery_date?: Timestamp;
  
  // Payment
  payment_method: 'promptpay' | 'transfer' | 'cash';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_reference?: string;
  
  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Order items as subcollection
interface OrderItem {
  id: string;
  order_id: string;
  material_id: string;
  material_name: string;  // Denormalized
  quantity: number;
  price: number;
  subtotal: number;
}
```

## 🔍 Indexing Strategy

### Composite Indexes

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "stock_transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "material_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "created_at",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "customer_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "created_at",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

### Single Field Indexes
Firestore automatically creates single field indexes for all fields.

## ⚡ Performance Considerations

### 1. Limit Query Results
```typescript
// ✅ Good - Limit results
db.collection('materials')
  .limit(20)
  .get()

// ❌ Bad - No limit (can be expensive)
db.collection('materials')
  .get()
```

### 2. Use Cursor-based Pagination
```typescript
// ✅ Good - Cursor-based pagination
async function getMaterialsPaginated(pageSize: number, lastDoc?: DocumentSnapshot) {
  let query = db.collection('materials')
    .orderBy('name')
    .limit(pageSize);
  
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  return query.get();
}
```

### 3. Avoid Large Documents
Firestore limit document size to 1MB. Keep documents under 100KB for best performance.

```typescript
// ✅ Good - Use subcollections for large data
orders/{orderId}
  {
    "id": "orderId",
    "customer_name": "John Doe",
    "total": 5000
  }

orders/{orderId}/items/{itemId}
  {
    "material_name": "Cotton",
    "quantity": 10
  }

// ❌ Bad - Large document with embedded array
orders/{orderId}
  {
    "id": "orderId",
    "customer_name": "John Doe",
    "total": 5000,
    "items": [  // Can grow large
      { "material_name": "Cotton", "quantity": 10 },
      { "material_name": "Silk", "quantity": 5 },
      // ... 100 more items
    ]
  }
```

### 4. Batch Reads
```typescript
// ✅ Good - Batch reads
const materialIds = ['id1', 'id2', 'id3'];
const promises = materialIds.map(id => 
  db.collection('materials').doc(id).get()
);
const snapshots = await Promise.all(promises);

// ❌ Bad - Sequential reads
for (const id of materialIds) {
  const doc = await db.collection('materials').doc(id).get();
}
```

## 🔒 Security Rules

### Basic Rules Pattern

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Materials collection
    match /materials/{materialId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                       request.resource.data.quantity is number;
    }
    
    // Stock transactions
    match /stock_transactions/{transactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                      request.resource.data.quantity is number &&
                      request.resource.data.type in ['in', 'out', 'adjust'];
      allow update, delete: if false;  // Immutable
    }
    
    // Orders
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
                      request.resource.data.customer_id == request.auth.uid;
      allow delete: if false;  // Soft delete only
    }
    
    // Order items (subcollection)
    match /orders/{orderId}/items/{itemId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📝 Migration Strategy

### Schema Versioning
```typescript
interface Document {
  schema_version: number;
  // ... other fields
}

// Migration function
async function migrateDocument(doc: Document): Promise<Document> {
  if (doc.schema_version < 2) {
    // Apply migration
    doc = { ...doc, schema_version: 2, new_field: 'default' };
  }
  return doc;
}
```

### Data Validation
```typescript
// Use Zod for validation
const materialSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.enum(['m', 'kg', 'piece', 'dozen']),
  created_at: z.instanceof(Timestamp),
  updated_at: z.instanceof(Timestamp)
});

function validateMaterial(data: unknown): Material {
  return materialSchema.parse(data);
}
```

## 🎯 Best Practices Summary

1. **Keep it flat** - Avoid deep nesting
2. **Denormalize for reads** - Embed frequently accessed data
3. **Use composite keys** - For relationships
4. **Timestamp everything** - For tracking and sorting
5. **Soft delete** - Don't delete, mark as deleted
6. **Limit document size** - Keep under 100KB
7. **Use subcollections** - For one-to-many relationships
8. **Index appropriately** - Create composite indexes for common queries
9. **Validate at write time** - Use Zod or similar
10. **Version your schema** - For future migrations

---
*อัปเดตเมื่อ: 2026-04-21*
