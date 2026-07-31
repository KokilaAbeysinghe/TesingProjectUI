import { PaymentMethod } from './sale.model';

export interface MonthlySalesSummary {
  month: string;
  transactionCount: number;
  totalRevenue: number;
  averageSaleValue: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
}

export interface PaymentMethodSummary {
  paymentMethod: PaymentMethod;
  salesCount: number;
  totalAmount: number;
}

export interface TopCustomers {
  customerId: number;
  customerName: string;
  quantityBuy: number;
  customerAmount: number;
}

export interface DailySalesSummary {
  date: string;
  salesCount: number;
  totalRevenue: number;
}

export interface LowStockProduct {
  productName: string;
  currentStock: number;
  reorderLevel: number;
  status: string;
}

