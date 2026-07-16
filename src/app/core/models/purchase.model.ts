export interface PurchaseItem {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface Purchase {
  id: number;
  purchaseDate: string;
  supplierId: number;
  supplierName: string;
  totalAmount: number;
  purchaseItems: PurchaseItem[];
}

export interface CreatePurchaseItemRequest {
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseRequest {
  supplierId: number;
  purchaseItems: CreatePurchaseItemRequest[];
}
