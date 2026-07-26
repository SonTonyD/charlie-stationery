export interface AdminProduct {
  id: string;
  name: string;
  purchaseUnitPrice: number;
  defaultSalePrice: number;
  stockQuantity: number;
}

export interface BoxProductLine {
  productId: string;
  quantity: number;
}

export interface AdminBoxImage {
  id: string;
  url: string;
  storagePath: string;
  sortOrder: number;
}

export interface AdminBox {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  images: AdminBoxImage[];
  completeImages: AdminBoxImage[];
  showOnFrontOffice: boolean;
  salePrice: number;
  purchasePrice: number | null;
  weightGrams: number;
  stockQuantity: number;
  items: BoxProductLine[];
}

export interface ShippingRate {
  id: number;
  carrier: 'mondial_relay' | 'laposte';
  deliveryMode: 'pickup' | 'home';
  weightMinGrams: number;
  weightMaxGrams: number;
  price: number;
}

export interface AdminReview {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  rating: number;
  comment: string;
  isPublished: boolean;
  createdAt: string;
}

export type OrderStatus =
  | 'pending_payment' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface AdminOrder {
  id: string;
  stripeSessionId: string | null;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryMethod: string;
  deliveryCarrier: string;
  deliveryMode: 'pickup' | 'home';
  deliveryPrice: number;
  deliveryAddress: string | null;
  deliveryPostalCode: string | null;
  deliveryCity: string | null;
  relayPoint: Record<string, unknown> | null;
  items: { boxId: string; name: string; unitPrice: number; quantity: number }[];
  itemsTotal: number;
  total: number;
  createdAt: string;
}
