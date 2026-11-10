/**
 * Brand & Store Configuration
 * 
 * Central configuration file for brand information, contact coordinates,
 * social links, customer support timings, and operational details.
 * 
 * TODO: Replace placeholders with official merchant details prior to commercial launch.
 */

export interface StoreBrandConfig {
  brandName: string;
  legalEntityName: string;
  tagline: string;
  supportPhone: string; // TODO: Replace placeholder with official merchant support number
  supportEmail: string; // TODO: Replace placeholder with official merchant email
  supportWhatsApp: string; // TODO: Replace placeholder with official WhatsApp business number
  officeAddress: string; // TODO: Replace placeholder with official merchant dispatch address
  businessHours: string;
  currency: string;
  country: string;
  social: {
    instagram: string; // TODO: Connect official Instagram handle
    facebook: string; // TODO: Connect official Facebook page
    tiktok?: string; // TODO: Connect official TikTok handle
  };
}

export const STORE_CONFIG: StoreBrandConfig = {
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || 'Arham Collection',
  legalEntityName: 'Arham Collection Private Limited',
  tagline: 'Refined Pakistani Fashion & Leather Goods',
  // Merchant support phone
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+92 311 9364088',
  // TODO: Replace with official domain email
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@arhamcollection.pk',
  // WhatsApp Business number
  supportWhatsApp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923119364088',
  // TODO: Replace with physical operational warehouse or office address in Pakistan
  officeAddress: 'Industrial Area, Phase 2, Lahore, Punjab, Pakistan',
  businessHours: 'Monday - Saturday: 10:00 AM - 8:00 PM PKT',
  currency: 'PKR',
  country: 'Pakistan',
  social: {
    instagram: 'https://instagram.com/arhamcollection',
    facebook: 'https://facebook.com/arhamcollection',
  },
};

