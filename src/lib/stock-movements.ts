import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp, Timestamp } from "firebase/firestore";
import { StockMovement, MovementType } from "@/types";

const COLLECTION = "stockMovements";

// Get a single stock movement by ID
export async function getStockMovement(id: string): Promise<StockMovement | null> {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    movementDate: data.movementDate?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
  } as StockMovement;
}

// List all stock movements
export async function listStockMovements(limitCount = 50): Promise<StockMovement[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy("movementDate", "desc"),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      movementDate: data.movementDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as StockMovement;
  });
}

// List stock movements for a specific item
export async function listStockMovementsByItem(itemId: string, limitCount = 100): Promise<StockMovement[]> {
  const q = query(
    collection(db, COLLECTION),
    where("itemId", "==", itemId),
    orderBy("movementDate", "desc"),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      movementDate: data.movementDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as StockMovement;
  });
}

// List stock movements by type
export async function listStockMovementsByType(type: MovementType, limitCount = 100): Promise<StockMovement[]> {
  const q = query(
    collection(db, COLLECTION),
    where("type", "==", type),
    orderBy("movementDate", "desc"),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      movementDate: data.movementDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as StockMovement;
  });
}

// List stock movements by date range
export async function listStockMovementsByDateRange(startDate: Date, endDate: Date, limitCount = 100): Promise<StockMovement[]> {
  const q = query(
    collection(db, COLLECTION),
    where("movementDate", ">=", Timestamp.fromDate(startDate)),
    where("movementDate", "<=", Timestamp.fromDate(endDate)),
    orderBy("movementDate", "desc"),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      movementDate: data.movementDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as StockMovement;
  });
}

// Create a new stock movement
export async function createStockMovement(data: Omit<StockMovement, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Calculate current stock from movements
export async function calculateCurrentStock(itemId: string): Promise<number> {
  const movements = await listStockMovementsByItem(itemId, 1000);
  
  return movements.reduce((total, movement) => {
    if (movement.type === "in" || movement.type === "adjustment") {
      return total + movement.quantity;
    } else if (movement.type === "out") {
      return total - movement.quantity;
    }
    // transfer doesn't change total stock, just location
    return total;
  }, 0);
}
