export type PaymentMethod = 'Cash' | 'Card' | 'BankTransfer';

export type SaleStatus = 'Completed' | 'Voided';

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: number;
  saleDate: string;
  customerId: number;
  customerName: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  saleItems: SaleItem[];
}

export interface CreateSaleItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateSaleRequest {
  customerId: number;
  saleItems: CreateSaleItemRequest[];
  paymentMethod: PaymentMethod;
}

export interface UpdateSaleRequest {
  customerId: number;
  paymentMethod: PaymentMethod;
}
