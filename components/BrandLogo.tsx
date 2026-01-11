
import React from 'react';

interface BrandLogoProps {
  variant?: 'horizontal' | 'square' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'horizontal', size = 'md', className = '', onClick }) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-24',
  };

  // Simulação de ícone SVG fiel ao logo fornecido (Carrinho-A estilizado)
  const LogoIcon = ({ colorRed = '#C00000', colorYellow = '#FFD700' }) => (
    <svg viewBox="0 0 100 100" className="h-full w-auto drop-shadow-xl">
      {/* Corpo do Carrinho/Letra A */}
      <path 
        d="M20,30 L40,80 L60,80 L80,30" 
        fill="none" 
        stroke={colorRed} 
        strokeWidth="12" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M35,60 L65,60" 
        stroke={colorYellow} 
        strokeWidth="8" 
        strokeLinecap="round" 
      />
      {/* Rodas do Carrinho */}
      <circle cx="35" cy="85" r="6" fill={colorYellow} />
      <circle cx="65" cy="85" r="6" fill={colorYellow} />
      {/* Linhas de movimento dinâmicas */}
      <path 
        d="M10,40 Q25,45 40,40" 
        fill="none" 
        stroke={colorYellow} 
        strokeWidth="3" 
        strokeDasharray="5,5" 
      />
    </svg>
  );

  if (variant === 'square') {
    return (
      <div 
        onClick={onClick}
        className={`bg-black rounded-2xl flex items-center justify-center p-2 border border-white/5 shadow-2xl ${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
      >
        <LogoIcon />
      </div>
    );
  }

  if (variant === 'monochrome') {
    return (
      <div 
        onClick={onClick}
        className={`flex items-center gap-3 opacity-40 grayscale brightness-200 ${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      >
        <LogoIcon colorRed="white" colorYellow="white" />
        <span className="text-white font-black italic tracking-tighter text-lg uppercase">AngoPlace</span>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2 md:gap-4 ${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer hover:opacity-90 transition-all' : ''}`}
    >
      <div className="h-full py-0.5">
        <LogoIcon />
      </div>
      <div className="flex flex-col justify-center leading-none">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-black italic tracking-tighter uppercase flex items-center gap-0">
          <span className="text-white">Ango</span>
          <span className="text-[#C00000]">Place</span>
        </h1>
        <span className="text-[8px] md:text-[10px] font-bold text-[#FFD700] tracking-[0.4em] uppercase opacity-80 -mt-1 ml-1">Market</span>
      </div>
    </div>
  );
};

export default BrandLogo;
