import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus } from '../types';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Package, Truck, Clock, CheckCircle2, CreditCard, MapPin, AlertCircle, ShoppingBag, ArrowRight, Smartphone } from 'lucide-react';

interface MyOrdersScreenProps {
    user: User | null;
    onBack: () => void;
}

const MyOrdersScreen: React.FC<MyOrdersScreenProps> = ({ user, onBack }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState<string | null>(null);

    const fetchOrders = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const channel = supabase
            .channel('order_updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user?.id}` }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handlePayment = async (orderId: string) => {
        setIsPaying(orderId);
        // Simulate payment process
        setTimeout(async () => {
            try {
                const { error } = await supabase
                    .from('orders')
                    .update({ status: OrderStatus.PAGO })
                    .eq('id', orderId);

                if (error) throw error;
                fetchOrders();
            } catch (err) {
                console.error('Payment simulation error:', err);
            } finally {
                setIsPaying(null);
            }
        }, 2000);
    };

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDENTE: return <Clock className="text-white/30" size={16} />;
            case OrderStatus.ATRIBUIDO: return <Truck className="text-blue-500" size={16} />;
            case OrderStatus.EM_POSSE: return <Package className="text-orange-500" size={16} />;
            case OrderStatus.PAGO: return <CheckCircle2 className="text-green-500" size={16} />;
            case OrderStatus.EM_TRANSITO: return <Truck className="text-[#FFD700] animate-pulse" size={16} />;
            case OrderStatus.ENTREGUE: return <CheckCircle2 className="text-green-500" size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white pb-32 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#0B0B0B]/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-lg font-black uppercase tracking-widest text-[#FFD700]">Minhas Encomendas</h2>
            </div>

            <div className="p-4 space-y-6">
                {isLoading ? (
                    <div className="py-20 text-center text-white/20 font-black uppercase text-xs animate-pulse">
                        Sincronizando encomendas...
                    </div>
                ) : orders.length > 0 ? (
                    orders.map(order => (
                        <div key={order.id} className="bg-[#1A1A1A] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Encomenda #{order.id.slice(0, 8)}</p>
                                        <p className="text-xl font-black text-[#FFD700] mt-1">{order.total.toLocaleString()} Kz</p>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${order.status === OrderStatus.EM_POSSE ? 'bg-orange-500 text-black' :
                                            order.status === OrderStatus.PAGO ? 'bg-green-500/20 text-green-500' :
                                                'bg-white/10 text-white'
                                        }`}>
                                        {getStatusIcon(order.status)}
                                        {order.status}
                                    </div>
                                </div>

                                {/* Tracking Progress */}
                                <div className="py-4">
                                    <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="absolute h-full bg-[#FFD700] transition-all duration-1000"
                                            style={{
                                                width:
                                                    order.status === OrderStatus.PENDENTE ? '10%' :
                                                        order.status === OrderStatus.ATRIBUIDO ? '30%' :
                                                            order.status === OrderStatus.EM_POSSE ? '50%' :
                                                                order.status === OrderStatus.PAGO ? '70%' :
                                                                    order.status === OrderStatus.EM_TRANSITO ? '90%' : '100%'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {order.status === OrderStatus.EM_POSSE && (
                                        <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-2xl p-4 space-y-4 animate-in zoom-in-95">
                                            <div className="flex gap-3">
                                                <AlertCircle className="text-[#FFD700] shrink-0" size={18} />
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black uppercase text-[#FFD700]">Ação Necessária</p>
                                                    <p className="text-[11px] text-white/70 leading-relaxed font-bold">
                                                        O entregador já recebeu a sua encomenda! Por favor, realize o pagamento para que ele possa iniciar a entrega ao domicílio.
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handlePayment(order.id)}
                                                disabled={isPaying === order.id}
                                                className="w-full bg-[#FFD700] text-black h-12 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-yellow-500/10"
                                            >
                                                {isPaying === order.id ? <><Clock size={16} className="animate-spin" /> Processando...</> : <><Smartphone size={16} /> Pagar Agora (MCX Express)</>}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 text-xs opacity-50">
                                        <Clock size={14} />
                                        <span>Realizada em {new Date(order.created_at).toLocaleDateString('pt-AO')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/40 px-5 py-3 border-t border-white/5 flex justify-between items-center group cursor-pointer hover:bg-black transition-colors">
                                <span className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                                    <ShoppingBag size={12} /> Ver Detalhes dos Itens
                                </span>
                                <ArrowRight size={14} className="text-white/10 group-hover:text-[#FFD700] transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
                            <Package size={40} className="text-white/10" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-black uppercase italic text-white/30 tracking-tighter">Sem encomendas</p>
                            <p className="text-xs text-white/20 max-w-[200px] font-bold">Ainda não realizaste nenhuma compra no AngoPlace.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrdersScreen;
