import { IMAGES } from '../assets/images';

export interface WeightOption {
  label: string; // e.g. '500g', '1kg', '2kg'
  multiplier: number; // e.g. 0.5, 1.0, 2.0
}

export interface Product {
  id: string;
  name: string;
  teluguName?: string;
  category: 'Snacks' | 'Sweets' | 'Pickles';
  basePrice: number; // Base price per kg OR base price per unit
  priceUnitText: string; // e.g. "₹350/kg" or "₹400 (250g)"
  description: string;
  image: string;
  weightOptions: WeightOption[];
  isPopular?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
}

// Snacks & Sweets: minimum order 500g (no 250g option)
// Pickles: start from 250g (unchanged)

const SNACK_WEIGHTS: WeightOption[] = [
  { label: '250g', multiplier: 0.25 },
  { label: '500g', multiplier: 0.5 },
  { label: '1 kg',  multiplier: 1.0 },
  { label: '2 kg',  multiplier: 2.0 },
  { label: '3 kg',  multiplier: 3.0 },
  { label: '4 kg',  multiplier: 4.0 },
  { label: '5 kg',  multiplier: 5.0 },
];

const SWEET_WEIGHTS: WeightOption[] = [
  { label: '250g', multiplier: 0.25 },
  { label: '500g', multiplier: 0.5 },
  { label: '1 kg',  multiplier: 1.0 },
  { label: '2 kg',  multiplier: 2.0 },
  { label: '3 kg',  multiplier: 3.0 },
  { label: '4 kg',  multiplier: 4.0 },
  { label: '5 kg',  multiplier: 5.0 },
];

