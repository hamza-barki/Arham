import { z } from 'zod';
import { normalizePakistaniPhone } from '@/lib/utils';

/**
 * Zod Schema for Pakistani Mobile-First Checkout Form
 * Validates Province -> City -> Area hierarchy, house/street, optional landmark,
 * optional GPS coordinates (lat/lng), honeypot anti-spam, and idempotency key.
 */
export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name (at least 2 characters)')
    .max(80, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .refine((val) => normalizePakistaniPhone(val) !== null, {
      message: 'Please enter a valid Pakistani mobile number (e.g. 03001234567, 03211234567)',
    }),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),

  // Geographic Hierarchy
  province: z
    .string()
    .trim()
    .min(2, 'Please select your province / territory'),
  city: z
    .string()
    .trim()
    .min(2, 'Please select your city in Pakistan'),
  courierCityCode: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  areaId: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  areaName: z
    .string()
    .trim()
    .min(2, 'Please select your area or choose "My area is not listed"'),
  isCustomArea: z
    .boolean()
    .optional()
    .default(false),
  customAreaName: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),

  // House / Street details
  address: z
    .string()
    .trim()
    .min(3, 'Please provide house/apartment/shop number, street, or block')
    .max(250, 'Address is too long'),
  landmark: z
    .string()
    .trim()
    .max(120, 'Landmark is too long')
    .optional()
    .or(z.literal('')),
  postalCode: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),

  // Optional GPS Location Coordinates (from Leaflet Map)
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),

  // Order notes & Payment
  notes: z
    .string()
    .trim()
    .max(500, 'Special instructions too long')
    .optional()
    .or(z.literal('')),
  paymentMethod: z.enum(['COD', 'BankTransfer', 'Card', 'EasyPaisa', 'JazzCash']),

  // Customer accounts & marketing consent
  customerId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal('')),
  marketingConsent: z
    .boolean()
    .optional()
    .default(false),

  // Anti-spam honeypot: Bots fill this, legitimate users leave it empty
  website_url_hp: z
    .string()
    .max(0, 'Spam detected')
    .optional()
    .or(z.literal('')),

  // Optional Cloudflare Turnstile token
  cf_turnstile_token: z.string().optional(),

  // Idempotency key generated on client to prevent double submits
  idempotencyKey: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.isCustomArea && (!data.customAreaName || data.customAreaName.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please write the name of your area so our delivery team can find you',
      path: ['customAreaName'],
    });
  }
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
