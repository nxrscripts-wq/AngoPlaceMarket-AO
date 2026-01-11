
export enum UserRole {
  USER = 'USER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum ProductStatus {
  PENDENTE = 'PENDENTE',
  PUBLICADO = 'PUBLICADO',
  REJEITADO = 'REJEITADO'
}

export enum PaymentStatus {
  IDLE = 'IDLE',
  WAITING_PIN = 'WAITING_PIN',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT'
}

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  totalSales: number;
  responseTime: string;
  level: 'BRONZE' | 'PRATA' | 'OURO' | 'PLATINA';
  joinedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  gallery?: string[];
  category: string;
  rating: number;
  sales: number;
  isInternational: boolean;
  isFreeShipping?: boolean;
  isFlashDeal?: boolean;
  status: ProductStatus;
  submittedBy: string;
  sellerId: string;
  description: string;
  stock: number;
  variations?: ProductVariation[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  role: UserRole;
  is_super_admin?: boolean;
  location?: string;
  avatar?: string;
}

export interface AppState {
  currentScreen: AppScreen;
  user: User | null;
}

export enum AppScreen {
  AUTH = 'auth',
  HOME = 'home',
  CATEGORIES = 'categories',
  CART = 'cart',
  PROFILE = 'profile',
  SEARCH = 'search',
  ADMIN = 'admin',
  SUBMIT_PRODUCT = 'submit_product',
  PRODUCT_DETAILS = 'product_details',
  CHAT_ROOM = 'chat_room'
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isInternational?: boolean | 'all';
  minRating?: number;
  onlyFreeShipping?: boolean;
}


export interface AdminAction {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId: string;
  timestamp: string;
  details: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}
