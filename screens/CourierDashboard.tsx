import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus } from '../types';
import { supabase } from '../lib/supabase';
import { Package, Truck, MapPin, CheckCircle2, QrCode, Navigation, Phone, ShoppingBag, Clock, AlertCircle } from 'lucide-react';

interface CourierDashboardProps {
    user: User | null;
    onBack: () => void;
}

const CourierDashboard: React.FC<CourierDashboardProps> = ({ user, onBack }) => {
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch available pending orders
            const { data: pending, error: pendingErr } = await supabase
                .from('orders')
                .select('*')
                .eq('status', 'PENDENTE')
                .order('created_at', { ascending: false });

            if (pendingErr) throw pendingErr;
            setPendingOrders(pending || []);

            // Fetch my active deliveries
            const { data: my, error: myErr } = await supabase
                .from('orders')
                .select('*')
                .eq('courier_id', user.id)
                .not('status', 'eq', 'ENTREGUE')
                .not('status', 'eq', 'CANCELADO')
                .order('created_at', { ascending: false });

            if (myErr) throw myErr;
            setMyDeliveries(my || []);
        } catch (err) {
            console.error('Error fetching courier orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Real-time subscription for new orders
        const channel = supabase
            .channel('courier_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const updates: any = { status: newStatus };
            if (newStatus === OrderStatus.ATRIBUIDO) {
                updates.courier_id = user?.id;
            }
            if (newStatus === OrderStatus.EM_POSSE) {
                updates.possession_confirmed_at = new Date().toISOString();
            }
            if (newStatus === OrderStatus.ENTREGUE) {
                updates.delivered_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', orderId);

            if (error) throw error;
            fetchOrders();
        } catch (err) {
            console.error('Error updating order status:', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white pb-24 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 bg-gradient-to-b from-[#C00000]/20 to-transparent">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.2em] mb-1">Painel Logístico</p>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Entregador</h2>
                    </div>
                    <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                        <Package className="text-[#FFD700]" size={24} />
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-8">
                {/* Active Deliveries */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Truck size={14} className="text-[#FFD700]" /> Minhas Entregas ({myDeliveries.length})
                    </h3>

                    <div className="space-y-4">
                        {myDeliveries.length > 0 ? myDeliveries.map(order => (
                            <div key={order.id} className="bg-[#1A1A1A] p-5 rounded-3xl border border-[#FFD700]/10 space-y-4 shadow-xl">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black text-white/30 uppercase">ID: #{order.id.slice(0, 8)}</p>
                                        <p className="text-lg font-black text-[#FFD700]">{order.total.toLocaleString()} Kz</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${order.status === OrderStatus.EM_POSSE ? 'bg-orange-500/20 text-orange-500' :
                                        order.status === OrderStatus.PAGO ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                                        }`}>
                                        {order.status}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-xs">
                                        <MapPin size={14} className="text-[#C00000]" />
                                        <span className="text-white/60 font-medium">Recolher no Vendedor (Belas Shopping)</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <Navigation size={14} className="text-[#FFD700]" />
                                        <span className="text-white/60 font-medium">Entregar em: Luanda Sul</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {order.status === OrderStatus.ATRIBUIDO && (
                                        <button
                                            onClick={() => updateStatus(order.id, OrderStatus.EM_POSSE)}
                                            className="flex-grow bg-[#FFD700] text-black py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            <ShoppingBag size={14} /> Confirmar Posse
                                        </button>
                                    )}
                                    {order.status === OrderStatus.EM_POSSE && (
                                        <div className="flex-grow bg-white/5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 animate-pulse">
                                            <Clock size={14} /> Aguardando Pagamento do Cliente
                                        </div>
                                    )}
                                    {(order.status === OrderStatus.PAGO || order.status === OrderStatus.EM_TRANSITO) && (
                                        <button
                                            onClick={() => updateStatus(order.id, OrderStatus.ENTREGUE)}
                                            className="flex-grow bg-green-500 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            <CheckCircle2 size={14} /> Finalizar Entrega
                                        </button>
                                    )}
                                    <button className="bg-black border border-white/10 p-3 rounded-xl text-white active:scale-90 transition-all">
                                        <Phone size={16} />
                                    </button>
                                </div>
                            </div>
                        )) : !isLoading && (
                            <div className="bg-[#1A1A1A] p-10 rounded-3xl border border-white/5 text-center space-y-3">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-30">
                                    <Truck size={24} />
                                </div>
                                <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Nenhuma entrega em curso</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Available Orders */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                            <Package size={14} className="text-[#C00000]" /> Pedidos Disponíveis ({pendingOrders.length})
                        </h3>
                        <button onClick={fetchOrders} className="text-[10px] font-black uppercase text-[#FFD700]">Atualizar</button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {pendingOrders.map(order => (
                            <div key={order.id} className="bg-[#1A1A1A] p-5 rounded-3xl border border-white/5 hover:border-[#FFD700]/30 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Novo Pedido</p>
                                        <p className="text-xl font-black italic">{order.total.toLocaleString()} Kz</p>
                                    </div>
                                    <div className="w-10 h-10 bg-[#C00000]/10 rounded-xl flex items-center justify-center text-[#C00000] group-hover:bg-[#C00000] group-hover:text-white transition-all">
                                        <Navigation size={20} />
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 mb-5">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <div className="w-0.5 h-6 bg-white/10"></div>
                                        <div className="w-2 h-2 rounded-full bg-[#C00000]"></div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-white/70">Coleta: Talatona, Nosso Centro</p>
                                        <p className="text-[10px] font-bold text-white/70">Entrega: Viana, Zango 3</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => updateStatus(order.id, OrderStatus.ATRIBUIDO)}
                                    className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#FFD700] transition-colors active:scale-95"
                                >
                                    Aceitar Entrega
                                </button>
                            </div>
                        ))}

                        {pendingOrders.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center py-10 opacity-20">
                                <AlertCircle size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest mt-3">Aguardando novos pedidos...</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Footer Branding */}
            <div className="py-10 text-center opacity-20">
                <p className="text-[8px] font-black uppercase tracking-[0.2em]">AngoPlace Logística Express • AO</p>
            </div>
        </div>
    );
};

export default CourierDashboard;
