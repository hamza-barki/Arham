/**
 * Supabase Database TypeScript Definitions – V2
 * Phase 1: Extended data model with profiles, roles, product_private,
 *           areas hierarchy, enriched orders, events, support, settings, audit
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enum Types ───────────────────────────────────────────────────────────────
export type AdminRole    = 'super_admin' | 'admin' | 'manager';
export type UserRole     = 'customer' | 'staff' | 'manager' | 'admin' | 'super_admin';
export type PaymentMethod = 'COD' | 'BankTransfer' | 'Card' | 'EasyPaisa' | 'JazzCash';
export type ProductStatus = 'active' | 'draft' | 'archived';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/** New rich order status enum (replaces old narrow status) */
export type OrderStatusV2 =
  | 'pending_confirmation'
  | 'confirmed'
  | 'ordered_from_supplier'
  | 'shipped'
  | 'delivered'
  | 'returned_rto'
  | 'cancelled';

/** Legacy order status – kept for backward compat */
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';

// ─── Database Interface ───────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      // ── profiles ──────────────────────────────────────────────────────────
      profiles: {
        Row: {
          id:                 string;
          full_name:          string | null;
          phone:              string | null;
          email:              string | null;
          marketing_consent:  boolean;
          consent_at:         string | null;
          created_at:         string;
        };
        Insert: {
          id:                  string;
          full_name?:          string | null;
          phone?:              string | null;
          email?:              string | null;
          marketing_consent?:  boolean;
          consent_at?:         string | null;
          created_at?:         string;
        };
        Update: {
          id?:                 string;
          full_name?:          string | null;
          phone?:              string | null;
          email?:              string | null;
          marketing_consent?:  boolean;
          consent_at?:         string | null;
          created_at?:         string;
        };
      };

      // ── user_roles ────────────────────────────────────────────────────────
      user_roles: {
        Row: {
          id:         string;
          user_id:    string;
          role:       UserRole;
          granted_by: string | null;
          granted_at: string;
        };
        Insert: {
          id?:         string;
          user_id:     string;
          role?:       UserRole;
          granted_by?: string | null;
          granted_at?: string;
        };
        Update: {
          id?:         string;
          user_id?:    string;
          role?:       UserRole;
          granted_by?: string | null;
          granted_at?: string;
        };
      };

      // ── admins (legacy – keep for backward compat) ────────────────────────
      admins: {
        Row: {
          id:         string;
          user_id:    string;
          role:       AdminRole;
          created_at: string;
        };
        Insert: {
          id?:        string;
          user_id:    string;
          role?:      AdminRole;
          created_at?: string;
        };
        Update: {
          id?:        string;
          user_id?:   string;
          role?:      AdminRole;
          created_at?: string;
        };
      };

      // ── categories ────────────────────────────────────────────────────────
      categories: {
        Row: {
          id:            string;
          name:          string;
          slug:          string;
          parent_id:     string | null;
          description:   string | null;
          image_url:     string | null;
          display_order: number;
          created_at:    string;
        };
        Insert: {
          id?:            string;
          name:           string;
          slug:           string;
          parent_id?:     string | null;
          description?:   string | null;
          image_url?:     string | null;
          display_order?: number;
          created_at?:    string;
        };
        Update: {
          id?:            string;
          name?:          string;
          slug?:          string;
          parent_id?:     string | null;
          description?:   string | null;
          image_url?:     string | null;
          display_order?: number;
          created_at?:    string;
        };
      };

      // ── products (public columns only) ────────────────────────────────────
      products: {
        Row: {
          id:               string;
          sku:              string;
          name:             string;
          slug:             string;
          description:      string | null;
          price:            number;
          compare_at_price: number | null;
          category_id:      string;
          stock_quantity:   number;
          is_active:        boolean;
          status?:          ProductStatus;
          tags?:            string[];
          created_at:       string;
          updated_at:       string;
        };
        Insert: {
          id?:               string;
          sku:               string;
          name:              string;
          slug:              string;
          description?:      string | null;
          price:             number;
          compare_at_price?: number | null;
          category_id:       string;
          stock_quantity?:   number;
          is_active?:        boolean;
          status?:           ProductStatus;
          tags?:             string[];
          created_at?:       string;
          updated_at?:       string;
        };
        Update: {
          id?:               string;
          sku?:              string;
          name?:             string;
          slug?:             string;
          description?:      string | null;
          price?:            number;
          compare_at_price?: number | null;
          category_id?:      string;
          stock_quantity?:   number;
          is_active?:        boolean;
          status?:           ProductStatus;
          tags?:             string[];
          created_at?:       string;
          updated_at?:       string;
        };
      };

      // ── product_private (admin-only – cost & supplier data) ───────────────
      product_private: {
        Row: {
          product_id:             string;
          supplier_sku:           string | null;
          cost_price:             number | null;
          supplier_delivery_cost: number | null;
          cod_fee:                number | null;
          notes:                  string | null;
          updated_at:             string;
        };
        Insert: {
          product_id:              string;
          supplier_sku?:           string | null;
          cost_price?:             number | null;
          supplier_delivery_cost?: number | null;
          cod_fee?:                number | null;
          notes?:                  string | null;
          updated_at?:             string;
        };
        Update: {
          product_id?:             string;
          supplier_sku?:           string | null;
          cost_price?:             number | null;
          supplier_delivery_cost?: number | null;
          cod_fee?:                number | null;
          notes?:                  string | null;
          updated_at?:             string;
        };
      };

      // ── product_variants ──────────────────────────────────────────────────
      product_variants: {
        Row: {
          id:             string;
          product_id:     string;
          size:           string | null;
          color:          string | null;
          stock_quantity: number;
          sku_suffix:     string;
          created_at:     string;
        };
        Insert: {
          id?:             string;
          product_id:      string;
          size?:           string | null;
          color?:          string | null;
          stock_quantity?: number;
          sku_suffix:      string;
          created_at?:     string;
        };
        Update: {
          id?:             string;
          product_id?:     string;
          size?:           string | null;
          color?:          string | null;
          stock_quantity?: number;
          sku_suffix?:     string;
          created_at?:     string;
        };
      };

      // ── product_images ────────────────────────────────────────────────────
      product_images: {
        Row: {
          id:                  string;
          product_id:          string;
          cloudinary_url:      string;
          cloudinary_public_id: string;
          position:            number;
          is_size_chart:       boolean;
          color_tag?:          string | null;
          created_at:          string;
        };
        Insert: {
          id?:                  string;
          product_id:           string;
          cloudinary_url:       string;
          cloudinary_public_id: string;
          position?:            number;
          is_size_chart?:       boolean;
          color_tag?:           string | null;
          created_at?:          string;
        };
        Update: {
          id?:                  string;
          product_id?:          string;
          cloudinary_url?:      string;
          cloudinary_public_id?: string;
          position?:            number;
          is_size_chart?:       boolean;
          color_tag?:           string | null;
          created_at?:          string;
        };
      };

      // ── provinces ─────────────────────────────────────────────────────────
      provinces: {
        Row: {
          id:      string;
          name:    string;
          name_ur: string | null;
        };
        Insert: {
          id?:      string;
          name:     string;
          name_ur?: string | null;
        };
        Update: {
          id?:      string;
          name?:    string;
          name_ur?: string | null;
        };
      };

      // ── cities ────────────────────────────────────────────────────────────
      cities: {
        Row: {
          id:                string;
          province_id:       string;
          name:              string;
          name_ur:           string | null;
          courier_city_code: string | null;
        };
        Insert: {
          id?:                string;
          province_id:        string;
          name:               string;
          name_ur?:           string | null;
          courier_city_code?: string | null;
        };
        Update: {
          id?:                string;
          province_id?:       string;
          name?:              string;
          name_ur?:           string | null;
          courier_city_code?: string | null;
        };
      };

      // ── areas ─────────────────────────────────────────────────────────────
      areas: {
        Row: {
          id:      string;
          city_id: string;
          name:    string;
          name_ur: string | null;
          active:  boolean;
        };
        Insert: {
          id?:      string;
          city_id:  string;
          name:     string;
          name_ur?: string | null;
          active?:  boolean;
        };
        Update: {
          id?:      string;
          city_id?: string;
          name?:    string;
          name_ur?: string | null;
          active?:  boolean;
        };
      };

      // ── addresses ─────────────────────────────────────────────────────────
      addresses: {
        Row: {
          id:           string;
          user_id:      string | null;
          full_name:    string;
          phone:        string;
          province:     string;
          city:         string;
          area_id:      string | null;
          address_line: string;
          landmark:     string | null;
          lat:          number | null;
          lng:          number | null;
          is_default:   boolean;
          created_at:   string;
        };
        Insert: {
          id?:           string;
          user_id?:      string | null;
          full_name:     string;
          phone:         string;
          province:      string;
          city:          string;
          area_id?:      string | null;
          address_line:  string;
          landmark?:     string | null;
          lat?:          number | null;
          lng?:          number | null;
          is_default?:   boolean;
          created_at?:   string;
        };
        Update: {
          id?:           string;
          user_id?:      string | null;
          full_name?:    string;
          phone?:        string;
          province?:     string;
          city?:         string;
          area_id?:      string | null;
          address_line?: string;
          landmark?:     string | null;
          lat?:          number | null;
          lng?:          number | null;
          is_default?:   boolean;
          created_at?:   string;
        };
      };

      // ── orders (enriched) ────────────────────────────────────────────────
      orders: {
        Row: {
          id:                 string;
          order_number:       string;
          user_id:            string | null;
          customer_id:        string | null;
          customer_name:      string;
          phone:              string;
          address:            string;
          city:               string;
          postal_code:        string | null;
          payment_method:     PaymentMethod;
          status:             OrderStatus;
          status_v2:          OrderStatusV2;
          total_amount:       number;
          notes:              string | null;
          // Address snapshot
          addr_province:      string | null;
          addr_city:          string | null;
          addr_area_name:     string | null;
          addr_address_line:  string | null;
          addr_landmark:      string | null;
          addr_lat:           number | null;
          addr_lng:           number | null;
          // Fulfillment
          supplier_order_ref: string | null;
          courier:            string | null;
          tracking_number:    string | null;
          internal_notes:     string | null;
          // Marketing
          utm_source:         string | null;
          utm_medium:         string | null;
          utm_campaign:       string | null;
          // Risk
          risk_flags:         Json;
          confirmation_token: string | null;
          created_at:         string;
          updated_at:         string;
        };
        Insert: {
          id?:                 string;
          order_number?:       string;
          user_id?:            string | null;
          customer_id?:        string | null;
          customer_name:       string;
          phone:               string;
          address:             string;
          city:                string;
          postal_code?:        string | null;
          payment_method?:     PaymentMethod;
          status?:             OrderStatus;
          status_v2?:          OrderStatusV2;
          total_amount:        number;
          notes?:              string | null;
          addr_province?:      string | null;
          addr_city?:          string | null;
          addr_area_name?:     string | null;
          addr_address_line?:  string | null;
          addr_landmark?:      string | null;
          addr_lat?:           number | null;
          addr_lng?:           number | null;
          supplier_order_ref?: string | null;
          courier?:            string | null;
          tracking_number?:    string | null;
          internal_notes?:     string | null;
          utm_source?:         string | null;
          utm_medium?:         string | null;
          utm_campaign?:       string | null;
          risk_flags?:         Json;
          confirmation_token?: string | null;
          created_at?:         string;
          updated_at?:         string;
        };
        Update: {
          id?:                 string;
          order_number?:       string;
          user_id?:            string | null;
          customer_id?:        string | null;
          customer_name?:      string;
          phone?:              string;
          address?:            string;
          city?:               string;
          postal_code?:        string | null;
          payment_method?:     PaymentMethod;
          status?:             OrderStatus;
          status_v2?:          OrderStatusV2;
          total_amount?:       number;
          notes?:              string | null;
          addr_province?:      string | null;
          addr_city?:          string | null;
          addr_area_name?:     string | null;
          addr_address_line?:  string | null;
          addr_landmark?:      string | null;
          addr_lat?:           number | null;
          addr_lng?:           number | null;
          supplier_order_ref?: string | null;
          courier?:            string | null;
          tracking_number?:    string | null;
          internal_notes?:     string | null;
          utm_source?:         string | null;
          utm_medium?:         string | null;
          utm_campaign?:       string | null;
          risk_flags?:         Json;
          confirmation_token?: string | null;
          created_at?:         string;
          updated_at?:         string;
        };
      };

      // ── order_items ───────────────────────────────────────────────────────
      order_items: {
        Row: {
          id:         string;
          order_id:   string;
          product_id: string;
          variant_id: string | null;
          quantity:   number;
          price:      number;
          created_at: string;
        };
        Insert: {
          id?:         string;
          order_id:    string;
          product_id:  string;
          variant_id?: string | null;
          quantity:    number;
          price:       number;
          created_at?: string;
        };
        Update: {
          id?:         string;
          order_id?:   string;
          product_id?: string;
          variant_id?: string | null;
          quantity?:   number;
          price?:      number;
          created_at?: string;
        };
      };

      // ── order_events ──────────────────────────────────────────────────────
      order_events: {
        Row: {
          id:         string;
          order_id:   string;
          status:     OrderStatusV2 | null;
          note:       string | null;
          actor_id:   string | null;
          created_at: string;
        };
        Insert: {
          id?:         string;
          order_id:    string;
          status?:     OrderStatusV2 | null;
          note?:       string | null;
          actor_id?:   string | null;
          created_at?: string;
        };
        Update: {
          id?:         string;
          order_id?:   string;
          status?:     OrderStatusV2 | null;
          note?:       string | null;
          actor_id?:   string | null;
          created_at?: string;
        };
      };

      // ── support_messages ──────────────────────────────────────────────────
      support_messages: {
        Row: {
          id:         string;
          name:       string;
          email:      string | null;
          phone:      string | null;
          message:    string;
          status:     SupportStatus;
          order_ref:  string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:         string;
          name:        string;
          email?:      string | null;
          phone?:      string | null;
          message:     string;
          status?:     SupportStatus;
          order_ref?:  string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?:         string;
          name?:       string;
          email?:      string | null;
          phone?:      string | null;
          message?:    string;
          status?:     SupportStatus;
          order_ref?:  string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ── settings ──────────────────────────────────────────────────────────
      settings: {
        Row: {
          key:        string;
          value:      Json;
          updated_at: string;
        };
        Insert: {
          key:         string;
          value:       Json;
          updated_at?: string;
        };
        Update: {
          key?:        string;
          value?:      Json;
          updated_at?: string;
        };
      };

      // ── audit_log ─────────────────────────────────────────────────────────
      audit_log: {
        Row: {
          id:         string;
          actor_id:   string | null;
          action:     string;
          entity:     string;
          entity_id:  string | null;
          diff:       Json | null;
          created_at: string;
        };
        Insert: {
          id?:         string;
          actor_id?:   string | null;
          action:      string;
          entity:      string;
          entity_id?:  string | null;
          diff?:       Json | null;
          created_at?: string;
        };
        Update: {
          id?:         string;
          actor_id?:   string | null;
          action?:     string;
          entity?:     string;
          entity_id?:  string | null;
          diff?:       Json | null;
          created_at?: string;
        };
      };
    };

    Functions: {
      is_admin:  { Args: Record<string, never>; Returns: boolean };
      is_staff:  { Args: Record<string, never>; Returns: boolean };
      has_role:  { Args: { _role: UserRole };   Returns: boolean };
    };
  };
}

