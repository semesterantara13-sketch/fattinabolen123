/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TransactionStatus {
  SUKSES = 'SUKSES',
  PENDING = 'PENDING',
  GAGAL = 'GAGAL'
}

export enum PaymentMethod {
  TUNAI = 'Tunai',
  QRIS = 'QRIS',
  TRANSFER = 'Transfer'
}

export enum ExpenseCategory {
  OPERASIONAL = 'Operasional',
  LOGISTIK = 'Logistik',
  PEMASARAN = 'Pemasaran',
  GAJI = 'Gaji',
  LAINNYA = 'Lainnya'
}

export interface Product {
  id: string;
  name: string;
  category: string; // This will store the category name or ID
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  image: string;
  description?: string;
  sku?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  createdAt?: any;
}

export interface Discount {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  isActive: boolean;
  createdAt?: any;
}

export interface CartItem extends Product {
  quantity: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: any; // Firestore Timestamp
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountDetails?: {
    id: string;
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
  };
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  cashierName: string;
}

export interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  date: any; // Firestore Timestamp
  notes?: string;
  status: 'SELESAI' | 'PENDING';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'TRANSAKSI' | 'SISTEM' | 'PENTING';
  date: any;
  isRead: boolean;
  actionLabel?: string;
}

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  logoUrl?: string;
  updatedAt?: any;
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  role: 'Admin' | 'Kasir';
  name: string;
}
