export interface ProductCategory {
  id: number;
  name: string;
  description: string;
}

export interface CreateProductCategoryRequest {
  name: string;
  description: string;
}
