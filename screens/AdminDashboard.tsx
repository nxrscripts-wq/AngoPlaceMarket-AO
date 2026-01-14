
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, BarChart3, Users, Package, ShoppingCart, DollarSign,
  TrendingUp, Activity, Plus, Key, Edit2, ShieldAlert, CheckCircle, XCircle, Clock, Eye, MessageSquare, Loader2, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, UserRole, AdminAction, Product, ProductStatus } from '../types';

interface AdminDashboardProps {
  onBack: () => void;
  user: User;
}

const salesData = [
  { name: 'Seg', sales: 400000 },
  { name: 'Ter', sales: 300000 },
  { name: 'Qua', sales: 500000 },
  { name: 'Qui', sales: 278000 },
  { name: 'Sex', sales: 689000 },
  { name: 'Sáb', sales: 839000 },
  { name: 'Dom', sales: 949000 },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'review' | 'logs' | 'management' | 'users'>('overview');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);

  const isSuperAdmin = user.is_super_admin && user.role === UserRole.SUPER_ADMIN && user.email === "elviino.nxrscripts@gmail.com";

  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    fetchPendingProducts();

    const channel = supabase
      .channel('admin:pending_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `status=eq.${ProductStatus.PENDENTE}` }, () => {
        fetchPendingProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', ProductStatus.PENDENTE)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts: Product[] = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
        rating: p.rating || 0,
        sales: p.sales || 0,
        isInternational: p.is_international || false,
        status: p.status,
        submittedBy: p.seller_id,
        sellerId: p.seller_id,
        description: p.description,
        stock: p.stock,
        location: p.location || ''
      }));

      setPendingProducts(mappedProducts);
    } catch (err: any) {
      console.error('Error fetching pending products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Note: In a real app, 'online' status would come from a presence system
      // Here we will use auth.listUsers if possible, or a 'profiles' table.
      // Assuming a 'profiles' table exists for listing users
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      const mappedUsers: User[] = (data || []).map(u => ({
        id: u.id,
        name: u.full_name || u.email?.split('@')[0] || 'Utilizador',
        email: u.email,
        walletBalance: u.wallet_balance || 0,
        role: u.role || UserRole.USER,
        is_super_admin: u.role === UserRole.SUPER_ADMIN,
        avatar: u.avatar_url || '',
        last_seen: u.last_seen // used for online/offline simulation
      }));

      setUsersList(mappedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem a certeza que deseja excluir este utilizador permanentemente? Esta ação não pode ser desfeita.')) return;

    setIsDeletingUser(userId);
    try {
      // Note: Deleting a user from auth requires admin privileges via supabase-js Admin API
      // For the frontend logic, we simulate or call an edge function
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsersList(usersList.filter(u => u.id !== userId));
      alert('Utilizador excluído com sucesso.');
    } catch (err: any) {
      alert(`Erro ao excluir utilizador: ${err.message}`);
    } finally {
      setIsDeletingUser(null);
    }
  };

  const getFilteredUsers = () => {
    if (userFilter === 'all') return usersList;

    // Simulate online: active in the last 5 minutes
    const now = new Date();
    return usersList.filter(u => {
      const lastSeen = u.last_seen ? new Date(u.last_seen) : null;
      const isOnline = lastSeen && (now.getTime() - lastSeen.getTime() < 5 * 60 * 1000);
      return userFilter === 'online' ? isOnline : !isOnline;
    });
  };

  const [auditLogs, setAuditLogs] = useState<AdminAction[]>([]);

  const handleReview = async (productId: string, action: 'APPROVE' | 'REJECT', feedback?: string) => {
    const product = pendingProducts.find(p => p.id === productId);
    if (!product) return;

    try {
      const newStatus = action === 'APPROVE' ? ProductStatus.PUBLICADO : ProductStatus.REJEITADO;

      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      // Log the action
      const newAction: AdminAction = {
        id: Date.now().toString(),
        adminId: user.id,
        adminName: user.name,
        action: action === 'APPROVE' ? 'APPROVE_PRODUCT' : 'REJECT_PRODUCT',
        targetId: productId,
        timestamp: new Date().toISOString(),
        details: `${action === 'APPROVE' ? 'Aprovado' : 'Rejeitado'}: ${product.name}. Obs: ${feedback || 'Sem comentários'}`
      };

      // Send notification to seller
      await supabase.from('notifications').insert({
        user_id: product.sellerId,
        title: action === 'APPROVE' ? 'Produto Aprovado! 🎉' : 'Produto Rejeitado ⚠️',
        message: action === 'APPROVE'
          ? `O seu produto "${product.name}" foi aprovado e já está visível no marketplace.`
          : `O seu produto "${product.name}" não foi aprovado. Motivo: ${feedback || 'Não cumpre os requisitos.'}`,
        type: 'PRODUCT_STATUS'
      });

      alert(`Produto ${action === 'APPROVE' ? 'aprovado' : 'rejeitado'} com sucesso!`);
      setAuditLogs([newAction, ...auditLogs]);
      setPendingProducts(pendingProducts.filter(p => p.id !== productId));
    } catch (err: any) {
      console.error('Error updating product status:', err);
      alert(`Erro ao atualizar produto: ${err.message}`);
    }
  };

  const tabs = [
    { id: 'overview', icon: BarChart3, label: 'Geral' },
    { id: 'review', icon: Clock, label: 'Revisão' },
    { id: 'products', icon: Package, label: 'Produtos' },
    { id: 'users', icon: Users, label: 'Utilizadores' },
    { id: 'logs', icon: Activity, label: 'Auditoria' },
    { id: 'shops', icon: ShieldAlert, label: 'Lojas' },
    ...(isSuperAdmin ? [{ id: 'management', icon: Key, label: 'Gestão Admins' }] : []),
  ];

  const [pendingShops, setPendingShops] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'shops') {
      fetchPendingShops();
    }
  }, [activeTab]);

  const fetchPendingShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*, profiles:owner_id(full_name, email)')
        .eq('status', 'PENDING');

      if (error) throw error;
      setPendingShops(data || []);
    } catch (err) {
      console.error("Error fetching shops:", err);
    }
  };

  const handleShopReview = async (shopId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const { error } = await supabase.from('shops').update({ status, is_verified: action === 'APPROVE' }).eq('id', shopId);
      if (error) throw error;

      setPendingShops(prev => prev.filter(s => s.id !== shopId));

      // Send notification to shop owner
      const shop = pendingShops.find(s => s.id === shopId);
      if (shop) {
        await supabase.from('notifications').insert({
          user_id: shop.owner_id,
          title: action === 'APPROVE' ? 'Loja Aprovada! 🏪' : 'Loja Rejeitada 🛑',
          message: action === 'APPROVE'
            ? `Parabéns! A sua loja "${shop.name}" foi verificada e aprovada.`
            : `Lamentamos, mas a sua solicitação para a loja "${shop.name}" foi rejeitada.`,
          type: 'SHOP_STATUS'
        });
      }

      alert(`Loja ${action === 'APPROVE' ? 'aprovada' : 'rejeitada'} com sucesso!`);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar loja");
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white flex flex-col md:flex-row animate-in fade-in duration-500">
      <aside className="w-full md:w-64 bg-[#0B0B0B] border-r border-white/5 flex flex-col p-4 gap-6 z-30">
        <div className="flex items-center gap-3 px-2">
          <button onClick={onBack} className="p-2 bg-[#1A1A1A] rounded-xl hover:bg-[#C00000] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#FFD700] tracking-[0.2em] uppercase">
              {isSuperAdmin ? 'Master Access' : 'Admin Panel'}
            </span>
            <span className="text-sm font-black italic">ANGOPLACE</span>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto no-scrollbar gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 min-w-max md:w-full ${isActive ? 'bg-[#FFD700] text-black font-black' : 'text-white/40 hover:bg-white/5'}`}
              >
                <div className="relative">
                  <Icon size={18} />
                  {tab.id === 'review' && pendingProducts.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#C00000] text-white text-[9px] flex items-center justify-center rounded-full font-black animate-pulse">
                      {pendingProducts.length}
                    </span>
                  )}
                </div>
                <span className="text-xs uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-grow p-6 overflow-y-auto pb-32">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Vista Executiva</h2>
                <p className="text-sm text-white/40 font-medium">Controlo total do marketplace em Angola</p>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: DollarSign, label: 'Volume Vendas', value: '14.2M Kz', color: '#FFD700' },
                { icon: Users, label: 'Novos Users', value: '+1.2k', color: '#C00000' },
                { icon: Package, label: 'Stock Total', value: '8.5k', color: '#FFFFFF' },
                { icon: ShieldAlert, label: 'Incidentes', value: '0', color: '#FFD700' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#0B0B0B] p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/50 w-fit mb-4">
                    <stat.icon size={20} />
                  </div>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{stat.label}</p>
                  <h4 className="text-2xl font-black mt-1" style={{ color: stat.color }}>{stat.value}</h4>
                </div>
              ))}
            </div>

            <div className="bg-[#0B0B0B] p-6 rounded-3xl border border-white/5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }}
                    itemStyle={{ color: '#FFD700', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="sales" fill="#FFD700" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Revisão de Produtos</h2>
            {pendingProducts.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-20">
                <CheckCircle size={64} />
                <p className="mt-4 font-black uppercase tracking-widest">Tudo em dia!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingProducts.map(product => (
                  <div key={product.id} className="bg-[#0B0B0B] border border-white/5 rounded-3xl overflow-hidden flex flex-col md:flex-row p-4 gap-6 hover:border-[#FFD700]/20 transition-all group">
                    <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden bg-[#1A1A1A] shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-2">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xl font-black">{product.name}</h4>
                          <span className="text-lg font-black text-[#FFD700]">{product.price.toLocaleString()} Kz</span>
                        </div>
                        <p className="text-xs text-white/40 mt-1 uppercase font-bold tracking-widest">{product.category}</p>
                        <div className="mt-4 flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase">
                          <Users size={12} /> Submetido por ID: {product.submittedBy}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-6">
                        <button
                          onClick={() => handleReview(product.id, 'APPROVE')}
                          className="flex items-center gap-2 px-6 py-3 bg-[#FFD700] text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform"
                        >
                          <CheckCircle size={14} /> Aprovar Publicação
                        </button>
                        <button
                          onClick={() => handleReview(product.id, 'REJECT', 'Produto não cumpre os requisitos.')}
                          className="flex items-center gap-2 px-6 py-3 bg-[#C00000] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform"
                        >
                          <XCircle size={14} /> Rejeitar
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white/40 rounded-xl font-black uppercase text-[10px] tracking-widest">
                          <Eye size={14} /> Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Gestão de Utilizadores</h2>
                <p className="text-sm text-white/40 font-medium">Controlo de acessos e monitorização de atividade</p>
              </div>
              <div className="flex bg-[#0B0B0B] p-1 rounded-2xl border border-white/5">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'online', label: 'Online' },
                  { id: 'offline', label: 'Offline' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setUserFilter(f.id as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${userFilter === f.id ? 'bg-[#FFD700] text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
              {getFilteredUsers().length === 0 ? (
                <div className="py-20 text-center opacity-20 font-black uppercase italic">Nenhum utilizador encontrado</div>
              ) : (
                getFilteredUsers().map(u => {
                  const now = new Date();
                  const lastSeen = u.last_seen ? new Date(u.last_seen) : null;
                  const isOnline = lastSeen && (now.getTime() - lastSeen.getTime() < 5 * 60 * 1000);

                  return (
                    <div key={u.id} className="bg-[#0B0B0B] border border-white/5 p-4 rounded-3xl flex items-center justify-between group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
                            {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : <Users size={20} className="text-white/20" />}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0B0B0B] ${isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-500'}`} />
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase italic">{u.name}</p>
                          <p className="text-[10px] text-white/40 font-bold">{u.email}</p>
                          <p className="text-[9px] text-[#FFD700] font-black uppercase mt-0.5 tracking-tighter">{u.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="hidden md:block mr-4 text-right">
                          <p className="text-[9px] text-white/20 uppercase font-black">Carteira</p>
                          <p className="text-xs font-black italic">{u.walletBalance.toLocaleString()} Kz</p>
                        </div>
                        <button
                          disabled={isDeletingUser === u.id || u.role === UserRole.SUPER_ADMIN}
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-3 bg-[#C00000]/10 text-[#C00000] rounded-xl hover:bg-[#C00000] hover:text-white transition-all disabled:opacity-20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Histórico de Ações</h2>
            <div className="bg-[#0B0B0B] rounded-3xl border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                    <th className="p-4">Data/Hora</th>
                    <th className="p-4">Admin</th>
                    <th className="p-4">Evento</th>
                    <th className="p-4">Alvo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-white/20 text-xs italic">Nenhuma ação administrativa registada recentemente</td></tr>
                  ) : auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-[10px] font-mono text-white/40">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 text-xs font-bold text-[#FFD700]">{log.adminName}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-white/5 text-[9px] font-black uppercase text-white/60">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-[10px] text-white/40 max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'management' && isSuperAdmin && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#FFD700]">Gestão de Admins</h2>
                <p className="text-sm text-white/40">Privilégios master reservados ao Super Admin</p>
              </div>
              <button className="flex items-center gap-2 px-6 py-4 bg-[#C00000] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform">
                <Plus size={18} /> Novo Administrador
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Admin Secundário', email: 'admin2@apm.ao', role: 'ADMIN' },
                { name: 'Gestor Logística', email: 'logistica@apm.ao', role: 'ADMIN' },
              ].map((adm, i) => (
                <div key={i} className="bg-[#0B0B0B] p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-[#FFD700]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#FFD700] font-black">AD</div>
                    <div>
                      <p className="font-bold">{adm.name}</p>
                      <p className="text-xs text-white/30">{adm.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:text-[#FFD700] transition-colors"><Edit2 size={16} /></button>
                    <button className="p-2 hover:text-[#C00000] transition-colors"><ShieldAlert size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'shops' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Aprovação de Lojas</h2>
            {pendingShops.length === 0 ? (
              <div className="py-20 text-center text-white/40">Nenhuma loja pendente.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingShops.map(shop => (
                  <div key={shop.id} className="bg-[#1A1A1A] p-6 rounded-3xl border border-white/5">
                    <h3 className="font-bold text-xl mb-1">{shop.name}</h3>
                    <p className="text-xs text-white/50 mb-4">{shop.description}</p>
                    <div className="space-y-2 text-sm text-white/70 mb-6">
                      <p>NIF: {shop.nif}</p>
                      <p>Proprietário: {shop.profiles?.full_name} ({shop.profiles?.email})</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleShopReview(shop.id, 'APPROVE')} className="flex-1 bg-[#FFD700] text-black py-2 rounded-xl font-bold uppercase text-xs">Aprovar</button>
                      <button onClick={() => handleShopReview(shop.id, 'REJECT')} className="flex-1 bg-[#C00000] text-white py-2 rounded-xl font-bold uppercase text-xs">Rejeitar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
