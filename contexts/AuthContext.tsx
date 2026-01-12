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
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                setUser(mapSupabaseUser(session.user));
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                setUser(mapSupabaseUser(session.user));
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
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
