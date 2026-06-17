/**
 * services/userService.ts — User Profile & Company Management
 *
 * Handles user profile CRUD, role management, and company scoping.
 * Roles are stored in Firestore (NOT derived from email prefix).
 */
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export type UserRole = 'owner' | 'manager' | 'admin' | 'finance' | 'marketing' | 'viewer'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  companyId: string
  status: 'active' | 'suspended' | 'pending'
  createdAt: any
  updatedAt: any
  invitedBy?: string
  lastLoginAt?: any
}

export interface Company {
  id: string
  name: string
  plan: 'starter' | 'dual' | 'full'
  ownerUid: string
  createdAt: any
  settings: {
    timezone: string
    currency: string
    language: string
  }
}

const DEFAULT_ROLE: UserRole = 'viewer'

/**
 * Get user profile from Firestore. Returns null if not found.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    return { uid: snap.id, ...snap.data() } as UserProfile
  } catch (err) {
    console.error('[userService] Failed to fetch profile:', err)
    return null
  }
}

/**
 * Create user profile on first login. Called from AuthContext.
 */
export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  role?: UserRole,
  companyId?: string,
): Promise<UserProfile> {
  const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any } = {
    uid,
    email,
    displayName: displayName || email.split('@')[0],
    role: role || deriveRoleFromEmail(email),
    companyId: companyId || `company_${uid}`,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'users', uid), profile)
  return profile as UserProfile
}

/**
 * Update user profile fields.
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Update last login timestamp.
 */
export async function updateLastLogin(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    lastLoginAt: serverTimestamp(),
  }).catch(() => {}) // silent fail — non-critical
}

/**
 * Get company by ID.
 */
export async function getCompany(companyId: string): Promise<Company | null> {
  try {
    const snap = await getDoc(doc(db, 'companies', companyId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Company
  } catch (err) {
    console.error('[userService] Failed to fetch company:', err)
    return null
  }
}

/**
 * Create a new company. Called when owner signs up.
 */
export async function createCompany(
  companyId: string,
  name: string,
  ownerUid: string,
  plan: Company['plan'] = 'starter',
): Promise<Company> {
  const company: Omit<Company, 'createdAt'> & { createdAt: any } = {
    id: companyId,
    name,
    plan,
    ownerUid,
    createdAt: serverTimestamp(),
    settings: {
      timezone: 'Asia/Jakarta',
      currency: 'IDR',
      language: 'id',
    },
  }
  await setDoc(doc(db, 'companies', companyId), company)
  return company as Company
}

/**
 * Derive default role from email prefix (migration fallback only).
 * New users should have role explicitly set.
 */
function deriveRoleFromEmail(email: string): UserRole {
  const prefix = email.split('@')[0].toLowerCase()
  const roleMap: Record<string, UserRole> = {
    owner: 'owner',
    manager: 'manager',
    admin: 'admin',
    finance: 'finance',
    marketing: 'marketing',
  }
  return roleMap[prefix] || DEFAULT_ROLE
}

/**
 * Check if user has permission for a specific action.
 */
export function hasPermission(role: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    owner: ['*'], // full access
    manager: [
      'dashboard.view', 'tasks.manage', 'agents.manage', 'reports.view',
      'inventory.view', 'inventory.edit', 'orders.view', 'orders.edit',
      'finance.view', 'marketing.view', 'marketing.edit', 'users.invite',
      'settings.view', 'settings.edit', 'audit.view',
    ],
    admin: [
      'dashboard.view', 'inventory.view', 'inventory.edit',
      'orders.view', 'orders.edit', 'suppliers.view', 'suppliers.edit',
    ],
    finance: [
      'dashboard.view', 'finance.view', 'finance.edit',
      'reports.view', 'orders.view', 'budget.view',
    ],
    marketing: [
      'dashboard.view', 'marketing.view', 'marketing.edit',
      'campaigns.manage', 'leads.view', 'leads.edit',
    ],
    viewer: ['dashboard.view'],
  }

  const userPerms = permissions[role] || []
  return userPerms.includes('*') || userPerms.includes(action)
}
