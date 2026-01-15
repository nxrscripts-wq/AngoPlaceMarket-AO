import { Smartphone, Shirt, Home, Camera, Car, Gamepad2, Baby } from 'lucide-react';

export const CATEGORIES = [
    { id: '1', name: 'Eletrónicos', slug: 'eletronicos', icon: Smartphone, count: '1.2k+ produtos' },
    { id: '2', name: 'Moda e Vestuário', slug: 'moda', icon: Shirt, count: '3k+ produtos' },
    { id: '3', name: 'Casa e Lazer', slug: 'casa', icon: Home, count: '850 produtos' },
    { id: '4', name: 'Fotografia', slug: 'fotografia', icon: Camera, count: '420 produtos' },
    { id: '5', name: 'Peças Auto', slug: 'pecas-auto', icon: Car, count: '2.1k+ produtos' },
    { id: '6', name: 'Gaming', slug: 'gaming', icon: Gamepad2, count: '310 produtos' },
    { id: '7', name: 'Bebé e Kids', slug: 'bebe', icon: Baby, count: '1.1k+ produtos' },
];

export const SUB_CATEGORIES: Record<string, string[]> = {
    'Eletrónicos': ['Smartphones', 'Laptops', 'Tablets', 'Acessórios', 'Áudio', 'TVs'],
    'Moda e Vestuário': ['Homem', 'Mulher', 'Crianças', 'Calçado', 'Relógios', 'Malas'],
    'Peças Auto': ['Motores', 'Pneus', 'Iluminação', 'Som', 'Acessórios Interior', 'Travões'],
    'Casa e Lazer': ['Cozinha', 'Quarto', 'Sala', 'Jardim', 'Decoração', 'Limpeza'],
    'Gaming': ['Playstation', 'Xbox', 'Nintendo', 'PC Gaming', 'Cadeiras', 'Jogos'],
    'Fotografia': ['Câmaras', 'Lentes', 'Tripés', 'Iluminação Estúdio', 'Bolsas', 'Drones'],
    'Bebé e Kids': ['Roupa', 'Brinquedos', 'Carrinhos', 'Alimentação', 'Higiene', 'Mobiliário']
};
