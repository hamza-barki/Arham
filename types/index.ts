import { PaymentMethod, OrderStatus, OrderStatusV2, Category, ProductWithRelations } from './database';

export * from './database';

// ─── Cart ──────────────────────────────────────────────────────────────────────
export interface CartItem {
  id:              string; // unique key: `${productId}-${variantId || 'default'}`
  productId:       string;
  variantId?:      string | null;
  sku:             string;
  name:            string;
  slug:            string;
  price:           number;
  compareAtPrice?: number | null;
  size?:           string | null;
  color?:          string | null;
  image:           string;
  quantity:        number;
  maxStock:        number;
}

// ─── Checkout ─────────────────────────────────────────────────────────────────
export interface CheckoutFormData {
  customerName:         string;
  phone:                string;
  email?:               string;
  customerId?:          string | null;
  // Address fields (v2 structured)
  province:             string;
  city:                 string;
  courierCityCode?:     string | null;
  areaId?:              string | null;
  areaName?:            string;
  isCustomArea?:        boolean;
  customAreaName?:      string;
  addressLine:          string;
  landmark?:            string;
  lat?:                 number | null;
  lng?:                 number | null;
  // Legacy flat fields (backward compat)
  address?:             string;
  postalCode?:          string;
  notes?:               string;
  paymentMethod:        PaymentMethod;
  marketingConsent?:    boolean;
  // Marketing attribution
  utmSource?:           string;
  utmMedium?:           string;
  utmCampaign?:         string;
}

// ─── Order Responses ──────────────────────────────────────────────────────────
export interface OrderCreationResponse {
  success:            boolean;
  orderId?:           string;
  orderNumber?:       string;
  confirmationToken?: string;
  message?:           string;
  error?:             string;
}

// ─── Order Status helpers ─────────────────────────────────────────────────────
export const ORDER_STATUS_LABELS: Record<OrderStatusV2, string> = {
  pending_confirmation:   'Pending Confirmation',
  confirmed:              'Confirmed',
  ordered_from_supplier:  'Ordered from Supplier',
  shipped:                'Shipped',
  delivered:              'Delivered',
  returned_rto:           'Returned (RTO)',
  cancelled:              'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatusV2, string> = {
  pending_confirmation:   'yellow',
  confirmed:              'blue',
  ordered_from_supplier:  'indigo',
  shipped:                'purple',
  delivered:              'green',
  returned_rto:           'orange',
  cancelled:              'red',
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data:       T[];
  count:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
export interface ApiResponse<T = void> {
  success: boolean;
  data?:   T;
  error?:  string;
  message?: string;
}