// ─── Convenience Type Aliases ─────────────────────────────────────────────────
export type Profile         = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert   = Database['public']['Tables']['profiles']['Insert'];

export type UserRoleRow     = Database['public']['Tables']['user_roles']['Row'];
export type UserRoleInsert  = Database['public']['Tables']['user_roles']['Insert'];

export type Category        = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert  = Database['public']['Tables']['categories']['Insert'];

export type Product         = Database['public']['Tables']['products']['Row'];
export type ProductInsert   = Database['public']['Tables']['products']['Insert'];

export type ProductPrivate      = Database['public']['Tables']['product_private']['Row'];
export type ProductPrivateInsert = Database['public']['Tables']['product_private']['Insert'];

export type ProductVariant      = Database['public']['Tables']['product_variants']['Row'];
export type ProductVariantInsert = Database['public']['Tables']['product_variants']['Insert'];

export type ProductImage        = Database['public']['Tables']['product_images']['Row'];
export type ProductImageInsert  = Database['public']['Tables']['product_images']['Insert'];

export type Province        = Database['public']['Tables']['provinces']['Row'];
export type City            = Database['public']['Tables']['cities']['Row'];
export type Area            = Database['public']['Tables']['areas']['Row'];

export type Address         = Database['public']['Tables']['addresses']['Row'];
export type AddressInsert   = Database['public']['Tables']['addresses']['Insert'];

