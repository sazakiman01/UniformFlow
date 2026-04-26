import type { UserRole, UserProfile } from '@/types';

export const FINANCE_MANAGE_ROLES: UserRole[] = ['owner', 'accountant'];
export const FINANCE_VIEW_ROLES: UserRole[] = ['owner', 'accountant', 'staff', 'viewer'];
export const OPS_MANAGE_ROLES: UserRole[] = ['owner', 'accountant', 'staff'];
export const OWNER_ONLY_ROLES: UserRole[] = ['owner'];

export function hasRole(profile: UserProfile | null | undefined, allowed: UserRole[]): boolean {
  if (!profile || profile.disabled) return false;
  return allowed.includes(profile.role);
}

export const can = {
  manageFinance: (p?: UserProfile | null) => hasRole(p, FINANCE_MANAGE_ROLES),
  viewFinance: (p?: UserProfile | null) => hasRole(p, FINANCE_VIEW_ROLES),
  manageOps: (p?: UserProfile | null) => hasRole(p, OPS_MANAGE_ROLES),
  admin: (p?: UserProfile | null) => hasRole(p, OWNER_ONLY_ROLES),
  manageUsers: (p?: UserProfile | null) => hasRole(p, OWNER_ONLY_ROLES),
  manageCompany: (p?: UserProfile | null) => hasRole(p, OWNER_ONLY_ROLES),
};

/** Permission key used by per-page UI guards / nav filter. */
export type PermissionKey = keyof typeof can;
