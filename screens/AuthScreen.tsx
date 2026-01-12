
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { Mail, Lock, LogIn, ArrowRight, Chrome, User as UserIcon, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
}

const AuthScreen: React.FC<AuthScreenProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendTimer]);

  const mapSupabaseError = (err: any): string => {
    const msg = err.message?.toLowerCase() || '';
    if (msg.includes('invalid login credentials')) return 'E-mail ou palavra-passe incorretos';
    if (msg.includes('user already registered')) return 'Este e-mail já está registado';
    if (msg.includes('signup disabled')) return 'O registo está temporariamente desativado';
    if (msg.includes('rate limit exceeded')) return 'Demasiadas tentativas. Tenta mais tarde';
    if (msg.includes('otp expired')) return 'O código expirou. Solicita um novo';
    if (msg.includes('invalid search path')) return 'Erro interno de configuração';
    return err.message || 'Ocorreu um erro inesperado';
  };

  const sanitizePhoneNumber = (phone: string) => {
    // Remove everything that's not a digit
    let cleaned = phone.replace(/\D/g, '');
    // If it starts with 244 and has more than 9 digits, it probably includes the country code twice or leading 244
    if (cleaned.startsWith('244') && cleaned.length > 9) {
      cleaned = cleaned.substring(3);
    }
    return cleaned;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (loginMethod === 'phone') {
      const cleanPhone = sanitizePhoneNumber(phoneNumber);
      if (!cleanPhone || cleanPhone.length < 9) {
        setError('Por favor, insere um número de telefone válido (9 dígitos)');
        return;
      }

      if (!showOtp) {
        setIsLoading(true);
        try {
          const { error } = await supabase.auth.signInWithOtp({
            phone: `+244${cleanPhone}`,
          });
          if (error) throw error;
          setShowOtp(true);
          setResendTimer(60);
          setSuccess('Código enviado para o seu telemóvel!');
        } catch (err: any) {
          setError(mapSupabaseError(err));
        } finally {
          setIsLoading(false);
        }
        return;
      }

      if (otp.length < 4) {
        setError('O código deve ter pelo menos 4 dígitos');
        return;
      }

      setIsLoading(true);
      try {
        const cleanPhone = sanitizePhoneNumber(phoneNumber);
        const { error } = await supabase.auth.verifyOtp({
          phone: `+244${cleanPhone}`,
          token: otp,
          type: 'sms',
        });
        if (error) throw error;
        setSuccess('Autenticado com sucesso!');
      } catch (err: any) {
        setError(mapSupabaseError(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Email/Password logic

    // Validate email
    if (!validateEmail(email)) {
      setError('Por favor, insere um e-mail válido');
      return;
    }

    // New validations for registration
    if (!isLogin) {
      if (!fullName || fullName.trim().length < 3) {
        setError('Por favor, insere o teu nome completo');
        return;
      }
      if (password !== confirmPassword) {
        setError('As palavras-passe não coincidem');
        return;
      }
      if (!termsAccepted) {
        setError('Deves aceitar os termos e condições');
        return;
      }
    }

    // Validate password
    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
              role: UserRole.USER,
              wallet_balance: 0
            }
          }
        });
        if (error) throw error;
        // Supabase sends a confirmation email by default unless configured otherwise
        if (!error) {
          setSuccess('Conta criada! Verifica o teu e-mail para confirmar.');
        }
      }
    } catch (err: any) {
      setError(mapSupabaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      const cleanPhone = sanitizePhoneNumber(phoneNumber);
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+244${cleanPhone}`,
      });
      if (error) throw error;
      setResendTimer(60);
      setSuccess('Novo código enviado!');
    } catch (err: any) {
      setError(mapSupabaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro no login com Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#C00000]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#FFD700]/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md space-y-10 relative z-10">
        {/* Splash Logo Section */}
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 opacity-20 animate-pulse"></div>
            <BrandLogo variant="horizontal" size="xl" className="relative" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-[#FFD700]">
              {isLogin ? 'Bem-vindo de volta' : 'Crie a sua conta'}
            </h2>
            <p className="text-white/40 font-black text-[10px] tracking-[0.4em] uppercase">Portal de Acesso Seguro • Angola</p>
          </div>
        </div>

        <form onSubmit={handleAction} className="space-y-4">
          {/* Status Messages */}
          {error && (
            <div className="bg-[#C00000]/10 border border-[#C00000]/30 text-[#C00000] px-4 py-3 rounded-2xl text-xs font-bold text-center animate-in fade-in duration-300">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-2xl text-xs font-bold text-center animate-in fade-in duration-300">
              {success}
            </div>
          )}

          {/* Login Method Toggle */}
          <div className="flex bg-[#1A1A1A] p-1 rounded-2xl border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => { setLoginMethod('phone'); setShowOtp(false); setError(null); setSuccess(null); }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'phone' ? 'bg-[#FFD700] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Telefone
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('email'); setError(null); setSuccess(null); }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'email' ? 'bg-[#FFD700] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              E-mail
            </button>
          </div>

          <div className="space-y-3">
            {loginMethod === 'phone' ? (
              <>
                <div className="relative group">
                  <LogIn className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#FFD700] transition-colors ${error && !phoneNumber ? 'text-[#C00000]' : 'text-white/20'}`} size={18} />
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 text-[#FFD700] font-black text-sm">+244</div>
                  <input
                    required
                    type="tel"
                    maxLength={9}
                    placeholder="Número de Telefone"
                    value={phoneNumber}
                    disabled={showOtp}
                    onChange={(e) => { setPhoneNumber(e.target.value); setError(null); }}
                    className={`w-full bg-[#1A1A1A] border rounded-2xl py-4 pl-24 pr-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm ${error && !phoneNumber ? 'border-[#C00000]' : 'border-white/5'} disabled:opacity-50`}
                  />
                </div>
                {showOtp && (
                  <>
                    <div className="relative group animate-in slide-in-from-top-4 duration-300">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#FFD700] transition-colors ${error && !otp ? 'text-[#C00000]' : 'text-white/20'}`} size={18} />
                      <input
                        required
                        type="text"
                        maxLength={6}
                        placeholder="Código OTP (4-6 dígitos)"
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value); setError(null); }}
                        className={`w-full bg-[#1A1A1A] border rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm ${error && !otp ? 'border-[#C00000]' : 'border-white/5'}`}
                      />
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        disabled={resendTimer > 0 || isLoading}
                        onClick={handleResendOtp}
                        className="text-[10px] font-black uppercase tracking-widest text-[#FFD700] hover:text-white transition-colors disabled:opacity-50"
                      >
                        {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Não recebi o código (Reenviar)'}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {!isLogin && (
                  <div className="relative group animate-in slide-in-from-top-2 duration-300">
                    <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#FFD700] transition-colors ${error && !fullName ? 'text-[#C00000]' : 'text-white/20'}`} size={18} />
                    <input
                      required
                      type="text"
                      placeholder="Nome Completo"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setError(null); }}
                      className={`w-full bg-[#1A1A1A] border rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm ${error && !fullName ? 'border-[#C00000]' : 'border-white/5'}`}
                    />
                  </div>
                )}
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#FFD700] transition-colors ${error && !email ? 'text-[#C00000]' : 'text-white/20'}`} size={18} />
                  <input
                    required
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className={`w-full bg-[#1A1A1A] border rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#FFD700] transition-all font-bold text-sm ${error && !email ? 'border-[#C00000]' : 'border-white/5'}`}
                  />
                </div>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#FFD700] transition-colors ${error && password.length < 6 ? 'text-[#C00000]' : 'text-white/20'}`} size={18} />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Palavra-passe (mín. 6 caracteres)"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    className={`w-full bg-[#1A1A1A] border rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-[#FFD700] transition-all font-bold text-sm ${error && password.length < 6 ? 'border-[#C00000]' : 'border-white/5'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#FFD700] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!isLogin && (
                  <div className="relative group animate-in slide-in-from-top-2 duration-300">
                    <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#FFD700] transition-colors ${error && confirmPassword !== password ? 'text-[#C00000]' : 'text-white/20'}`} size={18} />
                    <input
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmar Palavra-passe"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                      className={`w-full bg-[#1A1A1A] border rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-[#FFD700] transition-all font-bold text-sm ${error && confirmPassword !== password ? 'border-[#C00000]' : 'border-white/5'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#FFD700] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                )}
                {!isLogin && (
                  <div className="flex items-center gap-3 px-2 py-1 animate-in slide-in-from-top-2 duration-300">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded border-white/5 bg-[#1A1A1A] accent-[#FFD700] cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-[10px] text-white/40 cursor-pointer select-none">
                      Aceito os <span className="text-[#FFD700] font-bold">Termos e Condições</span> de uso do AngoPlace.
                    </label>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="w-full bg-[#FFD700] text-black h-14 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-white active:scale-95 transition-all shadow-xl shadow-yellow-500/10 disabled:opacity-50"
          >
            {isLoading ? 'Processando...' : (loginMethod === 'phone' ? (showOtp ? 'Verificar Código' : 'Gerar PIN SMS') : (isLogin ? 'Entrar Agora' : 'Criar Minha Conta'))}
            {!isLoading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[8px] uppercase font-black tracking-widest">
            <span className="bg-[#0B0B0B] px-4 text-white/10 italic">AngoPlace Ecosystem</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-[#1A1A1A] border border-white/10 text-white h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-[#222] active:scale-95 transition-all group"
        >
          <div className="bg-white p-1 rounded-full group-hover:rotate-12 transition-transform">
            <Chrome size={18} className="text-black" />
          </div>
          Login com Google
        </button>

        <div className="text-center pt-4">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
              setPassword('');
              setConfirmPassword('');
              setOtp('');
              setShowOtp(false);
            }}
            className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-[#FFD700] transition-colors"
          >
            {isLogin ? 'Novo por aqui? Regista-te' : 'Já és cliente? Entrar'}
          </button>
        </div>
      </div>

      <div className="fixed bottom-8 text-center">
        <p className="text-[9px] text-white/10 font-black uppercase tracking-[0.5em] italic">Marketplace Premium Angola</p>
      </div>
    </div>
  );
};

export default AuthScreen;
