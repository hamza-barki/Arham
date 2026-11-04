/**
 * Store Settings & COD Controls
 * 
 * Configures shipping fee thresholds, COD handling fees, open-parcel inspection flags,
 * and advance-payment rules for high-value orders across Pakistan.
 */

export interface RiskThresholdSettings {
  duplicateWindowMinutes: number;
  highValueThreshold: number;
  highRiskScore: number;
  mediumRiskScore: number;
}

export interface StoreSettings {
  freeShippingThreshold: number;
  shippingFee: number;
  codFee: number;
  allowOpenParcel: boolean; // "Inspect before payment" flag - false by default unless courier confirms
  advancePayment: {
    enabled: boolean;
    thresholdAmount: number;
    advanceAmount: number;
    accountDetails: string;
  };
  riskThresholds: RiskThresholdSettings;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  freeShippingThreshold: 3000,
  shippingFee: 200,
  codFee: 50,
  allowOpenParcel: false, // OFF by default as per Pakistani courier regulations
  advancePayment: {
    enabled: false, // OFF by default
    thresholdAmount: 8000,
    advanceAmount: 500,
    accountDetails: 'Contact Merchant Support for Official Deposit Details',
  },
  riskThresholds: {
    duplicateWindowMinutes: 10,
    highValueThreshold: 10000,
    highRiskScore: 45,
    mediumRiskScore: 20,
  },
};

// In-memory settings for local development and offline mode
export let inMemoryStoreSettings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };

/**
 * Calculates honest price breakdown for customer cart & checkout
 */
export function calculateHonestTotal(
  subtotal: number,
  paymentMethod: string = 'COD',
  settings: StoreSettings = inMemoryStoreSettings
) {
  const isFreeShipping = subtotal >= settings.freeShippingThreshold;
  const shippingCharge = subtotal > 0 ? (isFreeShipping ? 0 : settings.shippingFee) : 0;
  const codHandlingFee = paymentMethod === 'COD' && subtotal > 0 ? settings.codFee : 0;
  const grandTotal = subtotal + shippingCharge + codHandlingFee;

  // Advance Payment Rule (if enabled and subtotal exceeds threshold)
  const isAdvanceRequired =
    settings.advancePayment.enabled && subtotal >= settings.advancePayment.thresholdAmount;
  
  const advanceRequiredAmount = isAdvanceRequired
    ? Math.min(settings.advancePayment.advanceAmount, grandTotal)
    : 0;

  const codPayableOnDelivery = grandTotal - advanceRequiredAmount;

  return {
    subtotal,
    shippingCharge,
    isFreeShipping,
    codHandlingFee,
    grandTotal,
    isAdvanceRequired,
    advanceRequiredAmount,
    codPayableOnDelivery,
    allowOpenParcel: settings.allowOpenParcel,
  };
}

