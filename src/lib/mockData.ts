// Mock data representing the retail DSS notebook structure

export const ISLANDS = [
  'JAWA, BALI, & NT',
  'KALIMANTAN & SULAWESI', 
  'SUMATERA & RIAU'
] as const;

export type Island = typeof ISLANDS[number];

export const PRODUCT_CATEGORIES = [
  'KOSMETIK',
  'SKINCARE',
  'HAIRCARE',
  'BODYCARE',
  'PARFUM',
  'ALAT KECANTIKAN',
  'SUPLEMEN',
  'OBAT-OBATAN',
  'MAKANAN',
  'MINUMAN',
  'HOUSEHOLD',
  'ELEKTRONIK'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Generate weekly forecast data
function generateWeeklyData(baseValue: number, weeks: number, variance: number = 0.3) {
  const data = [];
  let current = baseValue;
  
  for (let i = 0; i < weeks; i++) {
    const change = (Math.random() - 0.5) * 2 * variance;
    current = Math.max(10, current * (1 + change));
    data.push(Math.round(current));
  }
  
  return data;
}

// Historical data (last 24 weeks)
export function generateHistoricalData(island: Island, category: ProductCategory) {
  const baseSales: Record<ProductCategory, number> = {
    'KOSMETIK': 450,
    'SKINCARE': 380,
    'HAIRCARE': 280,
    'BODYCARE': 320,
    'PARFUM': 150,
    'ALAT KECANTIKAN': 90,
    'SUPLEMEN': 200,
    'OBAT-OBATAN': 170,
    'MAKANAN': 500,
    'MINUMAN': 420,
    'HOUSEHOLD': 350,
    'ELEKTRONIK': 80
  };

  const islandMultiplier: Record<Island, number> = {
    'JAWA, BALI, & NT': 1.5,
    'KALIMANTAN & SULAWESI': 0.8,
    'SUMATERA & RIAU': 1.0
  };

  const base = baseSales[category] * islandMultiplier[island];
  const weeks = generateWeeklyData(base, 24);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 24 * 7);

  return weeks.map((qty, idx) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + idx * 7);
    return {
      date: date.toISOString().split('T')[0],
      quantity: qty,
      type: 'actual' as const
    };
  });
}

// Forecast data (next 10 weeks)
export function generateForecastData(island: Island, category: ProductCategory) {
  const baseSales: Record<ProductCategory, number> = {
    'KOSMETIK': 480,
    'SKINCARE': 400,
    'HAIRCARE': 290,
    'BODYCARE': 340,
    'PARFUM': 160,
    'ALAT KECANTIKAN': 95,
    'SUPLEMEN': 220,
    'OBAT-OBATAN': 180,
    'MAKANAN': 530,
    'MINUMAN': 450,
    'HOUSEHOLD': 370,
    'ELEKTRONIK': 85
  };

  const islandMultiplier: Record<Island, number> = {
    'JAWA, BALI, & NT': 1.5,
    'KALIMANTAN & SULAWESI': 0.8,
    'SUMATERA & RIAU': 1.0
  };

  const base = baseSales[category] * islandMultiplier[island];
  const weeks = generateWeeklyData(base, 10, 0.15);
  
  const startDate = new Date();

  return weeks.map((qty, idx) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (idx + 1) * 7);
    return {
      date: date.toISOString().split('T')[0],
      quantity: qty,
      type: 'forecast' as const
    };
  });
}

// MBA Association Rules
export interface MBARule {
  id: string;
  pulau: Island;
  antecedent: ProductCategory;
  consequent: ProductCategory;
  confidence: number;
  lift: number;
  support: number;
}

export const mbaRules: MBARule[] = [
  { id: '1', pulau: 'JAWA, BALI, & NT', antecedent: 'KOSMETIK', consequent: 'SKINCARE', confidence: 0.72, lift: 3.45, support: 0.15 },
  { id: '2', pulau: 'JAWA, BALI, & NT', antecedent: 'SKINCARE', consequent: 'BODYCARE', confidence: 0.65, lift: 2.89, support: 0.12 },
  { id: '3', pulau: 'JAWA, BALI, & NT', antecedent: 'HAIRCARE', consequent: 'BODYCARE', confidence: 0.58, lift: 2.56, support: 0.10 },
  { id: '4', pulau: 'JAWA, BALI, & NT', antecedent: 'PARFUM', consequent: 'KOSMETIK', confidence: 0.54, lift: 2.34, support: 0.08 },
  { id: '5', pulau: 'KALIMANTAN & SULAWESI', antecedent: 'HOUSEHOLD', consequent: 'BODYCARE', confidence: 0.68, lift: 3.12, support: 0.14 },
  { id: '6', pulau: 'KALIMANTAN & SULAWESI', antecedent: 'MAKANAN', consequent: 'MINUMAN', confidence: 0.78, lift: 4.21, support: 0.18 },
  { id: '7', pulau: 'KALIMANTAN & SULAWESI', antecedent: 'SKINCARE', consequent: 'KOSMETIK', confidence: 0.61, lift: 2.78, support: 0.11 },
  { id: '8', pulau: 'SUMATERA & RIAU', antecedent: 'SUPLEMEN', consequent: 'OBAT-OBATAN', confidence: 0.55, lift: 2.45, support: 0.09 },
  { id: '9', pulau: 'SUMATERA & RIAU', antecedent: 'KOSMETIK', consequent: 'ALAT KECANTIKAN', confidence: 0.48, lift: 2.12, support: 0.07 },
  { id: '10', pulau: 'SUMATERA & RIAU', antecedent: 'MINUMAN', consequent: 'MAKANAN', confidence: 0.71, lift: 3.89, support: 0.16 },
];

