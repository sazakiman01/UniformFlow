import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { BusinessModelCanvas, Quarter } from '@/types';

const COLLECTION_NAME = 'businessModelCanvas';

// Converter for Firestore
const canvasConverter = {
  toFirestore: (data: BusinessModelCanvas) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as BusinessModelCanvas,
};

/**
 * Get all Business Model Canvases
 */
export async function getBusinessModelCanvases(): Promise<BusinessModelCanvas[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('year', 'desc'), orderBy('quarter'), orderBy('version', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BusinessModelCanvas));
}

/**
 * Get Business Model Canvas by ID
 */
export async function getBusinessModelCanvasById(id: string): Promise<BusinessModelCanvas | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BusinessModelCanvas;
}

/**
 * Get Business Model Canvas by Year and Quarter
 */
export async function getBusinessModelCanvasByQuarter(year: number, quarter: Quarter): Promise<BusinessModelCanvas[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('year', '==', year),
    where('quarter', '==', quarter),
    orderBy('version', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BusinessModelCanvas));
}

/**
 * Create new Business Model Canvas
 */
export async function createBusinessModelCanvas(
  data: Omit<BusinessModelCanvas, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<string> {
  // Get the latest version for this year/quarter
  const existing = await getBusinessModelCanvasByQuarter(data.year, data.quarter);
  const nextVersion = existing.length > 0 ? Math.max(...existing.map((c) => c.version)) + 1 : 1;

  const canvasData: Omit<BusinessModelCanvas, 'id'> = {
    ...data,
    version: nextVersion,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), canvasData);
  return docRef.id;
}

/**
 * Update Business Model Canvas
 */
export async function updateBusinessModelCanvas(
  id: string,
  data: Partial<BusinessModelCanvas>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date(),
  });
}

/**
 * Delete Business Model Canvas
 */
export async function deleteBusinessModelCanvas(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
