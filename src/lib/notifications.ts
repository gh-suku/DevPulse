/**
 * Notifications System - Issue #20: No Notifications System
 * 
 * Provides real-time notifications for comments, likes, task assignments, and other events.
 */

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'like' | 'task_assigned' | 'goal_completed' | 'mention' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  comment_notifications: boolean;
  like_notifications: boolean;
  task_notifications: boolean;
  goal_notifications: boolean;
}

/**
 * Fetch user notifications
 */
export async function fetchNotifications(
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

/**
 * Create a new notification
 */
export async function createNotification(
  notification: Omit<Notification, 'id' | 'created_at' | 'read'>
): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notification,
        read: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from notifications
 */
export async function unsubscribeFromNotifications(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    // Return default preferences if none exist
    return data || {
      email_notifications: true,
      push_notifications: true,
      comment_notifications: true,
      like_notifications: true,
      task_notifications: true,
      goal_notifications: true
    };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

/**
 * React hook for notifications
 */
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;

    // Fetch initial notifications
    const loadNotifications = async () => {
      setLoading(true);
      const data = await fetchNotifications(userId);
      setNotifications(data);
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
      setLoading(false);
    };

    loadNotifications();

    // Subscribe to real-time updates
    const channel = subscribeToNotifications(userId, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      unsubscribeFromNotifications(channel);
    };
  }, [userId]);

  const markRead = async (notificationId: string) => {
    const success = await markAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllRead = async () => {
    const success = await markAllAsRead(userId);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotif = async (notificationId: string) => {
    const success = await deleteNotification(notificationId);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    deleteNotif,
    refresh: () => loadNotifications()
  };
}

// Add React import for the hook
import React from 'react';

// Helper function to load notifications
async function loadNotifications(userId: string) {
  const data = await fetchNotifications(userId);
  const count = await getUnreadCount(userId);
  return { data, count };
}
