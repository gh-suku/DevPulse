/**
 * Activity History/Audit Log - Issue #23
 * Tracks changes to tasks, goals, and other entities
 */

import { supabase } from './supabase';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  entity_type: 'task' | 'goal' | 'subtask' | 'log' | 'post';
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, { old: any; new: any }>;
  created_at: string;
}

export async function logAuditEntry(
  userId: string,
  entityType: AuditLogEntry['entity_type'],
  entityId: string,
  action: AuditLogEntry['action'],
  changes: Record<string, { old: any; new: any }>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        action,
        changes
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging audit entry:', error);
    return false;
  }
}

export async function getAuditHistory(
  entityType: string,
  entityId: string
): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching audit history:', error);
    return [];
  }
}
