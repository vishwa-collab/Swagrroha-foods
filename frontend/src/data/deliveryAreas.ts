export interface DeliveryArea {
  id: string;
  name: string;
  tier: 'Near' | 'Medium' | 'Far';
  charge: number;
  estimatedDeliveryText: string;
}

export const DELIVERY_AREAS: DeliveryArea[] = [
  // --- NEAR AREAS (₹20) ---
  { id: 'hayathnagar', name: 'Hayathnagar', tier: 'Near', charge: 20, estimatedDeliveryText: 'Weekend Delivery (₹20)' },
  { id: 'bhagyalatha', name: 'Bhagyalatha', tier: 'Near', charge: 20, estimatedDeliveryText: 'Weekend Delivery (₹20)' },
  { id: 'panama', name: 'Panama', tier: 'Near', charge: 20, estimatedDeliveryText: 'Weekend Delivery (₹20)' },
  { id: 'vanasthalipuram', name: 'Vanasthalipuram', tier: 'Near', charge: 20, estimatedDeliveryText: 'Weekend Delivery (₹20)' },

  // --- MEDIUM AREAS (₹30) ---
  { id: 'lbnagar', name: 'LB Nagar', tier: 'Medium', charge: 30, estimatedDeliveryText: 'Weekend Delivery (₹30)' },
  { id: 'sagarringroad', name: 'Sagar Ring Road', tier: 'Medium', charge: 30, estimatedDeliveryText: 'Weekend Delivery (₹30)' },
  { id: 'hasthinapuram', name: 'Hasthinapuram', tier: 'Medium', charge: 30, estimatedDeliveryText: 'Weekend Delivery (₹30)' },
  { id: 'bnreddy', name: 'BN Reddy', tier: 'Medium', charge: 30, estimatedDeliveryText: 'Weekend Delivery (₹30)' },
  { id: 'gurramguda', name: 'Gurramguda', tier: 'Medium', charge: 30, estimatedDeliveryText: 'Weekend Delivery (₹30)' },
  { id: 'turkayamjal', name: 'Turkayamjal', tier: 'Medium', charge: 30, estimatedDeliveryText: 'Weekend Delivery (₹30)' },
  { id: 'injapur', name: 'Injapur', tier: 'Medium', charge: 30, estimatedDeliveryText: 'Weekend Delivery (₹30)' },

  // --- FAR AREAS (₹40) ---
  { id: 'manneguda', name: 'Manneguda', tier: 'Far', charge: 40, estimatedDeliveryText: 'Weekend Delivery (₹40)' },
  { id: 'bongloor', name: 'Bongloor', tier: 'Far', charge: 40, estimatedDeliveryText: 'Weekend Delivery (₹40)' },
  { id: 'mangalpally', name: 'Mangalpally', tier: 'Far', charge: 40, estimatedDeliveryText: 'Weekend Delivery (₹40)' },
  { id: 'sheriguda', name: 'Sheriguda', tier: 'Far', charge: 40, estimatedDeliveryText: 'Weekend Delivery (₹40)' },
  { id: 'ibrahimpatnam', name: 'Ibrahimpatnam', tier: 'Far', charge: 40, estimatedDeliveryText: 'Weekend Delivery (₹40)' },
];
