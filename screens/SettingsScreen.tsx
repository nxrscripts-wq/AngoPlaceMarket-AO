import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ChevronLeft, User as UserIcon, Bell, Shield, Moon, Globe, HelpCircle, Save, Camera, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SettingsScreenProps {
    user: User | null;
    onBack: () => void;
    onUpdateUser: (updatedUser: Partial<User>) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onBack, onUpdateUser }) => {
    const [name, setName] = useState(user?.name || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: name, avatar_url: avatarUrl })
                .eq('id', user.id);

            if (error) throw error;

            onUpdateUser({ name, avatar: avatarUrl });
            setSuccess('Perfil atualizado com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar perfil');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        setError(null);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
            setSuccess('Foto carregada! Salve para confirmar.');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar imagem');
        } finally {
            setIsUploading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('A nova palavra-passe deve ter pelo menos 6 caracteres');
            return;
        }

        setIsUpdatingPassword(true);
        setError(null);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setSuccess('Palavra-passe alterada com sucesso!');
            setNewPassword('');
            setCurrentPassword('');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao alterar palavra-passe');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const settingsGroups = [
        {
            title: 'Conta',
            items: [
                { icon: UserIcon, label: 'Perfil', detail: 'Editar nome e informações' },
                { icon: Shield, label: 'Segurança', detail: 'Palavra-passe e acesso' },
            ]
        },
        {
            title: 'Preferências',
            items: [
                { icon: Bell, label: 'Notificações', detail: 'Personalizar alertas' },
                { icon: Moon, label: 'Modo Escuro', detail: 'Auto', toggle: true },
                { icon: Globe, label: 'Idioma', detail: 'Português (AO)' },
            ]
        },
        {
            title: 'Suporte',
            items: [
                { icon: HelpCircle, label: 'Centro de Ajuda', detail: 'Dúvidas frequentes' },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#0B0B0B]/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-lg font-black uppercase tracking-widest text-[#FFD700]">Definições</h2>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || name === user?.name}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white disabled:opacity-50 transition-all active:scale-95"
                >
                    {isSaving ? '...' : <><Save size={14} /> Guardar</>}
                </button>
            </div>

            <div className="p-4 space-y-8 pb-32">
                {/* Avatar Section */}
                <section className="flex flex-col items-center gap-4 py-4 animate-in zoom-in duration-500">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-[#1A1A1A] border-4 border-[#FFD700]/20 overflow-hidden relative shadow-2xl">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/10 uppercase font-black text-xs">Sem Foto</div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 size={24} className="text-[#FFD700] animate-spin" />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-[#FFD700] text-black rounded-full cursor-pointer hover:scale-110 active:scale-90 transition-all shadow-lg">
                            <Camera size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                        </label>
                    </div>
                    <div className="text-center">
                        <h4 className="font-black text-lg italic uppercase">{user?.name}</h4>
                        <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em]">{user?.role}</p>
                    </div>
                </section>

                {/* Profile Edit Section */}
                <section className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Informação Básica</p>
                    <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Introduz o teu nome"
                                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm font-bold focus:border-[#FFD700] outline-none transition-all placeholder:text-white/10 hover-glow"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">E-mail</label>
                            <input
                                type="email"
                                value={user?.email}
                                disabled
                                className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm font-bold opacity-50 cursor-not-allowed"
                            />
                        </div>
                    </div>
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in duration-300">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="bg-[#C00000]/10 border border-[#C00000]/30 text-[#C00000] px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in duration-300">
                            {error}
                        </div>
                    )}
                </section>

                {/* Security Section (Change Password) */}
                <section className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Segurança</p>
                    <form onSubmit={handleChangePassword} className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5 space-y-5">
                        <div className="space-y-4">
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input
                                    required
                                    type={showPasswords ? "text" : "password"}
                                    placeholder="Nova Palavra-passe"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-[#FFD700] transition-all font-bold text-sm hover-glow"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#FFD700]"
                                >
                                    {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={isUpdatingPassword || !newPassword}
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#FFD700] hover:text-black transition-all disabled:opacity-20 flex items-center justify-center gap-2 premium-bounce shadow-lg"
                            >
                                {isUpdatingPassword ? <Loader2 size={16} className="animate-spin" /> : 'Atualizar Palavra-passe'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Settings List */}
                {settingsGroups.map((group, idx) => (
                    <section key={idx} className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">{group.title}</p>
                        <div className="bg-[#1A1A1A] rounded-3xl border border-white/5 overflow-hidden">
                            {group.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-[#FFD700]">
                                            <item.icon size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{item.label}</p>
                                            <p className="text-[10px] text-white/30 uppercase tracking-tighter">{item.detail}</p>
                                        </div>
                                    </div>
                                    {item.toggle ? (
                                        <div className="w-10 h-5 bg-[#FFD700]/10 rounded-full relative border border-[#FFD700]/20">
                                            <div className="absolute right-1 top-0.5 w-3.5 h-3.5 bg-[#FFD700] rounded-full shadow-lg"></div>
                                        </div>
                                    ) : (
                                        <ChevronLeft size={16} className="text-white/10 rotate-180" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                <div className="pt-4 text-center">
                    <p className="text-[9px] text-white/10 font-black uppercase tracking-[0.5em] italic">AngoPlace Market • Versão 1.2.0</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;
