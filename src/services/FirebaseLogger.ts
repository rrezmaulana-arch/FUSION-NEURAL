import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type AgentRole = 'Manager' | 'Admin' | 'Marketing' | 'Finance' | 'System';

export class FirebaseLogger {
  /**
   * Logs an AI Agent action to the activity_logs collection.
   * @param agent The role of the agent performing the action
   * @param action A short uppercase string identifying the action type (e.g., 'UPDATE_INVENTORY')
   * @param details A human-readable description of the action
   */
  static async logAgentAction(agent: AgentRole, action: string, details: string) {
    try {
      await addDoc(collection(db, 'activity_logs'), {
        agent,
        action,
        details,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('FirebaseLogger Error:', error);
    }
  }
}
