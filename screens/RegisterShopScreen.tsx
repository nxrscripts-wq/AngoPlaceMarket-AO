
import React, { useState } from 'react';
import { User, UserRole, Shop, AppScreen } from '../types';
import { Store, FileText, MapPin, Phone, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Upload, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RegisterShopScreenProps {
    user: User;
    onBack: () => void;
    onSuccess: () => void;
}

const RegisterShopScreen: React.FC<RegisterShopScreenProps> = ({ user, onBack, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form States
    const [shopName, setShopName] = useState('');
    const [shopDescription, setShopDescription] = useState('');
    const [shopCategory, setShopCategory] = useState('');
    const [nif, setNif] = useState('');
    const [commercialLicense, setCommercialLicense] = useState('');
    const [province, setProvince] = useState('Luanda');
    const [municipality, setMunicipality] = useState('');
    const [street, setStreet] = useState('');
    const [commercialPhone, setCommercialPhone] = useState('');

    const validateStep = (s: number) => {
        setError(null);
        if (s === 1) {
            if (!shopName || shopName.length < 3) return "O nome da loja deve ter pelo menos 3 caracteres";
            if (!shopDescription || shopDescription.length < 10) return "A descrição deve ser mais detalhada (min. 10 caracteres)";
            if (!shopCategory) return "Selecione uma categoria";
        }
        if (s === 2) {
            const nifRegex = /^\d{10}$/; // Simple 10-digit NIF check for example
            if (!nifRegex.test(nif)) return "Insira um NIF válido com 10 dígitos (Padrão AGT)";
            if (!commercialLicense || commercialLicense.length < 5) return "Insira o número do seu Alvará Comercial";
        }
        if (s === 3) {
            if (!municipality) return "O município é obrigatório";
            if (!street) return "O endereço de rua é obrigatório";
            const phoneRegex = /^\d{9}$/;
            if (!phoneRegex.test(commercialPhone)) return "Insira um número de telefone comercial válido (9 dígitos)";
        }
        return null;
    };

    const handleNext = () => {
        const err = validateStep(step);
        if (err) {
            setError(err);
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        const err = validateStep(3);
        if (err) {
            setError(err);
            return;
        }

        setIsLoading(true);
        try {
            // In a real app, we would create a new entry in 'shops' table
            // and update user metadata via a secure edge function

            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    role: UserRole.SHOP_OWNER,
                    shop_data: {
                        name: shopName,
                        nif: nif,
                        category: shopCategory,
                        is_verified: false // Requires admin approval
                    }
                }
            });

            if (updateError) throw updateError;

            onSuccess();
        } catch (err: any) {
            setError(err.message || "Erro ao registrar loja. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderProgress = () => (
        <div className="flex justify-between items-center mb-10 px-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${step >= i ? 'bg-[#FFD700] text-black shadow-lg shadow-yellow-500/20' : 'bg-[#1A1A1A] text-white/20 border border-white/5'}`}>
                        {step > i ? <CheckCircle2 size={16} /> : i}
                    </div>
                    {i < 4 && <div className={`w-12 h-0.5 mx-2 ${step > i ? 'bg-[#FFD700]' : 'bg-[#1A1A1A]'}`} />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white p-6 pb-32">
            <div className="max-w-md mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-[#1A1A1A] rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter">Registo Profissional</h1>
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest italic">Padrão de Segurança AngoPlace</p>
                    </div>
                </div>

                {renderProgress()}

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {error && (
                        <div className="bg-[#C00000]/10 border border-[#C00000]/30 text-[#C00000] px-4 py-3 rounded-2xl text-[10px] font-bold flex items-center gap-2 mb-6">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black italic uppercase text-[#FFD700]">Identidade da Loja</h2>
                                <p className="text-xs text-white/50">Como os clientes verão o seu negócio.</p>
                            </div>
                            <div className="space-y-4 pt-4">
                                <div className="relative group">
                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFD700] transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Nome Comercial da Loja"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm"
                                    />
                                </div>
                                <div className="relative group">
                                    <textarea
                                        placeholder="Descrição do Negócio (O que vendem?)"
                                        rows={4}
                                        value={shopDescription}
                                        onChange={(e) => setShopDescription(e.target.value)}
                                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-4 px-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm resize-none"
                                    />
                                </div>
                                <select
                                    value={shopCategory}
                                    onChange={(e) => setShopCategory(e.target.value)}
                                    className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-4 px-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm appearance-none"
                                >
                                    <option value="">Selecionar Categoria do Negócio</option>
                                    <option value="ELECTRONICS">Eletrónicos e Tecnologia</option>
                                    <option value="FASHION">Moda e Acessórios</option>
                                    <option value="HOME">Casa e Decoração</option>
                                    <option value="AUTO">Automóveis e Peças</option>
                                    <option value="SERVICES">Prestação de Serviços</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black italic uppercase text-[#FFD700]">Legalidade e Impostos</h2>
                                <p className="text-xs text-white/50">Documentação necessária para verificação AGT.</p>
                            </div>
                            <div className="space-y-4 pt-4">
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFD700] transition-colors" size={18} />
                                    <input
                                        type="text"
                                        maxLength={10}
                                        placeholder="NIF (Número de Identificação Fiscal)"
                                        value={nif}
                                        onChange={(e) => setNif(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm"
                                    />
                                </div>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFD700] transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Número do Alvará Comercial"
                                        value={commercialLicense}
                                        onChange={(e) => setCommercialLicense(e.target.value)}
                                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm"
                                    />
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 text-[#FFD700]">
                                        <Upload size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Upload de Documento (Opcional)</span>
                                    </div>
                                    <p className="text-[9px] text-white/30 uppercase leading-relaxed">Pode anexar o PDF do seu Alvará para uma verificação mais rápida pela nossa equipa de compliance.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black italic uppercase text-[#FFD700]">Localização e Contacto</h2>
                                <p className="text-xs text-white/50">Onde a sua loja está fisicamente sediada.</p>
                            </div>
                            <div className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={province}
                                        onChange={(e) => setProvince(e.target.value)}
                                        className="bg-[#1A1A1A] border border-white/5 rounded-2xl py-4 px-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm"
                                    >
                                        <option value="Luanda">Luanda</option>
                                        <option value="Benguela">Benguela</option>
                                        <option value="Huambo">Huambo</option>
                                        <option value="Huíla">Huíla</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Município"
                                        value={municipality}
                                        onChange={(e) => setMunicipality(e.target.value)}
                                        className="bg-[#1A1A1A] border border-white/5 rounded-2xl py-4 px-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm"
                                    />
                                </div>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFD700] transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Endereço (Rua, Bairro, Edifício)"
                                        value={street}
                                        onChange={(e) => setStreet(e.target.value)}
                                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm"
                                    />
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700] font-black text-sm">+244</div>
                                    <input
                                        type="tel"
                                        maxLength={9}
                                        placeholder="Telefone Comercial"
                                        value={commercialPhone}
                                        onChange={(e) => setCommercialPhone(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 text-center py-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFD700]/10 rounded-full border border-[#FFD700]/20 text-[#FFD700] mb-4">
                                <Building2 size={40} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black italic uppercase">Tudo em conformidade</h2>
                                <p className="text-xs text-white/50 max-w-[280px] mx-auto">Ao submeter, a nossa equipa revisará os dados fiscais e de localização num prazo de 24h a 48h.</p>
                            </div>

                            <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-white/5 text-left space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase border-b border-white/5 pb-2">
                                    <span className="text-white/40">Loja</span>
                                    <span className="text-[#FFD700]">{shopName}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase border-b border-white/5 pb-2">
                                    <span className="text-white/40">NIF</span>
                                    <span>{nif}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-white/40">Local</span>
                                    <span>{province}, {municipality}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-4 bg-[#FFD700]/5 rounded-2xl border border-[#FFD700]/10 text-left">
                                <div className="p-2 bg-[#FFD700]/10 rounded-lg text-[#FFD700]">
                                    <ShieldCheck size={20} />
                                </div>
                                <p className="text-[9px] text-white/60 leading-tight">Ao clicar em "Finalizar Registo", declara que as informações são verdadeiras nos termos da lei angolana.</p>
                            </div>
                        </div>
                    )}

                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B] to-transparent">
                        {step < 4 ? (
                            <button
                                onClick={handleNext}
                                className="w-full bg-[#FFD700] text-black h-16 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-white active:scale-95 transition-all shadow-xl shadow-yellow-500/10"
                            >
                                Próximo Passo <ArrowRight size={20} />
                            </button>
                        ) : (
                            <button
                                disabled={isLoading}
                                onClick={handleSubmit}
                                className="w-full bg-[#FFD700] text-black h-16 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-white active:scale-95 transition-all shadow-xl shadow-yellow-500/10 disabled:opacity-50"
                            >
                                {isLoading ? 'A Processar Verificação...' : 'Finalizar e Solicitar Abertura'}
                                {!isLoading && <CheckCircle2 size={20} />}
                            </button>
                        )}
                        <p className="text-center mt-4 text-[8px] text-white/20 uppercase font-black tracking-[0.3em]">Protocolo de Segurança AngoPlace • Luanda 2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterShopScreen;
