import { PaymentMethod } from './sale.model';

export interface SalesSummary {
  startDate: string;
  endDate: string;
  totalSalesCount: number;
  totalItemsSold: number;
  totalRevenue: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
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

