/**
 * services/auditLogger.ts — Client-Side Audit Trail
 *
 * Logs user actions to Firestore activity_logs collection.
 * Append-only — no updates or deletes allowed (enforced by security rules).
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

export type AuditAction =
  | 'inventory.create'
  | 'inventory.update'
  | 'inventory.delete'
  | 'inventory.stock_adjust'
  | 'order.create'
  | 'order.update'
  | 'order.approve'
  | 'campaign.create'
  | 'campaign.approve'
  | 'campaign.send'
  | 'price.change'
  | 'user.login'
  | 'user.logout'
  | 'user.invite'
  | 'settings.update'
  | 'task.create'
  | 'task.approve'
  | 'task.reject'
  | 'report.export'
  | 'other'

interface AuditEntry {
  action: AuditAction
  details: string
  collection?: string
  documentId?: string
  oldValue?: unknown
  newValue?: unknown
  companyId?: string
}

/**
 * Log a user action to Firestore activity_logs.
 * Fire-and-forget — does not throw on failure.
 */
export async function logAction(entry: AuditEntry): Promise<void> {
  try {
    const user = auth.currentUser
    if (!user) return

    await addDoc(collection(db, 'activity_logs'), {
      userId: user.uid,
      userEmail: user.email || 'unknown',
      action: entry.action,
      details: entry.details,
      collection: entry.collection || null,
      documentId: entry.documentId || null,
      oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
      companyId: entry.companyId || null,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    })
  } catch (err) {
    // Silent fail — audit logging should never break the app
    console.warn('[audit] Failed to log action:', err)
  }
}

/**
 * Log inventory change with before/after values.
 */
export async function logInventoryChange(
  action: 'inventory.create' | 'inventory.update' | 'inventory.delete' | 'inventory.stock_adjust',
  itemName: string,
  documentId: string,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>,
): Promise<void> {
  await logAction({
    action,
    details: `${action.split('.')[1]}: ${itemName}`,
    collection: 'inventory',
    documentId,
    oldValue,
    newValue,
  })
}

/**
 * Log order action.
 */
export async function logOrderAction(
  action: 'order.create' | 'order.update' | 'order.approve',
  orderId: string,
  details: string,
): Promise<void> {
  await logAction({
    action,
    details,
    collection: 'orders',
    documentId: orderId,
  })
}

/**
 * Log campaign action.
 */
export async function logCampaignAction(
  action: 'campaign.create' | 'campaign.approve' | 'campaign.send',
  campaignId: string,
  details: string,
): Promise<void> {
  await logAction({
    action,
    details,
    collection: 'marketing_campaigns',
    documentId: campaignId,
  })
}

/**
 * Log price change with old and new values.
 */
export async function logPriceChange(
  productId: string,
  productName: string,
  oldPrice: number,
  newPrice: number,
): Promise<void> {
  await logAction({
    action: 'price.change',
    details: `Price change: ${productName} Rp ${oldPrice.toLocaleString()} → Rp ${newPrice.toLocaleString()}`,
    collection: 'inventory',
    documentId: productId,
    oldValue: { price: oldPrice },
    newValue: { price: newPrice },
  })
}

/**
 * Log authentication events.
 */
export async function logAuth(action: 'user.login' | 'user.logout'): Promise<void> {
  await logAction({
    action,
    details: action === 'user.login' ? 'User logged in' : 'User logged out',
  })
}