export const PRODUCTS: Product[] = [
  // --- SNACKS (₹350 / kg) — starts from 500g ---
  {
    id: 'murukulu',
    name: 'Classic Murukulu (Jantikalu)',
    teluguName: 'మురుకులు',
    category: 'Snacks',
    basePrice: 350,
    priceUnitText: '₹350 / kg',
    description: 'Traditional crispy rice & sesame seed savouries made with pure groundnut oil.',
    image: IMAGES.murukulu,
    weightOptions: SNACK_WEIGHTS,
    isPopular: true,
    isBestseller: true,
  },
  {
    id: 'red-sakinalu',
    name: 'Red Chilli Sakinalu',
    teluguName: 'ఎర్ర సకినాలు',
    category: 'Snacks',
    basePrice: 350,
    priceUnitText: '₹350 / kg',
    description: 'Crispy Telangana classic sakinalu infused with spicy red chilli and carom seeds (vaamu).',
    image: IMAGES.redSakinalu,
    weightOptions: SNACK_WEIGHTS,
    isPopular: true,
  },
  {
    id: 'yellow-sakinalu',
    name: 'Pachi Mirchi Sakinalu',
    teluguName: 'పచ్చిమిర్చి సకినాలు',
    category: 'Snacks',
    basePrice: 350,
    priceUnitText: '₹350 / kg',
    description: 'Authentic festival sakinalu prepared with freshly ground rice flour, sesame seeds, and fresh green chillies (pachi mirchi).',
    image: IMAGES.yellowSakinalu,
    weightOptions: SNACK_WEIGHTS,
  },
  {
    id: 'chakodi',
    name: 'Crispy Ring Chakodi',
    teluguName: 'చేకోడీలు',
    category: 'Snacks',
    basePrice: 350,
    priceUnitText: '₹350 / kg',
    description: 'Golden crunchy round ring snacks packed with spicy cumin & garlic seasoning.',
    image: IMAGES.chakodi,
    weightOptions: SNACK_WEIGHTS,
    isPopular: true,
  },
  {
    id: 'mixture',
    name: 'Special Spicy Mixture',
    teluguName: 'హాట్ మిక్చర్',
    category: 'Snacks',
    basePrice: 350,
    priceUnitText: '₹350 / kg',
    description: 'Rich blend of sev, fried peanuts, roasted chana dal, curry leaves, and secret spices.',
    image: IMAGES.mixture,
    weightOptions: SNACK_WEIGHTS,
  },
  {
    id: 'ottikaram',
    name: 'Ottikaram Karappapullu',
    teluguName: 'ఒట్టికారం కారప్పూస',
    category: 'Snacks',
    basePrice: 350,
    priceUnitText: '₹350 / kg',
    description: 'Fine spicy gram flour sticks seasoned with traditional dry red chilli powder.',
    image: IMAGES.ottikaram,
    weightOptions: SNACK_WEIGHTS,
  },
  {
    id: 'pachikaram',
    name: 'Pachikaram Karappapullu',
    teluguName: 'పచ్చిమిర్చి కారప్పూస',
    category: 'Snacks',
    basePrice: 350,
    priceUnitText: '₹350 / kg',
    description: 'Unique aromatic savoury sticks flavoured with fresh green chilli paste.',
    image: IMAGES.pachikaram,
    weightOptions: SNACK_WEIGHTS,
  },

  // --- SWEETS (₹380 / kg) — starts from 500g ---
  {
    id: 'gujiya',
    name: 'Sweet Gujiya (Kajjikayalu)',
    teluguName: 'కజ్జికాయలు',
    category: 'Sweets',
    basePrice: 380,
    priceUnitText: '₹380 / kg',
    description: 'Crispy pastry shells stuffed with sweet grated coconut, cardamom & dry fruits.',
    image: IMAGES.gujiya,
    weightOptions: SWEET_WEIGHTS,
    isBestseller: true,
  },
  {
    id: 'harshallu',
    name: 'Jaggery Ariselu (Harshallu)',
    teluguName: 'బెల్లం అరిసెలు',
    category: 'Sweets',
    basePrice: 380,
    priceUnitText: '₹380 / kg',
    description: 'Soft traditional rice-flour patties sweetened with organic pure jaggery and ghee.',
    image: IMAGES.harshallu,
    weightOptions: SWEET_WEIGHTS,
    isPopular: true,
  },
  {
    id: 'laddu',
    name: 'Homemade Motichoor / Besan Laddu',
    teluguName: 'లడ్డు',
    category: 'Sweets',
    basePrice: 380,
    priceUnitText: '₹380 / kg',
    description: 'Melt-in-mouth golden laddus prepared with pure cow ghee and fragrant cardamom.',
    image: IMAGES.laddu,
    weightOptions: SWEET_WEIGHTS,
    isPopular: true,
  },

  // --- PICKLES (Chicken ₹400/250g, Mutton ₹600/250g) — unchanged, starts from 250g ---
  {
    id: 'chicken-pickle',
    name: 'Spicy Homemade Chicken Pickle',
    teluguName: 'చికెన్ పచ్చడి',
    category: 'Pickles',
    basePrice: 400, // ₹400 for 250g
    priceUnitText: '₹400 (250g)',
    description: 'Boneless tender chicken pieces marinated in authentic homemade Telangana spice mix and lemon juice.',
    image: IMAGES.chickenPickle,
    weightOptions: [
      { label: '250g', multiplier: 1.0 },   // ₹400
      { label: '500g', multiplier: 1.875 },  // ₹750
      { label: '1 kg', multiplier: 3.5 },    // ₹1400
    ],
    isBestseller: true,
    isPopular: true,
  },
  {
    id: 'mutton-pickle',
    name: 'Royal Spicy Mutton Pickle',
    teluguName: 'మటన్ పచ్చడి',
    category: 'Pickles',
    basePrice: 600, // ₹600 for 250g
    priceUnitText: '₹600 (250g)',
    description: 'Premium boneless mutton fried crisp and steeped in rich aromatic ginger-garlic pickle gravy.',
    image: IMAGES.muttonPickle,
    weightOptions: [
      { label: '250g', multiplier: 1.0 },    // ₹600
      { label: '500g', multiplier: 1.916 },  // ₹1150
      { label: '1 kg', multiplier: 3.666 },  // ₹2200
    ],
    isBestseller: true,
  },
];
