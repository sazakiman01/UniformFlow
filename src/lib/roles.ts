import type { UserRole, UserProfile } from '@/types';

/**
 * Role normalization — legacy 'admin' counts as 'owner', legacy 'user' as 'staff'.
 */
export function normalizeRole(role: UserRole | undefined): UserRole {
  if (!role) return 'staff';
  if (role === 'admin') return 'owner';
  if (role === 'user') return 'staff';
  return role;
}

export const FINANCE_MANAGE_ROLES: UserRole[] = ['owner', 'accountant', 'admin'];
export const FINANCE_VIEW_ROLES: UserRole[] = ['owner', 'accountant', 'viewer', 'admin'];
export const OPS_MANAGE_ROLES: UserRole[] = ['owner', 'accountant', 'staff', 'admin', 'user'];
export const ADMIN_ROLES: UserRole[] = ['owner', 'admin'];

export function hasRole(profile: UserProfile | null | undefined, allowed: UserRole[]): boolean {
  if (!profile || profile.disabled) return false;
  return allowed.includes(profile.role) || allowed.includes(normalizeRole(profile.role));
}

export const can = {
  manageFinance: (p?: UserProfile | null) => hasRole(p, FINANCE_MANAGE_ROLES),
  viewFinance: (p?: UserProfile | null) => hasRole(p, FINANCE_VIEW_ROLES),
  manageOps: (p?: UserProfile | null) => hasRole(p, OPS_MANAGE_ROLES),
  admin: (p?: UserProfile | null) => hasRole(p, ADMIN_ROLES),
  manageUsers: (p?: UserProfile | null) => hasRole(p, ADMIN_ROLES),
  manageCompany: (p?: UserProfile | null) => hasRole(p, ADMIN_ROLES),
};
