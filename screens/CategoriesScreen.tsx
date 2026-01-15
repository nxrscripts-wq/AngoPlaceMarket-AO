
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, ProductStatus } from '../types';
import ProductCard from '../components/ProductCard';
import { CATEGORIES, SUB_CATEGORIES as MOCK_SUB_CATEGORIES } from '../lib/categories';

interface CategoriesScreenProps {
  onProductClick?: (p: Product) => void;
}

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ onProductClick }) => {
  const [activeCategory, setActiveCategory] = useState('1');
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);
  const subCategories = currentCategory ? MOCK_SUB_CATEGORIES[currentCategory.name] || [] : [];

  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentCategory) return;
      setIsLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('status', ProductStatus.PUBLICADO)
          .eq('category', currentCategory.name);

        if (activeSubCategory) {
          query = query.eq('sub_category', activeSubCategory);
        }

        const { data, error } = await query.limit(20);

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
          location: p.location
        }));

        setProducts(mappedProducts);
      } catch (err) {
        console.error("Error fetching category products:", err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory, activeSubCategory]);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setActiveSubCategory(null);
  };

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
              onClick={() => handleCategoryChange(cat.id)}
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
      <div className="flex-grow p-4 space-y-6 overflow-y-auto bg-[#1A1A1A] no-scrollbar">
        <div className="flex flex-col gap-2">
          {activeSubCategory && (
            <button
              onClick={() => setActiveSubCategory(null)}
              className="flex items-center gap-1 text-[#FFD700] text-[10px] font-black uppercase tracking-widest mb-2 active:scale-95 transition-all"
            >
              <ArrowLeft size={14} /> Voltar para Sub-categorias
            </button>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">
              {activeSubCategory || currentCategory?.name}
            </h2>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
              {products.length} Resultados
            </span>
          </div>
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
        {!activeSubCategory && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-right duration-500">
            {subCategories.map((sub, i) => (
              <div
                key={sub}
                className="space-y-2 group cursor-pointer"
                onClick={() => setActiveSubCategory(sub)}
              >
                <div className="aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/5 relative group-hover:border-[#FFD700]/50 transition-all hover-glow">
                  <img src={`https://picsum.photos/seed/sub${activeCategory}${i}/300`} alt={sub} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[10px] font-black uppercase tracking-tighter line-clamp-1">{sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <div className="space-y-4 pt-4 pb-12">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest">
              {activeSubCategory ? `Produtos em ${activeSubCategory}` : 'Produtos em Destaque'}
            </h4>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <Loader2 size={32} className="animate-spin mb-2" />
              <p className="text-[10px] font-bold uppercase">Sincronizando Marketplace...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onClick={onProductClick || (() => { })} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-black/20 rounded-3xl border border-white/5">
              <span className="text-2xl mb-2">📦</span>
              <p className="text-xs font-black uppercase text-white/20">Sem produtos nesta categoria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesScreen;
