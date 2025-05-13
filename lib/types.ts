export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface Attendee {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  church: string;
  sector: string;
  paymentamount: number;
  paymentstatus: 'Pendiente' | 'Pagado';
  registrationdate: string;
  paymentreceipturl: string;
  tshirtsize?: string;
  istest?: boolean;
} 