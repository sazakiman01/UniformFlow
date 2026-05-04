/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FabricCatalog, FabricColor, StockCategory } from "@/types";

const COLLECTION_NAME = "fabricCatalogs";

// เช็คว่า code ซ้ำหรือไม่ (excludeId สำหรับกรณี update)
async function checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("code", "==", code)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return false;
  
  // ถ้า excludeId ระบุมา ให้เช็คว่า document ที่เจอคือตัวเองหรือไม่
  if (excludeId) {
    const existingDocs = snapshot.docs.filter(doc => doc.id !== excludeId);
    return existingDocs.length > 0;
  }
  
  return true;
}

// ดึง catalogs ทั้งหมด
export async function getFabricCatalogs(): Promise<FabricCatalog[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy("code", "asc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as FabricCatalog));
}

// ดึง catalog ตาม category
export async function getCatalogsByCategory(category: StockCategory): Promise<FabricCatalog[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("category", "==", category),
    orderBy("code", "asc")
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as FabricCatalog));
}

// ดึง catalog เดียวตาม ID
export async function getFabricCatalogById(id: string): Promise<FabricCatalog | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) return null;
  
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
  } as FabricCatalog;
}

// สร้าง catalog ใหม่
export async function createFabricCatalog(data: {
  code: string;
  name: string;
  category: StockCategory;
  colors: FabricColor[];
  createdBy: string;
}): Promise<string> {
  // เช็คว่า code ซ้ำหรือไม่
  if (await checkCodeExists(data.code)) {
    throw new Error("รหัสแคตตาล็อกนี้มีอยู่แล้ว");
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
}

// อัปเดต catalog
export async function updateFabricCatalog(
  id: string,
  data: Partial<{
    code: string;
    name: string;
    category: StockCategory;
    colors: FabricColor[];
  }>
): Promise<void> {
  // ถ้ามีการเปลี่ยน code ให้เช็คว่าซ้ำหรือไม่ (exclude id ตัวเอง)
  if (data.code) {
    if (await checkCodeExists(data.code, id)) {
      throw new Error("รหัสแคตตาล็อกนี้มีอยู่แล้ว");
    }
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ลบ catalog
export async function deleteFabricCatalog(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

// เพิ่มสีใน catalog
export async function addColorToCatalog(catalogId: string, color: FabricColor): Promise<void> {
  const catalog = await getFabricCatalogById(catalogId);
  if (!catalog) throw new Error("Catalog not found");
  
  const updatedColors = [...catalog.colors, color];
  
  await updateFabricCatalog(catalogId, {
    colors: updatedColors,
  });
}

// อัปเดตสีใน catalog
export async function updateColorInCatalog(
  catalogId: string,
  colorCode: string,
  data: Partial<FabricColor>
): Promise<void> {
  const catalog = await getFabricCatalogById(catalogId);
  if (!catalog) throw new Error("Catalog not found");
  
  const updatedColors = catalog.colors.map(color =>
    color.code === colorCode ? { ...color, ...data } : color
  );
  
  await updateFabricCatalog(catalogId, {
    colors: updatedColors,
  });
}

// ลบสีใน catalog
export async function deleteColorFromCatalog(catalogId: string, colorCode: string): Promise<void> {
  const catalog = await getFabricCatalogById(catalogId);
  if (!catalog) throw new Error("Catalog not found");
  
  const updatedColors = catalog.colors.filter(color => color.code !== colorCode);
  
  await updateFabricCatalog(catalogId, {
    colors: updatedColors,
  });
}
