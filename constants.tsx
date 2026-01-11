
import { Product, ProductStatus, Seller, Review, RewardItem } from './types';

export const COLORS = {
  BLACK: '#0B0B0B',
  RED: '#C00000',
  YELLOW: '#FFD700',
  WHITE: '#FFFFFF',
  GRAY: '#1A1A1A'
};

export const MOCK_SELLERS: Seller[] = [
  {
    id: 's1',
    name: 'Kandengue Store',
    avatar: 'https://picsum.photos/seed/kandengue/200',
    rating: 4.9,
    totalSales: 1540,
    responseTime: '15 min',
    level: 'PLATINA',
    joinedAt: '2023-01-15'
  },
  {
    id: 's2',
    name: 'Loja do Povo Luanda',
    avatar: 'https://picsum.photos/seed/povo/200',
    rating: 4.5,
    totalSales: 850,
    responseTime: '1h',
    level: 'OURO',
    joinedAt: '2023-05-20'
  },
  {
    id: 's3',
    name: 'TechZona AO',
    avatar: 'https://picsum.photos/seed/techzona/200',
    rating: 4.7,
    totalSales: 2100,
    responseTime: '30 min',
    level: 'PLATINA',
    joinedAt: '2022-11-01'
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    userId: 'u1',
    userName: 'Nelson',
    rating: 5,
    comment: 'Chegou muito rápido em Viana! Qualidade top.',
    date: '2024-03-01'
  },
  {
    id: 'r2',
    userId: 'u2',
    userName: 'Filomena',
    rating: 4,
    comment: 'Bom produto, mas a caixa veio um pouco amassada.',
    date: '2024-02-28'
  },
  {
    id: 'r3',
    userId: 'u3',
    userName: 'João Manuel',
    rating: 5,
    comment: 'Excelente! Entrega no mesmo dia em Talatona.',
    date: '2024-03-05'
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Smartphone Pro Max Edição Luanda',
    price: 450000,
    oldPrice: 550000,
    image: 'https://picsum.photos/seed/phone/400/400',
    gallery: [
      'https://picsum.photos/seed/phone1/600/600',
      'https://picsum.photos/seed/phone2/600/600',
      'https://picsum.photos/seed/phone3/600/600'
    ],
    category: 'Eletrónicos',
    rating: 4.8,
    sales: 1200,
    isInternational: true,
    isFreeShipping: true,
    isFlashDeal: true,
    status: ProductStatus.PUBLICADO,
    submittedBy: 'system',
    sellerId: 's1',
    description: 'O melhor smartphone para quem vive o lifestyle de Luanda. Bateria de longa duração e câmera ultra potente.',
    stock: 25,
    variations: [
      { id: 'v1', name: 'Cor', options: ['Grafite', 'Dourado', 'Azul Marinho'] },
      { id: 'v2', name: 'Armazenamento', options: ['128GB', '256GB', '512GB'] }
    ]
  },
  {
    id: '2',
    name: 'Sapatos Sociais Couro Legítimo',
    price: 35000,
    image: 'https://picsum.photos/seed/shoes/400/400',
    category: 'Moda',
    rating: 4.5,
    sales: 450,
    isInternational: false,
    isFreeShipping: false,
    status: ProductStatus.PUBLICADO,
    submittedBy: 'system',
    sellerId: 's2',
    description: 'Elegância e conforto para eventos e trabalho. Feito à mão em Angola.',
    stock: 50,
    variations: [
      { id: 'v3', name: 'Tamanho', options: ['38', '39', '40', '41', '42'] }
    ]
  },
  {
    id: '3',
    name: 'Gerador Gasolina 5KVA Silencioso',
    price: 385000,
    oldPrice: 450000,
    image: 'https://picsum.photos/seed/generator/400/400',
    gallery: [
      'https://picsum.photos/seed/gen1/600/600',
      'https://picsum.photos/seed/gen2/600/600'
    ],
    category: 'Energia',
    rating: 4.9,
    sales: 890,
    isInternational: true,
    isFreeShipping: true,
    isFlashDeal: true,
    status: ProductStatus.PUBLICADO,
    submittedBy: 'system',
    sellerId: 's3',
    description: 'Gerador potente e silencioso, ideal para residências e escritórios em Angola. Consumo económico de combustível.',
    stock: 15,
    variations: [
      { id: 'v4', name: 'Potência', options: ['3KVA', '5KVA', '7KVA'] }
    ]
  },
  {
    id: '4',
    name: 'Kit Painel Solar 300W Completo',
    price: 180000,
    oldPrice: 220000,
    image: 'https://picsum.photos/seed/solar/400/400',
    gallery: [
      'https://picsum.photos/seed/solar1/600/600',
      'https://picsum.photos/seed/solar2/600/600'
    ],
    category: 'Energia',
    rating: 4.7,
    sales: 567,
    isInternational: true,
    isFreeShipping: true,
    isFlashDeal: false,
    status: ProductStatus.PUBLICADO,
    submittedBy: 'system',
    sellerId: 's3',
    description: 'Kit completo com painel, inversor e bateria. Perfeito para iluminação e aparelhos básicos. Instalação incluída em Luanda.',
    stock: 20,
    variations: [
      { id: 'v5', name: 'Capacidade', options: ['200W', '300W', '500W'] }
    ]
  },
  {
    id: '5',
    name: 'Cerveja Cuca (Grade 24 Unidades)',
    price: 12500,
    image: 'https://picsum.photos/seed/cuca/400/400',
    category: 'Bebidas',
    rating: 4.9,
    sales: 3500,
    isInternational: false,
    isFreeShipping: false,
    isFlashDeal: false,
    status: ProductStatus.PUBLICADO,
    submittedBy: 'system',
    sellerId: 's2',
    description: 'A cerveja angolana mais amada! Grade com 24 garrafas de 330ml. Entrega gelada disponível.',
    stock: 200
  },
  {
    id: '6',
    name: 'Smart TV 55" 4K Android',
    price: 320000,
    oldPrice: 380000,
    image: 'https://picsum.photos/seed/tv/400/400',
    gallery: [
      'https://picsum.photos/seed/tv1/600/600',
      'https://picsum.photos/seed/tv2/600/600'
    ],
    category: 'Eletrónicos',
    rating: 4.6,
    sales: 234,
    isInternational: true,
    isFreeShipping: true,
    isFlashDeal: true,
    status: ProductStatus.PUBLICADO,
    submittedBy: 'system',
    sellerId: 's1',
    description: 'Televisão 4K com sistema Android integrado. Netflix, YouTube e DStv Now prontos para usar.',
    stock: 12,
    variations: [
      { id: 'v6', name: 'Tamanho', options: ['43"', '50"', '55"', '65"'] }
    ]
  },
  {
    id: '7',
    name: 'Ar Condicionado Split 12000 BTU',
    price: 165000,
    oldPrice: 195000,
    image: 'https://picsum.photos/seed/ac/400/400',
    category: 'Casa',
    rating: 4.4,
    sales: 678,
    isInternational: true,
    isFreeShipping: true,
    isFlashDeal: false,
    status: ProductStatus.PUBLICADO,
    submittedBy: 'system',
    sellerId: 's3',
    description: 'Ar condicionado inverter económico. Instalação profissional disponível em Luanda e arredores.',
    stock: 30,
    variations: [
      { id: 'v7', name: 'BTU', options: ['9000', '12000', '18000', '24000'] }
    ]
  },
  {
    id: '8',
    name: 'Vestido Tradicional Angolano',
    price: 45000,
    image: 'https://picsum.photos/seed/dress/400/400',
    gallery: [
      'https://picsum.photos/seed/dress1/600/600',
      'https://picsum.photos/seed/dress2/600/600'
    ],
    category: 'Moda',
    rating: 4.8,
    sales: 890,
    isInternational: false,
    isFreeShipping: false,
    isFlashDeal: false,
    status: ProductStatus.PUBLICADO,
    submittedBy: 'system',
    sellerId: 's2',
    description: 'Vestido feito com tecido africano autêntico. Design exclusivo por estilistas angolanas. Perfeito para festas e eventos culturais.',
    stock: 40,
    variations: [
      { id: 'v8', name: 'Tamanho', options: ['S', 'M', 'L', 'XL'] },
      { id: 'v9', name: 'Cor', options: ['Vermelho/Amarelo', 'Azul/Verde', 'Preto/Dourado'] }
    ]
  }
];

export const REWARDS: RewardItem[] = [
  { id: '1', title: 'Voucher de 5.000 Kz', cost: 2500 },
  { id: '2', title: 'Voucher de 10.000 Kz', cost: 4500 },
  { id: '3', title: 'Frete Grátis Luanda', cost: 1000 },
  { id: '4', title: 'Cartão Presente Premium', cost: 8000 }
];

