export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: number;
  saleDate: string;
  customerName: string;
  totalAmount: number;
  saleItems: SaleItem[];
}

export interface CreateSaleItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateSaleRequest {
  customerId: number;
  saleItems: CreateSaleItemRequest[];
}
