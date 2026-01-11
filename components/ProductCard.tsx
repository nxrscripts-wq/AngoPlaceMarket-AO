
import React from 'react';
import { Product } from '../types';
import { Star, ShoppingCart, Globe } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick?: (p: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;

  return (
    <div 
      onClick={() => onClick?.(product)}
      className="bg-[#1A1A1A] rounded-xl overflow-hidden group border border-white/5 hover:border-[#FFD700]/30 transition-all duration-300 flex flex-col h-full cursor-pointer active:scale-95"
    >
      <div className="relative aspect-square overflow-hidden bg-white/5">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {discount && (
          <div className="absolute top-2 left-2 bg-[#C00000] text-white text-[10px] font-black px-2 py-1 rounded italic uppercase tracking-tighter">
            -{discount}% OFF
          </div>
        )}
        {product.isInternational && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-full flex items-center gap-1 border border-white/10">
            <Globe size={10} /> Internacional
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-grow">
        <h4 className="text-sm font-medium line-clamp-2 text-white/90 mb-2 min-h-[40px] leading-tight">
          {product.name}
        </h4>
        
        <div className="flex items-center gap-1 mb-2">
          <Star size={12} className="text-[#FFD700] fill-[#FFD700]" />
          <span className="text-[10px] text-white/60 font-bold">{product.rating} | {product.sales} vendidos</span>
        </div>

        <div className="mt-auto">
          {product.oldPrice && (
            <span className="text-[10px] text-white/30 line-through font-medium">
              {product.oldPrice.toLocaleString()} Kz
            </span>
          )}
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-black text-[#FFD700]">
              {product.price.toLocaleString()} <span className="text-xs">Kz</span>
            </span>
            <div className="w-8 h-8 bg-[#FFD700] text-black rounded-lg flex items-center justify-center hover:bg-white transition-colors">
              <ShoppingCart size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
