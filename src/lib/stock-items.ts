import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, Timestamp } from "firebase/firestore";
import { StockItem, StockCategory } from "@/types";

const COLLECTION = "stockItems";

// Get a single stock item by ID
export async function getStockItem(id: string): Promise<StockItem | null> {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as StockItem;
}

// List all stock items
export async function listStockItems(): Promise<StockItem[]> {
  const q = query(collection(db, COLLECTION));
  const querySnapshot = await getDocs(q);
  
  const items = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as StockItem;
  });
  
  // Sort by name in JavaScript (temporary workaround for index building)
  return items.sort((a, b) => a.name.localeCompare(b.name, "th"));
}

// List stock items by category
export async function listStockItemsByCategory(category: StockCategory): Promise<StockItem[]> {
  const q = query(
    collection(db, COLLECTION),
    where("category", "==", category)
  );
  const querySnapshot = await getDocs(q);
  
  const items = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as StockItem;
  });
  
  // Sort by name in JavaScript (temporary workaround for index building)
  return items.sort((a, b) => a.name.localeCompare(b.name, "th"));
}

// List low stock items (currentStock <= reorderPoint)
export async function listLowStockItems(): Promise<StockItem[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy("currentStock", "asc")
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as StockItem;
    })
    .filter(item => item.currentStock <= item.reorderPoint);
}

// Create a new stock item
export async function createStockItem(data: Omit<StockItem, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Update a stock item
export async function updateStockItem(id: string, data: Partial<Omit<StockItem, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Delete a stock item
export async function deleteStockItem(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

// Get sort order for a category (fabric DESC, others ASC)
export function getSortOrder(category: StockCategory): "desc" | "asc" {
  if (category === "fabric") {
    return "desc"; // fabric: show high to low
  }
  return "asc"; // others: show low to high
}

// List stock items with category-specific sorting
export async function listStockItemsSorted(): Promise<{ fabric: StockItem[]; others: StockItem[] }> {
  // Get fabric items (sorted DESC by currentStock)
  const fabricItems = await listStockItemsByCategory("fabric");
  fabricItems.sort((a, b) => b.currentStock - a.currentStock);
  
  // Get other items (sorted ASC by currentStock)
  const otherCategories: StockCategory[] = ["zip", "box", "bag", "pillow_filling", "tape"];
  const otherItems: StockItem[] = [];
  
  for (const category of otherCategories) {
    const items = await listStockItemsByCategory(category);
    items.sort((a, b) => a.currentStock - b.currentStock);
    otherItems.push(...items);
  }
  
  return {
    fabric: fabricItems,
    others: otherItems,
  };
}
