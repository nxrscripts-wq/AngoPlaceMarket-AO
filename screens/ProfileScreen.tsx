
import React from 'react';
import { User, UserRole } from '../types';
import { Settings, CreditCard, MapPin, Package, Heart, Headphones, ChevronRight, LogOut, ShieldCheck, ShoppingBag } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { supabase } from '../lib/supabase';

interface ProfileScreenProps {
  user: User | null;
  onAdmin: () => void;
  onLogout: () => void;
  onSell: () => void;
  onRegisterShop: () => void;
  onSettings: () => void;
  onMyOrders: () => void;
  onCourierDashboard: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onAdmin,
  onLogout,
  onSell,
  onRegisterShop,
  onSettings,
  onMyOrders,
  onCourierDashboard
}) => {
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isShopOwner = user?.role === UserRole.SHOP_OWNER;
  const isCourier = user?.role === ('COURIER' as UserRole);

  const menuItems = [
    { icon: Package, label: 'Meus Pedidos', sub: 'Rastrear encomendas' },
    { icon: CreditCard, label: 'Pagamentos', sub: 'Multicaixa, Unitel Money' },
    { icon: MapPin, label: 'Endereços', sub: 'Luanda, Angola' },
    { icon: Heart, label: 'Lista de Desejos', sub: '12 itens salvos' },
    { icon: Headphones, label: 'Suporte AngoPlace', sub: 'Falar com agente' },
  ];

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full border-4 border-[#C00000] p-1 overflow-hidden bg-[#1A1A1A]">
            <img src={`https://picsum.photos/seed/${user?.id}/200`} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">{user?.name}</h2>
            <div className="flex items-center gap-1 text-white/50 text-xs">
              <MapPin size={12} className="text-[#C00000]" /> {user?.location || 'Luanda, Angola'}
            </div>
            {isAdmin && (
              <div className="mt-2 inline-flex items-center gap-1 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-black px-2 py-0.5 rounded uppercase border border-[#FFD700]/20">
                <ShieldCheck size={10} /> {user?.role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Admin'}
              </div>
            )}
            {isShopOwner && (
              <div className="mt-2 inline-flex items-center gap-1 bg-[#C00000]/10 text-[#C00000] text-[10px] font-black px-2 py-0.5 rounded uppercase border border-[#C00000]/20 ml-1">
                <ShoppingBag size={10} /> Loja Verificada
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onSettings}
          className="p-2 bg-[#1A1A1A] rounded-full border border-white/5 active:scale-95 transition-all"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Selling/Shop CTA */}
      {!isShopOwner ? (
        <div className="bg-[#FFD700] rounded-2xl p-5 text-black flex items-center justify-between group cursor-pointer active:scale-95 transition-all shadow-xl shadow-yellow-500/10" onClick={onRegisterShop}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-[#FFD700]">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Negócio Profissional</p>
              <p className="font-black text-lg uppercase leading-tight italic">Abrir Loja Profissional</p>
            </div>
          </div>
          <ChevronRight size={24} />
        </div>
      ) : (
        <div className="bg-black rounded-2xl p-5 text-white flex items-center justify-between group cursor-pointer active:scale-95 transition-all border border-[#FFD700]/20" onClick={onSell}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFD700] rounded-xl flex items-center justify-center text-black">
              <Package size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Minha Loja</p>
              <p className="font-black text-lg uppercase leading-tight italic text-[#FFD700]">Gerir Produtos</p>
            </div>
          </div>
          <ChevronRight size={24} className="text-[#FFD700]" />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Carteira</p>
          <p className="text-xl font-black text-[#FFD700] mt-1">{user?.walletBalance.toLocaleString()} <span className="text-xs">Kz</span></p>
        </div>
      </div>

      {/* Main Menu */}
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
        {menuItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer group"
            onClick={() => {
              if (item.label === 'Meus Pedidos') onMyOrders();
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-[#FFD700] group-hover:bg-[#C00000] group-hover:text-white transition-all">
                <item.icon size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">{item.label}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-tighter">{item.sub}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/20 group-hover:text-[#FFD700] transition-colors" />
          </div>
        ))}
      </div>

      {/* Courier Quick Access */}
      {isCourier && (
        <div
          className="bg-gradient-to-r from-[#C00000] to-black p-5 rounded-2xl flex items-center justify-between group cursor-pointer active:scale-95 transition-all shadow-xl shadow-red-500/10"
          onClick={onCourierDashboard}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <Package size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#FFD700]">Portal do Entregador</p>
              <p className="font-black text-lg uppercase leading-tight italic">Gerir Entregas</p>
            </div>
          </div>
          <ChevronRight size={24} />
        </div>
      )}

      {/* Admin Quick Access */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-black to-[#1A1A1A] p-4 rounded-2xl border border-[#FFD700]/20 flex items-center justify-between group cursor-pointer" onClick={onAdmin}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD700] rounded flex items-center justify-center text-black font-black uppercase text-xs">
              {user?.role === UserRole.SUPER_ADMIN ? 'SA' : 'AD'}
            </div>
            <p className="text-sm font-bold text-white/80 uppercase tracking-tighter">Painel de Administração</p>
          </div>
          <ChevronRight size={16} className="text-[#FFD700]" />
        </div>
      )}

      {/* Logout */}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          onLogout();
        }}
        className="w-full flex items-center justify-center gap-2 py-4 text-[#C00000] font-black uppercase text-xs tracking-widest border border-[#C00000]/20 rounded-2xl hover:bg-[#C00000]/10 transition-colors"
      >
        <LogOut size={16} /> Terminar Sessão
      </button>

      {/* Footer Branding */}
      <div className="flex flex-col items-center justify-center py-10 opacity-30 gap-1">
        <BrandLogo variant="monochrome" size="sm" />
        <p className="text-[8px] text-white font-black uppercase tracking-[0.3em] mt-2 italic">Integridade • Qualidade • Angola</p>
        <p className="text-[8px] text-white/50 font-bold uppercase mt-1">Versão 1.2.0-PRO-ANGOLA</p>
      </div>
    </div>
  );
};

export default ProfileScreen;
