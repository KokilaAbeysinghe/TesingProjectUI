export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export interface CreateSupplierRequest {
  name: string;
  phone: string;
  email: string;
}
