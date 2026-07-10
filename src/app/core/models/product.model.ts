export interface Product {
  id: number;
  name: string;
  productCategoryId: number;
  categoryName: string;
  price: number;
  stock: number;
}

export interface CreateProductRequest {
  name: string;
  productCategoryId: number;
  price: number;
  stock: number;
}
