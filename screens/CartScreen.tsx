
import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2, Plus, Minus, ShieldCheck, ChevronRight, Landmark, X,
  CheckCircle2, AlertTriangle, Smartphone, Loader2, Info, Clock, ArrowRight, ShoppingBag,
  CreditCard, Check, Upload, FileText
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PaymentStatus } from '../types';

interface Toast {
  message: string;
  type: 'success' | 'error';
  id: number;
}

const CartScreen: React.FC = () => {
  const { user } = useAuth();
  const { items, removeFromCart, updateQuantity, clearCart, getSubtotal, getShipping, getTotal, getItemCount } = useCart();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.IDLE);
  const [phoneNumber, setPhoneNumber] = useState('923');
  const [timer, setTimer] = useState(120);
  const [paymentMethod, setPaymentMethod] = useState<'MCX' | 'IBAN'>('MCX');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const total = getTotal();

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const cleanUpTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (paymentStatus === PaymentStatus.WAITING_PIN && timer > 0) {
      cleanUpTimer(); // Clear any existing timer before starting new
      timerRef.current = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0 && paymentStatus === PaymentStatus.WAITING_PIN) {
      setPaymentStatus(PaymentStatus.TIMEOUT);
      cleanUpTimer();
    }

    // Auto success for demo if timer goes below 10 for MCX
    if (paymentStatus === PaymentStatus.WAITING_PIN && timer <= 110 && timer > 100) {
      // Just a demo trick to auto-verify after 10s
    }

    // New cleanup logic on unmount or status change
    return () => cleanUpTimer();
  }, [paymentStatus, timer]);

  const createOrder = async () => {
    if (!user) return;

    try {
      // 1. Create Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: total,
          status: 'PAID' // Assuming successful payment
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        variations: item.selectedVariations
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      console.log('Order created successfully:', orderData.id);
    } catch (err) {
      console.error('Error creating order:', err);
      showToast('Erro ao gravar encomenda. Contacte o suporte.', 'error');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setProofFile(event.target.files[0]);
      showToast('Comprovativo selecionado!', 'success');
    }
  };

  const handlePayment = () => {
    if (items.length === 0) return;

    if (!user) {
      showToast('Por favor, faça login para finalizar a compra.', 'error');
      // Ideally redirect to auth here? Or just toast.
      // For now toast is safer as redirect requires prop or context method.
      return;
    }

    if (paymentMethod === 'MCX') {
      if (!phoneNumber || phoneNumber.length < 9) {
        showToast('Digita um número válido (9 dígitos)', 'error');
        return;
      }
      setPaymentStatus(PaymentStatus.PROCESSING);
      setTimeout(() => {
        setPaymentStatus(PaymentStatus.WAITING_PIN);
        showToast('Solicitação enviada! Confirma no teu telemóvel.', 'success');

        // Emulate success after 5 seconds just for demo flow completion
        setTimeout(async () => {
          await createOrder();
          setPaymentStatus(PaymentStatus.SUCCESS);
          clearCart();
        }, 5000);

      }, 2000);
    }
    else if (paymentMethod === 'IBAN') {
      if (!proofFile) {
        showToast('Por favor, envia o comprovativo de transferência.', 'error');
        return;
      }
      setPaymentStatus(PaymentStatus.PROCESSING);
      // Simulate IBAN verification delay
      setTimeout(async () => {
        await createOrder();
        setPaymentStatus(PaymentStatus.SUCCESS);
        setProofFile(null); // Reset file
        clearCart();
        showToast('Transferência confirmada com sucesso!', 'success');
      }, 3000);
    }
  };

  const resetPayment = () => {
    cleanUpTimer();
    setPaymentStatus(PaymentStatus.IDLE);
    setTimer(120);
    setProofFile(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white pb-32 animate-in slide-in-from-right duration-300">
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">
            <span className="text-[#FFD700]">Meu</span> Carrinho
          </h2>
          <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">
            {getItemCount()} items
          </div>
        </header>

        {paymentStatus === PaymentStatus.SUCCESS ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-[#FFD700] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,215,0,0.3)]">
              <Check size={48} className="text-black" strokeWidth={4} />
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase italic mb-2">Pagamento Confirmado!</h3>
              <p className="text-white/50">A sua encomenda foi processada com sucesso.</p>
              <p className="text-[#FFD700] text-sm font-bold mt-2">ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-all"
            >
              Continuar a Comprar
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.length > 0 ? (
                items.map(item => (
                  <div key={item.id} className="bg-[#1A1A1A] p-4 rounded-2xl flex gap-4 border border-white/5 hover:border-[#FFD700]/50 transition-colors group">
                    <div className="w-24 h-24 bg-white/5 rounded-xl overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold leading-tight line-clamp-2">{item.name}</h3>
                          <button onClick={() => removeFromCart(item.id)} className="text-white/20 hover:text-red-500 transition-colors p-1">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <p className="text-[#FFD700] font-black text-lg mt-1">{item.price.toLocaleString()} Kz</p>
                        {item.selectedVariations && Object.keys(item.selectedVariations).length > 0 && (
                          <div className="flex gap-2 mt-1">
                            {Object.values(item.selectedVariations).map((val, i) => (
                              <span key={i} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/50">{val}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 bg-black/30 w-fit rounded-lg p-1 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center bg-white/5 rounded hover:bg-white/10 active:scale-90 transition-all text-white/70"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-[#FFD700] rounded text-black hover:bg-[#FFD700]/80 active:scale-90 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag size={40} className="text-white/10" />
                  </div>
                  <p className="text-lg font-black uppercase italic text-white/30">Carrinho vazio</p>
                  <p className="text-xs text-white/20 mt-2 max-w-[200px]">Adicione produtos ao carrinho para continuar as suas compras</p>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <>
                {/* Payment Settings */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2">
                    Escolha o Método de Pagamento
                  </h3>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setPaymentMethod('MCX')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'MCX'
                        ? 'bg-[#1A1A1A] border-[#FFD700] text-white'
                        : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5'
                        }`}
                    >
                      <Smartphone size={24} className={paymentMethod === 'MCX' ? 'text-[#FFD700]' : ''} />
                      <span className="text-xs font-bold uppercase">Multicaixa Express</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('IBAN')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'IBAN'
                        ? 'bg-[#1A1A1A] border-[#FFD700] text-white'
                        : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5'
                        }`}
                    >
                      <CreditCard size={24} className={paymentMethod === 'IBAN' ? 'text-[#FFD700]' : ''} />
                      <span className="text-xs font-bold uppercase">Transferência IBAN</span>
                    </button>
                  </div>

                  {paymentMethod === 'MCX' ? (
                    <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-white/10 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/10">
                          <Smartphone className="text-[#FFD700]" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-bold">Número de Telefone</p>
                          <p className="text-[10px] text-white/40 uppercase">Vinculado ao teu MCX Express</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-black/50 p-3 rounded-xl border border-white/5">
                        <span className="text-[#FFD700] font-black">+244</span>
                        <input
                          type="tel"
                          maxLength={9}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="9XX XXX XXX"
                          className="bg-transparent border-none outline-none flex-grow text-white font-black tracking-widest"
                        />
                        <button
                          onClick={() => setPhoneNumber('923456789')}
                          className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white/50"
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-white/10 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/10">
                          <Landmark className="text-[#FFD700]" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-bold">Dados Bancários</p>
                          <p className="text-[10px] text-white/40 uppercase">Faça a transferência para:</p>
                        </div>
                      </div>

                      <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-dashed border-white/20">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/50">Banco</span>
                          <span className="font-bold">BAI</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/50">IBAN</span>
                          <span className="font-mono text-[#FFD700] tracking-wider select-all">AO06 0040 0000 1234 5678 9012 3</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/50">Beneficiário</span>
                          <span className="font-bold">AngoPlace Lda</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-bold text-white/60 uppercase">Comprovativo de Transferência</p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*,.pdf"
                        />

                        {!proofFile ? (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-16 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-white/40 hover:bg-white/5 hover:border-[#FFD700] hover:text-[#FFD700] transition-all group"
                          >
                            <Upload size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase">Carregar Talão / Comprovativo</span>
                          </button>
                        ) : (
                          <div className="w-full bg-[#FFD700]/10 border border-[#FFD700] rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#FFD700] rounded-lg flex items-center justify-center text-black">
                                <FileText size={20} />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-white truncate max-w-[150px]">{proofFile.name}</p>
                                <p className="text-[10px] text-white/50">{(proofFile.size / 1024).toFixed(2)} KB</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setProofFile(null)}
                              className="p-2 hover:bg-black/20 rounded-lg text-white/60 hover:text-white transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 items-start bg-[#FFD700]/10 p-3 rounded-lg">
                        <Info size={16} className="text-[#FFD700] shrink-0 mt-0.5" />
                        <p className="text-xs text-[#FFD700]/80">
                          O pagamento será validado após o envio do comprovativo.
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* Summary */}
                <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between text-sm text-white/60"><span>Subtotal</span><span>{subtotal.toLocaleString()} Kz</span></div>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Entrega Luanda</span>
                    <span className={shipping === 0 ? 'text-green-500 font-bold' : ''}>
                      {shipping === 0 ? 'GRÁTIS' : `${shipping.toLocaleString()} Kz`}
                    </span>
                  </div>
                  {shipping === 0 && subtotal > 0 && (
                    <div className="text-[10px] text-green-500/60 uppercase font-bold">
                      ✓ Frete grátis para compras acima de 100.000 Kz
                    </div>
                  )}
                  <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-black text-[#FFD700]">{total.toLocaleString()} Kz</span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  className={`w-full h-16 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${paymentMethod === 'IBAN' && !proofFile
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-[#FFD700] text-black shadow-[#FFD700]/10 hover:bg-white'
                    }`}
                >
                  {paymentMethod === 'MCX' ? 'PAGAR COM EXPRESS' : 'CONFIRMAR TRANSFERÊNCIA'} <ArrowRight size={20} />
                </button>
              </>
            )}

            {/* Processing / Waiting UI Overlay */}
            {(paymentStatus === PaymentStatus.PROCESSING || paymentStatus === PaymentStatus.WAITING_PIN) && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
                {paymentStatus === PaymentStatus.PROCESSING && (
                  <div className="text-center space-y-4 animate-in zoom-in duration-300">
                    <Loader2 size={64} className="text-[#FFD700] animate-spin mx-auto" />
                    <h3 className="text-xl font-black uppercase italic">
                      {paymentMethod === 'MCX' ? 'Iniciando Transação...' : 'Validando Comprovativo...'}
                    </h3>
                    <p className="text-white/40 text-sm">
                      {paymentMethod === 'MCX' ? 'Estamos a comunicar com a rede Multicaixa.' : 'Aguarde um momento.'}
                    </p>
                  </div>
                )}

                {paymentStatus === PaymentStatus.WAITING_PIN && (
                  <div className="w-full max-w-sm bg-[#1A1A1A] p-8 rounded-[40px] border border-[#FFD700]/30 text-center space-y-6 relative overflow-hidden animate-in slide-in-from-bottom duration-500">
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                      <div className="h-full bg-[#FFD700] transition-all duration-1000" style={{ width: `${(timer / 120) * 100}%` }} />
                    </div>

                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto border-4 border-[#FFD700] animate-pulse">
                      <Smartphone size={32} className="text-[#FFD700]" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase italic">Confirma no App!</h3>
                      <p className="text-sm text-white/60">Enviamos uma notificação para o <span className="text-white font-bold">+244 {phoneNumber}</span>.</p>
                      <p className="text-xs text-white/30">Entra no teu Multicaixa Express agora e introduz o teu PIN.</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[#FFD700] font-black text-xl">
                      <Clock size={20} /> {formatTime(timer)}
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl flex items-start gap-3 text-left">
                      <Info size={16} className="text-[#FFD700] shrink-0 mt-1" />
                      <p className="text-[10px] text-white/50 leading-relaxed uppercase font-bold tracking-tight">
                        Não recebes nada? Verifica se o número está correto e se tens dados móveis ativos.
                      </p>
                    </div>

                    <button onClick={resetPayment} className="text-white/30 text-xs font-black uppercase underline hover:text-white">Cancelar</button>
                  </div>
                )}
              </div>
            )}

            {/* Warning / Timeout UI */}
            {paymentStatus === PaymentStatus.TIMEOUT && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-[#C00000] rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle size={48} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase italic">Tempo Expirado</h3>
                    <p className="text-white/40">Não detectamos a confirmação no tempo limite. Tenta novamente.</p>
                  </div>
                  <button onClick={resetPayment} className="bg-[#FFD700] text-black px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Tentar Novamente</button>
                </div>
              </div>
            )}

          </>
        )}

        {/* Security Info */}
        <div className="flex items-center justify-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-widest py-10">
          <ShieldCheck size={14} /> Integração Homologada via EMIS / Angola
        </div>

        {/* Toasts */}
        <div className="fixed bottom-32 left-0 right-0 px-4 space-y-2 z-[60]">
          {toasts.map((toast) => (
            <div key={toast.id} className={`flex items-center justify-between p-4 rounded-xl border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${toast.type === 'success' ? 'bg-[#0B0B0B] border-[#FFD700] text-[#FFD700]' : 'bg-[#0B0B0B] border-[#C00000] text-[#C00000]'}`}>
              <span className="text-xs font-black uppercase">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)}><X size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CartScreen;