export type Order           = Database['public']['Tables']['orders']['Row'];
export type OrderInsert     = Database['public']['Tables']['orders']['Insert'];

export type OrderItem       = Database['public']['Tables']['order_items']['Row'];
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

export type OrderEvent      = Database['public']['Tables']['order_events']['Row'];
export type OrderEventInsert = Database['public']['Tables']['order_events']['Insert'];

export type SupportMessage      = Database['public']['Tables']['support_messages']['Row'];
export type SupportMessageInsert = Database['public']['Tables']['support_messages']['Insert'];

export type Setting         = Database['public']['Tables']['settings']['Row'];
export type AuditLog        = Database['public']['Tables']['audit_log']['Row'];

export type Admin           = Database['public']['Tables']['admins']['Row'];

// ─── Composite / Domain Models ────────────────────────────────────────────────
export interface ProductWithRelations extends Product {
  category?:       Category;
  variants?:       ProductVariant[];
  images?:         ProductImage[];
  product_private?: ProductPrivate;   // admin-only; never exposed to public
}

export interface OrderWithDetails extends Order {
  items?:  OrderItem[];
  events?: OrderEvent[];
  profile?: Pick<Profile, 'full_name' | 'phone' | 'email'>;
}

export interface CityWithAreas extends City {
  areas?: Area[];
}

export interface ProvinceWithCities extends Province {
  cities?: CityWithAreas[];
}

/** Typed settings keys for type-safe access */
export interface AppSettings {
  shipping_fee:            { amount: number; currency: string };
  free_shipping_threshold: { amount: number; currency: string };
  cod_fee:                 { amount: number; currency: string };
  whatsapp_number:         string;
  store_name:              string;
  return_window_days:      number;
}
