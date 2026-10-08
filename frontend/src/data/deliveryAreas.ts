export interface DeliveryArea {
  id: string;
  name: string;
  tier: 'Near' | 'Medium' | 'Far';
  charge: number;       // ₹10 (Near), ₹20 (Medium), ₹30 (Far)
  estimatedDeliveryText: string;
}

export const DELIVERY_AREAS: DeliveryArea[] = [
  // --- NEAR AREAS (₹10) ---
  {
    id: 'hayathnagar',
    name: 'Hayathnagar',
    tier: 'Near',
    charge: 10,
    estimatedDeliveryText: 'Scheduled Delivery (₹10) • 2–3 Days',
  },
  {
    id: 'bhagyalatha',
    name: 'Bhagyalatha',
    tier: 'Near',
    charge: 10,
    estimatedDeliveryText: 'Scheduled Delivery (₹10) • 2–3 Days',
  },
  {
    id: 'panama',
    name: 'Panama',
    tier: 'Near',
    charge: 10,
    estimatedDeliveryText: 'Scheduled Delivery (₹10) • 2–3 Days',
  },
  {
    id: 'vanasthalipuram',
    name: 'Vanasthalipuram',
    tier: 'Near',
    charge: 10,
    estimatedDeliveryText: 'Scheduled Delivery (₹10) • 2–3 Days',
  },

  // --- MEDIUM AREAS (₹20) ---
  {
    id: 'lbnagar',
    name: 'LB Nagar',
    tier: 'Medium',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 2–3 Days',
  },
  {
    id: 'sagarringroad',
    name: 'Sagar Ring Road',
    tier: 'Medium',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 2–3 Days',
  },
  {
    id: 'hasthinapuram',
    name: 'Hasthinapuram',
    tier: 'Medium',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 2–3 Days',
  },
  {
    id: 'bnreddy',
    name: 'BN Reddy',
    tier: 'Medium',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 2–3 Days',
  },
  {
    id: 'gurramguda',
    name: 'Gurramguda',
    tier: 'Medium',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 2–3 Days',
  },
  {
    id: 'turkayamjal',
    name: 'Turkayamjal',
    tier: 'Medium',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 2–3 Days',
  },
  {
    id: 'injapur',
    name: 'Injapur',
    tier: 'Medium',
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • 2–3 Days',
  },

  // --- FAR AREAS (₹30) ---
  {
    id: 'manneguda',
    name: 'Manneguda',
    tier: 'Far',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 2–3 Days',
  },
  {
    id: 'bongloor',
    name: 'Bongloor',
    tier: 'Far',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 2–3 Days',
  },
  {
    id: 'mangalpally',
    name: 'Mangalpally',
    tier: 'Far',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 2–3 Days',
  },
  {
    id: 'sheriguda',
    name: 'Sheriguda',
    tier: 'Far',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 2–3 Days',
  },
  {
    id: 'ibrahimpatnam',
    name: 'Ibrahimpatnam',
    tier: 'Far',
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • 2–3 Days',
  },
];
