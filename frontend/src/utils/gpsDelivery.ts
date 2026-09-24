/**
 * gpsDelivery.ts
 * Rapido-style GPS-based delivery charge calculator.
 *
 * Pricing rule: ₹10 per every 7 km (minimum ₹10).
 *   0–7  km →  ₹10
 *   7–14 km →  ₹20
 *  14–21 km →  ₹30
 *  21–28 km →  ₹40
 *  28–35 km →  ₹50
 *  ...and so on.
 *
 * Formula: Math.max(10, Math.ceil(distanceKm / 7) * 10)
 */

/** PJR Swagrooha Foods store location — Hayathnagar, Hyderabad */
export const STORE_COORDS = {
  lat: 17.3378,
  lng: 78.5935,
  name: 'Hayathnagar',
};

export interface GpsDeliveryResult {
  lat: number;
  lng: number;
  distanceKm: number;
  charge: number;
}

/**
 * Haversine formula — calculates the straight-line distance between
 * two GPS coordinates in kilometres.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Add ~20% buffer to approximate road distance vs straight-line
  return parseFloat((R * c * 1.2).toFixed(1));
}

/**
 * Returns the delivery charge for a given distance.
 * Rule: ₹10 per 7 km slab, minimum ₹10.
 */
export function calcGpsDeliveryCharge(distanceKm: number): number {
  return Math.max(10, Math.ceil(distanceKm / 7) * 10);
}

/**
 * Detects the customer's current GPS location using the browser
 * Geolocation API, calculates distance from the store, and returns
 * the delivery charge.
 *
 * Throws an error string if permission is denied or unavailable.
 */
export function detectCustomerLocation(): Promise<GpsDeliveryResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('GPS not supported on this device/browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const distanceKm = haversineDistanceKm(
          STORE_COORDS.lat,
          STORE_COORDS.lng,
          lat,
          lng,
        );
        const charge = calcGpsDeliveryCharge(distanceKm);
        resolve({ lat, lng, distanceKm, charge });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject('Location permission denied. Please allow location access and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            reject('Location unavailable. Please check your GPS or try again.');
            break;
          case error.TIMEOUT:
            reject('Location request timed out. Please try again.');
            break;
          default:
            reject('Unable to detect location. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
}
