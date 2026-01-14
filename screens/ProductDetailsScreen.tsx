
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ShoppingCart, Heart, Share2, Star, ShieldCheck,
  MessageSquare, ChevronRight, Globe, Truck, RotateCcw, Clock, Check, X
} from 'lucide-react';
import { Product, Seller, Review } from '../types';
import { MOCK_SELLERS, MOCK_REVIEWS } from '../constants';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';

interface ProductDetailsScreenProps {
  product: Product;
  onBack: () => void;
  onAddToCart: () => void;
  onChatWithSeller: (sellerId: string) => void;
  onOpenSeller: (sellerId: string) => void;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
  id: number;
}

const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({
  product, onBack, onAddToCart, onChatWithSeller, onOpenSeller
}) => {
  const { addToCart, isInCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(product.image);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);

  useEffect(() => {
    const fetchSeller = async () => {
      // Allow fallback to mock if the ID looks like '1', '2' etc (standard mocks)
      if (MOCK_SELLERS.some(s => s.id === product.sellerId)) {
        setSeller(MOCK_SELLERS.find(s => s.id === product.sellerId) || MOCK_SELLERS[0]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', product.sellerId)
        .single();

      if (data) {
        setSeller({
          id: data.id,
          name: data.full_name || 'Vendedor',
          avatar: data.avatar_url || 'https://via.placeholder.com/150',
          rating: 0, // Profile might not have rating yet, schema doesn't strictly define it on profile, maybe avg product rating?
          totalSales: 0,
          responseTime: 'N/A',
          level: 'BRONZE', // Default or derive from somewhere
          joinedAt: data.created_at
        });
      } else {
        // Fallback
        setSeller(MOCK_SELLERS[0]);
      }
    };
    fetchSeller();
  }, [product.sellerId]);

  // Use a default/placeholder if seller is still loading
  const displaySeller = seller || MOCK_SELLERS[0];

  const gallery = [product.image, ...(product.gallery || [])];

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleAddToCart = () => {
    addToCart(product, 1, selectedVariations);
    showToast('Produto adicionado ao carrinho!', 'success');
  };

  const handleBuyNow = () => {
    addToCart(product, 1, selectedVariations);
    onAddToCart(); // This navigates to cart
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white pb-32 animate-in slide-in-from-right duration-300">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-50 bg-gradient-to-b from-black/80 to-transparent safe-area-top">
        <button onClick={onBack} className="p-2 bg-black/50 rounded-full backdrop-blur-md active:scale-95 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          <button className="p-2 bg-black/50 rounded-full backdrop-blur-md"><Share2 size={20} /></button>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full backdrop-blur-md transition-colors ${isLiked ? 'bg-red-500 text-white' : 'bg-black/50'}`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </header>

      {/* Main Image Slider */}
      <div className="relative aspect-square md:aspect-[3/1] bg-white/5 overflow-hidden">
        <img
          src={selectedImage}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {/* Image overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B]/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {gallery.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedImage(img)}
              className={`w-2 h-2 rounded-full transition-all ${selectedImage === img ? 'bg-[#FFD700] w-6' : 'bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Info Header */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-[#FFD700]">
              {product.price.toLocaleString()} <span className="text-sm">Kz</span>
            </span>
            {product.oldPrice && (
              <span className="text-sm text-white/30 line-through">
                {product.oldPrice.toLocaleString()} Kz
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold leading-tight">{product.name}</h1>
          <div className="flex items-center gap-4 text-xs font-bold text-white/50">
            <div className="flex items-center gap-1 text-[#FFD700]">
              <Star size={12} fill="#FFD700" /> {product.rating}
            </div>
            <span>{product.sales} Vendidos</span>
            {product.isInternational && (
              <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
                <Globe size={10} /> Internacional
              </span>
            )}
          </div>
        </section>

        {/* Variations */}
        {product.variations?.map((v) => (
          <section key={v.id} className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">{v.name}</h3>
            <div className="flex flex-wrap gap-2">
              {v.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => setSelectedVariations(prev => ({ ...prev, [v.id]: opt }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedVariations[v.id] === opt
                    ? 'border-[#FFD700] bg-[#FFD700] text-black'
                    : 'border-white/10 bg-[#1A1A1A] text-white/60'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Seller Rep */}
        <section
          onClick={() => onOpenSeller(displaySeller.id)}
          className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <img src={displaySeller.avatar} alt={displaySeller.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-bold flex items-center gap-2">
                {displaySeller.name}
                <span className="text-[9px] bg-[#FFD700]/10 text-[#FFD700] px-1.5 py-0.5 rounded uppercase">{displaySeller.level}</span>
              </h4>
              <p className="text-[10px] text-white/30 font-medium">Reputação: {displaySeller.rating}/5.0 | {displaySeller.totalSales} Vendas</p>
            </div>
          </div>
          <ChevronRight className="text-white/20 group-hover:text-[#FFD700] transition-colors" />
        </section>

        {/* Logistics Info */}
        <section className="bg-white/5 rounded-2xl p-4 divide-y divide-white/5">
          <div className="flex items-center gap-4 pb-3">
            <Truck size={20} className="text-[#FFD700]" />
            <div>
              <p className="text-xs font-bold">Frete Grátis para Luanda</p>
              <p className="text-[10px] text-white/40">Entrega estimada: 24h - 48h</p>
            </div>
          </div>
          <div className="flex items-center gap-4 py-3">
            <RotateCcw size={20} className="text-[#FFD700]" />
            <div>
              <p className="text-xs font-bold">Devolução Grátis</p>
              <p className="text-[10px] text-white/40">Até 7 dias após o recebimento</p>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-3">
            <ShieldCheck size={20} className="text-[#FFD700]" />
            <div>
              <p className="text-xs font-bold">Proteção ao Comprador</p>
              <p className="text-[10px] text-white/40">Reembolso garantido via AngoPlace</p>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="space-y-2">
          <h3 className="text-sm font-black uppercase italic">Descrição</h3>
          <p className="text-sm text-white/60 leading-relaxed">{product.description}</p>
        </section>

        {/* Reviews */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase italic">Avaliações ({MOCK_REVIEWS.length})</h3>
            <span className="text-xs text-[#FFD700] font-bold">Ver Todas</span>
          </div>
          <div className="space-y-4">
            {MOCK_REVIEWS.map(rev => (
              <div key={rev.id} className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center text-[10px] text-black font-black">
                      {rev.userName[0]}
                    </div>
                    <span className="text-xs font-bold">{rev.userName}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={10} fill={s <= rev.rating ? "#FFD700" : "transparent"} stroke={s <= rev.rating ? "#FFD700" : "#333"} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-white/60">{rev.comment}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-20 left-0 right-0 px-4 space-y-2 z-[100]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-2xl border shadow-2xl animate-in slide-in-from-top duration-300 ${toast.type === 'success' ? 'bg-[#0B0B0B] border-[#FFD700] text-[#FFD700]' : 'bg-[#0B0B0B] border-[#C00000] text-[#C00000]'}`}
          >
            <div className="flex items-center gap-3">
              <Check size={18} />
              <span className="text-xs font-black uppercase">{toast.message}</span>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-[#0B0B0B] border-t border-white/10 px-4 flex items-center gap-4 z-50 backdrop-blur-xl pb-safe">
        <style dangerouslySetInnerHTML={{ __html: `.pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }` }} />
        <button
          onClick={() => onChatWithSeller(displaySeller.id)}
          className="flex flex-col items-center justify-center text-white/50 hover:text-[#FFD700] transition-colors"
        >
          <MessageSquare size={24} />
          <span className="text-[9px] font-black uppercase mt-1">Chat</span>
        </button>
        <button
          onClick={handleAddToCart}
          className={`flex-grow h-14 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 ${isInCart(product.id) ? 'bg-green-500 text-white' : 'bg-white text-black'}`}
        >
          {isInCart(product.id) ? (
            <><Check size={18} /> No Carrinho</>
          ) : (
            <><ShoppingCart size={18} /> Adicionar</>
          )}
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-grow bg-[#FFD700] text-black h-14 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#FFD700]/10"
        >
          Comprar Agora
        </button>
      </footer>
    </div>
  );
};

export default ProductDetailsScreen;
