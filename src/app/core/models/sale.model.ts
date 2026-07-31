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
  subtotalAmount: number;
  discountPercentage: number;
  discountAmount: number;
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
  discountPercentage: number;
  paymentMethod: PaymentMethod;
}

export interface UpdateSaleRequest {
  customerId: number;
  discountPercentage: number;
  paymentMethod: PaymentMethod;
}
