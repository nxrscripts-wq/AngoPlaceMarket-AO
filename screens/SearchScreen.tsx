
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Sparkles, TrendingUp, History, SlidersHorizontal, X, Clock, ShoppingBag, Target, Star, Truck, Globe, ChevronRight, DollarSign, Zap } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../lib/supabase';
import { Product, SearchFilters, ProductStatus } from '../types';
import ProductCard from '../components/ProductCard';

interface SearchScreenProps {
  initialQuery?: string;
  onBack: () => void;
  onProductClick: (p: Product) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ initialQuery = '', onBack, onProductClick }) => {
  const [query, setQuery] = useState(initialQuery);
  const [aiSuggestions, setAiSuggestions] = useState<{ text: string, type: 'trend' | 'smart' | 'category' }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    isInternational: 'all',
    minPrice: 0,
    maxPrice: 1000000,
    minRating: 0,
    onlyFreeShipping: false
  });

  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('apm_search_history');
    return saved ? JSON.parse(saved) : ['Gerador 5kva', 'Cerveja Cuca grade', 'Smartphone barato'];
  });

  const categories = ['Eletrónicos', 'Moda', 'Casa e Lazer', 'Peças Auto', 'Energia Solar'];

  const [localSuggestions, setLocalSuggestions] = useState<{ type: 'history' | 'product', text: string, id?: string }[]>([]);

  useEffect(() => {
    const fetchLocalSuggestions = async () => {
      if (!query.trim()) {
        setLocalSuggestions([]);
        return;
      }
      const lowerQuery = query.toLowerCase();

      const historyMatches = searchHistory
        .filter(h => h.toLowerCase().includes(lowerQuery))
        .map(h => ({ type: 'history' as const, text: h }));

      try {
        const { data } = await supabase
          .from('products')
          .select('id, name')
          .eq('status', ProductStatus.PUBLICADO)
          .ilike('name', `%${lowerQuery}%`)
          .limit(3);

        const productMatches = (data || []).map(p => ({ type: 'product' as const, text: p.name, id: p.id }));
        setLocalSuggestions([...historyMatches, ...productMatches].slice(0, 5));
      } catch (err) {
        setLocalSuggestions(historyMatches.slice(0, 5));
      }
    };
    fetchLocalSuggestions();
  }, [query, searchHistory]);

  useEffect(() => {
    const performDeepSearch = async () => {
      const isQueryEmpty = query.trim().length < 2;

      if (!isQueryEmpty) {
        setIsThinking(true);
      }

      try {
        let aiParams = { category: undefined as string | undefined, minPrice: 0, maxPrice: 1000000, keywords: [] as string[] };

        if (!isQueryEmpty && import.meta.env.VITE_GEMINI_API_KEY) {
          // Only use AI if API key is available
          try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Analise a query "${query}". Retorne um JSON com autocomplete de tendências em Angola e parâmetros de busca. No campo search_params inclua minPrice e maxPrice baseados no contexto do produto.`,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    autocomplete: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { text: { type: Type.STRING }, type: { type: Type.STRING } },
                        required: ["text", "type"]
                      }
                    },
                    search_params: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING },
                        minPrice: { type: Type.NUMBER },
                        maxPrice: { type: Type.NUMBER },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  },
                  required: ["autocomplete", "search_params"]
                }
              }
            });

            const data = JSON.parse(response.text || '{}');
            setAiSuggestions(data.autocomplete || []);
            aiParams = { ...aiParams, ...data.search_params };
          } catch (aiError) {
            console.error("AI Search Error:", aiError);
            // Continue with local search on AI error
            setAiSuggestions([]);
          }
        } else {
          setAiSuggestions([]);
        }

        // Supabase Query Logic
        let queryBuilder = supabase
          .from('products')
          .select('*')
          .eq('status', ProductStatus.PUBLICADO);

        if (!isQueryEmpty) {
          const searchTerm = query.toLowerCase();
          queryBuilder = queryBuilder.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        if (filters.category) {
          queryBuilder = queryBuilder.eq('category', filters.category);
        }

        if (filters.minPrice) {
          queryBuilder = queryBuilder.gte('price', filters.minPrice);
        }

        if (filters.maxPrice) {
          queryBuilder = queryBuilder.lte('price', filters.maxPrice);
        }

        if (filters.isInternational !== 'all') {
          queryBuilder = queryBuilder.eq('is_international', filters.isInternational);
        }

        if (filters.minRating) {
          queryBuilder = queryBuilder.gte('rating', filters.minRating);
        }

        if (filters.onlyFreeShipping) {
          queryBuilder = queryBuilder.eq('is_free_shipping', true);
        }

        const { data, error: dbError } = await queryBuilder;

        if (dbError) throw dbError;

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
          location: p.location
        }));

        setResults(mappedProducts);
      } catch (error) {
        console.error("Deep Search Error:", error);
        setResults([]);
      } finally {
        setIsThinking(false);
      }
    };

    const timer = setTimeout(performDeepSearch, 300);
    return () => clearTimeout(timer);
  }, [query, filters]);

  const handleSelectQuery = (selected: string) => {
    setQuery(selected);
    if (!searchHistory.includes(selected) && selected.trim().length > 0) {
      const newHistory = [selected, ...searchHistory].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('apm_search_history', JSON.stringify(newHistory));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const val = parseInt(e.target.value);
    setFilters(prev => {
      const newState = { ...prev };
      if (type === 'min') {
        newState.minPrice = Math.min(val, (prev.maxPrice || 1000000) - 5000);
      } else {
        newState.maxPrice = Math.max(val, (prev.minPrice || 0) + 5000);
      }
      return newState;
    });
  };

  const isFilterActive = useMemo(() => {
    return filters.category || filters.minPrice !== 0 || filters.maxPrice !== 1000000 || filters.onlyFreeShipping || (filters.minRating && filters.minRating > 0);
  }, [filters]);

  return (
    <div className="fixed inset-0 bg-[#0B0B0B] z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header with Search Input */}
      <div className="p-4 bg-[#0B0B0B] border-b border-white/5 space-y-4 shadow-2xl relative z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-grow bg-[#1A1A1A] h-12 rounded-xl flex items-center px-4 gap-3 focus-within:ring-2 focus-within:ring-[#FFD700] transition-all relative group">
            <Search size={20} className={isThinking ? "text-[#C00000] animate-pulse" : "text-[#FFD700]"} />
            <input
              autoFocus
              type="text"
              placeholder="Pesquisar em Angola..."
              className="bg-transparent border-none outline-none flex-grow text-white placeholder:text-white/20 text-lg font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectQuery(query)}
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-white/30 hover:text-white">
                <X size={18} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition-all relative ${showFilters ? 'bg-[#FFD700] border-[#FFD700] text-black shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'bg-[#1A1A1A] border-white/10 text-white'}`}
          >
            <SlidersHorizontal size={20} />
            {isFilterActive && !showFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#C00000] rounded-full border-2 border-[#0B0B0B]"></span>
            )}
          </button>
        </div>

        {/* Filters Section with Interactive Slider */}
        {showFilters && (
          <div className="space-y-6 py-4 animate-in slide-in-from-top duration-300 bg-[#0F0F0F] rounded-2xl p-4 border border-white/5">
            {/* Price Slider UI */}
            <div className="space-y-6 px-2">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2">
                    <DollarSign size={12} className="text-[#FFD700]" /> Faixa de Preço
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white italic">{filters.minPrice?.toLocaleString()}</span>
                    <span className="text-white/20 text-xs">—</span>
                    <span className="text-xl font-black text-[#FFD700] italic">{filters.maxPrice?.toLocaleString()} <span className="text-[10px] uppercase ml-1">Kz</span></span>
                  </div>
                </div>
                <Zap size={16} className="text-[#C00000] animate-pulse" />
              </div>

              <div className="relative h-10 flex items-center">
                {/* Custom Track */}
                <div className="absolute w-full h-1.5 bg-white/5 rounded-full" />
                <div
                  className="absolute h-1.5 bg-gradient-to-r from-[#C00000] via-[#C00000] to-[#FFD700] rounded-full shadow-[0_0_15px_rgba(192,0,0,0.4)]"
                  style={{
                    left: `${((filters.minPrice || 0) / 1000000) * 100}%`,
                    right: `${100 - ((filters.maxPrice || 1000000) / 1000000) * 100}%`
                  }}
                />

                {/* Inputs Range */}
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="5000"
                  value={filters.minPrice}
                  onChange={(e) => handlePriceChange(e, 'min')}
                  className="absolute w-full h-1.5 bg-transparent appearance-none pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#C00000] [&::-webkit-slider-thumb]:shadow-lg z-30"
                />
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="5000"
                  value={filters.maxPrice}
                  onChange={(e) => handlePriceChange(e, 'max')}
                  className="absolute w-full h-1.5 bg-transparent appearance-none pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#FFD700] [&::-webkit-slider-thumb]:shadow-lg z-20"
                />
              </div>
              <div className="flex justify-between text-[8px] font-black text-white/10 uppercase tracking-widest">
                <span>0 Kz</span>
                <span>500.000 Kz</span>
                <span>1.000.000 Kz+</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <select
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                  className="w-full bg-[#1A1A1A] text-[10px] font-black uppercase px-4 py-3 rounded-xl border border-white/10 outline-none text-white/70 appearance-none cursor-pointer focus:border-[#FFD700] transition-colors"
                >
                  <option value="">Categorias</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-white/20 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={filters.isInternational === 'all' ? 'all' : (filters.isInternational ? 'int' : 'local')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({ ...filters, isInternational: val === 'all' ? 'all' : (val === 'int' ? true : false) });
                  }}
                  className="w-full bg-[#1A1A1A] text-[10px] font-black uppercase px-4 py-3 rounded-xl border border-white/10 outline-none text-white/70 appearance-none cursor-pointer focus:border-[#FFD700] transition-colors"
                >
                  <option value="all">Origem</option>
                  <option value="local">Nacional (AO)</option>
                  <option value="int">Internacional</option>
                </select>
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-white/20 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilters({ ...filters, onlyFreeShipping: !filters.onlyFreeShipping })}
                className={`flex-grow flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${filters.onlyFreeShipping ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-lg shadow-yellow-500/10' : 'bg-[#1A1A1A] text-white/40 border-white/5 hover:border-white/20'}`}
              >
                <Truck size={14} /> Entrega Grátis
              </button>

              <button
                onClick={() => setFilters({ isInternational: 'all', minPrice: 0, maxPrice: 1000000, minRating: 0, onlyFreeShipping: false })}
                className="text-[10px] font-black uppercase text-[#C00000] px-4 py-3 hover:bg-[#C00000]/10 rounded-xl transition-all border border-transparent active:scale-95"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {query && (localSuggestions.length > 0 || aiSuggestions.length > 0) && results.length === 0 && !isThinking && (
          <div className="absolute top-20 left-4 right-4 bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar divide-y divide-white/5">
              {localSuggestions.map((item, i) => (
                <button
                  key={`local-${i}`}
                  onClick={() => handleSelectQuery(item.text)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                    {item.type === 'history' ? <Clock size={16} className="text-white/30" /> : <ShoppingBag size={16} className="text-[#FFD700]" />}
                  </div>
                  <span className="text-sm font-bold text-white/90">{item.text}</span>
                </button>
              ))}
              {aiSuggestions.map((item, i) => (
                <button
                  key={`ai-${i}`}
                  onClick={() => handleSelectQuery(item.text)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'trend' ? 'bg-[#C00000]/10' : 'bg-[#FFD700]/10'}`}>
                    {item.type === 'trend' ? <TrendingUp size={16} className="text-[#C00000]" /> : <Target size={16} className="text-[#FFD700]" />}
                  </div>
                  <span className="text-sm font-bold text-white/90">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Results Area */}
      <div className="flex-grow overflow-y-auto p-4 pb-24 relative bg-[#0B0B0B]">
        {results.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 italic flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {results.length} resultados via APM-Elastic-Core
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {results.map(product => (
                <ProductCard key={product.id} product={product} onClick={onProductClick} />
              ))}
            </div>
          </div>
        ) : query.length >= 2 || isFilterActive ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Search size={40} className="text-white/10" />
            </div>
            <p className="font-black uppercase tracking-tighter text-lg text-white/80">Nenhum item indexado</p>
            <p className="text-xs mt-2 text-white/30 max-w-[200px]">Tente ajustar a faixa de preço ou a categoria da busca.</p>
            <button
              onClick={() => setFilters({ isInternational: 'all', minPrice: 0, maxPrice: 1000000, minRating: 0, onlyFreeShipping: false })}
              className="mt-6 text-[#FFD700] text-[10px] font-black uppercase tracking-widest border-b border-[#FFD700]/30 pb-1"
            >
              Resetar Filtros
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#C00000] px-1">
                <TrendingUp size={18} />
                <h3 className="font-black text-xs uppercase tracking-tighter italic">Destaques em Luanda</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['Geradores 5kva', 'Iphone 15 Pro', 'Cerveja Cuca', 'Kits Solares'].map((term, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectQuery(term)}
                    className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/5 hover:border-[#FFD700]/30 transition-all cursor-pointer group flex items-center justify-between active:scale-[0.98]"
                  >
                    <span className="text-sm font-black text-white group-hover:text-[#FFD700] transition-colors">{term}</span>
                    <ChevronRight size={14} className="text-white/10 group-hover:text-[#FFD700]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isThinking && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-[0_10px_30px_rgba(255,215,0,0.3)] z-[110] animate-in slide-in-from-bottom-5">
          <div className="w-4 h-4 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
          <span>APM-Elastic Indexing...</span>
        </div>
      )}

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: all;
          width: 28px;
          height: 28px;
          background-color: #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          transition: transform 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:active {
          transform: scale(1.15);
        }
        input[type=range]::-moz-range-thumb {
          pointer-events: all;
          width: 28px;
          height: 28px;
          background-color: #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
};

export default SearchScreen;
