
import React, { useState } from 'react';
import { Smartphone, Shirt, Home, Camera, Car, Gamepad2, Baby, Search, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { id: '1', name: 'Eletrónicos', icon: Smartphone, count: '1.2k+ produtos' },
  { id: '2', name: 'Moda e Vestuário', icon: Shirt, count: '3k+ produtos' },
  { id: '3', name: 'Casa e Lazer', icon: Home, count: '850 produtos' },
  { id: '4', name: 'Fotografia', icon: Camera, count: '420 produtos' },
  { id: '5', name: 'Peças Auto', icon: Car, count: '2.1k+ produtos' },
  { id: '6', name: 'Gaming', icon: Gamepad2, count: '310 produtos' },
  { id: '7', name: 'Bebé e Kids', icon: Baby, count: '1.1k+ produtos' },
];

const CategoriesScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('1');

  return (
    <div className="flex h-full animate-in fade-in duration-300">
      {/* Left Sidebar */}
      <div className="w-24 bg-[#0B0B0B] border-r border-white/5 flex flex-col pt-4 overflow-y-auto no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center py-5 px-1 transition-all duration-300 ${isActive ? 'bg-[#1A1A1A] border-l-4 border-[#FFD700] text-[#FFD700]' : 'text-white/40'}`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[9px] font-black uppercase mt-2 text-center tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {cat.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-4 space-y-6 overflow-y-auto bg-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            {CATEGORIES.find(c => c.id === activeCategory)?.name}
          </h2>
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
            {CATEGORIES.find(c => c.id === activeCategory)?.count}
          </span>
        </div>

        {/* Promo Sub-Banner */}
        <div className="bg-gradient-to-br from-[#C00000] to-black rounded-xl p-4 flex items-center justify-between border border-white/10">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-white/60 uppercase">Especial Luanda</p>
            <h4 className="font-bold text-sm">ENTREGA EM 24H</h4>
            <p className="text-[9px] text-[#FFD700] font-bold">CUPOM: FRETEAO</p>
          </div>
          <ChevronRight className="text-white/30" />
        </div>

        {/* Sub-categories Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2 group cursor-pointer">
              <div className="aspect-square bg-black rounded-2xl overflow-hidden border border-white/5 relative group-hover:border-[#FFD700]/50 transition-all">
                <img src={`https://picsum.photos/seed/cat${activeCategory}${i}/300`} alt="subcat" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-black uppercase tracking-tighter line-clamp-1">Sub-Categoria {i}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Popular Tags */}
        <div className="space-y-3 pt-4">
          <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Tags Populares</h4>
          <div className="flex flex-wrap gap-2">
            {['Inverno', 'Promoção', 'Atacado', 'Marcas AO', 'Xiaomi', 'SAMSUNG', 'Adidas'].map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-black rounded-full text-[10px] font-bold text-white/60 border border-white/5 hover:border-[#FFD700] hover:text-[#FFD700] transition-colors cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesScreen;
