export interface DeliveryArea {
  id: string;
  name: string;
  tier: 'Near' | 'Medium' | 'Far' | 'VeryFar';
  distanceKm: number;   // approximate road distance from Hayathnagar store
  charge: number;       // ₹10 per 5km slab (₹2/km, minimum ₹10)
  estimatedDeliveryText: string;
}

/**
 * Delivery charge rule (from Hayathnagar store):
 *   ₹10 per every 5 km  →  Math.max(10, Math.ceil(distanceKm / 5) * 10)
 *
 * Examples:
 *   0–5  km  →  ₹10
 *   6–10 km  →  ₹20
 *   11–15 km →  ₹30
 *   16–20 km →  ₹40
 *   21–25 km →  ₹50
 *   26–30 km →  ₹60
 *   31–35 km →  ₹70
 */
export function calcDeliveryCharge(distanceKm: number): number {
  return Math.max(10, Math.ceil(distanceKm / 5) * 10);
}

export const DELIVERY_AREAS: DeliveryArea[] = [
  // --- NEAR (0–5 km → ₹10) ---
  {
    id: 'hayathnagar',
    name: 'Hayathnagar',
    tier: 'Near',
    distanceKm: 1,
    charge: 10,
    estimatedDeliveryText: 'Scheduled Delivery (₹10) • ~1 km • 4–5 Days',
  },
  {
    id: 'bhagyalatha',
    name: 'Bhagyalatha',
    tier: 'Near',
    distanceKm: 2,
    charge: 10,
    estimatedDeliveryText: 'Scheduled Delivery (₹10) • ~2 km • 4–5 Days',
  },
  {
    id: 'panama',
    name: 'Panama',
    tier: 'Near',
    distanceKm: 3,
    charge: 10,
    estimatedDeliveryText: 'Scheduled Delivery (₹10) • ~3 km • 4–5 Days',
  },
  {
    id: 'vanasthalipuram',
    name: 'Vanasthalipuram',
    tier: 'Near',
    distanceKm: 3,
    charge: 10,
    estimatedDeliveryText: 'Scheduled Delivery (₹10) • ~3 km • 4–5 Days',
  },
  {
    id: 'sagarringroad',
    name: 'Sagar Ring Road',
    tier: 'Near',
    distanceKm: 5,
    charge: 10,
    estimatedDeliveryText: 'Scheduled Delivery (₹10) • ~5 km • 4–5 Days',
  },

  // --- MEDIUM (6–10 km → ₹20) ---
  {
    id: 'lbnagar',
    name: 'LB Nagar',
    tier: 'Medium',
    distanceKm: 8,
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • ~8 km • 4–5 Days',
  },
  {
    id: 'hasthinapuram',
    name: 'Hasthinapuram',
    tier: 'Medium',
    distanceKm: 8,
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • ~8 km • 4–5 Days',
  },
  {
    id: 'bnreddy',
    name: 'BN Reddy',
    tier: 'Medium',
    distanceKm: 8,
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • ~8 km • 4–5 Days',
  },
  {
    id: 'gurramguda',
    name: 'Gurramguda',
    tier: 'Medium',
    distanceKm: 9,
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • ~9 km • 4–5 Days',
  },
  {
    id: 'turkayamjal',
    name: 'Turkayamjal',
    tier: 'Medium',
    distanceKm: 7,
    charge: 20,
    estimatedDeliveryText: 'Scheduled Delivery (₹20) • ~7 km • 4–5 Days',
  },

  // --- FAR (11–15 km → ₹30) ---
  {
    id: 'injapur',
    name: 'Injapur',
    tier: 'Far',
    distanceKm: 12,
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • ~12 km • 4–5 Days',
  },
  {
    id: 'manneguda',
    name: 'Manneguda',
    tier: 'Far',
    distanceKm: 15,
    charge: 30,
    estimatedDeliveryText: 'Scheduled Delivery (₹30) • ~15 km • 4–5 Days',
  },

  // --- FAR (16–20 km → ₹40) ---
  {
    id: 'bongloor',
    name: 'Bongloor',
    tier: 'Far',
    distanceKm: 18,
    charge: 40,
    estimatedDeliveryText: 'Scheduled Delivery (₹40) • ~18 km • 4–5 Days',
  },

  // --- VERY FAR (21–25 km → ₹50) ---
  {
    id: 'sheriguda',
    name: 'Sheriguda',
    tier: 'VeryFar',
    distanceKm: 22,
    charge: 50,
    estimatedDeliveryText: 'Scheduled Delivery (₹50) • ~22 km • 4–5 Days',
  },

  // --- VERY FAR (26–30 km → ₹60) ---
  {
    id: 'mangalpally',
    name: 'Mangalpally',
    tier: 'VeryFar',
    distanceKm: 28,
    charge: 60,
    estimatedDeliveryText: 'Scheduled Delivery (₹60) • ~28 km • 4–5 Days',
  },

  // --- VERY FAR (31–35 km → ₹70) ---
  {
    id: 'ibrahimpatnam',
    name: 'Ibrahimpatnam',
    tier: 'VeryFar',
    distanceKm: 35,
    charge: 70,
    estimatedDeliveryText: 'Scheduled Delivery (₹70) • ~35 km • 4–5 Days',
  },
];
