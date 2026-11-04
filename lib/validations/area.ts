import { z } from 'zod';

/**
 * Validation schema for Area management in Admin Panel
 */
export const areaSchema = z.object({
  cityId: z.string().min(1, 'Please select a city'),
  name: z
    .string()
    .trim()
    .min(2, 'Area name must be at least 2 characters')
    .max(100, 'Area name is too long'),
  nameUr: z
    .string()
    .trim()
    .max(100, 'Urdu name is too long')
    .optional()
    .or(z.literal('')),
  active: z.boolean().default(true),
});

export type AreaInput = z.infer<typeof areaSchema>;

/**
 * Validation schema for CSV Area Importer rows
 * Expected CSV columns: province, city, area, courier_city_code
 */
export const csvAreaRowSchema = z.object({
  province: z
    .string()
    .trim()
    .min(2, 'Province name is required'),
  city: z
    .string()
    .trim()
    .min(2, 'City name is required'),
  area: z
    .string()
    .trim()
    .min(2, 'Area name must be at least 2 characters'),
  courier_city_code: z
    .string()
    .trim()
    .max(15, 'Courier city code too long')
    .optional()
    .or(z.literal('')),
  area_ur: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal('')),
  city_ur: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal('')),
});

export type CsvAreaRow = z.infer<typeof csvAreaRowSchema>;

