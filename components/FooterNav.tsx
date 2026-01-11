
import React from 'react';
import { Home, Grid, Trophy, ShoppingBag, User } from 'lucide-react';
import { AppScreen } from '../types';

interface FooterNavProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

const FooterNav: React.FC<FooterNavProps> = ({ activeScreen, onNavigate }) => {
  const items = [
    { id: AppScreen.HOME, icon: Home, label: 'Início' },
    { id: AppScreen.CATEGORIES, icon: Grid, label: 'Categorias' },
    { id: AppScreen.CART, icon: ShoppingBag, label: 'Carrinho' },
    { id: AppScreen.PROFILE, icon: User, label: 'Eu' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0B0B0B] border-t border-white/10 h-16 flex items-center justify-around px-2 z-50 safe-area-bottom">
      {items.map((item) => {
        const isActive = activeScreen === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 ${isActive ? 'text-[#FFD700]' : 'text-white/50 hover:text-white'}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default FooterNav;
