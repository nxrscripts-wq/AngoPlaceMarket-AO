import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as AppUser, UserRole } from '../types';

type AuthContextType = {
    session: Session | null;
    user: AppUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    const SUPER_ADMIN_EMAIL = "elviino.nxrscripts@gmail.com";

    const mapSupabaseUser = (sbUser: User): AppUser => {
        const email = sbUser.email || '';
        const isMaster = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
        const metadata = sbUser.user_metadata || {};

        return {
            id: sbUser.id,
            name: metadata.full_name || metadata.name || email.split('@')[0] || 'Utilizador',
            email: email,
            walletBalance: metadata.wallet_balance || 0,
            role: isMaster ? UserRole.SUPER_ADMIN : (metadata.role || UserRole.USER),
            is_super_admin: isMaster,
            avatar: metadata.avatar_url || metadata.picture || ''
        };
    };

    useEffect(() => {
        let mounted = true;

        // Safety timeout to ensure app loads even if Supabase hangs
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth check timed out - forcing app load");
                setLoading(false);
            }
        }, 5000);

        const fetchSessionAndProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                setSession(session);

                if (session?.user) {
                    try {
                        // Fetch profile from DB to get the real role
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        if (!mounted) return;

                        const mappedUser = mapSupabaseUser(session.user);

                        // Override role if found in profile
                        if (profile && profile.role) {
                            mappedUser.role = profile.role as UserRole;
                            // Also check for super admin override if needed, or keep the hardcoded check as fallback
                            if (mappedUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
                                mappedUser.role = UserRole.SUPER_ADMIN;
                                mappedUser.is_super_admin = true;
                            }
                        }

                        setUser(mappedUser);
                    } catch (profileErr) {
                        console.error('Error fetching profile:', profileErr);
                        setUser(mapSupabaseUser(session.user));
                    }
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                setUser(null);
            } finally {
                if (mounted) setLoading(false);
                clearTimeout(safetyTimeout);
            }
        };

        fetchSessionAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            setSession(session);
            // ... (rest of logic remains similar/simplified)
            if (session?.user) {
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    const mappedUser = mapSupabaseUser(session.user);
                    if (profile && profile.role) {
                        mappedUser.role = profile.role as UserRole;
                        if (mappedUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
                            mappedUser.role = UserRole.SUPER_ADMIN;
                            mappedUser.is_super_admin = true;
                        }
                    }
                    setUser(mappedUser);
                } catch (err) {
                    console.error('Error fetching profile on auth change:', err);
                    setUser(mapSupabaseUser(session.user));
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
