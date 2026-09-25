export interface DeliveryArea {
  id: string;
  name: string;
  tier: 'Near' | 'Medium' | 'Far';
  charge: number;       // ₹20 (Near), ₹30 (Medium), ₹40 (Far)
  estimatedDeliveryText: string;
}

export const DELIVERY_AREAS: DeliveryArea[] = [
  // --- NEAR AREAS (₹20) ---
  {
    id: 'hayathnagar',
    name: 'Hayathnagar',
    tier: 'Near',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 4–5 Days',
  },
  {
    id: 'bhagyalatha',
    name: 'Bhagyalatha',
    tier: 'Near',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 4–5 Days',
  },
  {
    id: 'panama',
    name: 'Panama',
    tier: 'Near',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 4–5 Days',
  },
  {
    id: 'vanasthalipuram',
    name: 'Vanasthalipuram',
    tier: 'Near',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 4–5 Days',
  },

  // --- MEDIUM AREAS (₹30) ---
  {
    id: 'lbnagar',
    name: 'LB Nagar',
    tier: 'Medium',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 4–5 Days',
  },
  {
    id: 'sagarringroad',
    name: 'Sagar Ring Road',
    tier: 'Medium',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 4–5 Days',
  },
  {
    id: 'hasthinapuram',
    name: 'Hasthinapuram',
    tier: 'Medium',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 4–5 Days',
  },
  {
    id: 'bnreddy',
    name: 'BN Reddy',
    tier: 'Medium',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 4–5 Days',
  },
  {
    id: 'gurramguda',
    name: 'Gurramguda',
    tier: 'Medium',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 4–5 Days',
  },
  {
    id: 'turkayamjal',
    name: 'Turkayamjal',
    tier: 'Medium',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 4–5 Days',
  },
  {
    id: 'injapur',
    name: 'Injapur',
    tier: 'Medium',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 4–5 Days',
  },

  // --- FAR AREAS (₹40) ---
  {
    id: 'manneguda',
    name: 'Manneguda',
    tier: 'Far',
    charge: 40,
    estimatedDeliveryText: 'Scheduled Delivery (₹40) • 4–5 Days',
  },
  {
    id: 'bongloor',
    name: 'Bongloor',
    tier: 'Far',
    charge: 40,
    estimatedDeliveryText: 'Scheduled Delivery (₹40) • 4–5 Days',
  },
  {
    id: 'mangalpally',
    name: 'Mangalpally',
    tier: 'Far',
    charge: 40,
    estimatedDeliveryText: 'Scheduled Delivery (₹40) • 4–5 Days',
  },
  {
    id: 'sheriguda',
    name: 'Sheriguda',
    tier: 'Far',
    charge: 40,
    estimatedDeliveryText: 'Scheduled Delivery (₹40) • 4–5 Days',
  },
  {
    id: 'ibrahimpatnam',
    name: 'Ibrahimpatnam',
    tier: 'Far',
    charge: 40,
    estimatedDeliveryText: 'Scheduled Delivery (₹40) • 4–5 Days',
  },
];
