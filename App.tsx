
import React, { useState, useEffect } from 'react';
import { AppScreen, User, UserRole, Product, Seller } from './types';
import { CartProvider } from './contexts/CartContext';
import Header from './components/Header';
import FooterNav from './components/FooterNav';
import HomeScreen from './screens/HomeScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import CartScreen from './screens/CartScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminDashboard from './screens/AdminDashboard';
import SearchScreen from './screens/SearchScreen';
import AuthScreen from './screens/AuthScreen';
import SubmitProductScreen from './screens/SubmitProductScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import ChatScreen from './screens/ChatScreen';
import RegisterShopScreen from './screens/RegisterShopScreen';
import { MOCK_SELLERS, MOCK_PRODUCTS } from './constants';
import { supabase } from './lib/supabase';

export const SUPER_ADMIN_EMAIL = "elviino.nxrscripts@gmail.com";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    const saved = localStorage.getItem('ango_current_screen');
    return (saved as AppScreen) || AppScreen.HOME;
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('ango_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  const mapSupabaseUser = (sbUser: any): User => {
    const email = sbUser.email || '';
    const isMaster = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const metadata = sbUser.user_metadata || {};

    return {
      id: sbUser.id,
      name: metadata.full_name || metadata.name || email.split('@')[0] || 'Utilizador',
      email: email,
      walletBalance: metadata.wallet_balance || 0,
      role: isMaster ? UserRole.SUPER_ADMIN : (metadata.role || UserRole.USER),
      is_super_admin: isMaster,
      avatar: metadata.avatar_url || metadata.picture || ''
    };
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        if (_event === 'SIGNED_IN') setCurrentScreen(AppScreen.HOME);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentScreen !== AppScreen.AUTH) {
      localStorage.setItem('ango_current_screen', currentScreen);
    }
  }, [currentScreen]);

  useEffect(() => {
    localStorage.setItem('ango_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);


  const handleLogin = (userData: User) => {
    // This is now handled by onAuthStateChange, but we keep this for legacy compatibility if needed
    setUser(userData);
    setCurrentScreen(AppScreen.HOME);
  };

  const handleOpenProduct = (p: Product) => {
    setSelectedProduct(p);
    setCurrentScreen(AppScreen.PRODUCT_DETAILS);
  };

  const handleOpenChat = (sellerId: string) => {
    if (!user) {
      setCurrentScreen(AppScreen.AUTH);
      return;
    }
    const s = MOCK_SELLERS.find(sel => sel.id === sellerId) || MOCK_SELLERS[0];
    setSelectedSeller(s);
    setCurrentScreen(AppScreen.CHAT_ROOM);
  };

  const handleSearch = (query?: string) => {
    if (query) {
      setActiveSearchQuery(query);
    }
    setCurrentScreen(AppScreen.SEARCH);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-24 right-4 z-[9999] px-6 py-3 rounded-2xl font-bold shadow-2xl animate-in slide-in-from-right fade-in duration-300 ${type === 'success'
      ? 'bg-[#FFD700] text-black border border-white/20'
      : 'bg-[#C00000] text-white border border-white/10'
      }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out', 'slide-out-to-right');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // Simulate checking if already claimed (in a real app this would be backend check)

  const renderScreen = () => {
    // Guest protection for specific screens
    const protectedScreens = [
      AppScreen.PROFILE,
      AppScreen.ADMIN,
      AppScreen.SUBMIT_PRODUCT,
      AppScreen.CHAT_ROOM
    ];

    if (!user && protectedScreens.includes(currentScreen)) {
      return <AuthScreen />;
    }

    if (currentScreen === AppScreen.AUTH) {
      return <AuthScreen />;
    }

    switch (currentScreen) {
      case AppScreen.HOME: return <HomeScreen onProductClick={handleOpenProduct} />;
      case AppScreen.CATEGORIES: return <CategoriesScreen />;
      case AppScreen.CART: return <CartScreen />;
      case AppScreen.PROFILE: return (
        <ProfileScreen
          user={user}
          onAdmin={() => setCurrentScreen(AppScreen.ADMIN)}
          onLogout={() => { setUser(null); localStorage.clear(); setCurrentScreen(AppScreen.HOME); }}
          onSell={() => setCurrentScreen(AppScreen.SUBMIT_PRODUCT)}
          onRegisterShop={() => setCurrentScreen(AppScreen.SHOP_REGISTRATION)}
        />
      );
      case AppScreen.ADMIN: return user ? <AdminDashboard user={user} onBack={() => setCurrentScreen(AppScreen.PROFILE)} /> : null;
      case AppScreen.SEARCH: return (
        <SearchScreen
          initialQuery={activeSearchQuery}
          onBack={() => {
            setActiveSearchQuery('');
            setCurrentScreen(AppScreen.HOME);
          }}
          onProductClick={handleOpenProduct}
        />
      );
      case AppScreen.SUBMIT_PRODUCT: return user ? <SubmitProductScreen onBack={() => setCurrentScreen(AppScreen.PROFILE)} user={user} /> : null;
      case AppScreen.PRODUCT_DETAILS: return selectedProduct ? (
        <ProductDetailsScreen
          product={selectedProduct}
          onBack={() => setCurrentScreen(AppScreen.HOME)}
          onAddToCart={() => setCurrentScreen(AppScreen.CART)}
          onChatWithSeller={handleOpenChat}
          onOpenSeller={(id) => { }}
        />
      ) : null;
      case AppScreen.CHAT_ROOM: return (selectedSeller && user) ? (
        <ChatScreen seller={selectedSeller} onBack={() => setCurrentScreen(AppScreen.PRODUCT_DETAILS)} />
      ) : null;
      case AppScreen.SHOP_REGISTRATION: return user ? (
        <RegisterShopScreen
          user={user}
          onBack={() => setCurrentScreen(AppScreen.PROFILE)}
          onSuccess={() => {
            showToast('Solicitação de Loja Submetida!', 'success');
            setCurrentScreen(AppScreen.PROFILE);
          }}
        />
      ) : null;
      default: return <HomeScreen onProductClick={handleOpenProduct} />;
    }
  };

  const hideFooter = [
    AppScreen.ADMIN,
    AppScreen.SEARCH,
    AppScreen.SUBMIT_PRODUCT,
    AppScreen.PRODUCT_DETAILS,
    AppScreen.CHAT_ROOM,
    AppScreen.AUTH
  ].includes(currentScreen);

  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen bg-[#0B0B0B] text-white">
        {!hideFooter && (
          <Header
            onSearchClick={handleSearch}
            onSellClick={() => setCurrentScreen(AppScreen.SUBMIT_PRODUCT)}
            onCartClick={() => setCurrentScreen(AppScreen.CART)}
            onLogoClick={() => setCurrentScreen(AppScreen.HOME)}
            onLoginClick={() => setCurrentScreen(AppScreen.AUTH)}
            user={user}
          />
        )}
        <main className={`flex-grow ${!hideFooter ? 'pb-20 pt-20' : ''}`}>
          {renderScreen()}
        </main>
        {!hideFooter && (
          <FooterNav activeScreen={currentScreen} onNavigate={setCurrentScreen} />
        )}
      </div>
    </CartProvider>
  );
};

export default App;
