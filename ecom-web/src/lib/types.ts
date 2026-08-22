export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProductListResponse {
  data: Product[];
  pagination: Pagination;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalCents: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "shipped" | "delivered";

export interface OrderItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalCents: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: string;
}

export interface OrderListResponse {
  data: Order[];
  pagination: Pagination;
}
