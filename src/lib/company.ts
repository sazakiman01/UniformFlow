import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { CompanyProfile, Address } from '@/types';

/**
 * UniformFlow uses a single-business model. The company profile is stored
 * as a singleton document at `companyProfile/main`.
 */
export const COMPANY_DOC_ID = 'main';
export const COMPANY_COLLECTION = 'companyProfile';

const emptyAddress: Address = {
  street: '',
  district: '',
  province: '',
  postcode: '',
  fullAddress: '',
};

export const DEFAULT_COMPANY_PROFILE: Omit<CompanyProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  taxId: '',
  branchCode: '00000',
  address: emptyAddress,
  phone: '',
  email: '',
  vatRegistered: true,
  vatRate: 7,
  defaultCreditTerm: 0,
  documentNumberingMode: 'monthly',
  fiscalYearStartMonth: 1,
};

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const ref = doc(db, COMPANY_COLLECTION, COMPANY_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    ...(d as Omit<CompanyProfile, 'id' | 'createdAt' | 'updatedAt'>),
    createdAt: (d.createdAt as Timestamp)?.toDate?.() ?? new Date(),
    updatedAt: (d.updatedAt as Timestamp)?.toDate?.() ?? new Date(),
  } as CompanyProfile;
}

export async function saveCompanyProfile(
  profile: Partial<Omit<CompanyProfile, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const ref = doc(db, COMPANY_COLLECTION, COMPANY_DOC_ID);
  const existing = await getDoc(ref);
  await setDoc(
    ref,
    {
      ...profile,
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Format full address as a single line for display on documents.
 */
export function formatAddressLine(addr: Address | undefined): string {
  if (!addr) return '';
  if (addr.fullAddress) return addr.fullAddress;
  return [addr.street, addr.district, addr.province, addr.postcode]
    .filter(Boolean)
    .join(' ');
}