// DSS Recommendations
export interface Recommendation {
  id: string;
  pulau: Island;
  type: 'stockup' | 'bundling' | 'promo' | 'layout';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  anchorProduct: ProductCategory;
  targetProduct?: ProductCategory;
  expectedImpact: string;
  confidence: number;
}

export const recommendations: Recommendation[] = [
  {
    id: '1',
    pulau: 'JAWA, BALI, & NT',
    type: 'stockup',
    priority: 'high',
    title: 'Tambah Stok: Kosmetik',
    description: 'Prakiraan memprediksi peningkatan permintaan 35% dalam 4 minggu berikutnya. Siapkan inventori tambahan.',
    anchorProduct: 'KOSMETIK',
    expectedImpact: '+35% peluang pendapatan',
    confidence: 0.85
  },
  {
    id: '2',
    pulau: 'JAWA, BALI, & NT',
    type: 'bundling',
    priority: 'high',
    title: 'Peluang Bundel',
    description: 'Pembeli Kosmetik sering membeli Skincare (72% kepercayaan). Buat penawaran combo.',
    anchorProduct: 'KOSMETIK',
    targetProduct: 'SKINCARE',
    expectedImpact: '+23% ukuran keranjang',
    confidence: 0.72
  },
  {
    id: '3',
    pulau: 'KALIMANTAN & SULAWESI',
    type: 'promo',
    priority: 'medium',
    title: 'Bersihkan Stok Lambat: Elektronik',
    description: 'Prakiraan rendah untuk Elektronik. Bundel dengan Household dengan diskon 20% untuk membersihkan inventori.',
    anchorProduct: 'ELEKTRONIK',
    targetProduct: 'HOUSEHOLD',
    expectedImpact: 'Kurangi stok mati sebesar 40%',
    confidence: 0.68
  },
  {
    id: '4',
    pulau: 'SUMATERA & RIAU',
    type: 'layout',
    priority: 'medium',
    title: 'Tata Letak Toko: Minuman & Makanan',
    description: 'Tempatkan Minuman bersebelahan dengan bagian Makanan. Tingkat cross-purchase tinggi (lift: 3.89x).',
    anchorProduct: 'MINUMAN',
    targetProduct: 'MAKANAN',
    expectedImpact: '+18% tingkat cross-sell',
    confidence: 0.71
  },
  {
    id: '5',
    pulau: 'JAWA, BALI, & NT',
    type: 'stockup',
    priority: 'medium',
    title: 'Permintaan Turunan: Skincare',
    description: 'Seiring penjualan Kosmetik meningkat, siapkan inventori Skincare (72% korelasi).',
    anchorProduct: 'SKINCARE',
    expectedImpact: '+28% penjualan turunan',
    confidence: 0.72
  },
];

// Summary metrics
export interface DashboardMetrics {
  totalForecastRevenue: number;
  stockoutRisks: number;
  bundlingOpportunities: number;
  promoSuggestions: number;
  accuracyScore: number;
}

export function getDashboardMetrics(): DashboardMetrics {
  return {
    totalForecastRevenue: 2847500000, // IDR
    stockoutRisks: 4,
    bundlingOpportunities: 12,
    promoSuggestions: 6,
    accuracyScore: 87.3
  };
}

// Forecast quality per category
export interface ForecastQuality {
  category: ProductCategory;
  pulau: Island;
  mae: number;
  mape: number;
  quality: 'Highly Accurate' | 'Good' | 'Reasonable' | 'Inaccurate';
}

export const forecastQuality: ForecastQuality[] = [
  { category: 'KOSMETIK', pulau: 'JAWA, BALI, & NT', mae: 12.3, mape: 8.5, quality: 'Highly Accurate' },
  { category: 'SKINCARE', pulau: 'JAWA, BALI, & NT', mae: 15.7, mape: 11.2, quality: 'Good' },
  { category: 'MAKANAN', pulau: 'KALIMANTAN & SULAWESI', mae: 28.4, mape: 14.8, quality: 'Good' },
  { category: 'MINUMAN', pulau: 'KALIMANTAN & SULAWESI', mae: 22.1, mape: 12.3, quality: 'Good' },
  { category: 'HOUSEHOLD', pulau: 'SUMATERA & RIAU', mae: 35.6, mape: 22.5, quality: 'Reasonable' },
  { category: 'ELEKTRONIK', pulau: 'JAWA, BALI, & NT', mae: 8.2, mape: 32.1, quality: 'Reasonable' },
];
