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
