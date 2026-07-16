export interface Customer {
  id: number;
  name: string;
  phone: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
}
