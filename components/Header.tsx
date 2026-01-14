
import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ShoppingCart, Package, Clock, TrendingUp, Sparkles, X, ChevronRight, LogIn } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { User } from '../types';
import { useCart } from '../contexts/CartContext';
import { useNotifications } from '../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import { GoogleGenAI, Type } from '@google/genai';

interface HeaderProps {
  onSearchClick: (query?: string) => void;
  onSellClick: () => void;
  onCartClick: () => void;
  onLogoClick: () => void;
  onLoginClick: () => void;
  user: User | null;
}

interface Suggestion {
  text: string;
  type: 'history' | 'trend' | 'smart';
}

const Header: React.FC<HeaderProps> = ({ onSearchClick, onSellClick, onCartClick, onLogoClick, onLoginClick, user }) => {
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('apm_search_history');
    return saved ? JSON.parse(saved) : ['Gerador 5kva', 'Iphone 15 Pro', 'Cerveja Cuca'];
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!isFocused) return;

      setIsThinking(true);
      try {
        // Check if API key is available
        if (!process.env.API_KEY) {
          // Fallback to local suggestions when no API key
          const fallbackSuggestions: Suggestion[] = [
            { text: 'Gerador 5KVA', type: 'trend' as const },
            { text: 'Iphone 15 Pro', type: 'trend' as const },
            { text: 'Painel Solar', type: 'smart' as const },
            { text: 'Ar Condicionado', type: 'smart' as const },
            { text: 'Cerveja Cuca', type: 'trend' as const }
          ].filter(s =>
            !query.trim() || s.text.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);

          const filteredHistory = history
            .filter(h => h.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3)
            .map(h => ({ text: h, type: 'history' as const }));

          setSuggestions([...filteredHistory, ...fallbackSuggestions]);
          setIsThinking(false);
          return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = query.trim()
          ? `Sugira 5 termos de autocompletar para a busca "${query}" em um marketplace em Angola. Retorne apenas JSON.`
          : `Sugira 5 termos de busca que são tendência atual em Angola (tecnologia, energia, moda). Retorne apenas JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ['trend', 'smart'] }
                    },
                    required: ["text", "type"]
                  }
                }
              },
              required: ["items"]
            }
          }
        });

        const data = JSON.parse(response.text || '{"items": []}');
        const aiItems: Suggestion[] = data.items;

        const filteredHistory = history
          .filter(h => h.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          .map(h => ({ text: h, type: 'history' as const }));

        setSuggestions([...filteredHistory, ...aiItems]);
      } catch (error) {
        console.error("Autocomplete error:", error);
        // Provide fallback suggestions on error
        const fallbackHistory = history
          .filter(h => h.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          .map(h => ({ text: h, type: 'history' as const }));
        setSuggestions(fallbackHistory);
      } finally {
        setIsThinking(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timer);
  }, [query, isFocused, history]);

  const handleSelectSuggestion = (text: string) => {
    setQuery(text);
    setIsFocused(false);
    onSearchClick(text);

    if (!history.includes(text)) {
      const newHistory = [text, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('apm_search_history', JSON.stringify(newHistory));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSelectSuggestion(query);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-[#0B0B0B] border-b border-white/10 z-50 flex items-center px-4 md:px-8 gap-2 md:gap-10 justify-between backdrop-blur-md bg-opacity-95">
      {/* Brand Section */}
      <div className="shrink-0 flex items-center">
        <BrandLogo variant="horizontal" size="lg" onClick={onLogoClick} className="hidden sm:flex" />
        <BrandLogo variant="square" size="md" onClick={onLogoClick} className="flex sm:hidden" />
      </div>

      {/* Central Search Section */}
      <div className="flex-grow flex items-center justify-center relative" ref={dropdownRef}>
        <div className={`w-full max-w-3xl bg-[#1A1A1A] h-10 md:h-12 rounded-xl md:rounded-2xl flex items-center px-3 md:px-5 gap-2 md:gap-3 border transition-all group shadow-2xl ${isFocused ? 'border-[#FFD700] ring-4 ring-[#FFD700]/10 bg-[#222222]' : 'border-white/10'}`}>
          <Search size={20} className={isThinking ? 'text-[#C00000] animate-pulse' : isFocused ? 'text-[#FFD700]' : 'text-white/40'} />
          <input
            type="text"
            placeholder="O que procuras em Angola?"
            className="bg-transparent border-none outline-none flex-grow text-sm font-medium text-white placeholder:text-white/20"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-white/20 hover:text-white p-1">
              <X size={16} />
            </button>
          )}
          <div className="hidden md:flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">APM Search</span>
          </div>
        </div>

        {isFocused && (
          <div className="fixed md:absolute top-16 md:top-14 left-0 right-0 bottom-0 md:bottom-auto bg-[#1A1A1A] border-t md:border border-white/10 md:rounded-3xl shadow-2xl overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 z-[60] max-w-3xl mx-auto">
            <div className="p-2">
              {suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(item.text)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl text-left group transition-colors"
                  >
                    <div className={`p-2 rounded-xl ${item.type === 'history' ? 'bg-white/5 text-white/40' : item.type === 'trend' ? 'bg-[#C00000]/10 text-[#C00000]' : 'bg-[#FFD700]/10 text-[#FFD700]'}`}>
                      {item.type === 'history' ? <Clock size={16} /> : item.type === 'trend' ? <TrendingUp size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-white group-hover:text-[#FFD700] transition-colors">{item.text}</p>
                      <p className="text-[9px] uppercase font-black tracking-widest text-white/20">
                        {item.type === 'history' ? 'Pesquisado Recentemente' : item.type === 'trend' ? 'Tendência em Luanda' : 'Sugestão Inteligente'}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-white/10 group-hover:text-white/40" />
                  </button>
                ))
              ) : isThinking ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Indexando...</p>
                </div>
              ) : (
                <div className="p-8 text-center text-white/20 text-xs font-bold uppercase tracking-widest italic">
                  Tenta pesquisar por "Iphone" ou "Gerador"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Section */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Lógica de Autenticação: Botão 'Vender Produto' visível apenas se logado */}
        {user ? (
          <button
            onClick={onSellClick}
            className="flex items-center gap-2 p-3 bg-[#C00000]/10 text-[#C00000] border border-[#C00000]/20 rounded-2xl hover:bg-[#C00000] hover:text-white transition-all group shadow-lg active:scale-95"
            title="Vender Produto"
          >
            <Package size={20} className="group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline text-[10px] font-black uppercase tracking-widest">Vender Produto</span>
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-5 py-3 bg-[#1A1A1A] text-white/60 border border-white/10 rounded-2xl hover:bg-[#222222] hover:text-[#FFD700] hover:border-[#FFD700]/50 transition-all group shadow-lg active:scale-95"
          >
            <LogIn size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Entrar</span>
          </button>
        )}

        {/* Notificações (Sino) - Oculto em mobile para priorizar o CTA principal */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-3 cursor-pointer rounded-2xl transition-all group border border-transparent hover:border-white/10 hidden sm:block ${showNotifications ? 'bg-white/10 text-[#FFD700]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <Bell size={22} className="group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-[#C00000] rounded-full text-[8px] flex items-center justify-center text-white font-black border-2 border-[#0B0B0B]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        {/* Botão COMPRAR AGORA (Carrinho) - Destaque Amarelo persistente */}
        <button
          onClick={onCartClick}
          className="relative flex items-center gap-2 p-3 md:px-5 md:py-3 bg-[#FFD700] text-black rounded-xl md:rounded-2xl hover:bg-white transition-all group shadow-xl shadow-[#FFD700]/20 border-none active:scale-95 transform duration-200"
          title="Comprar Agora"
        >
          <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-[#C00000] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0B0B0B]">
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
          <span className="hidden md:inline text-[11px] font-black uppercase tracking-tighter">Comprar Agora</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
