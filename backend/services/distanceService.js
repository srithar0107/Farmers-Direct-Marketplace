// Tamil Nadu District Coordinates (Centroids)
const TN_DISTRICT_COORDS = {
  chennai: { lat: 13.0827, lng: 80.2707 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  salem: { lat: 11.6643, lng: 78.146 },
  tirunelveli: { lat: 8.7139, lng: 77.7567 },
  tiruppur: { lat: 11.1085, lng: 77.3411 },
  erode: { lat: 11.341, lng: 77.7172 },
  vellore: { lat: 12.9165, lng: 79.1325 },
  thoothukudi: { lat: 8.7642, lng: 78.1348 },
  dindigul: { lat: 10.3673, lng: 77.9803 },
  thanjavur: { lat: 10.787, lng: 79.1378 },
  ranipet: { lat: 12.9229, lng: 79.3326 },
  virudhunagar: { lat: 9.5872, lng: 77.9514 },
  karur: { lat: 10.9601, lng: 78.0766 },
  nilgiris: { lat: 11.4916, lng: 76.7337 },
  ooty: { lat: 11.4102, lng: 76.695 },
  krishnagiri: { lat: 12.5186, lng: 78.2137 },
  kanyakumari: { lat: 8.0883, lng: 77.5385 },
  nagercoil: { lat: 8.1833, lng: 77.4119 },
  cuddalore: { lat: 11.748, lng: 79.7714 },
  kanchipuram: { lat: 12.8342, lng: 79.7036 },
  tiruvallur: { lat: 13.1432, lng: 79.9079 },
  nagapattinam: { lat: 10.7672, lng: 79.8449 },
  villupuram: { lat: 11.9401, lng: 79.4861 },
  namakkal: { lat: 11.2189, lng: 78.1674 },
  pudukkottai: { lat: 10.3797, lng: 78.8208 },
  theni: { lat: 10.0104, lng: 77.4768 },
  dharmapuri: { lat: 12.1211, lng: 78.1582 },
  ramanathapuram: { lat: 9.3639, lng: 78.8395 },
  sivaganga: { lat: 9.8433, lng: 78.4809 },
  thiruvarur: { lat: 10.7725, lng: 79.6365 },
  tiruvannamalai: { lat: 12.2253, lng: 79.0747 },
  ariyalur: { lat: 11.1401, lng: 79.0786 },
  perambalur: { lat: 11.2342, lng: 78.882 },
  kallakurichi: { lat: 11.7383, lng: 78.9634 },
  chengalpattu: { lat: 12.6841, lng: 79.9836 },
  tenkasi: { lat: 8.9594, lng: 77.3152 },
  mayiladuthurai: { lat: 11.1075, lng: 79.6524 }
};


// Configurable Marketplace Pricing Rules
const PRICING_CONFIG = {
  DELIVERY: {
    BASE_FEE: 35, // Base fee covers up to 15 km
    BASE_KM: 15,
    PER_KM_RATE: 3.5, // ₹3.50 per km beyond base km
    SAME_DISTRICT_FLAT: 35, // Flat fee if within the exact same district
    FALLBACK_FEE: 40, // Fallback if locations cannot be accurately parsed
    MAX_FEE: 250 // Prevent exorbitant cross-state freight charges
  },
  HANDLING_FEE: 10, // ₹10 fresh farm produce packaging, crate handling & careful sorting
  PLATFORM_FEE: 5,  // ₹5 transparent marketplace maintenance & support fee
  TAX_RATE: 0,      // Agricultural raw produce is exempted (0% GST) under Indian GST Law
  TAX_LABEL: "0% GST (Exempted for raw agricultural produce)",
  DISCOUNT: 0
};

// Haversine formula to calculate great-circle distance in kilometers
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Find district coordinates from a free-text location string
function resolveDistrict(locStr) {
  if (!locStr || typeof locStr !== "string") return null;
  const normalized = locStr.toLowerCase().trim();

  for (const [district, coords] of Object.entries(TN_DISTRICT_COORDS)) {
    if (normalized.includes(district)) {
      return { district: district.charAt(0).toUpperCase() + district.slice(1), coords };
    }
  }

  // Common market towns mapped to parent district
  const townToDistrict = {
    ottanchathiram: "dindigul",
    koyambedu: "chennai",
    pollachi: "coimbatore",
    mettupalayam: "coimbatore",
    sathyamangalam: "erode",
    bhavani: "erode",
    gobichettipalayam: "erode",
    panruti: "cuddalore",
    kumbakonam: "thanjavur",
    usilampatti: "madurai",
    melur: "madurai",
    attur: "salem",
    hosur: "krishnagiri",
    ambur: "tirupattur",
    kovilpatti: "thoothukudi",
    rajapalayam: "virudhunagar",
    srivilliputhur: "virudhunagar",
    bodinayakanur: "theni",
    cumbum: "theni",
    palani: "dindigul"
  };

  for (const [town, parent] of Object.entries(townToDistrict)) {
    if (normalized.includes(town) && TN_DISTRICT_COORDS[parent]) {
      return { district: parent.charAt(0).toUpperCase() + parent.slice(1), coords: TN_DISTRICT_COORDS[parent] };
    }
  }

  return null;
}

/**
 * Calculate distance and delivery charge between farmer's farm and buyer's address
 */
function calculateDeliveryCharge(farmerLocation, buyerLocation) {
  const farmerMatch = resolveDistrict(farmerLocation);
  const buyerMatch = resolveDistrict(buyerLocation);

  // If both locations are resolved
  if (farmerMatch && buyerMatch) {
    // If same district
    if (farmerMatch.district.toLowerCase() === buyerMatch.district.toLowerCase()) {
      return {
        distanceKm: 12, // Average local delivery distance
        deliveryFee: PRICING_CONFIG.DELIVERY.SAME_DISTRICT_FLAT,
        isSameDistrict: true,
        farmerDistrict: farmerMatch.district,
        buyerDistrict: buyerMatch.district,
        isEstimated: false
      };
    }

    const dist = haversineDistance(
      farmerMatch.coords.lat,
      farmerMatch.coords.lng,
      buyerMatch.coords.lat,
      buyerMatch.coords.lng
    );

    // Rate calculation: Base fee + per-km beyond BASE_KM
    let fee = PRICING_CONFIG.DELIVERY.BASE_FEE;
    if (dist > PRICING_CONFIG.DELIVERY.BASE_KM) {
      fee += (dist - PRICING_CONFIG.DELIVERY.BASE_KM) * PRICING_CONFIG.DELIVERY.PER_KM_RATE;
    }
    // Cap reasonable delivery fee max to prevent astronomical rates across state
    fee = Math.min(Math.round(fee), PRICING_CONFIG.DELIVERY.MAX_FEE);

    return {
      distanceKm: dist,
      deliveryFee: Math.round(fee),
      isSameDistrict: false,
      farmerDistrict: farmerMatch.district,
      buyerDistrict: buyerMatch.district,
      isEstimated: false
    };
  }

  // Fallback if one or both cannot be resolved to a specific district
  return {
    distanceKm: 25,
    deliveryFee: PRICING_CONFIG.DELIVERY.FALLBACK_FEE,
    isSameDistrict: false,
    farmerDistrict: farmerLocation || "Farm Location",
    buyerDistrict: buyerLocation || "Delivery Address",
    isEstimated: true
  };
}

/**
 * Full Transparent Delivered Price Breakdown Formula:
 * Item subtotal = Unit price × Quantity
 * Final delivered price = Item subtotal + Transport charge + Handling charge + Platform fee + Applicable tax − Discounts
 */
function calculateFullPriceBreakdown({
  unitPrice = 0,
  quantity = 1,
  farmerLocation = "",
  buyerLocation = ""
}) {
  const subtotal = Math.max(0, Number(unitPrice) || 0) * Math.max(1, Number(quantity) || 1);
  const deliveryResult = calculateDeliveryCharge(farmerLocation, buyerLocation);
  const deliveryCharge = deliveryResult.deliveryFee;
  const handlingCharge = PRICING_CONFIG.HANDLING_FEE;
  const platformFee = PRICING_CONFIG.PLATFORM_FEE;
  const taxAmount = Math.round(subtotal * PRICING_CONFIG.TAX_RATE);
  const discountAmount = PRICING_CONFIG.DISCOUNT;

  const totalDeliveredPrice = subtotal + deliveryCharge + handlingCharge + platformFee + taxAmount - discountAmount;

  return {
    subtotal,
    deliveryCharge,
    distanceKm: deliveryResult.distanceKm,
    isSameDistrict: deliveryResult.isSameDistrict,
    farmerDistrict: deliveryResult.farmerDistrict,
    buyerDistrict: deliveryResult.buyerDistrict,
    isEstimated: deliveryResult.isEstimated,
    handlingCharge,
    platformFee,
    taxAmount,
    taxLabel: PRICING_CONFIG.TAX_LABEL,
    discountAmount,
    totalDeliveredPrice,
    rules: PRICING_CONFIG
  };
}

module.exports = {
  calculateDeliveryCharge,
  calculateFullPriceBreakdown,
  resolveDistrict,
  haversineDistance,
  PRICING_CONFIG,
  DELIVERY_CONFIG: PRICING_CONFIG.DELIVERY,
  TN_DISTRICT_COORDS
};

