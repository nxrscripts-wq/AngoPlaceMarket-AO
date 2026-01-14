
import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS } from '../constants';
import { supabase } from '../lib/supabase';
import { ProductStatus } from '../types';
import ProductCard from '../components/ProductCard';
import { ChevronRight, Zap, Trophy, Gift } from 'lucide-react';
import { Product } from '../types';

interface HomeScreenProps {
  onProductClick: (p: Product) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onProductClick }) => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchApprovedProducts();

    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `status=eq.${ProductStatus.PUBLICADO}` }, () => {
        fetchApprovedProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApprovedProducts = async () => {
    // setIsLoading(true); // Don't show full loading spinner on realtime update to avoid flicker
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*`)
        .eq('status', ProductStatus.PUBLICADO)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedProducts: Product[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          oldPrice: p.old_price,
          image: p.image,
          category: p.category || 'Geral',
          rating: p.rating || 0,
          sales: p.sales || 0,
          isInternational: p.is_international || false,
          status: p.status,
          submittedBy: p.seller_id,
          sellerId: p.seller_id,
          description: p.description,
          stock: p.stock,
          variations: p.variations
        }));
        setProducts(mappedProducts);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">

      {/* Flash Deals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-[#C00000] fill-[#C00000]" size={24} />
            <h3 className="text-xl font-extrabold italic uppercase">Ofertas Relâmpago</h3>
          </div>
          <div className="flex items-center gap-1 text-[#FFD700] text-sm font-bold uppercase tracking-wider cursor-pointer">
            Ver Tudo <ChevronRight size={16} />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {products.filter(p => p.isFlashDeal).map(product => (
            <div key={product.id} className="min-w-[160px]">
              <ProductCard product={product} onClick={onProductClick} />
            </div>
          ))}
        </div>
      </section>

      {/* Main Grid */}
      <section>
        <div className="flex items-center justify-between mb-4 border-l-4 border-[#FFD700] pl-3">
          <h3 className="text-xl font-extrabold uppercase italic tracking-tight">Recomendados para Ti</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onClick={onProductClick} />
          ))}
        </div>
      </section>

    </div>
  );
};

export default HomeScreen;
