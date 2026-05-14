import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type AgentRole = 'Manager' | 'Admin' | 'Marketing' | 'Finance' | 'System' | 'Frontliner';

export class FirebaseLogger {
  /**
   * Logs an AI Agent action to the audit_logs table in Firestore.
   * @param agent The role of the agent performing the action
   * @param action A short uppercase string identifying the action type (e.g., 'UPDATE_INVENTORY')
   * @param details A human-readable description of the action
   */
  static async logAgentAction(agent: AgentRole, action: string, details: string) {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        agent,
        action_type: action,
        details,
        legal_protocol: 'RUTIN',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('FirebaseLogger Error:', error);
    }
  }
}
