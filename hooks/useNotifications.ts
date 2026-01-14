import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppNotification } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (data) {
                setNotifications(data as AppNotification[]);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time notifications
        if (user) {
            const subscription = supabase
                .channel(`notifications:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    const newNotification = payload.new as AppNotification;
                    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
                    setUnreadCount(prev => prev + 1);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [user]);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    };
};
