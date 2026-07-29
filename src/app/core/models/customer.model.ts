export interface Customer {
  id: number;
  name: string;
  lastName:string;
  phone: string;
}

export interface CreateCustomerRequest {
  name: string;
  lastName:string;
  phone: string;
}
