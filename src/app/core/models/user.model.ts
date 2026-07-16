export type UserRole = 'Admin' | 'Manager' | 'Cashier';

export interface User {
  id: number;
  name: string;
  email: string;
  contactNumber: string;
  role: UserRole;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  contactNumber: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  contactNumber: string;
  role: UserRole;
  password?: string;
}
