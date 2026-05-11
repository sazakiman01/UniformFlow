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
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Candidate,
  CandidateStatus,
  Position,
  Portfolio,
  InterviewRecord,
  StatusHistoryEntry,
} from '@/types';

// Convert Firestore data to Candidate
function candidateFromFirestore(data: any, id: string): Candidate {
  return {
    id,
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || '',
    position: data.position || 'Other',
    experienceYears: data.experienceYears || 0,
    expectedSalary: data.expectedSalary || 0,
    appliedDate: data.appliedDate?.toDate() || new Date(),
    status: data.status || 'New',
    notes: data.notes || '',
    portfolio: data.portfolio || { files: [], externalLinks: [] },
    interviews: data.interviews || [],
    statusHistory: data.statusHistory || [],
    createdBy: data.createdBy || '',
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

// Convert Candidate to Firestore data
function candidateToFirestore(candidate: Partial<Candidate>): any {
  const data: any = {
    ...candidate,
    updatedAt: serverTimestamp(),
  };

  // Convert Date to Timestamp for Firestore
  if (candidate.appliedDate) {
    data.appliedDate = Timestamp.fromDate(candidate.appliedDate);
  }
  if (candidate.createdAt) {
    data.createdAt = Timestamp.fromDate(candidate.createdAt);
  }

  // Convert portfolio files dates
  if (candidate.portfolio?.files) {
    data.portfolio = {
      files: candidate.portfolio.files.map((file) => ({
        ...file,
        uploadedAt: file.uploadedAt ? Timestamp.fromDate(file.uploadedAt) : serverTimestamp(),
      })),
      externalLinks: candidate.portfolio.externalLinks || [],
    };
  }

  // Convert interview dates
  if (candidate.interviews) {
    data.interviews = candidate.interviews.map((interview) => ({
      ...interview,
      date: interview.date ? Timestamp.fromDate(interview.date) : serverTimestamp(),
    }));
  }

  // Convert status history dates
  if (candidate.statusHistory) {
    data.statusHistory = candidate.statusHistory.map((entry) => ({
      ...entry,
      changedAt: entry.changedAt ? Timestamp.fromDate(entry.changedAt) : serverTimestamp(),
    }));
  }

  // Filter out undefined values
  return Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
}

// Get all candidates
export async function getAllCandidates(): Promise<Candidate[]> {
  const candidatesRef = collection(db, 'candidates');
  const q = query(candidatesRef, orderBy('appliedDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => candidateFromFirestore(doc.data(), doc.id));
}

// Get candidate by ID
export async function getCandidateById(id: string): Promise<Candidate | null> {
  const docRef = doc(db, 'candidates', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return candidateFromFirestore(docSnap.data(), docSnap.id);
}

// Create new candidate
export async function createCandidate(
  candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
): Promise<string> {
  const newCandidate: Omit<Candidate, 'id'> = {
    ...candidate,
    statusHistory: [
      {
        status: candidate.status,
        changedAt: new Date(),
        changedBy: candidate.createdBy,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const data = candidateToFirestore(newCandidate);
  const docRef = await addDoc(collection(db, 'candidates'), data);
  return docRef.id;
}

// Update candidate
export async function updateCandidate(
  id: string,
  updates: Partial<Candidate>,
  userId: string
): Promise<void> {
  const docRef = doc(db, 'candidates', id);
  
  // If status is being changed, add to status history
  if (updates.status) {
    const currentDoc = await getDoc(docRef);
    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      const currentStatus = currentData.status;
      
      if (currentStatus !== updates.status) {
        const newHistoryEntry: StatusHistoryEntry = {
          status: updates.status,
          changedAt: new Date(),
          changedBy: userId,
        };
        
        updates.statusHistory = [
          ...(currentData.statusHistory || []),
          newHistoryEntry,
        ];
      }
    }
  }

  const data = candidateToFirestore(updates);
  await updateDoc(docRef, data);
}

// Delete candidate
export async function deleteCandidate(id: string): Promise<void> {
  const docRef = doc(db, 'candidates', id);
  await deleteDoc(docRef);
}

// Filter candidates by status
export async function getCandidatesByStatus(status: CandidateStatus): Promise<Candidate[]> {
  const candidatesRef = collection(db, 'candidates');
  const q = query(candidatesRef, where('status', '==', status), orderBy('appliedDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => candidateFromFirestore(doc.data(), doc.id));
}

// Filter candidates by position
export async function getCandidatesByPosition(position: Position): Promise<Candidate[]> {
  const candidatesRef = collection(db, 'candidates');
  const q = query(candidatesRef, where('position', '==', position), orderBy('appliedDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => candidateFromFirestore(doc.data(), doc.id));
}

// Search candidates by name, phone, or email
export async function searchCandidates(searchTerm: string): Promise<Candidate[]> {
  const allCandidates = await getAllCandidates();
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return allCandidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(lowerSearchTerm) ||
      candidate.phone.includes(searchTerm) ||
      candidate.email.toLowerCase().includes(lowerSearchTerm)
  );
}

// Get candidate statistics
export async function getCandidateStats() {
  const candidates = await getAllCandidates();
  
  const stats = {
    total: candidates.length,
    byStatus: {} as Record<CandidateStatus, number>,
    byPosition: {} as Record<Position, number>,
  };
  
  // Initialize counters
  const statuses: CandidateStatus[] = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
  const positions: Position[] = ['Graphic Design', 'Accounting', 'Sales', 'Production', 'Manager', 'Admin', 'Other'];
  
  statuses.forEach((status) => {
    stats.byStatus[status] = 0;
  });
  
  positions.forEach((position) => {
    stats.byPosition[position] = 0;
  });
  
  // Count candidates
  candidates.forEach((candidate) => {
    stats.byStatus[candidate.status]++;
    stats.byPosition[candidate.position]++;
  });
  
  return stats;
}
