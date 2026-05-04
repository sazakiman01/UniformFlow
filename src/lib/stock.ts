import { runTransaction, doc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createStockItem, getStockItem, updateStockItem } from "./stock-items";
import { createStockMovement, calculateCurrentStock } from "./stock-movements";
import { StockItem, StockMovement, MovementType } from "@/types";

// Record a stock movement and update the item's current stock
export async function recordStockMovement(
  itemId: string,
  movementData: Omit<StockMovement, "id" | "itemId" | "createdAt">
): Promise<string> {
  const movementId = await runTransaction(db, async (transaction) => {
    // Get the stock item
    const itemRef = doc(db, "stockItems", itemId);
    const itemDoc = await transaction.get(itemRef);
    
    if (!itemDoc.exists()) {
      throw new Error("Stock item not found");
    }
    
    const item = itemDoc.data() as StockItem;
    
    // Calculate new stock
    let newStock = item.currentStock;
    if (movementData.type === "in" || movementData.type === "adjustment") {
      newStock += movementData.quantity;
    } else if (movementData.type === "out") {
      newStock -= movementData.quantity;
      
      // Prevent negative stock
      if (newStock < 0) {
        throw new Error("Insufficient stock for this movement");
      }
    }
    
    // Update the stock item
    transaction.update(itemRef, {
      currentStock: newStock,
      updatedAt: movementData.movementDate,
    });
    
    // Create the movement record
    const movementRef = doc(collection(db, "stockMovements"));
    transaction.set(movementRef, {
      ...movementData,
      id: movementRef.id,
      itemId,
      createdAt: new Date(),
    });
    
    return movementRef.id;
  });
  
  return movementId;
}

// Record a stock IN movement
export async function recordStockIn(
  itemId: string,
  quantity: number,
  costPerUnit: number,
  reason: string,
  createdBy: string,
  options?: {
    referenceType?: StockMovement["referenceType"];
    referenceId?: string;
    referenceNumber?: string;
    notes?: string;
    fromLocation?: string;
    toLocation?: string;
    createdByName?: string;
  }
): Promise<string> {
  const item = await getStockItem(itemId);
  if (!item) {
    throw new Error("Stock item not found");
  }
  
  const movementData: Omit<StockMovement, "id" | "itemId" | "createdAt"> = {
    itemSnapshot: {
      name: item.name,
      sku: item.sku,
      unit: item.unit,
    },
    type: "in",
    quantity,
    costPerUnit,
    totalCost: quantity * costPerUnit,
    movementDate: new Date(),
    reason,
    createdBy,
    ...options,
  };
  
  return recordStockMovement(itemId, movementData);
}

// Record a stock OUT movement
export async function recordStockOut(
  itemId: string,
  quantity: number,
  costPerUnit: number,
  reason: string,
  createdBy: string,
  options?: {
    referenceType?: StockMovement["referenceType"];
    referenceId?: string;
    referenceNumber?: string;
    notes?: string;
    fromLocation?: string;
    toLocation?: string;
    createdByName?: string;
  }
): Promise<string> {
  const item = await getStockItem(itemId);
  if (!item) {
    throw new Error("Stock item not found");
  }
  
  const movementData: Omit<StockMovement, "id" | "itemId" | "createdAt"> = {
    itemSnapshot: {
      name: item.name,
      sku: item.sku,
      unit: item.unit,
    },
    type: "out",
    quantity,
    costPerUnit,
    totalCost: quantity * costPerUnit,
    movementDate: new Date(),
    reason,
    createdBy,
    ...options,
  };
  
  return recordStockMovement(itemId, movementData);
}

// Record a stock ADJUSTMENT movement
export async function recordStockAdjustment(
  itemId: string,
  quantity: number,
  costPerUnit: number,
  reason: string,
  createdBy: string,
  options?: {
    referenceType?: StockMovement["referenceType"];
    referenceId?: string;
    referenceNumber?: string;
    notes?: string;
    fromLocation?: string;
    toLocation?: string;
    createdByName?: string;
  }
): Promise<string> {
  const item = await getStockItem(itemId);
  if (!item) {
    throw new Error("Stock item not found");
  }
  
  const movementData: Omit<StockMovement, "id" | "itemId" | "createdAt"> = {
    itemSnapshot: {
      name: item.name,
      sku: item.sku,
      unit: item.unit,
    },
    type: "adjustment",
    quantity,
    costPerUnit,
    totalCost: quantity * costPerUnit,
    movementDate: new Date(),
    reason,
    createdBy,
    ...options,
  };
  
  return recordStockMovement(itemId, movementData);
}

// Recalculate and update current stock for an item (from all movements)
export async function recalculateStock(itemId: string): Promise<number> {
  const calculatedStock = await calculateCurrentStock(itemId);
  await updateStockItem(itemId, { currentStock: calculatedStock });
  return calculatedStock;
}
